// Regras de negócio da autenticação.
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { AppError } from './AppError';
import { Role, gerarToken } from './jwt';
import { LoginInput, RegistrarInput } from './auth.schemas';

const SALT_ROUNDS = 10;
// Hash falso usado quando o e-mail não existe, para o tempo de resposta
// ser parecido nos dois casos (dificulta descobrir quais e-mails estão cadastrados).
const HASH_FALSO = bcrypt.hashSync('senha-falsa-para-tempo-constante', SALT_ROUNDS);

// Nunca devolve senhaHash.
function paraPublico(u: { id: string; nome: string; email: string; telefone: string | null; role: string; criadoEm: Date }) {
  return { id: u.id, nome: u.nome, email: u.email, telefone: u.telefone, role: u.role as Role, criadoEm: u.criadoEm };
}

export async function registrarCliente(dados: RegistrarInput) {
  const existente = await prisma.user.findUnique({ where: { email: dados.email } });
  if (existente) throw new AppError(409, 'Já existe uma conta com este e-mail');

  // role é sempre "user" aqui: admins só são criados pelo seed/banco.
  const usuario = await prisma.$transaction(async (tx) => {
    const criado = await tx.user.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone || null,
        senhaHash: await bcrypt.hash(dados.senha, SALT_ROUNDS),
        role: 'user',
      },
    });
    if (dados.endereco) {
      await tx.address.create({
        data: { ...dados.endereco, userId: criado.id, principal: true },
      });
    }
    return criado;
  });

  return { token: gerarToken({ sub: usuario.id, role: 'user' }), usuario: paraPublico(usuario) };
}

export async function login({ email, senha }: LoginInput) {
  const usuario = await prisma.user.findUnique({ where: { email } });
  const senhaOk = await bcrypt.compare(senha, usuario?.senhaHash ?? HASH_FALSO);

  // Mesma mensagem para e-mail inexistente e senha errada.
  if (!usuario || !senhaOk) throw new AppError(401, 'E-mail ou senha incorretos');

  return {
    token: gerarToken({ sub: usuario.id, role: usuario.role as Role }),
    usuario: paraPublico(usuario),
  };
}

export async function buscarPerfil(userId: string) {
  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  // Token válido, mas usuário foi removido do banco.
  if (!usuario) throw new AppError(401, 'Usuário não encontrado');
  return paraPublico(usuario);
}

export async function atualizarPerfil(userId: string, dados: { nome?: string; telefone?: string | null }) {
  const atualizado = await prisma.user.update({ where: { id: userId }, data: dados });
  return paraPublico(atualizado);
}

export async function alterarSenha(userId: string, senhaAtual: string, senhaNova: string) {
  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario) throw new AppError(401, 'Usuário não encontrado');
  const correta = await bcrypt.compare(senhaAtual, usuario.senhaHash);
  if (!correta) throw new AppError(401, 'Senha atual incorreta');
  const senhaHash = await bcrypt.hash(senhaNova, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { senhaHash } });
  return { alterada: true };
}
