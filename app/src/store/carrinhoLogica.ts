// Regras do carrinho em funções PURAS (sem React nem armazenamento) — fáceis de testar.
// Dinheiro sempre em CENTAVOS (inteiros). O servidor recalcula tudo no pedido; aqui é só conveniência.

export interface DadosProduto {
  produtoId: string;
  nome: string;
  preco: number; // centavos
  imagemUrl: string | null;
  categoria: string;
  estoque: number;
}

export interface ItemCarrinho extends DadosProduto {
  quantidade: number;
  indisponivel?: boolean; // inativo, esgotado ou removido desde que foi adicionado
}

export type Atualizacao =
  | { tipo: 'ok'; dados: DadosProduto & { ativo: boolean } }
  | { tipo: 'removido' };

// Adiciona respeitando o estoque. `limitado` indica que a quantidade pedida não coube inteira.
export function adicionarItem(itens: ItemCarrinho[], p: DadosProduto, qtd = 1) {
  const pedido = Math.max(1, Math.floor(qtd));
  const existente = itens.find((i) => i.produtoId === p.produtoId);
  const atual = existente?.quantidade ?? 0;
  const nova = Math.min(atual + pedido, Math.max(0, p.estoque));
  const adicionado = nova - atual;
  const limitado = nova < atual + pedido;

  if (adicionado <= 0) return { itens, adicionado: 0, limitado: true };

  const item: ItemCarrinho = { ...p, quantidade: nova }; // dados frescos do produto, sem flag de indisponível
  const lista = existente ? itens.map((i) => (i.produtoId === p.produtoId ? item : i)) : [...itens, item];
  return { itens: lista, adicionado, limitado };
}

// Define a quantidade (mínimo 1, máximo = estoque).
export function alterarQuantidade(itens: ItemCarrinho[], produtoId: string, qtd: number): ItemCarrinho[] {
  return itens.map((i) => {
    if (i.produtoId !== produtoId || i.estoque <= 0) return i;
    return { ...i, quantidade: Math.max(1, Math.min(Math.floor(qtd), i.estoque)) };
  });
}

export const removerItem = (itens: ItemCarrinho[], produtoId: string) => itens.filter((i) => i.produtoId !== produtoId);

// Itens indisponíveis não entram na conta.
export const calcularTotal = (itens: ItemCarrinho[]) =>
  itens.reduce((soma, i) => (i.indisponivel ? soma : soma + i.preco * i.quantidade), 0);

export const contarUnidades = (itens: ItemCarrinho[]) =>
  itens.reduce((soma, i) => (i.indisponivel ? soma : soma + i.quantidade), 0);

// Aplica dados atualizados vindos da API (preço, estoque, status).
export function aplicarAtualizacao(itens: ItemCarrinho[], mapa: Map<string, Atualizacao>) {
  let precoMudou = false;
  const novos = itens.map((i) => {
    const a = mapa.get(i.produtoId);
    if (!a) return i;
    if (a.tipo === 'removido') return { ...i, indisponivel: true };

    const d = a.dados;
    if (d.preco !== i.preco) precoMudou = true;
    return {
      ...i,
      nome: d.nome,
      preco: d.preco,
      imagemUrl: d.imagemUrl,
      categoria: d.categoria,
      estoque: d.estoque,
      quantidade: d.estoque > 0 ? Math.min(i.quantidade, d.estoque) : i.quantidade,
      indisponivel: !d.ativo || d.estoque <= 0,
    };
  });
  return { itens: novos, precoMudou };
}
