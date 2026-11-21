// Schemas de validação (Zod) de pedidos.
// O app envia APENAS produtoId e quantidade — preço e total vêm sempre do banco.
import { z } from 'zod';

export const criarPedidoSchema = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.string().min(1, 'Produto inválido'),
        quantidade: z
          .number({ message: 'Quantidade deve ser um número inteiro' })
          .int('Quantidade deve ser um número inteiro')
          .min(1, 'Quantidade mínima é 1')
          .max(999, 'Quantidade máxima é 999'),
      }),
    )
    .min(1, 'Informe ao menos um item')
    .max(50, 'Máximo de 50 itens por pedido'),
  tipoEntrega: z.enum(['entrega', 'retirada']).default('retirada'),
  enderecoId: z.string().optional(),
});

export const entregaPedidoSchema = z.object({
  previsaoEntrega: z.string().datetime().optional(),
  entregadorNome: z.string().trim().max(80).optional(),
  entregadorTelefone: z.string().trim().max(20).optional(),
});

export const statusPedidoSchema = z.object({
  status: z.enum(['pago', 'cancelado'], { message: 'Status deve ser "pago" ou "cancelado"' }),
});

export const listarPedidosQuerySchema = z.object({
  status: z.enum(['aguardando_pagamento', 'pago', 'cancelado']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>;
export type ListarPedidosQuery = z.infer<typeof listarPedidosQuerySchema>;
