import { Router } from 'express';
import { autenticar, exigirAdmin } from './auth';
import { autenticarOpcional } from './autenticarOpcional';
import { validarBody } from './validar';
import * as controller from './products.controller';
import { atualizarProdutoSchema, criarProdutoSchema, statusSchema } from './products.schemas';

export const productsRoutes = Router();

// Leitura: pública (token opcional — admin enxerga também os inativos).
productsRoutes.get('/', autenticarOpcional, controller.listar);
productsRoutes.get('/:id', autenticarOpcional, controller.detalhar);

// Escrita: somente ADMIN.
productsRoutes.post('/', autenticar, exigirAdmin, validarBody(criarProdutoSchema), controller.criar);
productsRoutes.put('/:id', autenticar, exigirAdmin, validarBody(atualizarProdutoSchema), controller.atualizar);
productsRoutes.patch('/:id/status', autenticar, exigirAdmin, validarBody(statusSchema), controller.alterarStatus);
productsRoutes.delete('/:id', autenticar, exigirAdmin, controller.remover);
