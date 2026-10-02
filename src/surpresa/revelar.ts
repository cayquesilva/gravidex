import { PAPEIS, type Papel } from '../shared/config';
import { h } from '../shared/dom';
import { textoPromocao } from '../shared/url';
import { confete } from './fx';

export interface OpcoesRevelar {
  papel: Papel;
  nome: string;
  /** segundos até a mensagem começar a aparecer */
  atraso: number;
  /** sem confete e sem transição (recarga depois de aberto) */
  instantaneo?: boolean;
  reduz: boolean;
}

/** Preenche a camada de revelação (criada vazia como região viva) e a mostra. */
export function revelar(camada: HTMLElement, o: OpcoesRevelar) {
  camada.style.setProperty('--msg-delay', `${o.atraso}s`);
  if (o.instantaneo) camada.classList.add('sem-transicao');
  camada.replaceChildren(
    ...(!o.instantaneo && !o.reduz ? [confete(o.atraso)] : []),
    h('div', { className: 'msg-pre' }, textoPromocao(o.papel, o.nome)),
    h('div', { className: 'msg-titulo' }, PAPEIS[o.papel].titulo),
    h('div', { className: 'msg-bebe' }, 'Tem um bebê a caminho!'),
  );
  // força o estado inicial antes de transicionar
  void camada.offsetWidth;
  camada.classList.add('visivel');
}
