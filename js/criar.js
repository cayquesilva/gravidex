import { PAPEIS, MECANICAS, PADRAO, NOME_MAX } from './config.js';
import { montarLink } from './url.js';

const KEY = 'surpresa.estado';
const $ = (sel) => document.querySelector(sel);

// A página da surpresa fica na raiz do site (/criar/ → /).
const basePadrao = () => {
  try { return new URL('../', location.href).href; } catch { return 'https://exemplo.com/'; }
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
const novaPessoa = (papel) => ({ id: uid(), nome: '', papel, mecanica: null });

function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') Object.assign(el.style, v);
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v);
  }
  el.append(...filhos.filter((f) => f != null));
  return el;
}

// ---------- QR ----------

if (window.qrcode) window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];

function qrObj(texto) {
  const qr = window.qrcode(0, 'M');
  qr.addData(texto, 'Byte');
  qr.make();
  return qr;
}

function qrSvg(texto) {
  return qrObj(texto).createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

function qrPng(texto, px = 1024) {
  const qr = qrObj(texto), n = qr.getModuleCount(), q = 4, cell = px / (n + q * 2);
  const c = document.createElement('canvas'); c.width = c.height = px;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, px, px); x.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++)
    if (qr.isDark(r, k)) x.fillRect((k + q) * cell, (r + q) * cell, Math.ceil(cell), Math.ceil(cell));
  return c.toDataURL('image/png');
}

// ---------- Estado ----------

function carregar() {
  const padrao = {
    base: basePadrao(),
    mecanica: PADRAO.mecanica,
    porPessoa: false,
    pessoas: ['vovo-a', 'vovo-o', 'titia', 'titio'].map(novaPessoa),
  };
  let salvo = null;
  try { salvo = JSON.parse(localStorage.getItem(KEY)); } catch {}
  if (!salvo || typeof salvo !== 'object') return padrao;
  return {
    base: typeof salvo.base === 'string' ? salvo.base : padrao.base,
    mecanica: MECANICAS[salvo.mecanica] ? salvo.mecanica : padrao.mecanica,
    porPessoa: !!salvo.porPessoa,
    pessoas: Array.isArray(salvo.pessoas)
      ? salvo.pessoas.map((p) => ({
          id: p?.id || uid(),
          nome: String(p?.nome ?? '').slice(0, NOME_MAX),
          papel: PAPEIS[p?.papel] ? p.papel : PADRAO.papel,
          mecanica: MECANICAS[p?.mecanica] ? p.mecanica : null,
        }))
      : padrao.pessoas,
  };
}

const estado = carregar();
const qrPronto = !!window.qrcode;
let copiado = null, copiadoTimer = 0;

function salvar() {
  try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch {}
}

const baseOk = () => {
  try { return new URL(estado.base).protocol === 'https:'; } catch { return false; }
};
const mecDe = (p) => (estado.porPessoa && p.mecanica ? p.mecanica : estado.mecanica);
const linkDe = (p) => montarLink(estado.base, { papel: p.papel, nome: p.nome, mecanica: mecDe(p) });
const pronto = () => qrPronto && baseOk();

function nomeArquivo(p) {
  const nome = (p.nome.trim() || PAPEIS[p.papel].titulo)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\W+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `qr-${nome || 'cartao'}.png`;
}

// ---------- Ações ----------

function copiar(p) {
  const texto = linkDe(p);
  const feito = () => {
    copiado = p.id;
    renderCartoes();
    clearTimeout(copiadoTimer);
    copiadoTimer = setTimeout(() => { copiado = null; renderCartoes(); }, 1500);
  };
  if (navigator.clipboard) navigator.clipboard.writeText(texto).then(feito, () => prompt('Copie o link:', texto));
  else prompt('Copie o link:', texto);
}

