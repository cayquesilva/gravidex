import { CONFETE } from '../shared/config';
import { h, rng, ESTRELA } from '../shared/dom';

export const reduzMovimento = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Vibra se o aparelho deixar; falha em silêncio. */
export function vibrar(padrao: number | number[]) {
  try { navigator.vibrate?.(padrao); } catch { /* sem vibração */ }
}

/** 10 estrelas de 4 pontas piscando ao fundo (seed fixa). */
export function brilhos(): HTMLElement {
  const R = rng(7);
  const kids = Array.from({ length: 10 }, () => {
    const s = 8 + R() * 12;
    return h('div', {
      className: 'brilho',
      style: {
        left: `${5 + R() * 88}%`, top: `${4 + R() * 90}%`,
        width: `${s}px`, height: `${s}px`,
        animationDuration: `${2.2 + R() * 2}s`, animationDelay: `${R() * 2}s`,
      },
    });
  });
  return h('div', { className: 'brilhos', 'aria-hidden': 'true' }, ...kids);
}

/** 44 peças (círculo, losango, estrela, tira) saindo do centro (seed fixa). */
export function confete(atraso: number): HTMLElement {
  const R = rng(42);
  const kids = Array.from({ length: 44 }, (_, i) => {
    const ang = R() * Math.PI * 2;
    const d = 110 + R() * 190;
    const s = 8 + R() * 12;
    const forma = Math.floor(R() * 4); // 0 círculo · 1 losango · 2 estrela · 3 tira
    return h('div', {
      className: 'confete',
      style: {
        width: `${forma === 3 ? s * 0.5 : s}px`,
        height: `${forma === 3 ? s * 1.6 : s}px`,
        background: CONFETE[i % CONFETE.length],
        borderRadius: forma === 0 ? '50%' : forma === 3 ? '3px' : '0',
        clipPath: forma === 2 ? ESTRELA : forma === 1 ? 'polygon(50% 0,100% 50%,50% 100%,0 50%)' : 'none',
        '--x': `${Math.cos(ang) * d}px`,
        '--y': `${Math.sin(ang) * d + 40}px`,
        '--r': `${R() * 720 - 360}deg`,
        animationDuration: `${1.3 + R() * 0.8}s`,
        animationDelay: `${atraso}s`,
      },
    });
  });
  return h('div', { className: 'confetes', 'aria-hidden': 'true' }, ...kids);
}
