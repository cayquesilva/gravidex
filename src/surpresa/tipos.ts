import type { Mecanica, MECANICAS } from '../shared/config';
import type { Parametros } from '../shared/url';
import type { Cartinha } from './cartinha';

/**
 * De onde a cartinha da revelação sai.
 * dentro: sobe de dentro de `el` (a caixa), recortada pela borda de cima;
 * crescer: cresce a partir de `el` (a carta do envelope);
 * no-lugar: a cartinha já está na tela (raspadinha) — só passa a poder virar.
 */
export type Origem =
  | { modo: 'dentro' | 'crescer'; el: HTMLElement }
  | { modo: 'no-lugar'; carta: Cartinha };

export interface Ctx {
  P: Parametros;
  M: (typeof MECANICAS)[Mecanica];
  reduz: boolean;
  /** onde a mecânica coloca o objeto interativo e o controle de progresso */
  palco: HTMLElement;
  dica(texto: string): void;
  /** fala o texto pela região viva (leitor de tela) */
  anunciar(texto: string): void;
  /** dispara a revelação; idempotente. Devolve false se já estava aberto. */
  abrir(origem: Origem): boolean;
  aberto(): boolean;
}

export type Montar = (ctx: Ctx) => void;
