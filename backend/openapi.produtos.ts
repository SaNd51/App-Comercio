// Trechos OpenAPI de produtos e categorias (mesclados em openapi.ts).
const erro = { $ref: '#/components/schemas/Erro' };
const json = (schema: object) => ({ 'application/json': { schema } });
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
const seguro = [{ bearerAuth: [] }];

const produtoCampos = {
  nome: { type: 'string' },
  descricao: { type: 'string' },
  preco: { type: 'integer', description: 'Em CENTAVOS. R$ 4,90 = 490' },
  categoriaId: { type: 'string' },
  imagemUrl: { type: 'string', nullable: true },
  estoque: { type: 'integer' },
  status: { type: 'string', enum: ['ativo', 'inativo'] },
  unidade: { type: 'string' },
  precoPromocional: { type: 'integer', nullable: true },
  promocaoAte: { type: 'string', format: 'date-time', nullable: true },
  destaqueSemana: { type: 'boolean' },
};
const produto = { type: 'object', properties: { id: { type: 'string' }, ...produtoCampos } };
const produtoResp = { type: 'object', properties: { produto } };

export const produtosPaths = {
  '/products': {
    get: {
      tags: ['Produtos'],
      summary: 'Lista produtos (ativos; admin pode usar status=inativo|todos)',
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'category', in: 'query', schema: { type: 'string' }, description: 'id ou nome' },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['ativo', 'inativo', 'todos'] } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        { name: 'oferta', in: 'query', schema: { type: 'boolean' } },
        { name: 'semana', in: 'query', schema: { type: 'boolean' } },
        { name: 'sort', in: 'query', schema: { type: 'string', enum: ['desconto', 'preco'] } },
      ],
      responses: { '200': { description: 'Página de produtos' }, '400': { description: 'Query inválida', content: json(erro) } },
    },
    post: {
      tags: ['Produtos'],
      summary: '[ADMIN] Cadastra produto',
      security: seguro,
      requestBody: {
        required: true,
        content: json({ type: 'object', required: ['nome', 'preco', 'categoriaId'], properties: produtoCampos }),
      },
      responses: {
        '201': { description: 'Criado', content: json(produtoResp) },
        '400': { description: 'Dados inválidos', content: json(erro) },
        '401': { description: 'Sem token', content: json(erro) },
        '403': { description: 'Não é admin', content: json(erro) },
      },
    },
  },
  '/products/{id}': {
    get: {
      tags: ['Produtos'],
      summary: 'Detalhe do produto (inativo → 404 para não-admin)',
      parameters: [idParam],
      responses: { '200': { description: 'Produto', content: json(produtoResp) }, '404': { description: 'Não encontrado', content: json(erro) } },
    },
    put: {
      tags: ['Produtos'],
      summary: '[ADMIN] Altera produto (campos parciais)',
      security: seguro,
      parameters: [idParam],
      requestBody: { required: true, content: json({ type: 'object', properties: produtoCampos }) },
      responses: { '200': { description: 'Atualizado', content: json(produtoResp) }, '404': { description: 'Não encontrado', content: json(erro) } },
    },
    delete: {
      tags: ['Produtos'],
      summary: '[ADMIN] Remove (ou inativa, se já houver pedidos)',
      security: seguro,
      parameters: [idParam],
      responses: { '200': { description: '{ acao: "removido" | "inativado" }' }, '404': { description: 'Não encontrado', content: json(erro) } },
    },
  },
  '/products/{id}/status': {
    patch: {
      tags: ['Produtos'],
      summary: '[ADMIN] Ativa/desativa produto',
      security: seguro,
      parameters: [idParam],
      requestBody: {
        required: true,
        content: json({ type: 'object', required: ['status'], properties: { status: produtoCampos.status } }),
      },
      responses: { '200': { description: 'Atualizado', content: json(produtoResp) } },
    },
  },
  '/categories': {
    get: { tags: ['Produtos'], summary: 'Lista categorias', responses: { '200': { description: 'Categorias com total de produtos ativos' } } },
  },
};
