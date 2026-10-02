import { PAPEIS } from '../../shared/config';
import { h } from '../../shared/dom';
import { textoPromocao } from '../../shared/url';
import { fatorLayout, teclaAvanca } from '../gesto';
import type { Montar } from '../tipos';

const PINCEL = 46;
const AMOSTRA = 16;
const LIMIAR = 0.5;

export const montar: Montar = (ctx) => {
  const { papel, nome } = ctx.P;
  const canvas = h('canvas', { className: 'raspa-canvas', tabIndex: 0, role: 'button', 'aria-label': 'Raspar o cartão' });
  // O conteúdo por baixo fica escondido de leitores de tela até a revelação.
  const card = h('div', { className: 'raspa-card' },
    h('div', { className: 'raspa-fundo', 'aria-hidden': 'true' },
      h('div', { className: 'raspa-pre' }, textoPromocao(papel, nome)),
      h('div', { className: 'raspa-titulo' }, PAPEIS[papel].titulo),
    ),
    canvas,
  );
  ctx.palco.append(card);

  const c2d = canvas.getContext('2d', { willReadFrequently: true })!;
  let dpr = 1;
  let riscou = false;
  let pronto = false;
  let desenhando = false;
  let ultimo: [number, number] | null = null;
  let moves = 0;

  const pintar = () => {
    const w = canvas.offsetWidth;
    const hgt = canvas.offsetHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(hgt * dpr);
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2d.globalCompositeOperation = 'source-over';
    const g = c2d.createLinearGradient(0, 0, w, hgt);
    g.addColorStop(0, '#c9b8e8');
    g.addColorStop(0.5, '#e8bfd0');
    g.addColorStop(1, '#bcd6ef');
    c2d.fillStyle = g;
    c2d.fillRect(0, 0, w, hgt);
    c2d.fillStyle = 'rgba(255,255,255,.35)';
    for (let yy = 14; yy < hgt; yy += 26) {
      for (let xx = ((yy / 26) % 2) * 13 + 10; xx < w; xx += 26) {
        c2d.beginPath();
        c2d.arc(xx, yy, 2.5, 0, Math.PI * 2);
        c2d.fill();
      }
    }
    c2d.fillStyle = '#fff';
    c2d.textAlign = 'center';
    c2d.font = '700 30px Fredoka, sans-serif';
    c2d.fillText('raspe aqui', w / 2, hgt / 2 + 4);
  };

  const ponto = (e: PointerEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    const k = fatorLayout(canvas);
    return [(e.clientX - r.left) * k, (e.clientY - r.top) * k];
  };

  const riscar = (p: [number, number], de = ultimo ?? p) => {
    c2d.globalCompositeOperation = 'destination-out';
    c2d.lineCap = 'round';
    c2d.lineJoin = 'round';
    c2d.lineWidth = PINCEL;
    c2d.beginPath();
    c2d.moveTo(de[0], de[1]);
    c2d.lineTo(p[0], p[1]);
    c2d.stroke();
    ultimo = p;
    riscou = true;
  };

  /** Fração raspada, amostrando o alpha numa grade de 16 px. */
  const raspado = () => {
    const { width: W, height: H } = canvas;
    const d = c2d.getImageData(0, 0, W, H).data;
    const passo = Math.max(1, Math.round(AMOSTRA * dpr));
    let n = 0;
    let total = 0;
    for (let y = Math.floor(passo / 2); y < H; y += passo) {
      for (let x = Math.floor(passo / 2); x < W; x += passo) {
        total++;
        if (d[(y * W + x) * 4 + 3] < 128) n++;
      }
    }
    return total ? n / total : 0;
  };

  const conferir = () => {
    if (pronto || raspado() <= LIMIAR) return;
    pronto = true;
    desenhando = false;
    setTimeout(() => ctx.abrir(), 500);
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (pronto) return;
    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);
    desenhando = true;
    ultimo = null;
    riscar(ponto(e));
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!desenhando) return;
    riscar(ponto(e));
    if (++moves % 12 === 0) conferir();
  });
  const soltar = () => {
    if (!desenhando) return;
    desenhando = false;
    conferir();
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  // Teclado: cada Enter/Espaço raspa duas faixas horizontais.
  let faixa = 0;
  teclaAvanca(canvas, () => {
    if (pronto) return;
    const w = canvas.offsetWidth;
    for (let i = 0; i < 2; i++) {
      const y = PINCEL / 2 + faixa++ * (PINCEL - 6);
      riscar([w, y], [0, y]);
    }
    conferir();
  });

  requestAnimationFrame(pintar);
  document.fonts?.ready.then(() => { if (!riscou) pintar(); });
  addEventListener('resize', () => { if (!riscou) pintar(); });
};
