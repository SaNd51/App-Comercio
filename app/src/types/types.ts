// Tipos que espelham as respostas da API.
export type Role = 'user' | 'admin';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: Role;
  criadoEm: string;
  telefone?: string | null;
}

export interface Endereco {
  id: string;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string;
  principal: boolean;
  criadoEm: string;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  ordem: number;
  totalProdutos: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number; // CENTAVOS
  categoriaId: string;
  imagemUrl: string | null;
  estoque: number;
  status: 'ativo' | 'inativo';
  categoria: { id: string; nome: string };
  unidade: string;
  precoPromocional: number | null;
  promocaoAte: string | null;
  destaqueSemana: boolean;
  precoEfetivo: number;
  emOferta: boolean;
  descontoPercentual: number;
  favorito?: boolean;
}

export interface ListaProdutos {
  itens: Produto[];
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}

export type StatusPedido = 'aguardando_pagamento' | 'pago' | 'cancelado';

export interface ItemPedido {
  id: string;
  produtoId: string;
  nome: string;
  imagemUrl: string | null;
  quantidade: number;
  precoUnitario: number; // centavos
  subtotal: number; // centavos
}

export interface Pedido {
  id: string;
  total: number; // centavos, calculado no servidor
  status: StatusPedido;
  pixPayload: string; // "Pix Copia e Cola"
  criadoEm: string;
  itens: ItemPedido[];
  cliente?: { nome: string; email: string }; // só vem para o admin
  tipoEntrega: 'entrega' | 'retirada';
  subtotal: number;
  taxaEntrega: number;
  enderecoEntrega?: Endereco | null;
  statusEntrega?: 'em_separacao' | 'saiu_para_entrega' | 'entregue' | 'pronto_para_retirada' | 'retirado' | null;
  previsaoEntrega?: string | null;
  entregadorNome?: string | null;
  entregadorTelefone?: string | null;
  eventos?: { id: string; status: string; observacao: string; criadoPor: string; criadoEm: string }[]; // só vem para o admin
}

export interface Banner {
  id: string;
  titulo: string;
  subtitulo: string;
  imagemUrl: string | null;
  cor: string;
  destino: string;
  ordem: number;
  ativo: boolean;
}

export interface ListaPedidos {
  pedidos: Pedido[];
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
}
