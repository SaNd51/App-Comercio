// Tratamento central de erros: sempre responde JSON { erro, detalhes? }.
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from './env';
import { AppError } from './AppError';

export function rotaNaoEncontrada(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Rota não encontrada'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tratarErros(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  }

  // JSON malformado no corpo da requisição
  if (err && typeof err === 'object' && (err as { type?: string }).type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }

  console.error(err);
  return res.status(500).json({
    erro: env.NODE_ENV === 'production' ? 'Erro interno do servidor' : String(err),
  });
}
