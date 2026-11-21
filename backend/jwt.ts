// Geração e verificação do token JWT (access token).
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from './env';

export type Role = 'user' | 'admin';

export interface TokenPayload {
  sub: string; // id do usuário
  role: Role;
}

export function gerarToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

// Lança erro se o token for inválido ou estiver expirado.
export function verificarToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Token malformado');
  }
  return { sub: String(decoded.sub), role: decoded.role as Role };
}
