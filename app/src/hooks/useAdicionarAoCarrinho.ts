// Adiciona ao carrinho e mostra o toast certo (sucesso, estoque limitado, esgotado).
// Retorna true se alguma unidade foi adicionada.
import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useCarrinho } from '../store/carrinho';
import { Produto } from '../types';

export function useAdicionarAoCarrinho() {
  const adicionar = useCarrinho((s) => s.adicionar);
  const { mostrar } = useToast();

  return useCallback(
    (produto: Produto, quantidade = 1): boolean => {
      if (produto.estoque <= 0) {
        mostrar('Produto esgotado.', 'erro');
        return false;
      }
      const r = adicionar(produto, quantidade);
      if (r.adicionado === 0) {
        mostrar(`Você já tem todo o estoque disponível (${produto.estoque}) no carrinho.`, 'info');
        return false;
      }
      if (r.limitado) mostrar(`Adicionamos ${r.adicionado}. O estoque é limitado a ${produto.estoque}.`, 'info');
      else mostrar(`${produto.nome} adicionado ao carrinho.`, 'sucesso');
      return true;
    },
    [adicionar, mostrar],
  );
}
