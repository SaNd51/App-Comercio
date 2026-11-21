import { Router } from 'express';
import { AppError } from './AppError';
import { asyncHandler } from './asyncHandler';

export const cepRoutes = Router();
const cache = new Map<string, { dados: unknown; expiraEm: number }>();

cepRoutes.get(
  '/:cep',
  asyncHandler(async (req, res) => {
    const cep = String(req.params.cep).replace(/\D/g, '');
    if (!/^\d{8}$/.test(cep)) throw new AppError(400, 'CEP deve ter 8 dígitos');
    const cacheado = cache.get(cep);
    if (cacheado && cacheado.expiraEm > Date.now()) {
      res.json(cacheado.dados);
      return;
    }

    const controle = new AbortController();
    const timeout = setTimeout(() => controle.abort(), 5000);
    let resposta: Response;
    try {
      resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controle.signal });
    } catch {
      throw new AppError(502, 'Não foi possível consultar o CEP. Informe o endereço manualmente.');
    } finally {
      clearTimeout(timeout);
    }
    if (!resposta.ok) throw new AppError(502, 'Não foi possível consultar o CEP.');
    const dados = await resposta.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
    if (dados.erro) throw new AppError(404, 'CEP não encontrado');
    const resultado = {
      cep,
      logradouro: dados.logradouro ?? '',
      bairro: dados.bairro ?? '',
      cidade: dados.localidade ?? '',
      uf: dados.uf ?? '',
    };
    cache.set(cep, { dados: resultado, expiraEm: Date.now() + 30 * 60 * 1000 });
    res.json(resultado);
  }),
);
