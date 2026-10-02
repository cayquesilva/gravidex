# Prompt de construção: "Surpresa — Você foi promovido(a)!"

> Para rodar no **Claude Code** ou no **Antigravity**. Cole este arquivo na raiz de um repositório vazio e peça: *"Implemente a aplicação descrita em BUILD_PROMPT.md"*.
> Junto com ele, coloque os arquivos de design `Surpresa.dc.html`, `Criar Surpresa.dc.html` e `Surpresa Promocao.dc.html` em `/design`. Eles são a **referência visual e de comportamento**: copie medidas, cores, textos e timings de lá.

---

## 0. Contexto

Um casal está grávido e quer contar para as futuras vovós, vovôs, titias e titios. Cada pessoa recebe um **cartão impresso com QR**. Ao escanear, abre uma página com um **lacre interativo** (gamificado, infantil e mágico). Ao romper o lacre, aparece só a mensagem:

> **Maria, você foi promovida a**
> # Vovó
> *Tem um bebê a caminho!*

Há duas páginas:

| Rota | Quem usa | Função |
|---|---|---|
| `/` | convidado (via QR) | lacre → mensagem |
| `/criar/` | os pais | escolher a mecânica, cadastrar pessoas, gerar QR, imprimir cartões |

**Não há backend.** Todo o estado do convidado vai na URL, e o estado do gerador fica em `localStorage`.

---

## 1. Stack e regras

- **Vite + TypeScript, sem framework de UI** (DOM puro + CSS). A saída precisa ser estática.
  - Se preferir, pode usar Preact, mas sem bibliotecas de UI.
- Dependência única de runtime: `qrcode-generator` (npm).
- Fontes: Google Fonts **Fredoka** (500/600/700) para títulos e **Nunito** (500/700/800) para texto.
- Build multi-página do Vite: `index.html` e `criar/index.html`.
- Adicione `<meta name="robots" content="noindex">` nas duas páginas.
- Mobile-first. A página `/` deve funcionar perfeitamente entre 320 e 480 px de largura, na vertical, sem rolagem (`min-height: 100dvh`).
- Use CSS em arquivos `.css`, com custom properties para as cores.
- Acessibilidade:
  - `prefers-reduced-motion`: sem confete, sem tremor e sem brilhos; só fades.
  - Os elementos interativos do lacre precisam de `aria-label` e devem funcionar com teclado (Enter/Espaço = avançar o gesto).

### Estrutura

```
/index.html
/criar/index.html
/src/shared/config.ts        papéis, mecânicas, cores
/src/shared/url.ts           montarLink / lerParametros / textoPromocao
/src/shared/qr.ts            qrSvg / qrPng
/src/surpresa/main.ts        bootstrap da página "/"
/src/surpresa/mecanicas/{segurar,laco,tampa,envelope,raspar}.ts
/src/surpresa/revelar.ts     tela da mensagem + confete
/src/surpresa/fx.ts          confete, brilhos, vibração
/src/criar/main.ts           gerador
/src/criar/print.ts          impressão A4
/src/styles/*.css
/tests/*.test.ts             Vitest
```

---

## 2. Contrato da URL (fonte única de verdade)

```
/?p=<papel>&n=<nome>&m=<mecanica>[&t=<toques>][&f=<capa>][&x=<recado>]
```

| Param | Valores | Padrão | Regra |
|---|---|---|---|
| `p` | `vovo-a` `vovo-o` `titia` `titio` | `vovo-a` | valor desconhecido → padrão |
| `n` | texto | vazio | `trim()`, no máximo 24 caracteres; renderizar com `textContent` (nunca innerHTML) |
| `m` | `segurar` `laco` `tampa` `envelope` `raspar` | `laco` | valor desconhecido → padrão |
| `t` | 1–10 | 5 | só para `envelope` |
| `f` | índice em `FRENTES` | 0 (omitido) | texto pronto da capa da cartinha; índice inválido → padrão |
| `x` | texto | — | recado escrito pelos pais, mostrado entre a capa e a promoção; espaços colapsados, no máximo 180 caracteres; vazio pula a etapa |

- Monte as URLs com `URL` + `URLSearchParams`. Nunca concatene strings.
- O papel **nunca** aparece por extenso na URL nem no cartão.

### `config.ts`

