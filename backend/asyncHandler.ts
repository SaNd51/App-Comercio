// Envolve handlers async para que erros caiam no middleware central (sem try/catch repetido).
import { NextFunction, Request, Response } from 'express';

export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
