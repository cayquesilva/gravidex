/** Fator layout-px / tela-px (desfaz zoom e transforms de escala do ancestral). */
export function fatorLayout(el: HTMLElement): number {
  const w = el.getBoundingClientRect().width;
  return w ? el.offsetWidth / w : 1;
}

interface Arraste {
  /** elemento de referência para converter px (não transformado durante o gesto) */
  ref: HTMLElement;
  inicio?(): boolean | void;
  mover(dx: number, dy: number): void;
  soltar(): void;
}

/** Arraste com Pointer Events + setPointerCapture; deltas já em px do layout. */
export function arrastar(el: HTMLElement, a: Arraste) {
  let ini: { x: number; y: number; k: number; id: number } | null = null;
  el.addEventListener('pointerdown', (e) => {
    if (ini || a.inicio?.() === false) return;
    e.preventDefault();
    e.stopPropagation();
    el.setPointerCapture?.(e.pointerId);
    ini = { x: e.clientX, y: e.clientY, k: fatorLayout(a.ref), id: e.pointerId };
  });
  el.addEventListener('pointermove', (e) => {
    if (!ini || e.pointerId !== ini.id) return;
    a.mover((e.clientX - ini.x) * ini.k, (e.clientY - ini.y) * ini.k);
  });
  const fim = (e: PointerEvent) => {
    if (!ini || e.pointerId !== ini.id) return;
    ini = null;
    a.soltar();
  };
  el.addEventListener('pointerup', fim);
  el.addEventListener('pointercancel', fim);
}

export const ehAvanco = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' ';

/** Enter/Espaço avançam o gesto. */
export function teclaAvanca(el: HTMLElement, fn: () => void) {
  el.addEventListener('keydown', (e) => {
    if (!ehAvanco(e)) return;
    e.preventDefault();
    if (!e.repeat) fn();
  });
}
