import { describe, expect, it } from 'vitest';
import { PADRAO } from '../src/shared/config';
import { lerParametros, montarLink, textoPromocao } from '../src/shared/url';

const BASE = 'https://surpresa.netlify.app/';
const busca = (link: string) => new URL(link).search;

describe('montarLink / lerParametros', () => {
  it.each(['Conceição', 'João Pedro', 'Zé & Cia ?#=/', 'Ñandú 👶'])('ida e volta com "%s"', (nome) => {
    const link = montarLink(BASE, { papel: 'vovo-o', nome, mecanica: 'raspar' });
    expect(lerParametros(busca(link))).toEqual({ papel: 'vovo-o', nome, mecanica: 'raspar', toques: 5 });
  });

  it('nunca escreve o papel por extenso', () => {
    const link = montarLink(BASE, { papel: 'vovo-a', nome: 'Maria', mecanica: 'laco' });
    expect(decodeURIComponent(link)).not.toMatch(/Vovó|Vovô|Titia|Titio/);
    expect(link).toBe('https://surpresa.netlify.app/?p=vovo-a&n=Maria&m=laco');
  });

  it('descarta query e hash da base, e omite nome vazio', () => {
    const link = montarLink(`${BASE}?x=1#topo`, { papel: 'titia', nome: '   ', mecanica: 'tampa' });
    expect(link).toBe('https://surpresa.netlify.app/?p=titia&m=tampa');
  });

  it('preserva subpasta (GitHub Pages)', () => {
    expect(montarLink('https://eu.github.io/surpresa/', { papel: 'titio', mecanica: 'segurar' }))
      .toBe('https://eu.github.io/surpresa/?p=titio&m=segurar');
  });

  it('inclui t só no envelope e fora do padrão', () => {
    expect(montarLink(BASE, { papel: 'titio', mecanica: 'envelope', toques: 3 })).toContain('t=3');
    expect(montarLink(BASE, { papel: 'titio', mecanica: 'envelope', toques: 5 })).not.toContain('t=');
    expect(montarLink(BASE, { papel: 'titio', mecanica: 'laco', toques: 3 })).not.toContain('t=');
  });

  it('parâmetros inválidos caem no padrão', () => {
    expect(lerParametros('?p=bisavo&m=explodir')).toEqual({ papel: 'vovo-a', nome: '', mecanica: 'laco', toques: 5 });
    expect(lerParametros('')).toEqual({ ...PADRAO, nome: '' });
    expect(lerParametros('?p=__proto__&m=toString').papel).toBe('vovo-a');
    expect(lerParametros('?p=__proto__&m=toString').mecanica).toBe('laco');
  });

  it('trunca o nome em 24 caracteres e apara espaços', () => {
    const longo = 'Maria Aparecida da Conceição Silva';
    const { nome } = lerParametros(`?n=${encodeURIComponent(`  ${longo}  `)}`);
    expect(nome).toBe(longo.slice(0, 24).trim());
    expect(nome.length).toBeLessThanOrEqual(24);
    const link = montarLink(BASE, { papel: 'titia', nome: longo, mecanica: 'laco' });
    expect(new URL(link).searchParams.get('n')!.length).toBeLessThanOrEqual(24);
  });

  it.each([
    ['0', 1], ['-4', 1], ['1', 1], ['7', 7], ['10', 10], ['11', 10], ['999', 10], ['abc', 5], ['', 5], ['3.6', 3],
  ])('t=%s vira %i', (t, esperado) => {
    expect(lerParametros(`?m=envelope&t=${t}`).toques).toBe(esperado);
  });
});

describe('textoPromocao', () => {
  it('usa o gênero do papel', () => {
    expect(textoPromocao('vovo-a', 'Maria')).toBe('Maria, você foi promovida a');
    expect(textoPromocao('vovo-o', 'José')).toBe('José, você foi promovido a');
    expect(textoPromocao('titia', 'Ana')).toBe('Ana, você foi promovida a');
    expect(textoPromocao('titio', 'Beto')).toBe('Beto, você foi promovido a');
  });

  it('funciona sem nome', () => {
    expect(textoPromocao('titia')).toBe('Você foi promovida a');
    expect(textoPromocao('vovo-o', '')).toBe('Você foi promovido a');
    expect(textoPromocao('titio', '   ')).toBe('Você foi promovido a');
  });
});
