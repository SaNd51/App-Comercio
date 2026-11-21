// Preços chegam em CENTAVOS (inteiro). 490 → "4,90" ; 123456 → "1.234,56"
export function formatarPreco(centavos: number): string {
  const reais = Math.floor(centavos / 100);
  const cents = String(centavos % 100).padStart(2, '0');
  return `${String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`;
}

// "2026-11-20T14:05:00.000Z" → "20/11/2026 14:05" (no fuso do aparelho)
export function formatarData(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

// Máscara de preço estilo app de banco: o usuário digita só números e o valor vai "empurrando".
// "490" → 490 centavos (R$ 4,90). Limite de 9 dígitos e R$ 1.000.000,00, o máximo aceito pela API.
export function centavosDeTexto(texto: string): number {
  const digitos = texto.replace(/\D/g, '').slice(0, 9);
  return Math.min(digitos ? Number(digitos) : 0, 100_000_000);
}
