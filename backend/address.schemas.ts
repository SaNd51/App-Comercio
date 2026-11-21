import { z } from 'zod';

const endereco = {
  apelido: z.string().trim().min(1, 'Apelido é obrigatório').max(30, 'Apelido muito longo'),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().trim().min(2, 'Rua é obrigatória').max(120),
  numero: z.string().trim().min(1, 'Número é obrigatório').max(20),
  complemento: z.string().trim().max(120).optional().default(''),
  bairro: z.string().trim().min(2, 'Bairro é obrigatório').max(80),
  cidade: z.string().trim().min(2, 'Cidade é obrigatória').max(80),
  uf: z.string().trim().regex(/^[A-Za-z]{2}$/, 'UF deve ter 2 letras').transform((v) => v.toUpperCase()),
  referencia: z.string().trim().max(120).optional().default(''),
};

export const criarEnderecoSchema = z.object(endereco);
export const atualizarEnderecoSchema = z.object({
  ...Object.fromEntries(Object.entries(endereco).map(([chave, schema]) => [chave, schema.optional()])),
}).refine((dados) => Object.keys(dados).length > 0, { message: 'Informe ao menos um campo para alterar' });
