import type { Parametros } from '../shared/url';
import { criarCartinha } from './cartinha';
import type { Origem } from './tipos';

/** sobe de dentro da caixa (ease-out) e depois cresce até o centro (mola suave) */
const SUBIDA = 'cubic-bezier(.25,.8,.35,1)';
const ASSENTO = 'cubic-bezier(.34,1.22,.5,1)';
/** folga do recorte para não cortar a sombra da cartinha */
const FOLGA = 90;
/** espaço mínimo acima da cartinha quando ela termina de sair da caixa */
const TOPO = 24;

export interface OpcoesRevelar {
  P: Parametros;
  /** segundos até a cartinha começar a aparecer */
  atraso: number;
  /** sem transição, já na promoção (recarga depois de aberto) */
  instantaneo?: boolean;
  reduz: boolean;
  /** a pessoa estava no teclado: o foco vai para a cartinha */
  focar?: boolean;
  origem?: Origem;
  anunciar(texto: string): void;
}

/** Coloca a cartinha na camada de revelação (ou ativa a que já está no lugar, na raspadinha). */
export function revelar(camada: HTMLElement, o: OpcoesRevelar) {
  const origem = o.origem;
  if (origem?.modo === 'no-lugar') { origem.carta.ativar(o.focar); return; }

  const carta = criarCartinha(o.P, { reduz: o.reduz, noFim: o.instantaneo, anunciar: o.anunciar });
  if (o.instantaneo) { camada.replaceChildren(carta.el); carta.ativar(); return; }

  setTimeout(() => {
    camada.replaceChildren(carta.el);
    carta.ativar(o.focar);
    const el = carta.el;
    if (o.reduz || !origem) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease' });
      return;
    }
    const F = el.getBoundingClientRect();
    const R = origem.el.getBoundingClientRect();
    if (origem.modo === 'dentro') sairDaCaixa(el, F, R);
    else crescer(el, F, R);
  }, o.atraso * 1000);
}

const mover = (F: DOMRect, cx: number, top: number, k: number) =>
  `translate(${cx - (F.left + F.width / 2)}px,${top + (k * F.height) / 2 - (F.top + F.height / 2)}px) scale(${k})`;

/**
 * A cartinha nasce dentro da caixa `B` (escondida abaixo da borda de cima, a "boca"),
 * sobe até ficar inteira acima dela e então cresce até a posição final `F`.
 * Na subida a escala é constante, então o recorte da boca interpola em linha reta.
 */
function sairDaCaixa(carta: HTMLElement, F: DOMRect, B: DOMRect) {
  const boca = B.top;
  const k = Math.min(1, (B.width * 0.84) / F.width, (boca - 18 - TOPO) / F.height);
  const cx = B.left + B.width / 2;
  const top0 = boca + 6;
  const top1 = boca - k * F.height - 18;
  // recorte em px locais (antes da escala): tudo abaixo da boca fica escondido
  const recorte = (top: number) => `inset(0px -${FOLGA}px ${F.height - (boca - top) / k}px -${FOLGA}px)`;
  carta.animate([
    { transform: mover(F, cx, top0, k), clipPath: recorte(top0), easing: SUBIDA },
    { transform: mover(F, cx, top1, k), clipPath: recorte(top1), easing: ASSENTO, offset: 0.45 },
    { transform: 'translate(0px,0px) scale(1)', clipPath: `inset(-${FOLGA}px)` },
  ], { duration: 1500 });
}

/** A cartinha cresce a partir da carta do envelope `R`, aparecendo por cima dela. */
function crescer(carta: HTMLElement, F: DOMRect, R: DOMRect) {
  const k = Math.min(R.width / F.width, R.height / F.height);
  carta.animate([
    { transform: mover(F, R.left + R.width / 2, R.top + R.height / 2 - (k * F.height) / 2, k), opacity: 0 },
    { opacity: 1, offset: 0.2 },
    { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
  ], { duration: 1000, easing: ASSENTO });
}
