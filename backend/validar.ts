// Valida (e limpa) o corpo da requisição com um schema Zod.
// Campos desconhecidos são descartados — o cliente não consegue, por exemplo, enviar "role".
import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export const validarBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) return next(resultado.error); // tratado em erros.ts
    req.body = resultado.data;
    next();
  };
