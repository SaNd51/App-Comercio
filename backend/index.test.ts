import { describe, expect, it } from 'vitest';
import { cores, espaco, raio } from './index';

describe('tokens de design', () => {
  it('expõe a paleta principal da marca', () => {
    expect(cores.primaria).toBe('#D7263D');
    expect(cores.primariaClara).toBe('#FDE8EB');
    expect(cores.texto).toBe('#1B2150');
  });

  it('mantem os raios e espaçamentos consistentes', () => {
    expect(raio).toEqual({ sm: 8, md: 12, lg: 16, pill: 999 });
    expect(espaco.xs).toBe(4);
    expect(espaco.xxl).toBe(24);
  });
});
