// Testes de integração de pedidos (banco de teste já com o seed).
// Prefixos próprios ("pedtest." / "PEDTESTE ") para não colidir com a limpeza dos outros arquivos de teste.
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crc16, txidDoPedido } from './pix';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'file:./test.db';
process.env.JWT_SECRET ??= 'segredo-de-teste-com-mais-de-16-caracteres';
process.env.PIX_CHAVE ??= 'chave-teste';
process.env.PIX_NOME_RECEBEDOR ??= 'LOJA TESTE';
process.env.PIX_CIDADE ??= 'SOBRAL';

type Prisma = typeof import('./prisma').prisma;
let app: Express;
let prisma: Prisma;
let tokenA = '';
let tokenB = '';
let tokenAdmin = '';
let pA: { id: string }; // R$ 10,00, estoque 5
let pB: { id: string }; // R$ 2,50, estoque 2
let pInativo: { id: string };
let pedidoPago = ''; // pedido 1 (A)
let pedidoCancelado = ''; // pedido com linhas repetidas (A)

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const sufixo = Date.now();
const pedir = (token: string, itens: unknown[], extra: object = {}) =>
  request(app).post('/api/orders').set(auth(token)).send({ itens, ...extra });
const estoqueDe = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id } })).estoque;

async function cadastrar(nome: string, prefixoEmail = nome) {
  const r = await request(app)
    .post('/api/auth/register')
    .send({ nome, email: `pedtest.${prefixoEmail}.${sufixo}@exemplo.com`, senha: 'Senha1234' });
  return r.body.token as string;
}

beforeAll(async () => {
  app = (await import('./app')).app;
  prisma = (await import('./prisma')).prisma;

  tokenA = await cadastrar('Cliente A', 'a');
  tokenB = await cadastrar('Cliente B', 'b');
  tokenAdmin = (
    await request(app).post('/api/auth/login').send({
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@mercadinho.com',
      senha: process.env.SEED_ADMIN_SENHA ?? 'Admin@123',
    })
  ).body.token;

  const categoriaId = (await prisma.category.findFirstOrThrow()).id;
  const novo = (nome: string, preco: number, estoque: number, status = 'ativo') =>
    prisma.product.create({ data: { nome: `PEDTESTE ${nome} ${sufixo}`, preco, estoque, status, categoriaId } });
  pA = await novo('A', 1000, 5);
  pB = await novo('B', 250, 2);
  pInativo = await novo('Inativo', 500, 9, 'inativo');
});

afterAll(async () => {
  const usuarios = await prisma.user.findMany({ where: { email: { startsWith: 'pedtest.' } }, select: { id: true } });
  await prisma.order.deleteMany({ where: { userId: { in: usuarios.map((u) => u.id) } } }); // itens saem junto (cascade)
  await prisma.product.deleteMany({ where: { nome: { startsWith: 'PEDTESTE ' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'pedtest.' } } });
  await prisma.$disconnect();
});

describe('POST /api/orders', () => {
  it('exige autenticação', async () => {
    expect((await request(app).post('/api/orders').send({ itens: [] })).status).toBe(401);
  });

  it('calcula o total no servidor, baixa o estoque e gera o Pix', async () => {
    // O app tenta "mandar" preço e total — tudo isso deve ser ignorado.
    const res = await pedir(
      tokenA,
      [
        { produtoId: pA.id, quantidade: 2, preco: 1 },
        { produtoId: pB.id, quantidade: 1 },
      ],
      { total: 1 },
    );
    expect(res.status).toBe(201);

    const { pedido } = res.body;
    pedidoPago = pedido.id;
    expect(pedido.total).toBe(2 * 1000 + 250); // 2250 = R$ 22,50
    expect(pedido.status).toBe('aguardando_pagamento');
    expect(pedido.itens.find((i: { produtoId: string }) => i.produtoId === pA.id).precoUnitario).toBe(1000);

    // Pix: valor, txid e CRC corretos
    const payload: string = pedido.pixPayload;
    expect(payload).toContain('540522.50');
    expect(payload).toContain(`0525${txidDoPedido(pedido.id)}`);
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));

    expect(await estoqueDe(pA.id)).toBe(3);
    expect(await estoqueDe(pB.id)).toBe(1);
  });

  it('mantém o preço do momento da compra mesmo se o produto mudar depois', async () => {
    await prisma.product.update({ where: { id: pA.id }, data: { preco: 2000 } });
    const res = await request(app).get(`/api/orders/${pedidoPago}`).set(auth(tokenA));
    expect(res.body.pedido.total).toBe(2250);
    expect(res.body.pedido.itens.find((i: { produtoId: string }) => i.produtoId === pA.id).precoUnitario).toBe(1000);
    await prisma.product.update({ where: { id: pA.id }, data: { preco: 1000 } });
  });

  it('recusa estoque insuficiente (409) sem baixar nada', async () => {
    const res = await pedir(tokenA, [
      { produtoId: pA.id, quantidade: 1 },
      { produtoId: pB.id, quantidade: 5 },
    ]);
    expect(res.status).toBe(409);
    expect(res.body.erro).toContain('Estoque insuficiente');
    expect(await estoqueDe(pA.id)).toBe(3);
    expect(await estoqueDe(pB.id)).toBe(1);
  });

  it('recusa produto inativo (409) e inexistente (404)', async () => {
    expect((await pedir(tokenA, [{ produtoId: pInativo.id, quantidade: 1 }])).status).toBe(409);
    expect((await pedir(tokenA, [{ produtoId: 'nao-existe', quantidade: 1 }])).status).toBe(404);
  });

  it('valida o corpo (400)', async () => {
    expect((await pedir(tokenA, [])).status).toBe(400);
    expect((await pedir(tokenA, [{ produtoId: pA.id, quantidade: 0 }])).status).toBe(400);
    expect((await pedir(tokenA, [{ produtoId: pA.id, quantidade: 1.5 }])).status).toBe(400);
    expect((await pedir(tokenA, [{ quantidade: 1 }])).status).toBe(400);
  });

  it('une linhas repetidas do mesmo produto', async () => {
    const res = await pedir(tokenA, [
      { produtoId: pA.id, quantidade: 1 },
      { produtoId: pA.id, quantidade: 1 },
    ]);
    expect(res.status).toBe(201);
    expect(res.body.pedido.itens).toHaveLength(1);
    expect(res.body.pedido.itens[0].quantidade).toBe(2);
    expect(res.body.pedido.total).toBe(2000);
    pedidoCancelado = res.body.pedido.id;
    expect(await estoqueDe(pA.id)).toBe(1);
  });
});

