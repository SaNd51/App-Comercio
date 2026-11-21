// Leitura e validação das variáveis de ambiente na inicialização.
// Se algo estiver faltando, a API nem sobe — falhar cedo evita bugs em produção.
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGINS: z.string().default('*'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PIX_CHAVE: z.string().min(1),
  PIX_NOME_RECEBEDOR: z.string().min(1).max(25),
  PIX_CIDADE: z.string().min(1).max(15),
  PEDIDO_EXPIRA_MINUTOS: z.coerce.number().int().min(1).default(60),
});

export function parseEnv(input: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      `Variáveis de ambiente inválidas: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
    );
  }
  return parsed.data;
}

export const env = parseEnv();
