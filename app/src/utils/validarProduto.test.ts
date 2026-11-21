import { describe, expect, it } from 'vitest';
import { centavosDeTexto } from './formatar';
import type { CamposProduto } from './validarProduto';
import { validarProduto } from './validarProduto';

const valido: CamposProduto = {
  nome: 'Açúcar refinado 1 kg',
  preco: 490,
  categoriaId: 'cat-1',
  estoque: '12',
  descricao: '',
  imagemUrl: '',
};

describe('validarProduto', () => {
  it('aceita um produto válido (descrição e imagem são opcionais)', () => {
    expect(validarProduto(valido)).toEqual({});
  });

  it('exige nome, preço e categoria', () => {
    const e = validarProduto({ ...valido, nome: ' a ', preco: 0, categoriaId: null });
    expect(Object.keys(e).sort()).toEqual(['categoriaId', 'nome', 'preco']);
  });

  it('estoque vazio vale 0; decimal e negativo são recusados', () => {
    expect(validarProduto({ ...valido, estoque: '' })).toEqual({});
    expect('estoque' in validarProduto({ ...valido, estoque: '1.5' })).toBe(true);
    expect('estoque' in validarProduto({ ...valido, estoque: '-3' })).toBe(true);
    expect('estoque' in validarProduto({ ...valido, estoque: '2000000' })).toBe(true);
  });

  it('valida o link da imagem', () => {
    expect(validarProduto({ ...valido, imagemUrl: 'https://site.com/foto.png' })).toEqual({});
    expect('imagemUrl' in validarProduto({ ...valido, imagemUrl: 'foto.png' })).toBe(true);
    expect('imagemUrl' in validarProduto({ ...valido, imagemUrl: 'ftp://site.com/x.png' })).toBe(true);
  });

  it('limita o tamanho da descrição', () => {
    expect('descricao' in validarProduto({ ...valido, descricao: 'x'.repeat(1001) })).toBe(true);
  });
});

describe('centavosDeTexto (máscara de preço)', () => {
  it('interpreta os dígitos digitados como centavos', () => {
    expect(centavosDeTexto('')).toBe(0);
    expect(centavosDeTexto('4')).toBe(4);
    expect(centavosDeTexto('490')).toBe(490);
    expect(centavosDeTexto('4,90')).toBe(490);
    expect(centavosDeTexto('R$ 1.234,56')).toBe(123456);
  });
  it('respeita o limite aceito pela API', () => {
    expect(centavosDeTexto('99999999999')).toBe(100_000_000);
  });
});
