import { Router } from 'express';
import { autenticar, exigirAdmin } from './auth';
import { limitadorPedidos } from './rateLimitPedidos';
import { validarBody } from './validar';
import * as controller from './orders.controller';
import { criarPedidoSchema, entregaPedidoSchema, statusPedidoSchema } from './orders.schemas';

export const ordersRoutes = Router();

ordersRoutes.use(autenticar); // todas as rotas de pedido exigem login

ordersRoutes.post('/', limitadorPedidos, validarBody(criarPedidoSchema), controller.criar);
ordersRoutes.get('/', controller.listar); // cliente: os seus | admin: todos
ordersRoutes.get('/:id', controller.detalhar);
ordersRoutes.post('/:id/cancel', controller.cancelar); // dono ou admin
ordersRoutes.patch('/:id/status', exigirAdmin, validarBody(statusPedidoSchema), controller.alterarStatus);
ordersRoutes.patch('/:id/entrega', exigirAdmin, validarBody(entregaPedidoSchema), controller.avancarEntrega);
