import type { Mecanica, MECANICAS } from '../shared/config';
import type { Parametros } from '../shared/url';

export interface Ctx {
  P: Parametros;
  M: (typeof MECANICAS)[Mecanica];
  reduz: boolean;
  /** onde a mecânica coloca o objeto interativo e o controle de progresso */
  palco: HTMLElement;
  dica(texto: string): void;
  /** dispara a revelação; idempotente. Devolve false se já estava aberto. */
  abrir(): boolean;
  aberto(): boolean;
}

export type Montar = (ctx: Ctx) => void;
