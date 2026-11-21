// Regras de negócio de pedidos.
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { env } from './env';
import { prisma } from './prisma';
import { AppError } from './AppError';
import { Role } from './jwt';
import { gerarPayloadPix, txidDoPedido } from './pix';
import { CriarPedidoInput, ListarPedidosQuery } from './orders.schemas';

// Limite de segurança do valor de um pedido (R$ 100.000,00), em centavos.
const TOTAL_MAXIMO = 10_000_000;

const incluir = {
  itens: { include: { product: { select: { nome: true, imagemUrl: true } } } },
  user: { select: { nome: true, email: true } },
  eventos: { orderBy: { criadoEm: 'asc' as const } },
} satisfies Prisma.OrderInclude;

type PedidoDb = Prisma.OrderGetPayload<{ include: typeof incluir }>;

const ROTULO: Record<string, string> = {
  aguardando_pagamento: 'aguardando pagamento',
  pago: 'pago',
  cancelado: 'cancelado',
};

// Formato de saída. Dados do cliente só aparecem para o admin.
function paraSaida(p: PedidoDb, ehAdmin: boolean) {
  return {
    id: p.id,
    total: p.total,
    status: p.status,
    tipoEntrega: p.tipoEntrega,
    subtotal: p.subtotal,
    taxaEntrega: p.taxaEntrega,
    enderecoEntrega: p.enderecoEntrega ? JSON.parse(p.enderecoEntrega) : null,
    statusEntrega: p.statusEntrega,
    previsaoEntrega: p.previsaoEntrega,
    entregadorNome: p.entregadorNome,
    entregadorTelefone: p.entregadorTelefone,
    eventos: p.eventos,
    pixPayload: p.pixPayload,
    criadoEm: p.criadoEm,
    itens: p.itens.map((i) => ({
      id: i.id,
      produtoId: i.productId,
      nome: i.product.nome,
      imagemUrl: i.product.imagemUrl,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      subtotal: i.quantidade * i.precoUnitario,
    })),
    ...(ehAdmin ? { cliente: p.user } : {}),
  };
}

export async function criarPedido(userId: string, entrada: CriarPedidoInput) {
  // Une linhas repetidas do mesmo produto.
  const quantidades = new Map<string, number>();
  for (const i of entrada.itens) quantidades.set(i.produtoId, (quantidades.get(i.produtoId) ?? 0) + i.quantidade);
  for (const q of quantidades.values()) {
    if (q > 999) throw new AppError(400, 'Quantidade máxima por produto é 999');
  }

  const ids = [...quantidades.keys()];
  const pedidoId = randomUUID(); // gerado antes para virar o txid do Pix

  // Tudo ou nada: se qualquer passo falhar, nada é gravado nem baixado do estoque.
  const pedido = await prisma.$transaction(async (tx) => {
    const produtos = await tx.product.findMany({ where: { id: { in: ids } } });
    const porId = new Map(produtos.map((p) => [p.id, p]));

    if (ids.some((id) => !porId.has(id))) {
      throw new AppError(404, 'Algum produto do carrinho não existe mais. Atualize o carrinho.');
    }
    const inativos = produtos.filter((p) => p.status !== 'ativo');
    if (inativos.length) {
      throw new AppError(409, `Produto indisponível: ${inativos.map((p) => p.nome).join(', ')}`);
    }
    const semEstoque = produtos.filter((p) => p.estoque < quantidades.get(p.id)!);
    if (semEstoque.length) {
      throw new AppError(409, `Estoque insuficiente: ${semEstoque.map((p) => `${p.nome} (restam ${p.estoque})`).join(', ')}`);
    }

    // Preço efetivo da promoção, sempre recalculado e congelado no pedido.
    const agora = new Date();
    const precoEfetivo = (p: typeof produtos[number]) =>
      p.precoPromocional && p.precoPromocional < p.preco && p.promocaoAte && new Date(p.promocaoAte) > agora
        ? p.precoPromocional
        : p.preco;
    const subtotal = produtos.reduce((soma, p) => soma + precoEfetivo(p) * quantidades.get(p.id)!, 0);
    const loja = await tx.loja.findUnique({ where: { id: 'loja' } });
    if (subtotal < (loja?.pedidoMinimo ?? 0)) throw new AppError(400, `Pedido mínimo de R$ ${(loja?.pedidoMinimo ?? 0) / 100}`);
    let enderecoEntrega: string | null = null;
    if (entrada.tipoEntrega === 'entrega') {
      if (!entrada.enderecoId) throw new AppError(400, 'Selecione um endereço de entrega');
      const endereco = await tx.address.findFirst({ where: { id: entrada.enderecoId, userId } });
      if (!endereco) throw new AppError(404, 'Endereço não encontrado');
      enderecoEntrega = JSON.stringify(endereco);
    }
    const taxaEntrega = entrada.tipoEntrega === 'entrega'
      ? (loja && loja.freteGratisAcima > 0 && subtotal >= loja.freteGratisAcima ? 0 : (loja?.taxaEntrega ?? 0))
      : 0;
    const total = subtotal + taxaEntrega;
    if (total > TOTAL_MAXIMO) throw new AppError(400, 'Valor do pedido acima do limite permitido');

    // Baixa de estoque condicional: só baixa se ainda houver estoque (protege contra pedidos simultâneos).
    for (const p of produtos) {
      const qtd = quantidades.get(p.id)!;
      const r = await tx.product.updateMany({
        where: { id: p.id, status: 'ativo', estoque: { gte: qtd } },
        data: { estoque: { decrement: qtd } },
      });
      if (r.count === 0) throw new AppError(409, `Estoque insuficiente: ${p.nome}`);
    }

    const pixPayload = gerarPayloadPix({
      chave: env.PIX_CHAVE,
      nomeRecebedor: env.PIX_NOME_RECEBEDOR,
      cidade: env.PIX_CIDADE,
      valorCentavos: total,
      txid: txidDoPedido(pedidoId),
    });

    return tx.order.create({
      data: {
        id: pedidoId,
        userId,
        total,
        subtotal,
        taxaEntrega,
        tipoEntrega: entrada.tipoEntrega,
        enderecoEntrega,
        status: 'aguardando_pagamento',
        pixPayload,
        itens: {
          create: produtos.map((p) => ({
            productId: p.id,
            quantidade: quantidades.get(p.id)!,
            precoUnitario: precoEfetivo(p), // preço "congelado" no momento da compra
          })),
        },
      },
      include: incluir,
    });
  });

  return paraSaida(pedido, false);
}

