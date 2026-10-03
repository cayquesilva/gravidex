export const PAPEIS = {
  'vovo-a': { titulo: 'Vovó', verbo: 'promovida', querido: 'Querida', cartao: 'oklch(0.88 0.06 10)' },
  'vovo-o': { titulo: 'Vovô', verbo: 'promovido', querido: 'Querido', cartao: 'oklch(0.88 0.06 230)' },
  'titia': { titulo: 'Titia', verbo: 'promovida', querido: 'Querida', cartao: 'oklch(0.91 0.06 85)' },
  'titio': { titulo: 'Titio', verbo: 'promovido', querido: 'Querido', cartao: 'oklch(0.88 0.06 160)' },
  'prima': { titulo: 'Prima', verbo: 'promovida', querido: 'Querida', cartao: 'oklch(0.89 0.06 50)' },
  'primo': { titulo: 'Primo', verbo: 'promovido', querido: 'Querido', cartao: 'oklch(0.87 0.06 290)' },
} as const;

/**
 * Textos prontos para a capa da cartinha (depois vêm o recado dos pais, se houver, e a promoção).
 * A ordem importa: o índice vai no link (`f`). Só acrescente no fim.
 */
export const FRENTES = [
  { label: 'Novidade guardada', texto: 'Temos uma novidade guardada com muito carinho, e você é uma das primeiras pessoas que precisava saber.' },
  { label: 'Novo capítulo', texto: 'A nossa família está prestes a ganhar um novo capítulo, e você vai ter um papel muito especial nele.' },
  { label: 'Melhores histórias', texto: 'Você faz parte das melhores histórias da nossa vida. E a próxima está só começando…' },
  { label: 'Amor de sempre', texto: 'Obrigado por todo o amor de sempre. Logo, logo ele vai ter mais alguém para receber.' },
  { label: 'Respira fundo', texto: 'Respira fundo e vira o cartão: o que está do outro lado vai mudar o seu título para sempre.' },
] as const;
/** limite do recado escrito pelos pais */
export const RECADO_MAX = 180;

/** Foto do casal no verso da cartinha: coloque o arquivo em `public/` com este nome. Se não existir, o porta-retrato some. */
export const FOTO = 'foto.jpg';

export const MECANICAS = {
  segurar: {
    label: 'Segurar o presente', curto: 'Segurar', dica: 'Segure o presente até ele abrir',
    bg: 'oklch(0.94 0.035 160)', ink: 'oklch(0.42 0.08 160)', titulo: 'oklch(0.52 0.12 160)',
    caixa: 'oklch(0.80 0.09 10)', tampa: 'oklch(0.74 0.10 10)', fita: 'oklch(0.80 0.09 85)',
    eyebrow: 'entrega especial', headline: 'Chegou um presente para você',
  },
  laco: {
    label: 'Arrastar o laço', curto: 'Laço', dica: 'Arraste o laço para desatar',
    bg: 'oklch(0.94 0.035 290)', ink: 'oklch(0.45 0.09 290)', titulo: 'oklch(0.52 0.13 290)',
    caixa: 'oklch(0.80 0.09 230)', tampa: 'oklch(0.74 0.10 230)', fita: 'oklch(0.80 0.09 10)',
    eyebrow: 'entrega especial', headline: 'Chegou um presente para você',
  },
  tampa: {
    label: 'Puxar a tampa', curto: 'Tampa', dica: 'Puxe a tampa para cima',
    bg: 'oklch(0.95 0.035 85)', ink: 'oklch(0.48 0.08 70)', titulo: 'oklch(0.55 0.12 60)',
    caixa: 'oklch(0.80 0.09 160)', tampa: 'oklch(0.72 0.10 160)', fita: 'oklch(0.80 0.09 10)',
    eyebrow: 'entrega especial', headline: 'Chegou um presente para você',
  },
  envelope: {
    label: 'Selo de cera', curto: 'Envelope', dica: 'Toque no lacre {t} vezes',
    bg: 'oklch(0.94 0.035 230)', ink: 'oklch(0.45 0.08 250)', titulo: 'oklch(0.60 0.15 15)',
    eyebrow: 'correspondência mágica', headline: 'Tem uma notícia lacrada para você',
  },
  raspar: {
    label: 'Raspadinha', curto: 'Raspadinha', dica: 'Raspe o cartão com o dedo',
    bg: 'oklch(0.94 0.035 10)', ink: 'oklch(0.48 0.09 10)', titulo: 'oklch(0.55 0.13 250)',
    eyebrow: 'segredo escondido', headline: 'Alguém tem um recado especial',
  },
} as const;

export type Papel = keyof typeof PAPEIS;
export type Mecanica = keyof typeof MECANICAS;

export const PADRAO = { papel: 'vovo-a', mecanica: 'laco', toques: 5, frente: 0 } as const satisfies {
  papel: Papel; mecanica: Mecanica; toques: number; frente: number;
};
export const NOME_MAX = 24;
export const TOQUES_MIN = 1;
export const TOQUES_MAX = 10;

export const CONFETE = ['oklch(0.80 0.09 10)', 'oklch(0.80 0.09 85)', 'oklch(0.80 0.09 230)',
  'oklch(0.80 0.09 160)', 'oklch(0.70 0.13 15)', 'oklch(0.72 0.11 290)'];
export const TINTA = 'oklch(0.32 0.04 280)'; // cor do texto principal

export const ehPapel = (v: unknown): v is Papel => typeof v === 'string' && Object.hasOwn(PAPEIS, v);
export const ehMecanica = (v: unknown): v is Mecanica => typeof v === 'string' && Object.hasOwn(MECANICAS, v);

export const dicaDe = (m: Mecanica, toques: number = PADRAO.toques) =>
  MECANICAS[m].dica.replace('{t}', String(toques));
