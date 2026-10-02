import {
  PAPEIS, PADRAO, NOME_MAX, TOQUES_MIN, TOQUES_MAX, FRENTES, RECADO_MAX, ehPapel, ehMecanica,
  type Papel, type Mecanica,
} from './config';

export interface Parametros {
  papel: Papel;
  nome: string;
  mecanica: Mecanica;
  toques: number;
  /** texto pronto da capa da cartinha */
  frente: string;
  /** recado escrito pelos pais (vazio = sem essa etapa) */
  recado: string;
}

export const limparNome = (nome: string | null | undefined) => (nome ?? '').trim().slice(0, NOME_MAX).trim();
/** Junta espaços e quebras de linha e corta em RECADO_MAX. */
export const limparRecado = (texto: string | null | undefined) =>
  (texto ?? '').replace(/\s+/g, ' ').trim().slice(0, RECADO_MAX).trim();

const ehFrente = (i: number) => Number.isInteger(i) && i >= 0 && i < FRENTES.length;

export function limitarToques(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return PADRAO.toques;
  return Math.min(TOQUES_MAX, Math.max(TOQUES_MIN, Math.round(n)));
}

export function montarLink(
  base: string,
  o: {
    papel: Papel; nome?: string; mecanica: Mecanica; toques?: number;
    /** índice em FRENTES (capa) */
    frente?: number;
    /** recado escrito pelos pais */
    recado?: string;
  },
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
  if (o.frente != null && ehFrente(o.frente) && o.frente !== PADRAO.frente) url.searchParams.set('f', String(o.frente));
  const recado = limparRecado(o.recado);
  if (recado) url.searchParams.set('x', recado);
  return url.toString();
}

export function lerParametros(search: string = location.search): Parametros {
  const q = new URLSearchParams(search);
  const p = q.get('p');
  const m = q.get('m');
  const f = Number(q.get('f') ?? PADRAO.frente);
  return {
    papel: ehPapel(p) ? p : PADRAO.papel,
    nome: limparNome(q.get('n')),
    mecanica: ehMecanica(m) ? m : PADRAO.mecanica,
    toques: q.has('t') ? limitarToques(q.get('t')) : PADRAO.toques,
    frente: FRENTES[ehFrente(f) ? f : PADRAO.frente].texto,
    recado: limparRecado(q.get('x')),
  };
}

/** Saudação da frente: "Querida Maria," | "" (sem nome) */
export function textoSaudacao(papel: Papel, nome?: string): string {
  const n = limparNome(nome);
  return n ? `${PAPEIS[papel].querido} ${n},` : '';
}

/** Topo do verso: "Parabéns, Maria!" | "Parabéns!" */
export function textoParabens(nome?: string): string {
  const n = limparNome(nome);
  return n ? `Parabéns, ${n}!` : 'Parabéns!';
}

/** "Você foi promovida a" | "Você foi promovido a" */
export function textoPromocao(papel: Papel): string {
  return `Você foi ${PAPEIS[papel].verbo} a`;
}
