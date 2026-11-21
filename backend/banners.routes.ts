import { Router } from 'express';
import { prisma } from './prisma';
import { asyncHandler } from './asyncHandler';

export const bannersRoutes = Router();

bannersRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: 'asc' }, { criadoEm: 'asc' }],
    });
    res.json({ banners });
  }),
);
