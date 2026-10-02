import { h } from '../../shared/dom';
import { vibrar } from '../fx';
import { ehAvanco } from '../gesto';
import type { Montar } from '../tipos';
import { criarPresente } from './presente';

const ENCHER_MS = 1800;
const ESVAZIAR_MS = 700;

export const montar: Montar = (ctx) => {
  const g = criarPresente(ctx, 70);
  Object.assign(g.area, { tabIndex: 0 });
  g.area.classList.add('segurar');
  g.area.setAttribute('role', 'button');
  g.area.setAttribute('aria-label', 'Segurar o presente até ele abrir');

  const barra = h('div', { className: 'barra' });
  const trilho = h('div', {
    className: 'barra-trilho', role: 'progressbar', 'aria-label': 'Progresso',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0',
  }, barra);
  ctx.palco.append(trilho);

  let prog = 0;
  let segurando = false;
  let marca = 0;
  let raf = 0;
  let ultimo = 0;

  const render = (t: number) => {
    barra.style.width = `${prog * 100}%`;
    trilho.setAttribute('aria-valuenow', String(Math.round(prog * 100)));
    const tremor = ctx.reduz ? 0 : Math.sin(t / 38) * prog * 7;
    g.area.style.transform = `rotate(${tremor}deg) scale(${1 + prog * 0.07})`;
    g.tampa.style.transform = `translateY(${-prog * 10}px)`;
    ctx.dica(prog > 0.85 ? 'Quase…' : prog > 0.05 ? 'Continue segurando!' : ctx.M.dica);
  };

  const abrir = () => {
    g.area.style.transform = 'none';
    g.abrir('translate(-40px,-320px) rotate(-35deg)');
  };

  const tick = (t: number) => {
    const dt = Math.min(t - ultimo, 100);
    ultimo = t;
    prog = Math.max(0, Math.min(1, prog + (segurando ? dt / ENCHER_MS : -dt / ESVAZIAR_MS)));
    const m = Math.floor(prog * 4);
    if (segurando && m > marca) { marca = m; vibrar(20); }
    render(t);
    if (prog >= 1) { raf = 0; segurando = false; abrir(); return; }
    raf = prog > 0 || segurando ? requestAnimationFrame(tick) : 0;
  };

  const comecar = () => {
    if (ctx.aberto() || segurando) return;
    segurando = true;
    marca = Math.floor(prog * 4);
    if (!raf) { ultimo = performance.now(); raf = requestAnimationFrame(tick); }
  };
  const parar = () => { segurando = false; };

  g.area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    g.area.setPointerCapture?.(e.pointerId);
    comecar();
  });
  g.area.addEventListener('pointerup', parar);
  g.area.addEventListener('pointercancel', parar);
  g.area.addEventListener('lostpointercapture', parar);
  g.area.addEventListener('contextmenu', (e) => e.preventDefault());
  g.area.addEventListener('keydown', (e) => {
    if (!ehAvanco(e)) return;
    e.preventDefault();
    if (!e.repeat) comecar();
  });
  g.area.addEventListener('keyup', (e) => { if (ehAvanco(e)) parar(); });
  g.area.addEventListener('blur', parar);
};
