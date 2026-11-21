// Middlewares de autenticação (JWT) e autorização (role).
import { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError';
import { Role, verificarToken } from './jwt';

// Estende o Request do Express com o usuário autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: { id: string; role: Role };
    }
  }
}

// Exige "Authorization: Bearer <token>" válido.
export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Token de acesso não informado'));
  }
  try {
    const payload = verificarToken(header.slice(7));
    req.usuario = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Token inválido ou expirado'));
  }
}

// Use SEMPRE depois de `autenticar`. Bloqueia quem não é admin (403).
export function exigirAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.usuario?.role !== 'admin') {
    return next(new AppError(403, 'Acesso restrito a administradores'));
  }
  next();
}
