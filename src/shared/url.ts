import {
  PAPEIS, PADRAO, NOME_MAX, TOQUES_MIN, TOQUES_MAX, ehPapel, ehMecanica,
  type Papel, type Mecanica,
} from './config';

export interface Parametros {
  papel: Papel;
  nome: string;
  mecanica: Mecanica;
  toques: number;
}

export const limparNome = (nome: string | null | undefined) => (nome ?? '').trim().slice(0, NOME_MAX).trim();

export function limitarToques(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return PADRAO.toques;
  return Math.min(TOQUES_MAX, Math.max(TOQUES_MIN, Math.round(n)));
}

export function montarLink(
  base: string,
  o: { papel: Papel; nome?: string; mecanica: Mecanica; toques?: number },
): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('p', o.papel);
  const nome = limparNome(o.nome);
  if (nome) url.searchParams.set('n', nome);
  url.searchParams.set('m', o.mecanica);
  if (o.mecanica === 'envelope' && o.toques != null && limitarToques(o.toques) !== PADRAO.toques) {
    url.searchParams.set('t', String(limitarToques(o.toques)));
  }
  return url.toString();
}

export function lerParametros(search: string = location.search): Parametros {
  const q = new URLSearchParams(search);
  const p = q.get('p');
  const m = q.get('m');
  return {
    papel: ehPapel(p) ? p : PADRAO.papel,
    nome: limparNome(q.get('n')),
    mecanica: ehMecanica(m) ? m : PADRAO.mecanica,
    toques: q.has('t') ? limitarToques(q.get('t')) : PADRAO.toques,
  };
}

/** "Maria, você foi promovida a" | "Você foi promovido a" */
export function textoPromocao(papel: Papel, nome?: string): string {
  const { verbo } = PAPEIS[papel];
  const n = limparNome(nome);
  return n ? `${n}, você foi ${verbo} a` : `Você foi ${verbo} a`;
}
