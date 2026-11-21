// Gerador de "Pix Copia e Cola" (BR Code estático, padrão EMV® QRCPS-MPM do Banco Central).
// Função PURA (não lê .env): quem chama informa chave, nome, cidade, valor e txid.
//
// Estrutura (TLV = Tag(2) + Tamanho(2) + Valor):
//   00 versão "01" | 01 tipo "11"(reutilizável)/"12"(uso único) | 26 conta Pix (GUI + chave)
//   52 MCC | 53 moeda 986 | 54 valor | 58 país | 59 nome | 60 cidade | 62 txid | 63 CRC16

export interface PixParams {
  chave: string; // CPF/CNPJ (só dígitos), e-mail, celular (+55...) ou chave aleatória (EVP)
  nomeRecebedor: string; // máx. 25 caracteres (acentos são removidos)
  cidade: string; // máx. 15 caracteres (acentos são removidos)
  valorCentavos?: number; // inteiro em centavos; sem valor, o pagador digita
  txid?: string; // 1–25 caracteres [A-Za-z0-9]; sem txid usa "***"
  descricao?: string; // opcional, vai junto da conta Pix
  usoUnico?: boolean; // padrão true: indica que o código vale para um único pagamento
}

const VALOR_MAX_CENTAVOS = 999_999_999_999; // "9999999999.99" = 13 caracteres, limite do campo 54

function tlv(id: string, valor: string): string {
  if (valor.length > 99) throw new Error(`Campo ${id} do Pix excede 99 caracteres`);
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

// CRC-16/CCITT-FALSE (polinômio 0x1021, início 0xFFFF) — exigido pelo BR Code.
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Nome/cidade no BR Code: maiúsculas, sem acento, só letras/dígitos/espaço, com limite de tamanho.
export function sanitizarTexto(texto: string, max: number): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();
}

// txid do pedido: 25 primeiros caracteres do UUID sem hífens (só [a-f0-9], válido no Pix).
export const txidDoPedido = (pedidoId: string) => pedidoId.replace(/-/g, '').slice(0, 25);

function formatarValor(centavos: number): string {
  return `${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}`;
}

export function gerarPayloadPix(p: PixParams): string {
  const chave = p.chave.trim();
  if (!chave) throw new Error('Chave Pix não configurada');
  if (!/^[\x20-\x7E]+$/.test(chave)) throw new Error('Chave Pix contém caracteres inválidos');

  const nome = sanitizarTexto(p.nomeRecebedor, 25);
  const cidade = sanitizarTexto(p.cidade, 15);
  if (!nome) throw new Error('Nome do recebedor inválido');
  if (!cidade) throw new Error('Cidade do recebedor inválida');

  if (p.valorCentavos !== undefined) {
    if (!Number.isInteger(p.valorCentavos) || p.valorCentavos <= 0 || p.valorCentavos > VALOR_MAX_CENTAVOS) {
      throw new Error('Valor do Pix inválido (use centavos inteiros maiores que zero)');
    }
  }

  if (p.txid !== undefined && !/^[A-Za-z0-9]{1,25}$/.test(p.txid)) {
    throw new Error('txid inválido (1 a 25 caracteres alfanuméricos)');
  }

  const conta = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave) + (p.descricao ? tlv('02', p.descricao) : '');

  const semCrc =
    tlv('00', '01') +
    tlv('01', p.usoUnico === false ? '11' : '12') +
    tlv('26', conta) +
    tlv('52', '0000') +
    tlv('53', '986') +
    (p.valorCentavos !== undefined ? tlv('54', formatarValor(p.valorCentavos)) : '') +
    tlv('58', 'BR') +
    tlv('59', nome) +
    tlv('60', cidade) +
    tlv('62', tlv('05', p.txid ?? '***')) +
    '6304'; // o CRC cobre o texto inteiro, inclusive "6304"

  return semCrc + crc16(semCrc);
}
