// GET /api/categories — alimenta os chips da Home e o filtro do painel admin.
import { Router } from 'express';
import { prisma } from './prisma';
import { asyncHandler } from './asyncHandler';

export const categoriesRoutes = Router();

categoriesRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categorias = await prisma.category.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        icone: true,
        ordem: true,
        _count: { select: { produtos: { where: { status: 'ativo' } } } }, // só ativos
      },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
    res.json({
      categorias: categorias.map((c) => ({
        id: c.id,
        nome: c.nome,
        descricao: c.descricao,
        icone: c.icone,
        ordem: c.ordem,
        totalProdutos: c._count.produtos,
      })),
    });
  }),
);
