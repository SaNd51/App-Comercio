// Limita tentativas de login/cadastro por IP (proteção contra força bruta).
import rateLimit from 'express-rate-limit';
import { env } from './env';

export const limitadorAutenticacao = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.NODE_ENV === 'test' ? 1000 : 10, // em testes não limitamos
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});
