import { escaparHtml } from '../../utils/html.js';
import { formatarData, formatarDataHora } from '../../utils/dataHora.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';

export const CAPITAIS_SIMULACAO = [10, 100, 1_000, 10_000];
export const CAPITAL_BASE = 10_000;

export function labelCapital(c) {
  return c >= 1000 ? `R$${(c / 1000).toLocaleString('pt-BR')}k` : `R$${c}`;
}

export const ESTRATEGIAS_PADRAO = [
  'MOMENTO_PURO',
  'MOMENTO_REVERSAO',
  'BAIXO_SPREAD',
  'VALOR_RELATIVO',
  'QUALIDADE',
  'DIVIDENDOS',
  'DEFENSIVA',
];

export const SEM_DADO = 'sem dado';

export function campo(obj, nomes, vazio = null) {
  if (!obj) return vazio;
  for (const nome of Array.isArray(nomes) ? nomes : [nomes]) {
    const valor = obj[nome];
    if (valor !== undefined && valor !== null && valor !== '') return valor;
  }
  return vazio;
}

export function listaDe(dados) {
  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados?.itens)) return dados.itens;
  if (Array.isArray(dados?.resultados)) return dados.resultados;
  if (Array.isArray(dados?.estrategias)) return dados.estrategias;
  if (Array.isArray(dados?.operacoes)) return dados.operacoes;
  return [];
}

export function fmtMoeda(valor) {
  return escaparHtml(formatarMoeda(valor, SEM_DADO));
}

export function fmtPct(valor, sinal = true) {
  return escaparHtml(formatarPercentual(valor, 2, { sinal, vazio: SEM_DADO }));
}

export function fmtData(valor) {
  return escaparHtml(formatarData(valor, SEM_DADO));
}

export function fmtDataHora(valor) {
  return escaparHtml(formatarDataHora(valor, SEM_DADO));
}

export function classeValor(valor) {
  if (valor === null || valor === undefined || valor === '' || Number.isNaN(Number(valor))) return 'text-muted';
  return Number(valor) >= 0 ? 'text-success' : 'text-danger';
}

export function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

export function dataFutura(dataIso, hoje = hojeIso()) {
  return Boolean(dataIso && dataIso > hoje);
}

export function htmlComboboxAtivo(id, ativos = [], { label = 'Ativo', cssClass = 'form-control form-control-sm', placeholder = 'Digite ou busque…', required = true, value = '' } = {}) {
  const listId = `dl-${id}`;
  const opcoes = ativos.map((a) => `<option value="${escaparHtml(a.simbolo || a)}"></option>`).join('');
  const valorInicial = value ? ` value="${escaparHtml(value)}"` : '';
  return `<input type="text" id="${id}" list="${listId}" class="${cssClass}" placeholder="${placeholder}" autocomplete="off"${valorInicial}${required ? ' required' : ''}><datalist id="${listId}">${opcoes}</datalist>`;
}

export function validarSimboloAtivo(simbolo) {
  const valor = String(simbolo || '').trim().toUpperCase();
  return /^[A-Z]{4}[0-9]{1,2}$/.test(valor) ? null : 'Ativo inválido: use o formato XXXX0 ou XXXX00.';
}

export function fraseVsCdi(resultado) {
  const excesso = campo(resultado, ['excessoCdi', 'excessoSobreCdi', 'retornoVsCdi', 'vsCdi']);
  if (excesso === null || excesso === undefined || excesso === '') return 'Comparação com CDI ainda sem dado.';
  return Number(excesso) >= 0 ? 'Resultado acima do CDI no período.' : 'Resultado abaixo do CDI no período.';
}
