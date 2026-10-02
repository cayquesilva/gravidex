import '../styles/base.css';
import '../styles/surpresa.css';
import { MECANICAS, type Mecanica } from '../shared/config';
import { h } from '../shared/dom';
import { lerParametros } from '../shared/url';
import { brilhos, reduzMovimento, vibrar } from './fx';
import { preCarregarFoto } from './cartinha';
import { revelar } from './revelar';
import type { Ctx, Montar } from './tipos';
import { montar as segurar } from './mecanicas/segurar';
import { montar as laco } from './mecanicas/laco';
import { montar as tampa } from './mecanicas/tampa';
import { montar as envelope } from './mecanicas/envelope';
import { montar as raspar, cartaoRaspado } from './mecanicas/raspar';

const MONTAR: Record<Mecanica, Montar> = { segurar, laco, tampa, envelope, raspar };

/** Segundos até a cartinha começar a aparecer (no presente, enquanto a tampa voa), depois de romper o lacre. */
const ATRASO: Record<Mecanica, number> = { segurar: 0.15, laco: 0.15, tampa: 0.15, envelope: 0.9, raspar: 0.1 };

function iniciar() {
  const P = lerParametros();
  const M = MECANICAS[P.mecanica];
  const reduz = reduzMovimento();
  const chave = `aberto:${location.search}`;

  const cena = document.getElementById('app')!;
  const cores: Record<string, string> = { '--bg': M.bg, '--ink': M.ink, '--titulo': M.titulo };
  if ('caixa' in M) Object.assign(cores, { '--caixa': M.caixa, '--tampa': M.tampa, '--fita': M.fita });
  for (const [k, v] of Object.entries(cores)) document.documentElement.style.setProperty(k, v);

  preCarregarFoto();
  // Região viva vazia: o leitor de tela anuncia o texto da face visível da cartinha.
  const aviso = h('p', { className: 'so-leitor', role: 'status', 'aria-live': 'polite' });
  const anunciar = (texto: string) => { aviso.textContent = texto; };
  const camada = h('div', { className: 'revelacao' });
  if (!reduz) cena.append(brilhos());
  cena.append(aviso);

  let jaAberto = false;
  try { jaAberto = sessionStorage.getItem(chave) === '1'; } catch { /* sem storage */ }
  if (jaAberto) {
    cena.append(camada);
    if (P.mecanica === 'raspar') camada.append(cartaoRaspado(P, { reduz, anunciar }));
    else revelar(camada, { P, atraso: 0, instantaneo: true, reduz, anunciar });
    return;
  }

  const dica = h('p', { className: 'dica' }, M.dica);
  const palco = h('div', { className: 'palco' });
  const lacre = h('main', {
    className: 'lacre',
    style: { '--pre-delay': P.mecanica === 'envelope' ? '.6s' : '0s' },
  },
    h('div', { className: 'eyebrow' }, M.eyebrow),
    h('h1', { className: 'headline' }, M.headline),
    palco,
    dica,
  );
  cena.append(lacre, camada);

  let aberto = false;
  const ctx: Ctx = {
    P, M, reduz, palco, anunciar,
    dica: (texto) => { if (dica.textContent !== texto) dica.textContent = texto; },
    aberto: () => aberto,
    abrir: (origem) => {
      if (aberto) return false;
      aberto = true;
      vibrar(60);
      // guarda antes de o lacre ficar inerte (e perder o foco); evita o anel de foco em quem usou toque
      const focar = !!document.activeElement?.matches(':focus-visible');
      lacre.classList.add('saindo');
      // tudo sai de cena, menos o cartão raspado, que continua na tela e vira
      for (const el of lacre.querySelectorAll<HTMLElement>(':scope > :not(.palco), .palco > :not(.raspa-card)')) el.inert = true;
      try { sessionStorage.setItem(chave, '1'); } catch { /* sem storage */ }
      revelar(camada, { P, atraso: ATRASO[P.mecanica], reduz, origem, anunciar, focar });
      return true;
    },
  };
  MONTAR[P.mecanica](ctx);
}

iniciar();
