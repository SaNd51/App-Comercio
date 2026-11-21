// Identifica o usuário SE houver token, mas não exige login.
// Usado na vitrine: visitantes e clientes veem só produtos ativos; admin pode ver os inativos.
// Token presente porém inválido/expirado → 401 (o app deve refazer o login).
import { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError';
import { verificarToken } from './jwt';

export function autenticarOpcional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return next();
  if (!header.startsWith('Bearer ')) return next(new AppError(401, 'Token inválido ou expirado'));
  try {
    const payload = verificarToken(header.slice(7));
    req.usuario = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Token inválido ou expirado'));
  }
}
