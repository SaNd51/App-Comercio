// Testes de integração de produtos e categorias (banco de teste já com o seed).
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'file:./test.db';
process.env.JWT_SECRET ??= 'segredo-de-teste-com-mais-de-16-caracteres';
process.env.PIX_CHAVE ??= 'chave-teste';
process.env.PIX_NOME_RECEBEDOR ??= 'LOJA TESTE';
process.env.PIX_CIDADE ??= 'SOBRAL';

let app: Express;
let prisma: typeof import('./prisma').prisma;
let adminToken = '';
let clienteToken = '';
let categoriaId = '';
let produtoId = '';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const nomeTeste = `TESTE Produto ${Date.now()}`;

beforeAll(async () => {
  app = (await import('./app')).app;
  prisma = (await import('./prisma')).prisma;

  const login = await request(app).post('/api/auth/login').send({
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@mercadinho.com',
    senha: process.env.SEED_ADMIN_SENHA ?? 'Admin@123',
  });
  adminToken = login.body.token;

  const cadastro = await request(app)
    .post('/api/auth/register')
    .send({ nome: 'Cliente Teste', email: `teste.prod.${Date.now()}@exemplo.com`, senha: 'Senha1234' });
  clienteToken = cadastro.body.token;

  categoriaId = (await prisma.category.findFirstOrThrow({ where: { nome: 'Bebidas' } })).id;
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { nome: { startsWith: 'TESTE ' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'teste.' } } });
  await prisma.$disconnect();
});

describe('GET /api/categories', () => {
  it('lista as categorias do seed', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.categorias.length).toBeGreaterThanOrEqual(5);
    expect(res.body.categorias[0]).toHaveProperty('totalProdutos');
  });
});

describe('GET /api/products (listagem)', () => {
  it('pagina e retorna só produtos ativos', async () => {
    const res = await request(app).get('/api/products?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.itens.length).toBeLessThanOrEqual(5);
    expect(res.body.paginacao.limite).toBe(5);
    expect(res.body.itens.every((p: { status: string }) => p.status === 'ativo')).toBe(true);
  });

  it('filtra por nome da categoria', async () => {
    const res = await request(app).get('/api/products?category=Bebidas');
    expect(res.body.itens.length).toBeGreaterThan(0);
    expect(res.body.itens.every((p: { categoria: { nome: string } }) => p.categoria.nome === 'Bebidas')).toBe(true);
  });

  it('busca por nome', async () => {
    const res = await request(app).get('/api/products?search=Caravelas');
    expect(res.body.itens.length).toBeGreaterThan(0);
  });

  it('rejeita paginação inválida com 400', async () => {
    expect((await request(app).get('/api/products?limit=999')).status).toBe(400);
  });

  it('visitante não consegue ver inativos nem com status=todos', async () => {
    const res = await request(app).get('/api/products?status=todos&limit=100');
    expect(res.body.itens.every((p: { status: string }) => p.status === 'ativo')).toBe(true);
  });
});

describe('Escrita — somente admin', () => {
  it('sem token → 401', async () => {
    expect((await request(app).post('/api/products').send({})).status).toBe(401);
  });

  it('cliente comum → 403', async () => {
    const res = await request(app).post('/api/products').set(auth(clienteToken)).send({ nome: 'x', preco: 100, categoriaId });
    expect(res.status).toBe(403);
  });

  it('admin cria produto (preço em centavos)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set(auth(adminToken))
      .send({ nome: nomeTeste, preco: 1234, categoriaId, estoque: 10 });
    expect(res.status).toBe(201);
    expect(res.body.produto.preco).toBe(1234);
    expect(res.body.produto.status).toBe('ativo');
    produtoId = res.body.produto.id;
  });

  it('rejeita preço decimal/negativo e categoria inexistente', async () => {
    const dec = await request(app).post('/api/products').set(auth(adminToken)).send({ nome: 'TESTE x', preco: 12.5, categoriaId });
    const neg = await request(app).post('/api/products').set(auth(adminToken)).send({ nome: 'TESTE x', preco: -1, categoriaId });
    const cat = await request(app).post('/api/products').set(auth(adminToken)).send({ nome: 'TESTE x', preco: 100, categoriaId: 'nao-existe' });
    expect(dec.status).toBe(400);
    expect(neg.status).toBe(400);
    expect(cat.status).toBe(400);
  });

  it('PUT altera só os campos enviados', async () => {
    const res = await request(app).put(`/api/products/${produtoId}`).set(auth(adminToken)).send({ preco: 1500 });
    expect(res.status).toBe(200);
    expect(res.body.produto.preco).toBe(1500);
    expect(res.body.produto.estoque).toBe(10); // não foi sobrescrito
    expect(res.body.produto.nome).toBe(nomeTeste);
  });

  it('PUT sem campos → 400', async () => {
    expect((await request(app).put(`/api/products/${produtoId}`).set(auth(adminToken)).send({})).status).toBe(400);
  });
});

describe('Ativar/desativar', () => {
  it('produto inativo some para o cliente, mas o admin continua vendo', async () => {
    const patch = await request(app).patch(`/api/products/${produtoId}/status`).set(auth(adminToken)).send({ status: 'inativo' });
    expect(patch.status).toBe(200);
    expect(patch.body.produto.status).toBe('inativo');

    const lista = await request(app).get('/api/products?search=TESTE Produto&limit=100').set(auth(clienteToken));
    expect(lista.body.itens.find((p: { id: string }) => p.id === produtoId)).toBeUndefined();

    expect((await request(app).get(`/api/products/${produtoId}`).set(auth(clienteToken))).status).toBe(404);
    expect((await request(app).get(`/api/products/${produtoId}`).set(auth(adminToken))).status).toBe(200);

    const listaAdmin = await request(app).get('/api/products?status=inativo&search=TESTE Produto').set(auth(adminToken));
    expect(listaAdmin.body.itens.find((p: { id: string }) => p.id === produtoId)).toBeDefined();
  });

  it('status inválido → 400', async () => {
    const res = await request(app).patch(`/api/products/${produtoId}/status`).set(auth(adminToken)).send({ status: 'talvez' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/products/:id', () => {
  it('remove produto sem pedidos', async () => {
    const res = await request(app).delete(`/api/products/${produtoId}`).set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.acao).toBe('removido');
    expect((await request(app).get(`/api/products/${produtoId}`).set(auth(adminToken))).status).toBe(404);
  });

  it('id inexistente → 404', async () => {
    expect((await request(app).delete('/api/products/nao-existe').set(auth(adminToken))).status).toBe(404);
  });
});
