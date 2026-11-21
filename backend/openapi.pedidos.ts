// Trechos OpenAPI de pedidos (mesclados em openapi.ts).
const erro = { $ref: '#/components/schemas/Erro' };
const json = (schema: object) => ({ 'application/json': { schema } });
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
const seguro = [{ bearerAuth: [] }];

const itemPedido = {
  type: 'object',
  properties: {
    produtoId: { type: 'string' },
    nome: { type: 'string' },
    quantidade: { type: 'integer' },
    precoUnitario: { type: 'integer', description: 'centavos' },
    subtotal: { type: 'integer', description: 'centavos' },
  },
};
const pedido = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    total: { type: 'integer', description: 'centavos, calculado no servidor' },
    status: { type: 'string', enum: ['aguardando_pagamento', 'pago', 'cancelado'] },
    pixPayload: { type: 'string', description: 'Pix Copia e Cola (BR Code)' },
    criadoEm: { type: 'string', format: 'date-time' },
    tipoEntrega: { type: 'string', enum: ['entrega', 'retirada'] },
    subtotal: { type: 'integer' },
    taxaEntrega: { type: 'integer' },
    statusEntrega: { type: 'string', enum: ['em_separacao', 'saiu_para_entrega', 'entregue', 'pronto_para_retirada', 'retirado'] },
    itens: { type: 'array', items: itemPedido },
  },
};
const pedidoResp = { type: 'object', properties: { pedido } };

export const pedidosPaths = {
  '/orders': {
    post: {
      tags: ['Pedidos'],
      summary: 'Cria pedido (total recalculado no servidor) e retorna o Pix',
      security: seguro,
      requestBody: {
        required: true,
        content: json({
          type: 'object',
          required: ['itens'],
          properties: {
            itens: {
              type: 'array',
              items: {
                type: 'object',
                required: ['produtoId', 'quantidade'],
                properties: { produtoId: { type: 'string' }, quantidade: { type: 'integer', minimum: 1 } },
              },
              tipoEntrega: { type: 'string', enum: ['entrega', 'retirada'], default: 'retirada' },
              enderecoId: { type: 'string' },
            },
          },
        }),
      },
      responses: {
        '201': { description: 'Pedido criado', content: json(pedidoResp) },
        '400': { description: 'Dados inválidos', content: json(erro) },
        '404': { description: 'Produto não existe mais', content: json(erro) },
        '409': { description: 'Produto inativo ou estoque insuficiente', content: json(erro) },
      },
    },
    get: {
      tags: ['Pedidos'],
      summary: 'Lista pedidos (cliente: os seus; admin: todos)',
      security: seguro,
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['aguardando_pagamento', 'pago', 'cancelado'] } },
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ],
      responses: { '200': { description: '{ pedidos, paginacao }' } },
    },
  },
  '/orders/{id}': {
    get: {
      tags: ['Pedidos'],
      summary: 'Detalhe do pedido (de outra pessoa → 404)',
      security: seguro,
      parameters: [idParam],
      responses: { '200': { description: 'Pedido', content: json(pedidoResp) }, '404': { description: 'Não encontrado', content: json(erro) } },
    },
  },
  '/orders/{id}/cancel': {
    post: {
      tags: ['Pedidos'],
      summary: 'Cancela pedido aguardando pagamento (devolve o estoque)',
      security: seguro,
      parameters: [idParam],
      responses: { '200': { description: 'Pedido cancelado', content: json(pedidoResp) }, '409': { description: 'Pedido não está aguardando pagamento', content: json(erro) } },
    },
  },
  '/orders/{id}/status': {
    patch: {
      tags: ['Pedidos'],
      summary: '[ADMIN] Marca como pago ou cancela',
      security: seguro,
      parameters: [idParam],
      requestBody: {
        required: true,
        content: json({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['pago', 'cancelado'] } } }),
      },
      responses: { '200': { description: 'Pedido atualizado', content: json(pedidoResp) }, '403': { description: 'Não é admin', content: json(erro) }, '409': { description: 'Status não pode mais mudar', content: json(erro) } },
    },
  },
  '/orders/{id}/entrega': {
    patch: {
      tags: ['Pedidos'],
      summary: '[ADMIN] Avança a próxima etapa da entrega',
      security: seguro,
      parameters: [idParam],
      requestBody: {
        content: json({
          type: 'object',
          properties: {
            previsaoEntrega: { type: 'string', format: 'date-time' },
            entregadorNome: { type: 'string' },
            entregadorTelefone: { type: 'string' },
          },
        }),
      },
      responses: { '200': { description: 'Próxima etapa registrada', content: json(pedidoResp) }, '409': { description: 'Transição inválida' } },
    },
  },
};
