import { ApiError } from '../services/api';

export function mensagemDeErro(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Algo deu errado. Tente novamente.';
}

// Converte os "detalhes" de validação da API em { campo: mensagem } para mostrar sob cada campo.
export function errosPorCampo(e: unknown): Record<string, string> {
  const mapa: Record<string, string> = {};
  if (e instanceof ApiError) for (const d of e.detalhes) if (!mapa[d.campo]) mapa[d.campo] = d.mensagem;
  return mapa;
}
