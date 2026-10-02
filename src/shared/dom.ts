type Filho = Node | string | null | undefined | false;

/** Mini-hyperscript: `h('div', { className: 'x', onclick }, filho)`. Texto vira textContent, nunca HTML. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs: Record<string, unknown> = {}, ...filhos: Filho[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'style') {
      for (const [p, val] of Object.entries(v as Record<string, string>)) {
        if (p.startsWith('--')) el.style.setProperty(p, val);
        else (el.style as unknown as Record<string, string>)[p] = val;
      }
    } else if (k in el && !k.includes('-')) (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k, String(v));
  }
  for (const f of filhos) if (f != null && f !== false) el.append(f);
  return el;
}

export const ESTRELA = 'polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)';

/** PRNG determinístico (mulberry32) para animações estáveis. */
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
