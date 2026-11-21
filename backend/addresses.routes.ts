import { Router } from 'express';
import { AppError } from './AppError';
import { autenticar } from './auth';
import { asyncHandler } from './asyncHandler';
import { prisma } from './prisma';
import { criarEnderecoSchema, atualizarEnderecoSchema } from './address.schemas';
import { validarBody } from './validar';

export const addressesRoutes = Router();
addressesRoutes.use(autenticar);

addressesRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const enderecos = await prisma.address.findMany({
      where: { userId: req.usuario!.id },
      orderBy: [{ principal: 'desc' }, { criadoEm: 'desc' }],
    });
    res.json({ enderecos });
  }),
);

addressesRoutes.post(
  '/',
  validarBody(criarEnderecoSchema),
  asyncHandler(async (req, res) => {
    const userId = req.usuario!.id;
    const total = await prisma.address.count({ where: { userId } });
    if (total >= 5) throw new AppError(409, 'Você pode cadastrar no máximo 5 endereços');
    const principal = total === 0;
    const endereco = await prisma.address.create({ data: { ...req.body, userId, principal } });
    res.status(201).json({ endereco });
  }),
);

addressesRoutes.put(
  '/:id',
  validarBody(atualizarEnderecoSchema),
  asyncHandler(async (req, res) => {
    const atual = await prisma.address.findFirst({ where: { id: String(req.params.id), userId: req.usuario!.id } });
    if (!atual) throw new AppError(404, 'Endereço não encontrado');
    const endereco = await prisma.address.update({ where: { id: atual.id }, data: req.body });
    res.json({ endereco });
  }),
);

addressesRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const atual = await prisma.address.findFirst({ where: { id: String(req.params.id), userId: req.usuario!.id } });
    if (!atual) throw new AppError(404, 'Endereço não encontrado');
    await prisma.address.delete({ where: { id: atual.id } });
    if (atual.principal) {
      const outro = await prisma.address.findFirst({ where: { userId: req.usuario!.id }, orderBy: { criadoEm: 'asc' } });
      if (outro) await prisma.address.update({ where: { id: outro.id }, data: { principal: true } });
    }
    res.json({ excluido: true });
  }),
);

addressesRoutes.patch(
  '/:id/principal',
  asyncHandler(async (req, res) => {
    const atual = await prisma.address.findFirst({ where: { id: String(req.params.id), userId: req.usuario!.id } });
    if (!atual) throw new AppError(404, 'Endereço não encontrado');
    await prisma.address.updateMany({ where: { userId: req.usuario!.id }, data: { principal: false } });
    const endereco = await prisma.address.update({ where: { id: atual.id }, data: { principal: true } });
    res.json({ endereco });
  }),
);
