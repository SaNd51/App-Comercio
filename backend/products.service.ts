// Regras de negócio de produtos.
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { AppError } from './AppError';
import { Role } from './jwt';
import { AtualizarProdutoInput, CriarProdutoInput, ListarQuery } from './products.schemas';

const incluirCategoria = { categoria: { select: { id: true, nome: true } } } as const;

async function garantirCategoria(categoriaId: string) {
  const existe = await prisma.category.findUnique({ where: { id: categoriaId } });
  if (!existe) throw new AppError(400, 'Categoria não encontrada');
}

export async function listar(q: ListarQuery, role?: Role, userId?: string) {
  const ehAdmin = role === 'admin';
  const where: Prisma.ProductWhereInput = {};

  // Cliente/visitante: SEMPRE só ativos. Admin pode filtrar por status (ou "todos").
  if (!ehAdmin) where.status = 'ativo';
  else if (q.status !== 'todos') where.status = q.status;

  // Busca por nome. (No SQLite o "contains" ignora maiúsculas só para letras sem acento;
  // no PostgreSQL, adicione `mode: 'insensitive'` — ver README.)
  if (q.search) where.nome = { contains: q.search };

  if (q.category) {
    where.categoria = { OR: [{ id: q.category }, { nome: q.category }] };
  }
  if (q.oferta === 'true') {
    where.precoPromocional = { not: null };
    where.promocaoAte = { gt: new Date() };
  }
  if (q.semana === 'true') where.destaqueSemana = true;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    q.sort === 'preco'
      ? [{ precoPromocional: 'asc' }, { preco: 'asc' }]
      : [{ nome: 'asc' }];

  const [total, itens] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: incluirCategoria,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
  ]);

  const agora = new Date();
  const favoritos = userId
    ? await prisma.favorite.findMany({ where: { userId, productId: { in: itens.map((item) => item.id) } }, select: { productId: true } })
    : [];
  const favoritosIds = new Set(favoritos.map((favorito) => favorito.productId));
  const itensPublicos = itens.map((item) => {
    const validade = item.promocaoAte ? new Date(item.promocaoAte) : null;
    const emOferta = !!item.precoPromocional && item.precoPromocional < item.preco && !!validade && validade > agora;
    const precoEfetivo = emOferta ? item.precoPromocional! : item.preco;
    const descontoPercentual = emOferta ? Math.round((1 - precoEfetivo / item.preco) * 100) : 0;
    return { ...item, precoEfetivo, emOferta, descontoPercentual, favorito: favoritosIds.has(item.id) };
  });

  return {
    itens: itensPublicos,
    paginacao: {
      pagina: q.page,
      limite: q.limit,
      total,
      totalPaginas: Math.max(1, Math.ceil(total / q.limit)),
    },
  };
}

export async function detalhar(id: string, role?: Role) {
  const produto = await prisma.product.findUnique({ where: { id }, include: incluirCategoria });
  // Produto inativo "não existe" para quem não é admin.
  if (!produto || (produto.status !== 'ativo' && role !== 'admin')) {
    throw new AppError(404, 'Produto não encontrado');
  }
  const validade = produto.promocaoAte ? new Date(produto.promocaoAte) : null;
  const emOferta = !!produto.precoPromocional && produto.precoPromocional < produto.preco && !!validade && validade > new Date();
  const precoEfetivo = emOferta ? produto.precoPromocional! : produto.preco;
  return {
    ...produto,
    precoEfetivo,
    emOferta,
    descontoPercentual: emOferta ? Math.round((1 - precoEfetivo / produto.preco) * 100) : 0,
  };
}

export async function criar(dados: CriarProdutoInput) {
  await garantirCategoria(dados.categoriaId);
  return prisma.product.create({
    data: {
      nome: dados.nome,
      preco: dados.preco,
      categoriaId: dados.categoriaId,
      descricao: dados.descricao ?? '',
      imagemUrl: dados.imagemUrl ?? null,
      estoque: dados.estoque ?? 0,
      status: dados.status ?? 'ativo',
      unidade: dados.unidade ?? '',
      precoPromocional: dados.precoPromocional ?? null,
      promocaoAte: dados.promocaoAte ? new Date(dados.promocaoAte) : null,
      destaqueSemana: dados.destaqueSemana ?? false,
    },
    include: incluirCategoria,
  });
}

export async function atualizar(id: string, dados: AtualizarProdutoInput) {
  const atual = await prisma.product.findUnique({ where: { id } });
  if (!atual) throw new AppError(404, 'Produto não encontrado');
  if (dados.categoriaId) await garantirCategoria(dados.categoriaId);

  return prisma.product.update({ where: { id }, data: dados, include: incluirCategoria });
}

export async function alterarStatus(id: string, status: 'ativo' | 'inativo') {
  const atual = await prisma.product.findUnique({ where: { id } });
  if (!atual) throw new AppError(404, 'Produto não encontrado');
  return prisma.product.update({ where: { id }, data: { status }, include: incluirCategoria });
}

// Remove o produto. Se ele já aparece em pedidos, apenas INATIVA (preserva o histórico).
export async function remover(id: string) {
  const atual = await prisma.product.findUnique({ where: { id } });
  if (!atual) throw new AppError(404, 'Produto não encontrado');

  const emPedidos = await prisma.orderItem.count({ where: { productId: id } });
  if (emPedidos > 0) {
    await prisma.product.update({ where: { id }, data: { status: 'inativo' } });
    return { acao: 'inativado' as const };
  }
  await prisma.product.delete({ where: { id } });
  return { acao: 'removido' as const };
}
