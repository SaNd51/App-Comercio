import { describe, expect, it } from 'vitest';
import { crc16, gerarPayloadPix, sanitizarTexto, txidDoPedido } from './pix';

// Decodifica um TLV em { tag: valor } (um nível).
function decodificar(tlv: string): Record<string, string> {
  const campos: Record<string, string> = {};
  let i = 0;
  while (i < tlv.length) {
    const tag = tlv.slice(i, i + 2);
    const tamanho = Number(tlv.slice(i + 2, i + 4));
    campos[tag] = tlv.slice(i + 4, i + 4 + tamanho);
    i += 4 + tamanho;
  }
  return campos;
}

const base = {
  chave: '123e4567-e12b-12d1-a456-426655440000',
  nomeRecebedor: 'Fulano de Tal',
  cidade: 'Brasília',
};

describe('crc16 (CCITT-FALSE)', () => {
  it('bate com o vetor de teste padrão "123456789" → 29B1', () => {
    expect(crc16('123456789')).toBe('29B1');
  });
  it('texto vazio → FFFF (valor inicial)', () => {
    expect(crc16('')).toBe('FFFF');
  });
});

describe('gerarPayloadPix', () => {
  it('monta todos os campos do BR Code', () => {
    const payload = gerarPayloadPix({ ...base, valorCentavos: 2250 });
    expect(payload.startsWith('000201010212')).toBe(true);

    const campos = decodificar(payload);
    expect(campos['00']).toBe('01');
    expect(campos['01']).toBe('12');
    expect(decodificar(campos['26'])).toEqual({ '00': 'br.gov.bcb.pix', '01': base.chave });
    expect(campos['52']).toBe('0000');
    expect(campos['53']).toBe('986');
    expect(campos['54']).toBe('22.50');
    expect(campos['58']).toBe('BR');
    expect(campos['59']).toBe('FULANO DE TAL');
    expect(campos['60']).toBe('BRASILIA');
    expect(decodificar(campos['62'])).toEqual({ '05': '***' });
  });

  it('o CRC16 final confere com o conteúdo', () => {
    const payload = gerarPayloadPix({ ...base, valorCentavos: 1290, txid: 'PEDIDO123' });
    expect(payload.slice(-8, -4)).toBe('6304');
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
    expect(payload.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
  });

  it('inclui o txid no campo 62', () => {
    const campos = decodificar(gerarPayloadPix({ ...base, valorCentavos: 100, txid: 'PEDIDO123' }));
    expect(campos['62']).toBe('0509PEDIDO123');
  });

  it('formata o valor a partir de centavos, sem erro de ponto flutuante', () => {
    const valor = (c: number) => decodificar(gerarPayloadPix({ ...base, valorCentavos: c }))['54'];
    expect(valor(5)).toBe('0.05');
    expect(valor(100)).toBe('1.00');
    expect(valor(490)).toBe('4.90');
    expect(valor(123456)).toBe('1234.56');
  });

  it('sem valor, omite o campo 54 (pagador digita)', () => {
    const campos = decodificar(gerarPayloadPix(base));
    expect('54' in campos).toBe(false);
  });

  it('uso único (padrão "12") ou reutilizável ("11")', () => {
    expect(decodificar(gerarPayloadPix(base))['01']).toBe('12');
    expect(decodificar(gerarPayloadPix({ ...base, usoUnico: false }))['01']).toBe('11');
  });

  it('limpa acentos e símbolos e respeita os limites de tamanho', () => {
    const campos = decodificar(
      gerarPayloadPix({ ...base, nomeRecebedor: 'Mercadinho Ximênes & Cia Ltda ME Extra', cidade: 'São José dos Pinhais' }),
    );
    expect(campos['59'].length).toBeLessThanOrEqual(25);
    expect(campos['60'].length).toBeLessThanOrEqual(15);
    expect(campos['59']).toMatch(/^[A-Z0-9 ]+$/);
    expect(campos['59'].startsWith('MERCADINHO XIMENES CIA')).toBe(true);
    expect(campos['60']).toBe('SAO JOSE DOS PI'); // 15 caracteres
  });

  it('rejeita entradas inválidas', () => {
    expect(() => gerarPayloadPix({ ...base, valorCentavos: 0 })).toThrow();
    expect(() => gerarPayloadPix({ ...base, valorCentavos: -5 })).toThrow();
    expect(() => gerarPayloadPix({ ...base, valorCentavos: 12.5 })).toThrow();
    expect(() => gerarPayloadPix({ ...base, chave: '  ' })).toThrow();
    expect(() => gerarPayloadPix({ ...base, chave: 'chavé' })).toThrow();
    expect(() => gerarPayloadPix({ ...base, txid: 'PED-1' })).toThrow();
    expect(() => gerarPayloadPix({ ...base, txid: 'A'.repeat(26) })).toThrow();
    expect(() => gerarPayloadPix({ ...base, nomeRecebedor: '###' })).toThrow();
  });
});

describe('utilitários', () => {
  it('sanitizarTexto', () => {
    expect(sanitizarTexto('  Ação  &  Café ', 25)).toBe('ACAO CAFE');
  });
  it('txidDoPedido usa 25 caracteres alfanuméricos do UUID', () => {
    const txid = txidDoPedido('123e4567-e89b-12d3-a456-426614174000');
    expect(txid).toBe('123e4567e89b12d3a45642661');
    expect(txid.length).toBe(25);
  });
});