export async function listar(userId: string, role: Role, q: ListarPedidosQuery) {
  const ehAdmin = role === 'admin';
  const where: Prisma.OrderWhereInput = { ...(ehAdmin ? {} : { userId }), ...(q.status ? { status: q.status } : {}) };

  const [total, pedidos] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: incluir,
      orderBy: { criadoEm: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
  ]);

  return {
    pedidos: pedidos.map((p) => paraSaida(p, ehAdmin)),
    paginacao: { pagina: q.page, limite: q.limit, total, totalPaginas: Math.max(1, Math.ceil(total / q.limit)) },
  };
}

// Pedido de outra pessoa "não existe" (404) — não revela que o id é válido.
async function buscarAutorizado(id: string, userId: string, role: Role) {
  const p = await prisma.order.findUnique({ where: { id }, include: incluir });
  if (!p || (role !== 'admin' && p.userId !== userId)) throw new AppError(404, 'Pedido não encontrado');
  return p;
}

export async function detalhar(id: string, userId: string, role: Role) {
  return paraSaida(await buscarAutorizado(id, userId, role), role === 'admin');
}

// Cliente: só pode cancelar. Admin: pode marcar como pago ou cancelar.
// Só pedidos "aguardando_pagamento" mudam de status. Cancelar devolve o estoque.
export async function mudarStatus(id: string, userId: string, role: Role, novo: 'pago' | 'cancelado') {
  const atual = await buscarAutorizado(id, userId, role);
  if (role !== 'admin' && novo !== 'cancelado') throw new AppError(403, 'Acesso restrito a administradores');
  if (atual.status !== 'aguardando_pagamento') {
    throw new AppError(409, `Pedido já está ${ROTULO[atual.status] ?? atual.status}`);
  }

  await prisma.$transaction(async (tx) => {
    // Condição no WHERE evita dupla mudança em requisições simultâneas.
    const r = await tx.order.updateMany({
      where: { id, status: 'aguardando_pagamento' },
      data: {
        status: novo,
        ...(novo === 'pago'
          ? { statusEntrega: 'em_separacao' }
          : {}),
      },
    });
    if (r.count === 0) throw new AppError(409, 'Pedido já foi atualizado');

    if (novo === 'pago') {
      await tx.orderEvent.create({
        data: { orderId: id, status: 'em_separacao', observacao: 'Pagamento confirmado', criadoPor: userId },
      });
    }

    if (novo === 'cancelado') {
      for (const i of atual.itens) {
        await tx.product.update({ where: { id: i.productId }, data: { estoque: { increment: i.quantidade } } });
      }
    }
  });

  return detalhar(id, userId, role);
}

export async function avancarEntrega(
  id: string,
  adminId: string,
  dados: { previsaoEntrega?: string; entregadorNome?: string; entregadorTelefone?: string },
) {
  const atual = await buscarAutorizado(id, adminId, 'admin');
  if (atual.status !== 'pago' || !atual.statusEntrega) {
    throw new AppError(409, 'A entrega só pode avançar após o pagamento');
  }
  const fluxo = atual.tipoEntrega === 'entrega'
    ? ['em_separacao', 'saiu_para_entrega', 'entregue']
    : ['em_separacao', 'pronto_para_retirada', 'retirado'];
  const indice = fluxo.indexOf(atual.statusEntrega);
  if (indice < 0 || indice >= fluxo.length - 1) throw new AppError(409, 'Não há próxima etapa');
  const proximo = fluxo[indice + 1];

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        statusEntrega: proximo,
        previsaoEntrega: dados.previsaoEntrega ? new Date(dados.previsaoEntrega) : atual.previsaoEntrega,
        entregadorNome: dados.entregadorNome ?? atual.entregadorNome,
        entregadorTelefone: dados.entregadorTelefone ?? atual.entregadorTelefone,
      },
    });
    await tx.orderEvent.create({
      data: { orderId: id, status: proximo, observacao: 'Estado atualizado pelo administrador', criadoPor: adminId },
    });
  });

  return detalhar(id, adminId, 'admin');
}
