import '../styles/base.css';
import '../styles/criar.css';
import {
  PAPEIS, MECANICAS, PADRAO, NOME_MAX, ehPapel, ehMecanica, dicaDe,
  type Papel, type Mecanica,
} from '../shared/config';
import { h } from '../shared/dom';
import { qrPng, qrSvg } from '../shared/qr';
import { montarLink } from '../shared/url';
import { imprimir } from './print';

interface Pessoa { id: string; nome: string; papel: Papel; mecanica: Mecanica | null }
interface Estado { base: string; mecanica: Mecanica; porPessoa: boolean; pessoas: Pessoa[] }

const KEY = 'surpresa.estado';
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

// A página da surpresa fica na raiz do site (/criar/ → /).
const basePadrao = () => {
  try { return new URL('../', location.href).href; } catch { return 'https://exemplo.com/'; }
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
const novaPessoa = (papel: Papel): Pessoa => ({ id: uid(), nome: '', papel, mecanica: null });

// ---------- Estado ----------

function carregar(): Estado {
  const padrao: Estado = {
    base: basePadrao(),
    mecanica: PADRAO.mecanica,
    porPessoa: false,
    pessoas: (['vovo-a', 'vovo-o', 'titia', 'titio'] as const).map(novaPessoa),
  };
  let salvo: Record<string, unknown> | null = null;
  try { salvo = JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { /* estado corrompido */ }
  if (!salvo || typeof salvo !== 'object') return padrao;
  return {
    base: typeof salvo.base === 'string' ? salvo.base : padrao.base,
    mecanica: ehMecanica(salvo.mecanica) ? salvo.mecanica : padrao.mecanica,
    porPessoa: !!salvo.porPessoa,
    pessoas: Array.isArray(salvo.pessoas)
      ? salvo.pessoas.map((p: Partial<Pessoa> | null) => ({
          id: typeof p?.id === 'string' && p.id ? p.id : uid(),
          nome: String(p?.nome ?? '').slice(0, NOME_MAX),
          papel: ehPapel(p?.papel) ? p.papel : PADRAO.papel,
          mecanica: ehMecanica(p?.mecanica) ? p.mecanica : null,
        }))
      : padrao.pessoas,
  };
}

const estado = carregar();
let copiado: string | null = null;
let copiadoTimer = 0;

function salvar() {
  try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch { /* sem storage */ }
}

const baseOk = () => {
  try { return new URL(estado.base).protocol === 'https:'; } catch { return false; }
};
const mecDe = (p: Pessoa): Mecanica => (estado.porPessoa && p.mecanica ? p.mecanica : estado.mecanica);
const linkDe = (p: Pessoa) => montarLink(estado.base, { papel: p.papel, nome: p.nome, mecanica: mecDe(p) });
const podeAgir = () => baseOk() && estado.pessoas.length > 0;

function nomeArquivo(p: Pessoa) {
  const nome = (p.nome.trim() || PAPEIS[p.papel].titulo)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\W+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `qr-${nome || 'cartao'}.png`;
}

// ---------- Ações ----------

function copiar(p: Pessoa) {
  const texto = linkDe(p);
  const feito = () => {
    copiado = p.id;
    renderCartoes();
    clearTimeout(copiadoTimer);
    copiadoTimer = window.setTimeout(() => { copiado = null; renderCartoes(); }, 1500);
  };
  if (navigator.clipboard) navigator.clipboard.writeText(texto).then(feito, () => prompt('Copie o link:', texto));
  else prompt('Copie o link:', texto);
}

function baixarPng(p: Pessoa) {
  const a = h('a', { href: qrPng(linkDe(p), 1024), download: nomeArquivo(p) });
  document.body.append(a);
  a.click();
  a.remove();
}

function imprimirTodos() {
  if (!podeAgir()) return;
  imprimir($('#folhas'), estado.pessoas.map((p) => ({
    cor: PAPEIS[p.papel].cartao, nome: p.nome.trim(), link: linkDe(p),
  })));
}

/** Mudou algo que afeta links e cartões. */
function mudou() {
  salvar();
  renderBase();
  renderAvisos();
  renderCartoes();
}

// ---------- Render ----------

function renderBase() {
  const ok = baseOk();
  $('#base').classList.toggle('ruim', !ok);
  $('#base').setAttribute('aria-invalid', String(!ok));
  $('#base-aviso').hidden = ok;
}

function renderMecs() {
  for (const el of document.querySelectorAll<HTMLElement>('.mec')) {
    const sel = el.dataset.mec === estado.mecanica;
    el.setAttribute('aria-checked', String(sel));
    el.tabIndex = sel ? 0 : -1;
  }
}

function montarMecs() {
  const box = $('#mecs');
  const chaves = Object.keys(MECANICAS) as Mecanica[];
  const escolher = (k: Mecanica) => {
    estado.mecanica = k;
    renderMecs();
    renderPessoas();
    mudou();
  };
  box.replaceChildren(...chaves.map((k, i) => {
    const m = MECANICAS[k];
    return h('div', {
      className: 'mec', role: 'radio', 'data-mec': k, 'aria-label': m.label,
      onclick: () => escolher(k),
      onkeydown: (e: KeyboardEvent) => {
        const passo = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
        if (passo) {
          e.preventDefault();
          const prox = chaves[(i + passo + chaves.length) % chaves.length];
          escolher(prox);
          box.querySelector<HTMLElement>(`[data-mec="${prox}"]`)?.focus();
        } else if ((e.key === ' ' || e.key === 'Enter') && e.target === e.currentTarget) {
          e.preventDefault();
          escolher(k);
        }
      },
    },
      h('div', { className: 'mec-topo' }, h('div', { className: 'radio' }), h('div', { className: 'mec-nome' }, m.label)),
      h('div', { className: 'mec-dica' }, dicaDe(k)),
      h('button', {
        type: 'button', className: 'pilula', 'aria-label': `Testar ${m.label} em nova aba`,
        onclick: (e: MouseEvent) => {
          e.stopPropagation();
          const base = baseOk() ? estado.base : basePadrao();
          window.open(montarLink(base, { papel: 'vovo-a', mecanica: k }), '_blank', 'noopener');
        },
      }, 'Testar ↗'),
    );
  }));
  renderMecs();
}

function opcoes(pares: [string, string][], atual: string) {
  return pares.map(([v, label]) => h('option', { value: v, selected: v === atual }, label));
}

function atualizar(id: string, patch: Partial<Pessoa>) {
  const p = estado.pessoas.find((x) => x.id === id);
  if (!p) return;
  Object.assign(p, patch);
  salvar();
  renderAvisos();
  renderCartoes();
}

function renderPessoas() {
  const papeis = Object.entries(PAPEIS).map(([v, o]) => [v, o.titulo] as [string, string]);
  const mecs = Object.entries(MECANICAS).map(([v, o]) => [v, o.curto] as [string, string]);
  $('#pessoas').replaceChildren(...estado.pessoas.map((p, i) => {
    const cor = h('div', { className: 'cor', style: { background: PAPEIS[p.papel].cartao } });
    return h('div', { className: 'pessoa' },
      cor,
      h('input', {
        className: 'campo nome', value: p.nome, maxLength: NOME_MAX,
        placeholder: 'Nome ou apelido (opcional)', 'aria-label': `Nome da pessoa ${i + 1}`,
        oninput: (e: Event) => atualizar(p.id, { nome: (e.target as HTMLInputElement).value.slice(0, NOME_MAX) }),
      }),
      h('select', {
        className: 'campo', 'aria-label': `Papel da pessoa ${i + 1}`,
        onchange: (e: Event) => {
          const papel = (e.target as HTMLSelectElement).value as Papel;
          atualizar(p.id, { papel });
          cor.style.background = PAPEIS[papel].cartao;
        },
      }, ...opcoes(papeis, p.papel)),
      estado.porPessoa ? h('select', {
        className: 'campo', 'aria-label': `Mecânica da pessoa ${i + 1}`,
        onchange: (e: Event) => atualizar(p.id, { mecanica: (e.target as HTMLSelectElement).value as Mecanica }),
      }, ...opcoes(mecs, mecDe(p))) : null,
      h('button', {
        type: 'button', className: 'remover', 'aria-label': `Remover pessoa ${i + 1}`, title: 'Remover',
        onclick: () => {
          estado.pessoas = estado.pessoas.filter((x) => x.id !== p.id);
          renderPessoas();
          mudou();
        },
      }, '×'),
    );
  }));
}

function renderAvisos() {
  const vistos = new Set<string>();
  let dup = false;
  for (const p of estado.pessoas) {
    const n = p.nome.trim().toLowerCase();
    if (!n) continue;
    const k = `${n}|${p.papel}`;
    if (vistos.has(k)) dup = true;
    vistos.add(k);
  }
  $('#dup-aviso').hidden = !dup;
  $('#vazio-aviso').hidden = estado.pessoas.length > 0;
  $<HTMLButtonElement>('#imprimir').disabled = !podeAgir();
}

function renderCartoes() {
  const ok = baseOk();
  $('#cartoes').replaceChildren(...estado.pessoas.map((p) => {
    const qr = h('div', { className: 'qr' });
    if (ok) qr.innerHTML = qrSvg(linkDe(p));
    return h('div', { className: 'cartao-col' },
      h('div', { className: 'cartao', style: { background: PAPEIS[p.papel].cartao } },
        h('div', { className: 'estrela' }),
        h('div', { className: 'para' }, h('span', {}, 'Para:'), h('div', {}, p.nome.trim())),
        h('h3', {}, 'Tem uma surpresa lacrada para você'),
        qr,
        h('div', { className: 'camera' }, 'Aponte a câmera do celular'),
      ),
      h('div', { className: 'cartao-acoes' },
        h('span', { className: 'etiqueta' }, `${PAPEIS[p.papel].titulo} · ${MECANICAS[mecDe(p)].label}`),
        h('button', { type: 'button', className: 'pilula copiar', disabled: !ok, onclick: () => copiar(p) },
          copiado === p.id ? 'Copiado!' : 'Copiar link'),
        h('button', { type: 'button', className: 'pilula', disabled: !ok, onclick: () => baixarPng(p) }, 'PNG'),
        h('button', {
          type: 'button', className: 'pilula', disabled: !ok,
          onclick: () => window.open(linkDe(p), '_blank', 'noopener'),
        }, 'Abrir ↗'),
      ),
    );
  }));
}

// ---------- Início ----------

const baseInput = $<HTMLInputElement>('#base');
baseInput.value = estado.base;
baseInput.addEventListener('input', () => {
  estado.base = baseInput.value.trim();
  mudou();
});
$('#base-reset').addEventListener('click', () => {
  estado.base = baseInput.value = basePadrao();
  mudou();
});

const porPessoa = $<HTMLInputElement>('#por-pessoa');
porPessoa.checked = estado.porPessoa;
porPessoa.addEventListener('change', () => {
  estado.porPessoa = porPessoa.checked;
  renderPessoas();
  mudou();
});

$('#add').addEventListener('click', () => {
  estado.pessoas.push(novaPessoa('titia'));
  renderPessoas();
  mudou();
  document.querySelector<HTMLInputElement>('.pessoa:last-child .nome')?.focus();
});

$('#imprimir').addEventListener('click', imprimirTodos);

montarMecs();
renderPessoas();
renderBase();
renderAvisos();
renderCartoes();