```ts
export const PAPEIS = {
  'vovo-a': { titulo: 'Vovó',  verbo: 'promovida', cartao: 'oklch(0.88 0.06 10)'  },
  'vovo-o': { titulo: 'Vovô',  verbo: 'promovido', cartao: 'oklch(0.88 0.06 230)' },
  'titia':  { titulo: 'Titia', verbo: 'promovida', cartao: 'oklch(0.91 0.06 85)'  },
  'titio':  { titulo: 'Titio', verbo: 'promovido', cartao: 'oklch(0.88 0.06 160)' },
} as const;

export const MECANICAS = {
  segurar:  { label: 'Segurar o presente', dica: 'Segure o presente até ele abrir',
              bg: 'oklch(0.94 0.035 160)', ink: 'oklch(0.42 0.08 160)', titulo: 'oklch(0.52 0.12 160)',
              caixa: 'oklch(0.80 0.09 10)', tampa: 'oklch(0.74 0.10 10)', fita: 'oklch(0.80 0.09 85)',
              eyebrow: 'entrega especial', headline: 'Chegou um presente para você' },
  laco:     { label: 'Arrastar o laço', dica: 'Arraste o laço para desatar',
              bg: 'oklch(0.94 0.035 290)', ink: 'oklch(0.45 0.09 290)', titulo: 'oklch(0.52 0.13 290)',
              caixa: 'oklch(0.80 0.09 230)', tampa: 'oklch(0.74 0.10 230)', fita: 'oklch(0.80 0.09 10)',
              eyebrow: 'entrega especial', headline: 'Chegou um presente para você' },
  tampa:    { label: 'Puxar a tampa', dica: 'Puxe a tampa para cima',
              bg: 'oklch(0.95 0.035 85)', ink: 'oklch(0.48 0.08 70)', titulo: 'oklch(0.55 0.12 60)',
              caixa: 'oklch(0.80 0.09 160)', tampa: 'oklch(0.72 0.10 160)', fita: 'oklch(0.80 0.09 10)',
              eyebrow: 'entrega especial', headline: 'Chegou um presente para você' },
  envelope: { label: 'Selo de cera', dica: 'Toque no lacre {t} vezes',
              bg: 'oklch(0.94 0.035 230)', ink: 'oklch(0.45 0.08 250)', titulo: 'oklch(0.60 0.15 15)',
              eyebrow: 'correspondência mágica', headline: 'Tem uma notícia lacrada para você' },
  raspar:   { label: 'Raspadinha', dica: 'Raspe o cartão com o dedo',
              bg: 'oklch(0.94 0.035 10)', ink: 'oklch(0.48 0.09 10)', titulo: 'oklch(0.55 0.13 250)',
              eyebrow: 'segredo escondido', headline: 'Alguém tem um recado especial' },
} as const;

export const PADRAO = { papel: 'vovo-a', mecanica: 'laco', toques: 5 } as const;
export const CONFETE = ['oklch(0.80 0.09 10)','oklch(0.80 0.09 85)','oklch(0.80 0.09 230)',
                        'oklch(0.80 0.09 160)','oklch(0.70 0.13 15)','oklch(0.72 0.11 290)'];
export const TINTA = 'oklch(0.32 0.04 280)';   // cor do texto principal
```

### `url.ts`

```ts
export function montarLink(base: string, o: { papel; nome?; mecanica; toques? }): string;
export function lerParametros(search = location.search): { papel; nome; mecanica; toques };
export function textoPromocao(papel, nome): string; // "Maria, você foi promovida a" | "Você foi promovido a"
```

### `qr.ts`

```ts
import qrcode from 'qrcode-generator';
export function qrSvg(texto: string): string;           // nível 'M', margem 0, scalable
export function qrPng(texto: string, px = 1024): string; // dataURL, quiet zone de 4 módulos, fundo branco
```

---

## 3. Página `/` (surpresa)

### Layout do estado "lacrado"

Coluna centralizada, com `max-width: 480px` e padding superior de `12vh`:

1. eyebrow: 12px, 800, `letter-spacing: .16em`, uppercase, cor `ink`
2. headline: Fredoka 600, 32px/1.12, `text-wrap: balance`
3. objeto interativo (específico de cada mecânica)
4. controle de progresso (barra, trilho do laço ou bolinhas), quando houver
5. dica: Nunito 700, 15px, cor `ink`

Ao fundo, cor `bg` com **10 brilhos de estrela de 4 pontas** (clip-path), cor `oklch(0.99 0.01 85)`, de 8 a 20 px, piscando (`opacity .25↔1`, `scale .6↔1`, entre 2,2 e 4,2 s, delays aleatórios com seed fixa).

**Proibido:** botão "começar", menus, rodapé ou qualquer texto além desses.

### Presente (comum a `segurar`, `laco` e `tampa`)

