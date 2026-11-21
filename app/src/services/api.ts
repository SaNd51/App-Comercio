// Cliente HTTP da API: injeta o token, aplica timeout e padroniza os erros.
import { API_URL } from '../config';

export interface DetalheErro {
  campo: string;
  mensagem: string;
}

export class ApiError extends Error {
  constructor(
    public status: number, // 0 = falha de rede/timeout
    mensagem: string,
    public detalhes: DetalheErro[] = [],
  ) {
    super(mensagem);
    this.name = 'ApiError';
  }
}

let token: string | null = null;
let aoExpirar: (() => void) | null = null;

export const definirToken = (t: string | null) => {
  token = t;
};
// Chamado quando uma requisição AUTENTICADA recebe 401 (token expirado/inválido).
export const definirAoExpirar = (fn: (() => void) | null) => {
  aoExpirar = fn;
};

interface Opcoes {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
}

function montarQuery(query?: Opcoes['query']) {
  if (!query) return '';
  const partes = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return partes.length ? `?${partes.join('&')}` : '';
}

export async function api<T>(caminho: string, { method = 'GET', body, query }: Opcoes = {}): Promise<T> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), 15000);

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}${montarQuery(query)}`, {
      method,
      signal: controle.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua internet.');
  } finally {
    clearTimeout(timer);
  }

  const texto = await resposta.text();
  let dados: any = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    /* resposta não-JSON */
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && token) aoExpirar?.();
    throw new ApiError(resposta.status, dados?.erro ?? 'Algo deu errado. Tente novamente.', dados?.detalhes ?? []);
  }
  return dados as T;
}
