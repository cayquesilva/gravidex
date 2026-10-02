import '../styles/base.css';
import '../styles/surpresa.css';
import { MECANICAS, type Mecanica } from '../shared/config';
import { h } from '../shared/dom';
import { lerParametros } from '../shared/url';
import { brilhos, reduzMovimento, vibrar } from './fx';
import { revelar } from './revelar';
import type { Ctx, Montar } from './tipos';
import { montar as segurar } from './mecanicas/segurar';
import { montar as laco } from './mecanicas/laco';
import { montar as tampa } from './mecanicas/tampa';
import { montar as envelope } from './mecanicas/envelope';
import { montar as raspar } from './mecanicas/raspar';

const MONTAR: Record<Mecanica, Montar> = { segurar, laco, tampa, envelope, raspar };

/** Segundos até a mensagem aparecer, depois de romper o lacre. */
const ATRASO: Record<Mecanica, number> = { segurar: 0.45, laco: 0.45, tampa: 0.45, envelope: 0.9, raspar: 0.1 };

function iniciar() {
  const P = lerParametros();
  const M = MECANICAS[P.mecanica];
  const reduz = reduzMovimento();
  const chave = `aberto:${location.search}`;

  const cena = document.getElementById('app')!;
  const cores: Record<string, string> = { '--bg': M.bg, '--ink': M.ink, '--titulo': M.titulo };
  if ('caixa' in M) Object.assign(cores, { '--caixa': M.caixa, '--tampa': M.tampa, '--fita': M.fita });
  for (const [k, v] of Object.entries(cores)) document.documentElement.style.setProperty(k, v);

  // Região viva vazia: o leitor de tela anuncia a mensagem quando ela é preenchida.
  const camada = h('div', { className: 'revelacao', role: 'status', 'aria-live': 'polite' });
  if (!reduz) cena.append(brilhos());

  let jaAberto = false;
  try { jaAberto = sessionStorage.getItem(chave) === '1'; } catch { /* sem storage */ }
  if (jaAberto) {
    cena.append(camada);
    revelar(camada, { papel: P.papel, nome: P.nome, atraso: 0, instantaneo: true, reduz });
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
    P, M, reduz, palco,
    dica: (texto) => { if (dica.textContent !== texto) dica.textContent = texto; },
    aberto: () => aberto,
    abrir: () => {
      if (aberto) return false;
      aberto = true;
      vibrar([40, 60, 90]);
      lacre.classList.add('saindo');
      lacre.inert = true;
      try { sessionStorage.setItem(chave, '1'); } catch { /* sem storage */ }
      revelar(camada, { papel: P.papel, nome: P.nome, atraso: ATRASO[P.mecanica], reduz });
      return true;
    },
  };
  MONTAR[P.mecanica](ctx);
}

iniciar();
