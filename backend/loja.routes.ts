import { Router } from 'express';
import { prisma } from './prisma';
import { asyncHandler } from './asyncHandler';
import { autenticar, exigirAdmin } from './auth';
import { z } from 'zod';

export const lojaRoutes = Router();

lojaRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const loja = await prisma.loja.findUnique({ where: { id: 'loja' } });
    res.json({ loja });
  }),
);

lojaRoutes.put(
  '/',
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    const dados = z.object({
      nome: z.string().trim().min(2).max(80).optional(),
      slogan: z.string().trim().max(120).optional(),
      telefone: z.string().trim().max(30).optional(),
      whatsapp: z.string().trim().max(30).optional(),
      email: z.string().trim().email().optional(),
      endereco: z.string().trim().max(200).optional(),
      horarios: z.string().trim().max(200).optional(),
      quemSomos: z.string().trim().max(2000).optional(),
      termosPedido: z.string().trim().max(2000).optional(),
      avisoLegal: z.string().trim().max(2000).optional(),
      taxaEntrega: z.number().int().min(0).optional(),
      freteGratisAcima: z.number().int().min(0).optional(),
      pedidoMinimo: z.number().int().min(0).optional(),
    }).parse(req.body);
    const loja = await prisma.loja.update({ where: { id: 'loja' }, data: dados });
    res.json({ loja });
  }),
);
