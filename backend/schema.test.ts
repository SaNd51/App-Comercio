import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(__dirname, 'schema.prisma'), 'utf8');

describe('schema Prisma', () => {
  it('define todas as entidades principais', () => {
    expect(schema).toContain('model User');
    expect(schema).toContain('model Category');
    expect(schema).toContain('model Product');
    expect(schema).toContain('model Order');
    expect(schema).toContain('model OrderItem');
  });

  it('usa SQLite e mantem os valores monetarios em centavos', () => {
    expect(schema).toContain('provider = "sqlite"');
    expect(schema).toMatch(/preco\s+Int/);
    expect(schema).toMatch(/total\s+Int/);
    expect(schema).toMatch(/precoUnitario\s+Int/);
  });

  it('exige cancelamento em cascata dos itens ao excluir um pedido', () => {
    expect(schema).toContain('onDelete: Cascade');
  });
});