describe('Consulta de pedidos', () => {
  it('cliente vê só os seus; pedido alheio dá 404', async () => {
    const lista = await request(app).get('/api/orders').set(auth(tokenA));
    expect(lista.status).toBe(200);
    expect(lista.body.pedidos.length).toBeGreaterThanOrEqual(2);

    const doB = await request(app).get('/api/orders').set(auth(tokenB));
    expect(doB.body.pedidos).toHaveLength(0);

    expect((await request(app).get(`/api/orders/${pedidoPago}`).set(auth(tokenB))).status).toBe(404);
  });

  it('admin vê todos, com dados do cliente', async () => {
    const res = await request(app).get(`/api/orders/${pedidoPago}`).set(auth(tokenAdmin));
    expect(res.status).toBe(200);
    expect(res.body.pedido.cliente.email).toContain('pedtest.a.');

    const lista = await request(app).get('/api/orders?status=aguardando_pagamento&limit=100').set(auth(tokenAdmin));
    expect(lista.body.pedidos.some((p: { id: string }) => p.id === pedidoPago)).toBe(true);
  });

  it('cliente não vê dados de outros clientes no próprio pedido', async () => {
    const res = await request(app).get(`/api/orders/${pedidoPago}`).set(auth(tokenA));
    expect(res.body.pedido.cliente).toBeUndefined();
  });
});

describe('Cancelamento e pagamento', () => {
  it('outro cliente não cancela pedido alheio (404)', async () => {
    expect((await request(app).post(`/api/orders/${pedidoCancelado}/cancel`).set(auth(tokenB))).status).toBe(404);
  });

  it('dono cancela e o estoque volta; cancelar de novo dá 409', async () => {
    const res = await request(app).post(`/api/orders/${pedidoCancelado}/cancel`).set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.pedido.status).toBe('cancelado');
    expect(await estoqueDe(pA.id)).toBe(3); // 1 + 2 devolvidos

    expect((await request(app).post(`/api/orders/${pedidoCancelado}/cancel`).set(auth(tokenA))).status).toBe(409);
  });

  it('cliente não marca como pago (403); admin marca (200)', async () => {
    const cliente = await request(app).patch(`/api/orders/${pedidoPago}/status`).set(auth(tokenA)).send({ status: 'pago' });
    expect(cliente.status).toBe(403);

    const admin = await request(app).patch(`/api/orders/${pedidoPago}/status`).set(auth(tokenAdmin)).send({ status: 'pago' });
    expect(admin.status).toBe(200);
    expect(admin.body.pedido.status).toBe('pago');
  });

  it('pedido pago não pode mais ser cancelado nem alterado (409)', async () => {
    expect((await request(app).post(`/api/orders/${pedidoPago}/cancel`).set(auth(tokenA))).status).toBe(409);
    const admin = await request(app).patch(`/api/orders/${pedidoPago}/status`).set(auth(tokenAdmin)).send({ status: 'cancelado' });
    expect(admin.status).toBe(409);
  });

  it('status inválido → 400', async () => {
    const res = await request(app).patch(`/api/orders/${pedidoPago}/status`).set(auth(tokenAdmin)).send({ status: 'talvez' });
    expect(res.status).toBe(400);
  });
});

describe('Produto que já está em pedido', () => {
  it('DELETE apenas inativa (preserva o histórico)', async () => {
    const res = await request(app).delete(`/api/products/${pB.id}`).set(auth(tokenAdmin));
    expect(res.status).toBe(200);
    expect(res.body.acao).toBe('inativado');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: pB.id } })).status).toBe('inativo');
  });
});
