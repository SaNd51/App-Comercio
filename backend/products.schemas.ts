// Schemas de validação (Zod) de produtos.
// OBS.: os campos opcionais NÃO usam .default() aqui de propósito — nas atualizações
// parciais (PUT) um default sobrescreveria dados existentes. Os padrões são aplicados no service.
import { z } from 'zod';

const campos = {
  nome: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(120, 'Nome muito longo'),
  descricao: z.string().trim().max(1000, 'Descrição muito longa'),
  // PREÇO EM CENTAVOS (inteiro). Ex.: R$ 4,90 → 490
  preco: z
    .number({ message: 'Preço deve ser um número inteiro em centavos' })
    .int('Preço deve ser um número inteiro em centavos')
    .min(1, 'Preço deve ser maior que zero')
    .max(100_000_000, 'Preço acima do permitido'),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
  imagemUrl: z.string().trim().url('URL da imagem inválida').max(500).nullable(),
  estoque: z
    .number({ message: 'Estoque deve ser um número inteiro' })
    .int('Estoque deve ser um número inteiro')
    .min(0, 'Estoque não pode ser negativo')
    .max(1_000_000),
  status: z.enum(['ativo', 'inativo'], { message: 'Status deve ser "ativo" ou "inativo"' }),
  unidade: z.string().trim().max(80, 'Unidade muito longa'),
  precoPromocional: z.number({ message: 'Preço promocional inválido' }).int().min(1).max(100_000_000).nullable(),
  promocaoAte: z.string().datetime({ message: 'Validade da promoção inválida' }).nullable().optional(),
  destaqueSemana: z.boolean(),
};

// Cadastro: nome, preço e categoria são obrigatórios.
export const criarProdutoSchema = z.object({
  nome: campos.nome,
  preco: campos.preco,
  categoriaId: campos.categoriaId,
  descricao: campos.descricao.optional(),
  imagemUrl: campos.imagemUrl.optional(),
  estoque: campos.estoque.optional(),
  status: campos.status.optional(),
  unidade: campos.unidade.optional(),
  precoPromocional: campos.precoPromocional.optional(),
  promocaoAte: campos.promocaoAte.optional(),
  destaqueSemana: campos.destaqueSemana.optional(),
});

// Alteração: qualquer subconjunto dos campos, mas ao menos um.
export const atualizarProdutoSchema = z
  .object({
    nome: campos.nome.optional(),
    preco: campos.preco.optional(),
    categoriaId: campos.categoriaId.optional(),
    descricao: campos.descricao.optional(),
    imagemUrl: campos.imagemUrl.optional(),
    estoque: campos.estoque.optional(),
    status: campos.status.optional(),
    unidade: campos.unidade.optional(),
    precoPromocional: campos.precoPromocional.optional(),
    promocaoAte: campos.promocaoAte.optional(),
    destaqueSemana: campos.destaqueSemana.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Informe ao menos um campo para alterar' });

export const statusSchema = z.object({ status: campos.status });

// Query string da listagem: ?search=&category=&status=&page=&limit=
export const listarQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(), // aceita id OU nome da categoria
  status: z.enum(['ativo', 'inativo', 'todos']).default('ativo'), // só vale para admin
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  oferta: z.enum(['true', 'false']).optional(),
  semana: z.enum(['true', 'false']).optional(),
  sort: z.enum(['desconto', 'preco']).optional(),
});

export type CriarProdutoInput = z.infer<typeof criarProdutoSchema>;
export type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>;
export type ListarQuery = z.infer<typeof listarQuerySchema>;
