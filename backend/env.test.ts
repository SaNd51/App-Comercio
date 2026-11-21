import { describe, expect, it } from 'vitest';

const validEnv = {
  DATABASE_URL: 'file:./test.db',
  JWT_SECRET: 'segredo-de-teste-com-16-caracteres',
  PIX_CHAVE: 'teste@pix',
  PIX_NOME_RECEBEDOR: 'MERCADINHO XIMENES',
  PIX_CIDADE: 'SOBRAL',
};

describe('parseEnv', () => {
  it('aplica os valores padrao', async () => {
    process.env.DATABASE_URL = validEnv.DATABASE_URL;
    process.env.JWT_SECRET = validEnv.JWT_SECRET;
    process.env.PIX_CHAVE = validEnv.PIX_CHAVE;
    process.env.PIX_NOME_RECEBEDOR = validEnv.PIX_NOME_RECEBEDOR;
    process.env.PIX_CIDADE = validEnv.PIX_CIDADE;
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.CORS_ORIGINS;
    delete process.env.JWT_EXPIRES_IN;

    const { parseEnv } = await import('./env');
    const result = parseEnv(validEnv);

    expect(result.PORT).toBe(3333);
    expect(result.NODE_ENV).toBe('development');
    expect(result.CORS_ORIGINS).toBe('*');
    expect(result.JWT_EXPIRES_IN).toBe('7d');
  });

  it('rejeita um JWT_SECRET curto', async () => {
    const { parseEnv } = await import('./env');
    expect(() =>
      parseEnv({
        ...validEnv,
        JWT_SECRET: 'curto',
      })
    ).toThrow('Variáveis de ambiente inválidas');
  });

  it('rejeita variaveis obrigatorias ausentes', async () => {
    const { parseEnv } = await import('./env');
    expect(() => parseEnv({})).toThrow('Variáveis de ambiente inválidas');
  });

  it('converte PORT para numero', async () => {
    const { parseEnv } = await import('./env');
    expect(parseEnv({ ...validEnv, PORT: '4500' }).PORT).toBe(4500);
  });
});
