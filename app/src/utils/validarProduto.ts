// Validação do formulário de produto no app (as mesmas regras da API; a API continua sendo a palavra final).
export interface CamposProduto {
  nome: string;
  preco: number; // centavos
  categoriaId: string | null;
  estoque: string; // texto digitado
  descricao: string;
  imagemUrl: string;
}

export type ErrosProduto = Partial<Record<'nome' | 'preco' | 'categoriaId' | 'estoque' | 'descricao' | 'imagemUrl', string>>;

export function validarProduto(c: CamposProduto): ErrosProduto {
  const e: ErrosProduto = {};

  const nome = c.nome.trim();
  if (nome.length < 2) e.nome = 'Nome deve ter ao menos 2 caracteres';
  else if (nome.length > 120) e.nome = 'Nome muito longo (máx. 120)';

  if (!Number.isInteger(c.preco) || c.preco < 1) e.preco = 'Informe um preço maior que zero';

  if (!c.categoriaId) e.categoriaId = 'Escolha uma categoria';

  const estoque = c.estoque.trim() === '' ? 0 : Number(c.estoque);
  if (!Number.isInteger(estoque) || estoque < 0) e.estoque = 'Estoque deve ser um número inteiro';
  else if (estoque > 1_000_000) e.estoque = 'Estoque acima do permitido';

  if (c.descricao.trim().length > 1000) e.descricao = 'Descrição muito longa (máx. 1000)';

  const url = c.imagemUrl.trim();
  if (url && !/^https?:\/\/\S+$/i.test(url)) e.imagemUrl = 'Use um link que comece com http:// ou https://';
  else if (url.length > 500) e.imagemUrl = 'Link muito longo';

  return e;
}
