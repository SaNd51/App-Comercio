// Seed: 1 admin, 1 cliente, 8 categorias e produtos de exemplo.
// É idempotente: pode ser executado várias vezes sem duplicar dados.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// preco em CENTAVOS (ex.: 490 = R$ 4,90)
const categorias = [
  { nome: 'Açougue', descricao: 'Qualidade à sua mesa', icone: 'restaurant-outline', ordem: 1 },
  { nome: 'Bebidas', descricao: 'Para todos os momentos', icone: 'beer-outline', ordem: 2 },
  { nome: 'Higiene', descricao: 'Cuidado essencial', icone: 'water-outline', ordem: 3 },
  { nome: 'Hortifruti', descricao: 'Frescor todos os dias', icone: 'leaf-outline', ordem: 4 },
  { nome: 'Laticínios', descricao: 'Sabor e nutrição', icone: 'cafe-outline', ordem: 5 },
  { nome: 'Limpeza', descricao: 'Sua casa brilhando', icone: 'sparkles-outline', ordem: 6 },
  { nome: 'Mercearia', descricao: 'Essenciais da despensa', icone: 'basket-outline', ordem: 7 },
  { nome: 'Utilidades', descricao: 'Praticidade para a casa', icone: 'home-outline', ordem: 8 },
];

const catalogo: Record<string, { nome: string; descricao: string; unidade: string; preco: number; precoPromocional?: number; destaqueSemana?: boolean; estoque: number }[]> = {
  'Açougue': [
    { nome: 'Picanha bovina', descricao: 'Corte nobre resfriado.', unidade: 'Pacote · 1 kg', preco: 7990, precoPromocional: 6990, destaqueSemana: true, estoque: 30 },
  ],
  Bebidas: [
    { nome: 'Refrigerante cola 2 L', descricao: 'Garrafa PET de 2 litros.', unidade: 'Garrafa · 2 L', preco: 949, precoPromocional: 790, estoque: 80 },
  ],
  Higiene: [
    { nome: 'Sabonete em barra 85 g', descricao: 'Sabonete hidratante.', unidade: 'Pacote · 85 g', preco: 229, estoque: 140 },
  ],
  Hortifruti: [
    { nome: 'Banana prata', descricao: 'Banana prata fresca.', unidade: 'Pacote · 1 kg', preco: 599, precoPromocional: 499, destaqueSemana: true, estoque: 50 },
  ],
  Laticínios: [
    { nome: 'Leite integral 1 L', descricao: 'Leite integral longa vida.', unidade: 'Caixa · 1 L', preco: 590, estoque: 100 },
  ],
  Limpeza: [
    { nome: 'Detergente líquido 500 ml', descricao: 'Neutro, ação desengordurante.', unidade: 'Frasco · 500 ml', preco: 259, precoPromocional: 199, estoque: 100 },
  ],
  Mercearia: [
    { nome: 'Açúcar refinado Caravelas 1 kg', descricao: 'Pacote de 1 kg de açúcar refinado.', unidade: 'Pacote · 1 kg', preco: 490, precoPromocional: 399, destaqueSemana: true, estoque: 120 },
    { nome: 'Macarrão instantâneo Nissin Lámen Galinha 85 g', descricao: 'Sabor galinha caipira.', unidade: 'Pacote · 85 g', preco: 310, estoque: 200 },
  ],
  Utilidades: [
    { nome: 'Conjunto de tábuas', descricao: 'Conjunto prático para cozinha.', unidade: 'Conjunto · 3 peças', preco: 2990, estoque: 25 },
  ],
};

