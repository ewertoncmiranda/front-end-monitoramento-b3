import { escaparHtml } from '../../utils/html.js';

const GRUPOS = [
  ['positivos', 'Fatores positivos', 'success'],
  ['negativos', 'Fatores negativos', 'danger'],
  ['riscos', 'Riscos', 'warning'],
  ['dadosAusentes', 'Dados ausentes', 'secondary'],
  ['invalidadores', 'O que invalida a tese', 'dark'],
];

function itemHtml(item, tom) {
  const valor = typeof item === 'string' ? { descricao: item } : (item || {});
  const descricao = valor.descricao || valor.detalhe || valor.codigo || 'sem dado';
  return `<li class="list-group-item px-0 d-flex gap-2 align-items-start">
    <span class="badge text-bg-${tom}">${escaparHtml(valor.severidade || valor.codigo || 'INFO')}</span>
    <span>${escaparHtml(descricao)}</span></li>`;
}
export function htmlTese(dados) {
  if (!dados || dados.indisponivel) {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Por que esse sinal existe?</p><p class="small text-muted mb-0">Tese explicada ainda indisponível.</p></section>';
  }
  const bloco = dados.tese || dados;
  const grupos = GRUPOS.map(([chave, rotulo, tom]) => {
    const itens = Array.isArray(bloco[chave]) ? bloco[chave] : [];
    return `<div class="col-md-6"><h3 class="h6">${rotulo}</h3>
      ${itens.length ? `<ul class="list-group list-group-flush small">${itens.map((i) => itemHtml(i, tom)).join('')}</ul>` : '<p class="small text-muted">Nenhum item informado.</p>'}</div>`;
  }).join('');
  return `<section class="ficha-cartao"><p class="ficha-rotulo">Por que esse sinal existe?</p>${bloco.aviso ? `<p class="small text-muted">${escaparHtml(bloco.aviso)}</p>` : ''}<div class="row g-3">${grupos}</div></section>`;
}
