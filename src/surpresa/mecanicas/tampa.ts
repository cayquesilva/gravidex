import { h } from '../../shared/dom';
import { arrastar, teclaAvanca } from '../gesto';
import type { Montar } from '../tipos';
import { criarPresente } from './presente';

const CURSO = 150;
const ABRE = 0.7;

export const montar: Montar = (ctx) => {
  ctx.palco.classList.add('mec-tampa', 'mola');
  const g = criarPresente(ctx, 130);
  const seta = h('div', { className: 'seta', 'aria-hidden': 'true' }, '↑');
  g.area.prepend(seta);
  Object.assign(g.tampa, { tabIndex: 0 });
  g.tampa.setAttribute('role', 'button');
  g.tampa.setAttribute('aria-label', 'Puxar a tampa para cima');
  g.tampa.classList.add('puxavel');

  let y = 0;

  const render = () => {
    g.tampa.style.transform = `translateY(${-y * CURSO}px) rotate(${-y * 8}deg)`;
    g.brilho.style.opacity = String(y);
  };

  const abrir = () => {
    g.brilho.style.opacity = '0';
    g.abrir('translate(-30px,-420px) rotate(-30deg)');
    ctx.abrir();
  };

  let y0 = 0;
  arrastar(g.tampa, {
    ref: g.area,
    inicio: () => {
      if (ctx.aberto()) return false;
      y0 = y;
      seta.classList.add('some');
      ctx.palco.classList.remove('mola');
    },
    mover: (_dx, dy) => { y = Math.max(0, Math.min(1, y0 - dy / CURSO)); render(); },
    soltar: () => {
      ctx.palco.classList.add('mola');
      if (y > ABRE) abrir();
      else { y = 0; render(); }
    },
  });

  teclaAvanca(g.tampa, () => {
    if (ctx.aberto()) return;
    seta.classList.add('some');
    y = Math.min(1, y + 0.25);
    if (y > ABRE) abrir(); else render();
  });
};
