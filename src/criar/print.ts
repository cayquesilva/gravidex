import { h } from '../shared/dom';
import { qrSvg } from '../shared/qr';

export interface CartaoImpressao {
  cor: string;
  nome: string;
  link: string;
}

const POR_FOLHA = 4;

/** Monta as folhas A4 (2×2) em `.print-sheet` e abre a impressão da própria página. */
export async function imprimir(destino: HTMLElement, cartoes: CartaoImpressao[]) {
  const folhas: HTMLElement[] = [];
  for (let i = 0; i < cartoes.length; i += POR_FOLHA) {
    folhas.push(h('div', { className: 'folha' }, ...cartoes.slice(i, i + POR_FOLHA).map(cartao)));
  }
  destino.replaceChildren(...folhas);
  try { await document.fonts?.ready; } catch { /* imprime com o fallback */ }
  window.print();
}

function cartao(c: CartaoImpressao) {
  const qr = h('div', { className: 'pc-qr' });
  qr.innerHTML = qrSvg(c.link);
  return h('div', { className: 'pc', style: { background: c.cor } },
    h('div', { className: 'pc-estrela' }),
    h('div', { className: 'pc-para' }, h('span', {}, 'Para:'), h('div', {}, c.nome)),
    h('div', { className: 'pc-titulo' }, 'Tem uma surpresa lacrada para você'),
    qr,
    h('div', { className: 'pc-camera' }, 'Aponte a câmera do celular'),
  );
}
