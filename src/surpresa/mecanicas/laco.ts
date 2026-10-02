import { h } from '../../shared/dom';
import { arrastar } from '../gesto';
import type { Montar } from '../tipos';
import { criarPresente } from './presente';

const CURSO = 204;
const ABRE = 0.88;

export const montar: Montar = (ctx) => {
  ctx.palco.classList.add('mec-laco', 'mola');
  const g = criarPresente(ctx, 70);

  const rabo = h('div', { className: 'laco-rabo' });
  const botao = h('div', {
    className: 'laco-botao', role: 'button', tabIndex: 0,
    'aria-label': 'Arrastar o laço para desatar',
  });
  const trilho = h('div', { className: 'trilho-laco' }, rabo, h('div', { className: 'laco-seta', 'aria-hidden': 'true' }, '→'), botao);
  ctx.palco.append(trilho);

  let x = 0;

  const render = () => {
    botao.style.transform = `translateX(${x * CURSO}px)`;
    rabo.style.width = `${x * CURSO}px`;
    g.anelE.style.transform = `translate(${-x * 26}px,${x * 10}px) rotate(${-25 - x * 70}deg) scale(${1 - x * 0.3})`;
    g.anelD.style.transform = `translate(${x * 26}px,${x * 10}px) rotate(${25 + x * 70}deg) scale(${1 - x * 0.3})`;
    g.anelE.style.opacity = g.anelD.style.opacity = String(1 - x * 0.6);
    for (const f of g.fitas) f.style.transform = `scaleY(${1 - x * 0.7})`;
    g.tampa.style.transform = `rotate(${x * 3}deg)`;
  };

  const abrir = () => {
    x = 1;
    render();
    for (const f of g.fitas) f.style.transform = 'scaleY(0)';
    g.anelE.style.opacity = g.anelD.style.opacity = '0';
    g.abrir('translate(40px,-320px) rotate(35deg)');
    ctx.abrir();
  };

  let x0 = 0;
  arrastar(botao, {
    ref: trilho,
    inicio: () => {
      if (ctx.aberto()) return false;
      x0 = x;
      ctx.palco.classList.remove('mola');
    },
    mover: (dx) => { x = Math.max(0, Math.min(1, x0 + dx / CURSO)); render(); },
    soltar: () => {
      ctx.palco.classList.add('mola');
      if (x > ABRE) abrir();
      else { x = 0; render(); }
    },
  });

  botao.addEventListener('keydown', (e) => {
    if (ctx.aberto()) return;
    const passo = e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' ? 0.25 : e.key === 'ArrowLeft' ? -0.25 : 0;
    if (!passo) return;
    e.preventDefault();
    if (e.repeat) return;
    x = Math.max(0, Math.min(1, x + passo));
    if (x > ABRE) abrir(); else render();
  });

  render();
};
