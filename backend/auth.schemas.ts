// Schemas de validação (Zod) da autenticação, com mensagens em português.
import { z } from 'zod';

const email = z
  .string({ error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .email('E-mail inválido');

export const registrarSchema = z.object({
  nome: z
    .string({ error: 'Nome é obrigatório' })
    .trim()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(80, 'Nome deve ter no máximo 80 caracteres'),
  email,
  senha: z
    .string({ error: 'Senha é obrigatória' })
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres') // limite do bcrypt
    .regex(/[A-Za-z]/, 'Senha deve conter ao menos uma letra')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
  telefone: z.string().trim().max(20, 'Telefone muito longo').optional(),
  endereco: z.object({
    apelido: z.string().trim().min(1, 'Apelido é obrigatório').max(30),
    cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    logradouro: z.string().trim().min(2).max(120),
    numero: z.string().trim().min(1).max(20),
    complemento: z.string().trim().max(120).optional().default(''),
    bairro: z.string().trim().min(2).max(80),
    cidade: z.string().trim().min(2).max(80),
    uf: z.string().trim().regex(/^[A-Za-z]{2}$/, 'UF deve ter 2 letras').transform((v) => v.toUpperCase()),
    referencia: z.string().trim().max(120).optional().default(''),
  }).optional(),
});

export const loginSchema = z.object({
  email,
  senha: z.string({ error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});

export const atualizarPerfilSchema = z.object({
  nome: z.string().trim().min(2).max(80).optional(),
  telefone: z.string().trim().max(20).nullable().optional(),
}).refine((dados) => Object.keys(dados).length > 0, { message: 'Informe ao menos um campo para alterar' });

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
  senhaNova: z.string().min(8, 'Senha nova deve ter ao menos 8 caracteres').max(72).regex(/[A-Za-z]/, 'Senha nova deve conter uma letra').regex(/[0-9]/, 'Senha nova deve conter um número'),
});

export type RegistrarInput = z.infer<typeof registrarSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
