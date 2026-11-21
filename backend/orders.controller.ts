import { asyncHandler } from './asyncHandler';
import { listarPedidosQuerySchema } from './orders.schemas';
import * as service from './orders.service';

const idParam = (req: { params: Record<string, unknown> }) => String(req.params.id);

export const criar = asyncHandler(async (req, res) => {
  res.status(201).json({ pedido: await service.criarPedido(req.usuario!.id, req.body) });
});

export const listar = asyncHandler(async (req, res) => {
  const query = listarPedidosQuerySchema.parse(req.query);
  res.json(await service.listar(req.usuario!.id, req.usuario!.role, query));
});

export const detalhar = asyncHandler(async (req, res) => {
  res.json({ pedido: await service.detalhar(idParam(req), req.usuario!.id, req.usuario!.role) });
});

export const cancelar = asyncHandler(async (req, res) => {
  res.json({ pedido: await service.mudarStatus(idParam(req), req.usuario!.id, req.usuario!.role, 'cancelado') });
});

export const alterarStatus = asyncHandler(async (req, res) => {
  res.json({ pedido: await service.mudarStatus(idParam(req), req.usuario!.id, req.usuario!.role, req.body.status) });
});

export const avancarEntrega = asyncHandler(async (req, res) => {
  res.json({ pedido: await service.avancarEntrega(idParam(req), req.usuario!.id, req.body) });
});
