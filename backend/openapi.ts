import { produtosPaths } from './openapi.produtos';
import { pedidosPaths } from './openapi.pedidos';
// Documentação OpenAPI (Swagger). Será ampliada nas próximas etapas.
const erro = { type: 'object', properties: { erro: { type: 'string' } } };
const usuario = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    nome: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string', enum: ['user', 'admin'] },
    criadoEm: { type: 'string', format: 'date-time' },
  },
};
const sessao = {
  type: 'object',
  properties: { token: { type: 'string' }, usuario },
};

export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Mercadinho Ximenes API', version: '1.0.0' },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: { Erro: erro },
  },
  paths: {
    ...produtosPaths,
    ...pedidosPaths,
    '/auth/register': {
      post: {
        tags: ['Autenticação'],
        summary: 'Cadastro de cliente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome', 'email', 'senha'],
                properties: {
                  nome: { type: 'string' },
                  email: { type: 'string' },
                  senha: { type: 'string', description: 'Mín. 8 caracteres, com letra e número' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Conta criada', content: { 'application/json': { schema: sessao } } },
          '400': { description: 'Dados inválidos', content: { 'application/json': { schema: erro } } },
          '409': { description: 'E-mail já cadastrado', content: { 'application/json': { schema: erro } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Login (cliente ou admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'senha'],
                properties: { email: { type: 'string' }, senha: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Token JWT e usuário', content: { 'application/json': { schema: sessao } } },
          '401': { description: 'Credenciais incorretas', content: { 'application/json': { schema: erro } } },
          '429': { description: 'Muitas tentativas', content: { 'application/json': { schema: erro } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticação'],
        summary: 'Dados do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Usuário',
            content: { 'application/json': { schema: { type: 'object', properties: { usuario } } } },
          },
          '401': { description: 'Token ausente/inválido', content: { 'application/json': { schema: erro } } },
        },
      },
      '/addresses': {
        get: { tags: ['Endereços'], summary: 'Lista endereços do usuário', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista de endereços' } } },
        post: { tags: ['Endereços'], summary: 'Cria endereço', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Endereço criado' }, '409': { description: 'Limite de 5 endereços' } } },
      },
      '/addresses/{id}/principal': {
        patch: { tags: ['Endereços'], summary: 'Define endereço principal', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Endereço atualizado' } } },
      },
      '/cep/{cep}': {
        get: { tags: ['CEP'], summary: 'Consulta ViaCEP pelo backend', parameters: [{ name: 'cep', in: 'path', required: true, schema: { type: 'string', pattern: '^\\\\d{8}$' } }], responses: { '200': { description: 'Dados do endereço' }, '404': { description: 'CEP não encontrado' }, '502': { description: 'Falha na consulta ViaCEP' } } },
      },
      '/favorites': {
        get: { tags: ['Favoritos'], summary: 'Lista produtos favoritos', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Produtos favoritos' } } },
      },
      '/favorites/{productId}': {
        put: { tags: ['Favoritos'], summary: 'Adiciona favorito', security: [{ bearerAuth: [] }], parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Favorito criado' } } },
        delete: { tags: ['Favoritos'], summary: 'Remove favorito', security: [{ bearerAuth: [] }], parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Favorito removido' } } },
      },
      '/banners': {
        get: { tags: ['Loja'], summary: 'Lista banners ativos em ordem', responses: { '200': { description: 'Banners' } } },
      },
      '/loja': {
        get: { tags: ['Loja'], summary: 'Dados públicos da loja', responses: { '200': { description: 'Configuração da loja' } } },
      },
    },
  },
};