- Área de 240×250.
- Corpo: 200×170, raio 14, cor `caixa`, com faixa vertical de fita de 30 px.
- Tampa: 224×54, raio 12, cor `tampa`, com faixa de fita de 32 px.
- Laço: dois anéis de 52×44, borda de 10 px na cor `fita`, rotacionados ±25°, sobre a tampa.
- Ao abrir:
  - tampa voa (`translate(±40px,-320px) rotate(±35deg)`, 0,7 s, `cubic-bezier(.2,.8,.3,1)`)
  - corpo faz fade e encolhe (`scale(.6)`, 0,4 s, delay de 0,35 s)

### Mecânicas

| `m` | Gesto | Feedback contínuo | Abre quando | Falha |
|---|---|---|---|---|
| `segurar` | `pointerdown` mantido na caixa | barra de 200×12 enche em **1,8 s**; a caixa treme `rotate(sin(t/38)·p·7°)` e cresce `scale(1+p·0.07)`; vibra 20 ms a cada 25 % | progresso = 1 | ao soltar, esvazia em **0,7 s** |
| `laco` | arrastar o botão (48 px) num trilho de 260×56 por **204 px** | a fita estica atrás do botão; os anéis se afastam e giram (`±(25+x·70)°`, `scale(1-x·.3)`); a fita vertical encolhe `scaleY(1-x·.7)` | soltar com **> 88 %** | volta com mola `cubic-bezier(.3,1.6,.5,1)` em 0,45 s |
| `tampa` | arrastar a tampa para cima por **150 px** | a tampa sobe e gira `-y·8°`; um brilho radial amarelo dentro da caixa cresce com `y`; uma seta ↑ some ao começar | soltar com **> 70 %** | volta com mola em 0,6 s |
| `envelope` | tocar no selo de cera (84 px) **t** vezes | o selo gira ±12° e cresce; o envelope balança ±1,5°; a rachadura (SVG, `stroke-dashoffset`) avança; bolinhas de progresso; dica "Faltam N toques" → "Só mais um toque!" | toques = t (+380 ms) | — |
| `raspar` | canvas sobre o cartão (300×360, raio 28) | gradiente lilás→rosa→azul com pontinhos e o texto "raspe aqui"; pincel `destination-out` de 46 px | **> 50 %** raspado (amostrar alpha a cada 16 px; checar a cada 12 moves e no `pointerup`) | — |

Regras gerais:
- Pointer Events com `setPointerCapture`.
- `touch-action: none` nos elementos de gesto e `user-select: none` em toda a página.
- Converta o delta do ponteiro para px do layout (divida pelo `getBoundingClientRect().width / offsetWidth`).
- Vibração `navigator.vibrate?.()`: `[40,60,90]` ao abrir e 25 ms por toque. Pode falhar em silêncio.
- No envelope, ao abrir: o selo parte em duas metades que caem para os lados, a aba gira `rotateX(180deg)` e a carta sobe 120 px.

### Revelação (igual para todas)

- O conteúdo do lacre faz fade-out.
- Em seguida, aparece uma camada centralizada com `scale(.5) translateY(80px) → scale(1)` (0,8 s, `cubic-bezier(.3,1.5,.5,1)`), contendo:
  1. `textoPromocao()`: Nunito 700, 22px/1.35
  2. Título do papel: Fredoka 700, `clamp(80px, 26vw, 120px)`, cor `titulo` da mecânica
  3. Pílula "**Tem um bebê a caminho!**": Fredoka 600, 22px, fundo `rgba(255,255,255,.65)`, padding 12×22, raio 99
- **Confete:** 44 peças (círculo, losango, estrela e tira), cores `CONFETE`, saindo do centro (45 % do topo) a 110–300 px de distância, girando até ±360°, com duração de 1,3–2,1 s e fade no final. Use seed fixa para a animação ser estável.
- **Delay da revelação:** 0,45 s nos presentes, 0,9 s no envelope e 0,1 s na raspadinha.
- **Nada depois.** Sem botões e sem compartilhar.
- Bônus opcional: salvar `sessionStorage['aberto:'+location.search]=1`. Ao recarregar, mostra direto a mensagem, sem confete.

---

## 4. Página `/criar/` (gerador)

Referência: `design/Criar Surpresa.dc.html`. Fundo `oklch(0.975 0.012 85)`, `max-width: 1080px`, seções numeradas com círculo escuro de 28 px.

1. **Endereço do site publicado**
   - Input. Padrão: a origem atual + `/`.
   - Precisa ser `https://`. Se não for, mostra a borda vermelha e a mensagem, e desativa as ações.
   - Link "usar o endereço desta página".
