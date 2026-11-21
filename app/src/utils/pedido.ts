// Textos e cores dos status de pedido.
import { StatusPedido } from '../types';

export const ROTULO_STATUS: Record<StatusPedido, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

export const CORES_STATUS: Record<StatusPedido, { fundo: string; texto: string }> = {
  aguardando_pagamento: { fundo: '#FFF4DB', texto: '#9A6A00' },
  pago: { fundo: '#E3F6EC', texto: '#1E7A4A' },
  cancelado: { fundo: '#F0F1F7', texto: '#68738B' },
};

// Código curto para o cliente citar na loja: "#123E4567"
export const codigoPedido = (id: string) => `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
