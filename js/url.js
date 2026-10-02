import { PAPEIS, MECANICAS, PADRAO, NOME_MAX } from './config.js';

export function montarLink(base, { papel, nome, mecanica }) {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('p', papel);
  if (nome?.trim()) url.searchParams.set('n', nome.trim().slice(0, NOME_MAX));
  url.searchParams.set('m', mecanica);
  return url.toString();
}

export function lerParametros(search = location.search) {
  const q = new URLSearchParams(search);
  const p = q.get('p');
  const m = q.get('m');
  return {
    papel: PAPEIS[p] ? p : PADRAO.papel,
    mecanica: MECANICAS[m] ? m : PADRAO.mecanica,
    nome: (q.get('n') || '').trim().slice(0, NOME_MAX),
  };
}

export function textoPromocao({ papel, nome }) {
  const { verbo } = PAPEIS[papel];
  return nome ? `${nome}, você foi ${verbo} a` : `Você foi ${verbo} a`;
}
