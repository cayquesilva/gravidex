import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { qrSvg } from '../src/shared/qr';
import { montarLink } from '../src/shared/url';

const CELULA = 4; // cellSize usado em qrSvg
const ESCALA = 4; // px por módulo na rasterização
const QUIET = 4; // módulos de margem branca

/** Rasteriza o <path> do SVG (um quadrado por módulo escuro) e decodifica com jsQR. */
function decodificarSvg(svg: string): string | null {
  const lado = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)![1]) / CELULA;
  const escuros = [...svg.matchAll(/M(\d+),(\d+)l/g)].map(([, x, y]) => [Number(x) / CELULA, Number(y) / CELULA]);
  const px = (lado + QUIET * 2) * ESCALA;
  const rgba = new Uint8ClampedArray(px * px * 4).fill(255);
  for (const [mx, my] of escuros) {
    for (let dy = 0; dy < ESCALA; dy++) {
      for (let dx = 0; dx < ESCALA; dx++) {
        const i = (((my + QUIET) * ESCALA + dy) * px + (mx + QUIET) * ESCALA + dx) * 4;
        rgba[i] = rgba[i + 1] = rgba[i + 2] = 0;
      }
    }
  }
  return jsQR(rgba, px, px)?.data ?? null;
}

describe('qrSvg', () => {
  it('gera SVG escalável, sem margem', () => {
    const svg = qrSvg('https://exemplo.com/');
    expect(svg).toMatch(/^<svg[^>]+viewBox="0 0 \d+ \d+"/);
    expect(svg).not.toMatch(/<svg[^>]+width=/);
  });

  it.each([
    { papel: 'vovo-a', nome: 'Conceição', mecanica: 'laco' },
    { papel: 'vovo-o', nome: 'João Pedro', mecanica: 'segurar' },
    { papel: 'titia', nome: '', mecanica: 'raspar' },
    { papel: 'titio', nome: 'Maria Aparecida da Silva', mecanica: 'envelope', toques: 8 },
  ] as const)('decodifica de volta para a URL ($papel / $mecanica)', (o) => {
    const link = montarLink('https://surpresa.netlify.app/', o);
    expect(decodificarSvg(qrSvg(link))).toBe(link);
  });

  it('pessoas diferentes geram QR diferentes', () => {
    const base = 'https://surpresa.netlify.app/';
    const svgs = (['vovo-a', 'vovo-o', 'titia', 'titio'] as const)
      .map((papel) => qrSvg(montarLink(base, { papel, mecanica: 'laco' })));
    expect(new Set(svgs).size).toBe(4);
  });
});
