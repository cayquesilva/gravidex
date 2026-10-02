import { dicaDe } from '../../shared/config';
import { h } from '../../shared/dom';
import { vibrar } from '../fx';
import type { Montar } from '../tipos';

const RACHADURA = `<svg class="selo-rachadura" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
<polyline points="42,3 37,20 46,33 35,48 45,62 39,81" fill="none" stroke="oklch(0.95 0.03 15)" stroke-width="2.5"
 stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="100" stroke-dashoffset="100"/></svg>`;

export const montar: Montar = (ctx) => {
  const t = ctx.P.toques;
  const metade = (lado: 'e' | 'd') => h('div', { className: `selo-metade selo-${lado}` }, h('div', { className: 'selo-borda' }));
  const metE = metade('e');
  const metD = metade('d');
  const estrela = h('div', { className: 'selo-estrela' });
  const selo = h('button', { type: 'button', className: 'selo', 'aria-label': 'Tocar no lacre' }, metE, metD, estrela);
  selo.insertAdjacentHTML('beforeend', RACHADURA);
  const rachadura = selo.querySelector('polyline')!;
  const svg = selo.querySelector('svg')!;

  const carta = h('div', { className: 'carta' }, h('div', { className: 'carta-estrela' }));
  const aba = h('div', { className: 'env-aba' });
  const env = h('div', { className: 'envelope' },
    h('div', { className: 'env-fundo' }), carta, h('div', { className: 'env-frente' }), aba, selo);
  const bolinhas = Array.from({ length: t }, () => h('div', { className: 'bolinha' }));
  ctx.palco.append(env, h('div', { className: 'bolinhas', 'aria-hidden': 'true' }, ...bolinhas));

  let toques = 0;

  const render = () => {
    const dir = toques % 2 ? -1 : 1;
    const falta = t - toques;
    env.style.transform = toques && !ctx.reduz ? `rotate(${dir * 1.5}deg)` : 'none';
    selo.style.transform = toques
      ? `${ctx.reduz ? '' : `rotate(${dir * 12}deg) `}scale(${1 + (toques / t) * 0.18})`
      : 'none';
    rachadura.style.strokeDashoffset = String(100 * (1 - Math.min(1, toques / t)));
    bolinhas.forEach((b, i) => b.classList.toggle('cheia', i < toques));
    ctx.dica(falta <= 0 ? 'Abrindo…'
      : falta === t ? dicaDe('envelope', t)
      : falta === 1 ? 'Só mais um toque!'
      : `Faltam ${falta} toques`);
  };

  const abrir = () => {
    env.classList.add('aberto');
    env.style.transform = 'none';
    selo.style.transform = 'none';
    rachadura.style.strokeDashoffset = '0';
    if (!ctx.reduz) {
      metE.style.transform = 'translate(-70px,40px) rotate(-40deg)';
      metD.style.transform = 'translate(70px,40px) rotate(40deg)';
    }
    for (const el of [metE, metD, estrela, svg] as (HTMLElement | SVGElement)[]) el.style.opacity = '0';
    selo.disabled = true;
    ctx.abrir();
  };

  selo.addEventListener('click', () => {
    if (ctx.aberto() || toques >= t) return;
    toques++;
    vibrar(25);
    render();
    if (toques >= t) setTimeout(abrir, 380);
  });

  render();
};
