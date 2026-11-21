import { NextFunction, Request, Response } from 'express';
import * as service from './auth.service';

// Cada handler só repassa dados e delega erros ao middleware central.
export async function registrar(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.registrarCliente(req.body));
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.login(req.body));
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ usuario: await service.buscarPerfil(req.usuario!.id) });
  } catch (e) {
    next(e);
  }
}

export async function atualizarPerfil(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ usuario: await service.atualizarPerfil(req.usuario!.id, req.body) });
  } catch (e) {
    next(e);
  }
}

export async function alterarSenha(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.alterarSenha(req.usuario!.id, req.body.senhaAtual, req.body.senhaNova));
  } catch (e) {
    next(e);
  }
}
