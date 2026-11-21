// Testes de integração da autenticação (usam o banco de teste SQLite).
// As variáveis são definidas ANTES de importar o app, pois env.ts valida ao carregar.
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'file:./test.db';
process.env.JWT_SECRET ??= 'segredo-de-teste-com-mais-de-16-caracteres';
process.env.PIX_CHAVE ??= 'chave-teste';
process.env.PIX_NOME_RECEBEDOR ??= 'LOJA TESTE';
process.env.PIX_CIDADE ??= 'SOBRAL';

const email = `teste.${Date.now()}@exemplo.com`;
const senha = 'Senha1234';

let app: Express;
let prisma: typeof import('./prisma').prisma;
let token = '';

beforeAll(async () => {
  app = (await import('./app')).app;
  prisma = (await import('./prisma')).prisma;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: 'teste.' } } }); // limpa o que criamos
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('cadastra cliente, devolve token e não expõe senhaHash', async () => {
    const res = await request(app).post('/api/auth/register').send({ nome: 'Maria', email, senha });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario.role).toBe('user');
    expect(res.body.usuario.senhaHash).toBeUndefined();
  });

  it('ignora tentativa de se cadastrar como admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Hacker', email: `teste.admin.${Date.now()}@exemplo.com`, senha, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.usuario.role).toBe('user');
  });

  it('rejeita e-mail duplicado com 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ nome: 'Maria', email, senha });
    expect(res.status).toBe(409);
  });

  it('rejeita dados inválidos com 400 e detalhes por campo', async () => {
    const res = await request(app).post('/api/auth/register').send({ nome: 'M', email: 'x', senha: '123' });
    expect(res.status).toBe(400);
    expect(res.body.detalhes.length).toBeGreaterThanOrEqual(3);
  });
});

describe('POST /api/auth/login', () => {
  it('autentica com credenciais corretas', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, senha });
    expect(res.status).toBe(200);
    token = res.body.token;
    expect(token).toBeTruthy();
  });

  it('aceita e-mail com maiúsculas/espaços (normalizado)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: `  ${email.toUpperCase()} `, senha });
    expect(res.status).toBe(200);
  });

  it('retorna 401 com a mesma mensagem para senha errada e e-mail inexistente', async () => {
    const a = await request(app).post('/api/auth/login').send({ email, senha: 'errada123' });
    const b = await request(app).post('/api/auth/login').send({ email: 'naoexiste@exemplo.com', senha });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.erro).toBe(b.body.erro);
  });
});

describe('GET /api/auth/me', () => {
  it('exige token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  it('rejeita token inválido', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  it('retorna o usuário autenticado', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.email).toBe(email);
    expect(res.body.usuario.senhaHash).toBeUndefined();
  });
});