2. **Como romper o lacre**
   - Grade de 5 cartões-rádio (nome, dica e botão "Testar ↗", que abre `/?p=vovo-a&m=<k>` em uma nova aba sem selecionar o cartão).
   - Checkbox "Mecânica diferente para cada pessoa".
3. **Quem vai receber**
   - Lista editável; cada linha tem:
     - barra com a cor do cartão do papel
     - input de nome (máx. 24, opcional)
     - select de papel
     - select de mecânica (só se o checkbox estiver marcado)
     - botão remover (44×44)
   - "+ adicionar pessoa".
   - Avisos: nome repetido com o mesmo papel (aviso amarelo, não bloqueia); lista vazia (vermelho, bloqueia).
   - Estado inicial: 4 linhas vazias (vovo-a, vovo-o, titia, titio).
4. **Cartões**
   - Grade com a pré-visualização ao vivo.
   - Embaixo de cada cartão: etiqueta "Papel · Mecânica" (só na tela), "Copiar link" (vira "Copiado!" por 1,5 s), "PNG" e "Abrir ↗".
   - Botão "Imprimir todos (A4)".

**Estado** em `localStorage['surpresa.estado']`: `{ base, mecanica, porPessoa, pessoas:[{id,nome,papel,mecanica|null}] }`. Salvar a cada mudança e restaurar no carregamento. Ids com `crypto.randomUUID()`.

### Cartão (tela e impressão)

- **80 × 115 mm**, raio de 6 mm, fundo `PAPEIS[papel].cartao`, estrela de 4 mm no canto superior direito.
- "Para: ____": o nome, se houver; senão, a linha pontilhada para escrever à mão.
- "**Tem uma surpresa lacrada para você**": Fredoka 600, 17pt.
- QR de 45 mm sobre um quadrado branco com raio de 4 mm e padding de 3 mm, no rodapé.
- "Aponte a câmera do celular": 9pt.
- **Nunca** mostre o papel nem a palavra bebê no cartão.

### Impressão

- Use uma folha de estilo `@media print` na própria página, sem pop-up, mostrando só `.print-sheet`.
- `@page { size: A4; margin: 10mm }`, grade 2×2 com gap de 8 mm, `break-inside: avoid`, contorno tracejado de corte de 0,2 mm e `print-color-adjust: exact`.
- Aguarde `document.fonts.ready` antes de chamar `print()`.

### PNG

`qrPng(link, 1024)`. Nome do arquivo `qr-<nome-ou-papel-sem-acento>.png`.

---

## 5. Testes (Vitest)

- `montarLink` / `lerParametros` fazem ida e volta com acentos ("Conceição", "João Pedro").
- Parâmetros inválidos caem no padrão; `n` é truncado em 24 caracteres; `t` é limitado a 1–10.
- `textoPromocao` usa o gênero correto e funciona com e sem nome.
- O conteúdo de `qrSvg` decodifica de volta para a URL (use `jsqr` em dev para validar o PNG).
- Playwright (opcional): em viewport 390×844, para cada mecânica, simular o gesto e verificar que "Tem um bebê a caminho!" ficou visível.

---

## 6. Critérios de aceite

- [ ] `npm run build` gera um `dist/` estático com `/` e `/criar/`.
- [ ] Em `/criar/`, 4 pessoas geram 4 QR distintos; o estado sobrevive ao reload.
- [ ] Os QR escaneiam no iPhone (câmera nativa) e no Android (Google Lens).
- [ ] Cada uma das 5 mecânicas abre com o dedo no celular, sem rolar nem dar zoom na página.
- [ ] Nenhum texto antes da abertura revela o papel ou o bebê.
- [ ] A impressão em A4 tem 4 cartões por folha, sem cortar nada, com as cores impressas.
- [ ] Com `prefers-reduced-motion`, não há confete nem tremor.
- [ ] Lighthouse mobile: Performance ≥ 90, Acessibilidade ≥ 90.

---

## 7. Deploy

- **Netlify:** arrastar o `dist/` em app.netlify.com/drop, ou conectar o repositório (build `npm run build`, publish `dist`).
- **Vercel / GitHub Pages:** também funcionam. No Pages, configure o `base` do Vite com o nome do repositório.
- Depois de publicar: abrir `/criar/`, colar o endereço final, gerar os cartões e imprimir.

## 8. Fora do escopo

- Analytics de quem abriu
- Upload de foto
- Encurtador de links
- Login
