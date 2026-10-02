import { FOTO, PAPEIS } from '../shared/config';
import { h } from '../shared/dom';
import { textoParabens, textoPromocao, textoSaudacao, type Parametros } from '../shared/url';
import { confete, vibrar } from './fx';
import { teclaAvanca } from './gesto';

const BEBE = 'Tem um bebê a caminho!';
const FOTO_URL = `${import.meta.env.BASE_URL}${FOTO}`;

let foto: 'carregando' | 'ok' | 'falhou' = 'carregando';

/** Começa a baixar a foto do casal logo na abertura, para o verso já nascer com ela (ou sem o porta-retrato). */
export function preCarregarFoto() {
  const img = new Image();
  img.onload = () => { foto = 'ok'; };
  img.onerror = () => { foto = 'falhou'; };
  img.src = FOTO_URL;
}

export interface Cartinha {
  el: HTMLElement;
  /** Deixa a cartinha virável e anuncia a face visível. `focar`: quem vinha pelo teclado recebe o foco nela. */
  ativar(focar?: boolean): void;
}

export interface OpcoesCartinha {
  reduz: boolean;
  /** já começa na promoção (recarga depois de aberto) */
  noFim?: boolean;
  anunciar(texto: string): void;
}

const estrelas = () => [
  h('div', { className: 'cartinha-estrela' }),
  h('div', { className: 'cartinha-estrela' }),
];

type Etapa = 'capa' | 'recado' | 'promocao';

/**
 * Cartinha que vira em etapas: capa (saudação + texto pronto) → recado dos pais (se houver)
 * → promoção com a foto. Cada toque gira mais 180°; o conteúdo da face que está escondida
 * é trocado antes de ela aparecer. Depois da promoção, volta para a capa.
 * O confete estoura na primeira vez que a promoção aparece.
 */
export function criarCartinha(P: Parametros, o: OpcoesCartinha): Cartinha {
  const saudacao = textoSaudacao(P.papel, P.nome);
  const titulo = PAPEIS[P.papel].titulo;
  const etapas: Etapa[] = P.recado ? ['capa', 'recado', 'promocao'] : ['capa', 'promocao'];

  const dica = () => h('div', { className: 'frente-dica' }, h('span', { className: 'frente-icone' }, '↻'), 'toque para virar');
  const PAINEIS: Record<Etapa, () => HTMLElement> = {
    capa: () => h('div', { className: 'painel capa' },
      h('div', { className: 'frente-corpo' },
        saudacao ? h('div', { className: 'frente-saudacao' }, saudacao) : null,
        h('p', { className: 'frente-texto' }, P.frente),
      ),
      dica(),
    ),
    recado: () => h('div', { className: 'painel recado' },
      h('div', { className: 'frente-corpo' },
        h('div', { className: 'recado-rotulo' }, 'um recado nosso'),
        h('p', { className: 'recado-texto' }, P.recado),
      ),
      dica(),
    ),
    promocao: () => {
      const polaroid = foto === 'falhou' ? null : h('figure', { className: 'polaroid' },
        h('img', { src: FOTO_URL, alt: '', decoding: 'async', onerror: () => polaroid?.remove() }));
      return h('div', { className: 'painel promocao' },
        polaroid,
        h('div', { className: 'msg-parabens' }, textoParabens(P.nome)),
        h('div', { className: 'msg-pre' }, textoPromocao(P.papel)),
        h('div', { className: 'msg-titulo' }, titulo),
        h('div', { className: 'msg-bebe' }, BEBE),
      );
    },
  };
  const TEXTOS: Record<Etapa, string> = {
    capa: `${saudacao} ${P.frente}`.trim(),
    recado: P.recado,
    promocao: `${textoParabens(P.nome)} ${textoPromocao(P.papel)} ${titulo}. ${BEBE}`,
  };

  // Cada face carrega todas as etapas empilhadas (só uma visível): a altura do cartão é a da
  // maior etapa e não pula quando o conteúdo troca.
  const face = (lado: string) => h('div', { className: `face ${lado}` }, ...estrelas(), ...etapas.map((e) => PAINEIS[e]()));
  const faces = [face('frente'), face('verso')];
  const mostrar = (f: HTMLElement, e: Etapa) => {
    for (const p of f.querySelectorAll('.painel')) p.classList.toggle('ativo', p.classList.contains(e));
  };

  // As faces são só visuais; o leitor de tela ouve o texto da etapa visível pela região viva.
  const giro = h('div', { className: 'cartinha-giro', 'aria-hidden': 'true' }, ...faces);
  const el = h('div', {
    className: 'cartinha', role: 'button', tabIndex: -1, 'aria-hidden': 'true',
    'aria-label': 'Virar o cartão',
  }, giro);

  let ativo = false;
  let n = o.noFim ? etapas.length - 1 : 0; // etapa visível
  let giros = 0; // meias-voltas dadas; par = frente para cima
  let viuPromocao = !!o.noFim;

  const aplicar = () => {
    el.dataset.etapa = etapas[n];
    el.classList.toggle('mostra-verso', giros % 2 === 1);
    giro.style.setProperty('--giro', `${giros * 180}deg`);
  };
  mostrar(faces[0], etapas[n]);
  aplicar();

  /** confete do centro da cartinha, atrás dela, quando a promoção aparece */
  const estourar = () => {
    const pai = el.parentElement;
    if (!pai) return;
    const A = pai.getBoundingClientRect();
    const R = el.getBoundingClientRect();
    el.before(confete(0.3, `${R.left + R.width / 2 - A.left}px`, `${R.top + R.height / 2 - A.top}px`));
  };

  const virar = () => {
    if (!ativo) return;
    n = (n + 1) % etapas.length;
    giros++;
    mostrar(faces[giros % 2], etapas[n]); // a face que vai aparecer (estava de costas)
    aplicar();
    el.classList.remove('cutucando');
    o.anunciar(TEXTOS[etapas[n]]);
    if (!o.reduz) giro.animate([{ scale: '1' }, { scale: '1.07' }, { scale: '1' }], { duration: 850, easing: 'ease-in-out' });
    if (etapas[n] === 'promocao' && !viuPromocao) {
      viuPromocao = true;
      vibrar([40, 60, 90]);
      if (!o.reduz) estourar();
    }
  };

  el.addEventListener('click', virar);
  teclaAvanca(el, virar);

  return {
    el,
    ativar(focar = false) {
      ativo = true;
      el.tabIndex = 0;
      el.removeAttribute('aria-hidden');
      if (!viuPromocao && !o.reduz) el.classList.add('cutucando');
      o.anunciar(TEXTOS[etapas[n]]);
      if (focar) el.focus({ preventScroll: true });
    },
  };
}
