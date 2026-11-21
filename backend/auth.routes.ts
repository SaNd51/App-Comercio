import { Router } from 'express';
import { autenticar } from './auth';
import { limitadorAutenticacao } from './rateLimit';
import { validarBody } from './validar';
import * as controller from './auth.controller';
import { alterarSenhaSchema, atualizarPerfilSchema, loginSchema, registrarSchema } from './auth.schemas';

export const authRoutes = Router();

authRoutes.post('/register', limitadorAutenticacao, validarBody(registrarSchema), controller.registrar);
authRoutes.post('/login', limitadorAutenticacao, validarBody(loginSchema), controller.login);
authRoutes.get('/me', autenticar, controller.me);
authRoutes.patch('/me', autenticar, validarBody(atualizarPerfilSchema), controller.atualizarPerfil);
authRoutes.patch('/password', autenticar, validarBody(alterarSenhaSchema), controller.alterarSenha);