async function main() {
  const env = process.env;

  const admin = await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL ?? 'admin@mercadinho.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: env.SEED_ADMIN_EMAIL ?? 'admin@mercadinho.com',
      senhaHash: await bcrypt.hash(env.SEED_ADMIN_SENHA ?? 'Admin@123', 10),
      role: 'admin',
    },
  });
  const cliente = await prisma.user.upsert({
    where: { email: env.SEED_CLIENTE_EMAIL ?? 'cliente@mercadinho.com' },
    update: {},
    create: {
      nome: 'Cliente Teste',
      email: env.SEED_CLIENTE_EMAIL ?? 'cliente@mercadinho.com',
      senhaHash: await bcrypt.hash(env.SEED_CLIENTE_SENHA ?? 'Cliente@123', 10),
      role: 'user',
    },
  });

  let totalProdutos = 0;
  for (const meta of categorias) {
    const produtos = catalogo[meta.nome] ?? [];
    const categoria = await prisma.category.upsert({
      where: { nome: meta.nome },
      update: { descricao: meta.descricao, icone: meta.icone, ordem: meta.ordem },
      create: meta,
    });

    for (const p of produtos) {
      const existente = await prisma.product.findFirst({ where: { nome: p.nome } });
      const dados = {
        ...p,
        categoriaId: categoria.id,
        status: 'ativo',
        imagemUrl: null,
        promocaoAte: p.precoPromocional ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      };
      if (!existente) {
        await prisma.product.create({ data: dados });
        totalProdutos++;
      } else {
        await prisma.product.update({ where: { id: existente.id }, data: dados });
      }
    }
  }

  const nomesLegados = [
    'Suco de laranja integral 1 L',
    'Água mineral sem gás 1,5 L',
    'Banana prata (kg)',
    'Tomate (kg)',
    'Batata inglesa (kg)',
    'Arroz branco tipo 1 5 kg',
    'Água sanitária 1 L',
    'Sabão em pó 1 kg',
    'Creme dental 90 g',
    'Papel higiênico folha dupla (12 un.)',
  ];
  for (const nome of nomesLegados) {
    const legados = await prisma.product.findMany({ where: { nome }, select: { id: true } });
    for (const legado of legados) {
      const emPedidos = await prisma.orderItem.count({ where: { productId: legado.id } });
      if (emPedidos > 0) {
        await prisma.product.update({ where: { id: legado.id }, data: { status: 'inativo' } });
      } else {
        await prisma.product.delete({ where: { id: legado.id } });
      }
    }
  }

  await prisma.loja.upsert({
    where: { id: 'loja' },
    update: {},
    create: {
      id: 'loja',
      nome: 'Mercadinho Ximenes',
      slogan: 'Preços baixos!',
      telefone: '(11) 3333-3333',
      whatsapp: '5511933333333',
      email: 'contato@mercadinhoximenes.com',
      endereco: 'Rua das Flores, 123 — Centro',
      horarios: 'Segunda a sábado, das 7h às 20h',
      quemSomos: 'O Mercadinho Ximenes leva praticidade, frescor e economia para sua família todos os dias.',
      termosPedido: 'Ao finalizar uma compra, o pagamento e a disponibilidade dos produtos são confirmados pelo estabelecimento.',
      avisoLegal: 'Preços e condições podem variar. Os dados pessoais são usados exclusivamente para realizar o pedido.',
      taxaEntrega: 800,
      freteGratisAcima: 15000,
      pedidoMinimo: 2000,
    },
  });

  await prisma.banner.upsert({
    where: { id: 'ofertas-dia' },
    update: {},
    create: {
      id: 'ofertas-dia',
      titulo: 'Ofertas do dia',
      subtitulo: 'Economia para encher sua cesta',
      cor: '#FDEDF0',
      destino: 'promocoes',
      ordem: 1,
      ativo: true,
    },
  });

  const unidadesAntigas = await prisma.product.findMany({
    where: { unidade: '' },
    include: { categoria: true },
  });
  for (const produto of unidadesAntigas) {
    const unidade =
      produto.categoria.nome === 'Hortifruti' ? 'Pacote · 1 kg'
      : produto.categoria.nome === 'Bebidas' ? 'Bebida · 1 unidade'
      : produto.categoria.nome === 'Limpeza' ? 'Produto · 1 unidade'
      : produto.categoria.nome === 'Higiene' ? 'Produto · 1 unidade'
      : produto.categoria.nome === 'Mercearia' ? 'Pacote · 1 unidade'
      : 'Produto · 1 unidade';
    await prisma.product.update({ where: { id: produto.id }, data: { unidade } });
  }

  console.log(`✔ Admin: ${admin.email} | Cliente: ${cliente.email}`);
  console.log(`✔ ${Object.keys(catalogo).length} categorias, ${totalProdutos} produtos novos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
