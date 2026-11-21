import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const prisma = new PrismaClient();

beforeAll(() => {
  process.env.DATABASE_URL = 'file:./test.db';
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('banco de dados de teste', () => {
  it('contém os dados esperados do seed', async () => {
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
    ]);

    expect(counts).toEqual([2, 5, 15]);
  });

  it('mantém as credenciais principais do seed', async () => {
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
      orderBy: { email: 'asc' },
    });

    expect(users).toContainEqual({
      email: 'admin@mercadinho.com',
      role: 'admin',
    });
    expect(users).toContainEqual({
      email: 'cliente@mercadinho.com',
      role: 'user',
    });
  });
});
