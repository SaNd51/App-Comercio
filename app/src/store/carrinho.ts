// Estado global do carrinho (Zustand) com persistência: o carrinho sobrevive ao fechar o app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ApiError, api } from '../services/api';
import { Produto } from '../types';
import {
  Atualizacao,
  DadosProduto,
  ItemCarrinho,
  adicionarItem,
  alterarQuantidade,
  aplicarAtualizacao,
  contarUnidades,
  removerItem,
} from './carrinhoLogica';

const deProduto = (p: Produto): DadosProduto => ({
  produtoId: p.id,
  nome: p.nome,
  preco: p.precoEfetivo ?? p.preco,
  imagemUrl: p.imagemUrl,
  categoria: p.categoria.nome,
  estoque: p.estoque,
});

interface Estado {
  itens: ItemCarrinho[];
  donoId: string | null; // de quem é o carrinho salvo
  adicionar: (produto: Produto, quantidade?: number) => { adicionado: number; limitado: boolean };
  definirQuantidade: (produtoId: string, quantidade: number) => void;
  remover: (produtoId: string) => void;
  limpar: () => void;
  definirDono: (userId: string) => void;
  sincronizar: () => Promise<{ precoMudou: boolean }>;
}

export const useCarrinho = create<Estado>()(
  persist(
    (set, get) => ({
      itens: [],
      donoId: null,

      adicionar: (produto, quantidade = 1) => {
        const r = adicionarItem(get().itens, deProduto(produto), quantidade);
        set({ itens: r.itens });
        return { adicionado: r.adicionado, limitado: r.limitado };
      },

      definirQuantidade: (id, q) => set({ itens: alterarQuantidade(get().itens, id, q) }),
      remover: (id) => set({ itens: removerItem(get().itens, id) }),
      limpar: () => set({ itens: [] }),

      // Se outra pessoa entrou no aparelho, o carrinho da anterior é descartado.
      definirDono: (userId) => {
        if (get().donoId !== userId) set({ itens: [], donoId: userId });
      },

      // Confere preço/estoque/status atuais de cada item na API.
      sincronizar: async () => {
        const atuais = get().itens;
        if (atuais.length === 0) return { precoMudou: false };

        const resultados = await Promise.allSettled(
          atuais.map((i) => api<{ produto: Produto }>(`/products/${i.produtoId}`)),
        );
        const mapa = new Map<string, Atualizacao>();
        resultados.forEach((r, idx) => {
          const id = atuais[idx].produtoId;
          if (r.status === 'fulfilled') {
            const p = r.value.produto;
            mapa.set(id, { tipo: 'ok', dados: { ...deProduto(p), ativo: p.status === 'ativo' } });
          } else if (r.reason instanceof ApiError && r.reason.status === 404) {
            mapa.set(id, { tipo: 'removido' }); // inativo ou apagado
          } // falha de rede: mantém o item como está
        });

        const { itens, precoMudou } = aplicarAtualizacao(get().itens, mapa);
        set({ itens });
        return { precoMudou };
      },
    }),
    {
      name: 'mercadinho_carrinho',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ itens: s.itens, donoId: s.donoId }),
    },
  ),
);

// Seletor: número de unidades no carrinho (para o selo do cabeçalho).
export const selecionarContagem = (s: Estado) => contarUnidades(s.itens);
