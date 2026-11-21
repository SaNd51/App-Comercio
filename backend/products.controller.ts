import { Request, Response } from 'express';
import { asyncHandler } from './asyncHandler';
import { listarQuerySchema } from './products.schemas';
import * as service from './products.service';

// Em Express 4, req.params.id é string.
const idParam = (req: Request) => String(req.params.id);

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const query = listarQuerySchema.parse(req.query); // ZodError → 400 pelo middleware central
  res.json(await service.listar(query, req.usuario?.role, req.usuario?.id));
});

export const detalhar = asyncHandler(async (req, res) => {
  res.json({ produto: await service.detalhar(idParam(req), req.usuario?.role) });
});

export const criar = asyncHandler(async (req, res) => {
  res.status(201).json({ produto: await service.criar(req.body) });
});

export const atualizar = asyncHandler(async (req, res) => {
  res.json({ produto: await service.atualizar(idParam(req), req.body) });
});

export const alterarStatus = asyncHandler(async (req, res) => {
  res.json({ produto: await service.alterarStatus(idParam(req), req.body.status) });
});

export const remover = asyncHandler(async (req, res) => {
  res.json(await service.remover(idParam(req)));
});