function baixarPng(p) {
  const a = h('a', { href: qrPng(linkDe(p)), download: nomeArquivo(p) });
  document.body.append(a);
  a.click();
  a.remove();
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PRINT_CSS = `
@page{size:A4;margin:10mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Nunito,sans-serif;color:#3a3550}
.g{display:grid;grid-template-columns:repeat(2,80mm);gap:8mm;justify-content:center}
.c{width:80mm;height:115mm;border-radius:6mm;padding:8mm 7mm 6mm;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;break-inside:avoid;outline:.2mm dashed #bbb;outline-offset:2mm}
.s{position:absolute;top:5mm;right:6mm;width:4mm;height:4mm;background:#fffdf8;clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}
.to{display:flex;gap:2mm;width:100%;align-items:flex-end;font-size:11pt;font-weight:700}
.to div{flex:1;text-align:left;border-bottom:.5mm dotted #8a85a0;font:600 13pt Fredoka,sans-serif;min-height:5mm}
.h{font:600 17pt/1.12 Fredoka,sans-serif;margin-top:6mm}
.q{margin-top:auto;width:45mm;height:45mm;background:#fff;border-radius:4mm;padding:3mm}
.q svg{width:100%;height:100%;display:block}
.f{font-size:9pt;font-weight:700;margin-top:4mm}`;

function imprimirTodos() {
  if (!pronto() || !estado.pessoas.length) return;
  const cartoes = estado.pessoas.map((p) => `
    <div class="c" style="background:${PAPEIS[p.papel].cor}">
      <div class="s"></div>
      <div class="to"><span>Para:</span><div>${esc(p.nome.trim())}</div></div>
      <div class="h">Tem uma surpresa lacrada para você</div>
      <div class="q">${qrSvg(linkDe(p))}</div>
      <div class="f">Aponte a câmera do celular</div>
    </div>`).join('');
  const w = window.open('', '_blank');
  if (!w) { alert('Permita pop-ups para imprimir os cartões.'); return; }
  const d = w.document;
  d.open();
  d.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cartões</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@700&display=swap" rel="stylesheet">
<style>${PRINT_CSS}</style></head><body><div class="g">${cartoes}</div></body></html>`);
  d.close();
  const imprimir = () => setTimeout(() => w.print(), 300);
  if (d.fonts?.ready) d.fonts.ready.then(imprimir); else imprimir();
}

// ---------- Render ----------

function renderBase() {
  const ok = baseOk();
  $('#base').classList.toggle('ruim', !ok);
  $('#base-aviso').hidden = ok;
}

function renderMecs() {
  for (const el of document.querySelectorAll('.mec')) {
    const sel = el.dataset.mec === estado.mecanica;
    el.setAttribute('aria-checked', sel);
    el.tabIndex = sel ? 0 : -1;
  }
}

function montarMecs() {
  const box = $('#mecs');
  const chaves = Object.keys(MECANICAS);
  const escolher = (k) => { estado.mecanica = k; salvar(); renderMecs(); renderPessoas(); renderCartoes(); };
  box.replaceChildren(...chaves.map((k, i) => {
    const m = MECANICAS[k];
    return h('div', {
      className: 'mec', role: 'radio', 'data-mec': k,
      onclick: () => escolher(k),
      onkeydown: (e) => {
        const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (passo) {
          e.preventDefault();
          const prox = chaves[(i + passo + chaves.length) % chaves.length];
          escolher(prox);
          box.querySelector(`[data-mec="${prox}"]`).focus();
        } else if (e.key === ' ' || e.key === 'Enter') {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          escolher(k);
        }
      },
    },
      h('div', { className: 'mec-topo' }, h('div', { className: 'radio' }), h('div', { className: 'mec-nome' }, m.label)),
      h('div', { className: 'mec-dica' }, m.dica),
      h('button', {
        type: 'button', className: 'pilula',
        onclick: (e) => {
          e.stopPropagation();
          const base = baseOk() ? estado.base : basePadrao();
          window.open(montarLink(base, { papel: 'vovo-a', nome: '', mecanica: k }), '_blank');
        },
      }, 'Testar ↗'),
    );
  }));
  renderMecs();
}

function opcoes(pares, atual) {
  return pares.map(([v, label]) => h('option', { value: v, selected: v === atual }, label));
}

function atualizar(id, patch) {
  const p = estado.pessoas.find((x) => x.id === id);
  Object.assign(p, patch);
  salvar();
  renderAvisos();
  renderCartoes();
  return p;
}

function renderPessoas() {
  const papeis = Object.entries(PAPEIS).map(([v, o]) => [v, o.titulo]);
  const mecs = Object.entries(MECANICAS).map(([v, o]) => [v, o.curto]);
  $('#pessoas').replaceChildren(...estado.pessoas.map((p) => {
    const cor = h('div', { className: 'cor', style: { background: PAPEIS[p.papel].cor } });
    return h('div', { className: 'pessoa' },
      cor,
      h('input', {
        className: 'campo nome', value: p.nome, maxLength: NOME_MAX,
        placeholder: 'Nome ou apelido (opcional)', 'aria-label': 'Nome',
        oninput: (e) => atualizar(p.id, { nome: e.target.value.slice(0, NOME_MAX) }),
      }),
      h('select', {
        className: 'campo', 'aria-label': 'Papel',
        onchange: (e) => { atualizar(p.id, { papel: e.target.value }); cor.style.background = PAPEIS[e.target.value].cor; },
      }, ...opcoes(papeis, p.papel)),
      estado.porPessoa ? h('select', {
        className: 'campo', 'aria-label': 'Mecânica',
        onchange: (e) => atualizar(p.id, { mecanica: e.target.value }),
      }, ...opcoes(mecs, mecDe(p))) : null,
      h('button', {
        type: 'button', className: 'remover', 'aria-label': 'Remover', title: 'Remover',
        onclick: () => {
          estado.pessoas = estado.pessoas.filter((x) => x.id !== p.id);
          salvar(); renderPessoas(); renderAvisos(); renderCartoes();
        },
      }, '×'),
    );
  }));
}

function renderAvisos() {
  const vistos = new Set();
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
  $('#imprimir').disabled = !(pronto() && estado.pessoas.length);
}

function renderCartoes() {
  const ok = baseOk(), qrOk = pronto();
  $('#cartoes').replaceChildren(...estado.pessoas.map((p) => {
    const qr = h('div', { className: 'qr' });
    if (qrOk) qr.innerHTML = qrSvg(linkDe(p));
    return h('div', { className: 'cartao-col' },
      h('div', { className: 'cartao', style: { background: PAPEIS[p.papel].cor } },
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
        h('button', { type: 'button', className: 'pilula', disabled: !qrOk, onclick: () => baixarPng(p) }, 'PNG'),
        h('button', { type: 'button', className: 'pilula', disabled: !ok, onclick: () => window.open(linkDe(p), '_blank') }, 'Abrir ↗'),
      ),
    );
  }));
}

// ---------- Início ----------

const baseInput = $('#base');
baseInput.value = estado.base;
baseInput.addEventListener('input', () => {
  estado.base = baseInput.value.trim();
  salvar(); renderBase(); renderAvisos(); renderCartoes();
});
$('#base-reset').addEventListener('click', () => {
  estado.base = baseInput.value = basePadrao();
  salvar(); renderBase(); renderAvisos(); renderCartoes();
});

const porPessoa = $('#por-pessoa');
porPessoa.checked = estado.porPessoa;
porPessoa.addEventListener('change', () => {
  estado.porPessoa = porPessoa.checked;
  salvar(); renderPessoas(); renderCartoes();
});

$('#add').addEventListener('click', () => {
  estado.pessoas.push(novaPessoa('titia'));
  salvar(); renderPessoas(); renderAvisos(); renderCartoes();
  document.querySelector('.pessoa:last-child .nome')?.focus();
});

$('#imprimir').addEventListener('click', imprimirTodos);

if (!qrPronto) console.warn('qrcode-generator não carregou; os QR não serão exibidos.');

montarMecs();
renderBase();
renderPessoas();
renderAvisos();
renderCartoes();
