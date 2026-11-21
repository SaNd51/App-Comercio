// Limita a criação de pedidos por IP (evita enchente de pedidos e esgotamento de estoque).
import rateLimit from 'express-rate-limit';
import { env } from './env';

export const limitadorPedidos = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitos pedidos em pouco tempo. Tente novamente em alguns minutos.' },
});
