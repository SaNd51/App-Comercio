import { describe, expect, it } from 'vitest';
import { formatarData, formatarPreco } from './formatar';

describe('formatarPreco (centavos → "reais,centavos")', () => {
  it('formata valores comuns', () => {
    expect(formatarPreco(490)).toBe('4,90');
    expect(formatarPreco(310)).toBe('3,10');
    expect(formatarPreco(5)).toBe('0,05');
    expect(formatarPreco(0)).toBe('0,00');
  });
  it('usa ponto como separador de milhar', () => {
    expect(formatarPreco(123456)).toBe('1.234,56');
    expect(formatarPreco(100000000)).toBe('1.000.000,00');
  });
});

describe('formatarData', () => {
  it('formata no padrão brasileiro', () => {
    const iso = new Date(2026, 10, 20, 14, 5).toISOString(); // data local: 20/11/2026 14:05
    expect(formatarData(iso)).toBe('20/11/2026 14:05');
  });
  it('data inválida → texto vazio', () => {
    expect(formatarData('xxx')).toBe('');
  });
});
