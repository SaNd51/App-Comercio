import { Router } from 'express';
import { AppError } from './AppError';
import { autenticar } from './auth';
import { asyncHandler } from './asyncHandler';
import { prisma } from './prisma';

export const favoritesRoutes = Router();
favoritesRoutes.use(autenticar);

favoritesRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const favoritos = await prisma.favorite.findMany({
      where: { userId: req.usuario!.id },
      include: { product: { include: { categoria: { select: { id: true, nome: true } } } } },
    });
    res.json({ produtos: favoritos.map((f) => ({ ...f.product, favorito: true })) });
  }),
);

favoritesRoutes.put(
  '/:productId',
  asyncHandler(async (req, res) => {
    const produto = await prisma.product.findUnique({ where: { id: String(req.params.productId) } });
    if (!produto) throw new AppError(404, 'Produto não encontrado');
    await prisma.favorite.upsert({
      where: { userId_productId: { userId: req.usuario!.id, productId: produto.id } },
      update: {},
      create: { userId: req.usuario!.id, productId: produto.id },
    });
    res.status(201).json({ favorito: true });
  }),
);

favoritesRoutes.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    await prisma.favorite.deleteMany({ where: { userId: req.usuario!.id, productId: String(req.params.productId) } });
    res.json({ favorito: false });
  }),
);
