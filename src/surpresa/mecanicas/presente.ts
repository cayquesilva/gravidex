import { h } from '../../shared/dom';
import type { Ctx } from '../tipos';

export const MOLA = 'cubic-bezier(.3,1.6,.5,1)';
const VOO = 'transform .7s cubic-bezier(.2,.8,.3,1),opacity .5s ease .3s';

export type Presente = ReturnType<typeof criarPresente>;

/** Caixa de presente comum a segurar, laço e tampa. */
export function criarPresente(ctx: Ctx, marginTop: number) {
  const brilho = h('div', { className: 'caixa-brilho' });
  const fitaCorpo = h('div', { className: 'fita fita-corpo' });
  const corpo = h('div', { className: 'corpo' }, fitaCorpo);
  const anelE = h('div', { className: 'anel anel-e' });
  const anelD = h('div', { className: 'anel anel-d' });
  const fitaTampa = h('div', { className: 'fita fita-tampa' });
  const tampa = h('div', { className: 'tampa' }, anelE, anelD, h('div', { className: 'tampa-face' }, fitaTampa));
  const area = h('div', { className: 'presente', style: { marginTop: `${marginTop}px` } }, brilho, corpo, tampa);
  ctx.palco.append(area);

  return {
    area, brilho, corpo, tampa, anelE, anelD,
    fitas: [fitaCorpo, fitaTampa],
    /** A tampa voa para `voo`; o corpo faz fade e encolhe (só fade com movimento reduzido). */
    abrir(voo: string) {
      tampa.style.transition = ctx.reduz ? 'opacity .5s ease' : VOO;
      if (!ctx.reduz) tampa.style.transform = voo;
      area.classList.add('aberto');
    },
  };
}
