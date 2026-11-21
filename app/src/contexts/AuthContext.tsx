// Sessão do usuário: restaura o token ao abrir o app, faz login/cadastro/logout.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, definirAoExpirar, definirToken } from '../services/api';
import { lerToken, removerToken, salvarToken } from '../services/storage';
import { Sessao, Usuario } from '../types';
import { useCarrinho } from '../store/carrinho';
import { useToast } from './ToastContext';

interface AuthValor {
  usuario: Usuario | null;
  carregando: boolean; // true enquanto verifica a sessão salva
  login: (email: string, senha: string) => Promise<void>;
  registrar: (nome: string, email: string, senha: string, telefone?: string, endereco?: unknown) => Promise<void>;
  sair: () => Promise<void>;
}

const Ctx = createContext<AuthValor>(null as unknown as AuthValor);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { mostrar } = useToast();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const limpar = useCallback(async () => {
    definirToken(null);
    await removerToken();
    setUsuario(null);
  }, []);

  const iniciarSessao = useCallback(async ({ token, usuario: u }: Sessao) => {
    await salvarToken(token);
    definirToken(token);
    useCarrinho.getState().definirDono(u.id);
    setUsuario(u);
  }, []);

  // Token expirado durante o uso → volta para o login.
  useEffect(() => {
    definirAoExpirar(() => {
      limpar();
      mostrar('Sua sessão expirou. Entre novamente.', 'info');
    });
    return () => definirAoExpirar(null);
  }, [limpar, mostrar]);

  // Restaura a sessão salva ao abrir o app.
  useEffect(() => {
    (async () => {
      try {
        const token = await lerToken();
        if (token) {
          definirToken(token);
          const { usuario: u } = await api<{ usuario: Usuario }>('/auth/me');
          useCarrinho.getState().definirDono(u.id);
          setUsuario(u);
        }
      } catch {
        await limpar(); // token inválido/expirado (ou API fora do ar): pede login
      } finally {
        setCarregando(false);
      }
    })();
  }, [limpar]);

  const login = useCallback(
    async (email: string, senha: string) => {
      await iniciarSessao(await api<Sessao>('/auth/login', { method: 'POST', body: { email, senha } }));
    },
    [iniciarSessao],
  );

  const registrar = useCallback(
    async (nome: string, email: string, senha: string, telefone?: string, endereco?: unknown) => {
      await iniciarSessao(await api<Sessao>('/auth/register', { method: 'POST', body: { nome, email, senha, telefone, endereco } }));
    },
    [iniciarSessao],
  );

  return <Ctx.Provider value={{ usuario, carregando, login, registrar, sair: limpar }}>{children}</Ctx.Provider>;
}
