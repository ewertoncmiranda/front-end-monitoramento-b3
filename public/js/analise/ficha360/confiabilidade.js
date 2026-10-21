// FONTES-PAI-4: logica pura dos selos de confiabilidade (GET /ativos/{s}/confiabilidade
// do gestor, FONTES-GES-4). Sem DOM; a SecaoCabecalho so desenha o que sai daqui.
import { escaparHtml } from '../../utils/html.js';

export const NIVEIS = Object.freeze(['CRITICO', 'ALERTA', 'OK', 'SEM_DADO']);

// Menor numero = mais grave. SEM_DADO nunca e "pior": so aparece se tudo for SEM_DADO.
const GRAVIDADE = { CRITICO: 0, ALERTA: 1, OK: 2, SEM_DADO: 3 };
const ROTULO = { CRITICO: 'CRÍTICO', ALERTA: 'ALERTA', OK: 'OK', SEM_DADO: 'Sem dado' };
const ICONE = { CRITICO: '⛔', ALERTA: '⚠', OK: '✓', SEM_DADO: '○' };
const ORDEM_ID = ['CADASTRO', 'AUDITOR', 'DIVIDA', 'FUNDOS', 'DIVIDENDO'];

const nivelValido = (n) => (n in GRAVIDADE ? n : 'SEM_DADO');

export const rotuloDoNivel = (n) => ROTULO[nivelValido(n)];
export const iconeDoNivel = (n) => ICONE[nivelValido(n)];

/** Pior nivel de uma lista de niveis (CRITICO > ALERTA > OK > SEM_DADO); vazio = SEM_DADO. */
export function piorNivel(niveis) {
  return (niveis || []).map(nivelValido).reduce((a, b) => (GRAVIDADE[b] < GRAVIDADE[a] ? b : a), 'SEM_DADO');
}

/** Mais grave primeiro; empate pela ordem fixa dos ids, depois alfabetica. */
export function compararSelos(a, b) {
  const g = GRAVIDADE[nivelValido(a.nivel)] - GRAVIDADE[nivelValido(b.nivel)];
  if (g) return g;
  const ia = ORDEM_ID.indexOf(a.id);
  const ib = ORDEM_ID.indexOf(b.id);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.id.localeCompare(b.id);
}

/** Normaliza a resposta; resposta invalida ou sem selos = null (a faixa some). */
export function normalizarConfiabilidade(resposta) {
  const selos = Array.isArray(resposta?.selos) ? resposta.selos.filter((s) => s && s.id) : [];
  if (!selos.length) return null;
  const lista = selos.map((s) => ({
    id: String(s.id), nivel: nivelValido(s.nivel), titulo: s.titulo || String(s.id), detalhe: s.detalhe || '',
  })).sort(compararSelos);
  return {
    resumo: nivelValido(resposta?.resumo?.nivel ?? piorNivel(lista.map((s) => s.nivel))),
    leitura: resposta?.resumo?.leitura || '',
    selos: lista,
  };
}

const CLASSE = { CRITICO: 'f360-conf-critico', ALERTA: 'f360-conf-alerta', OK: 'f360-conf-ok', SEM_DADO: 'f360-conf-sem' };

function htmlSelo(s) {
  const detalhe = escaparHtml(s.detalhe || 'Sem detalhe.');
  return `<span class="f360-conf-selo ${CLASSE[s.nivel]}" title="${detalhe}" tabindex="0">
    <span aria-hidden="true">${ICONE[s.nivel]}</span> ${escaparHtml(s.titulo)}: ${ROTULO[s.nivel]}
    <span class="visually-hidden">. ${detalhe}</span></span>`;
}

/** Faixa de selos. Dado ausente/invalido = '' (cabecalho como antes). SEM_DADO fica recolhido. */
export function htmlFaixaConfiabilidade(resposta) {
  const c = normalizarConfiabilidade(resposta);
  if (!c) return '';
  const vivos = c.selos.filter((s) => s.nivel !== 'SEM_DADO');
  const mudos = c.selos.filter((s) => s.nivel === 'SEM_DADO');
  const semDado = mudos.length ? `<details class="f360-conf-sem-dado"><summary>${mudos.length} sem dado</summary>
    <div class="d-flex flex-wrap gap-1">${mudos.map(htmlSelo).join('')}</div></details>` : '';
  return `<div class="f360-conf" role="group" aria-label="Confiabilidade das fontes">
    <span class="f360-conf-selo f360-conf-resumo ${CLASSE[c.resumo]}" title="${escaparHtml(c.leitura)}" tabindex="0">
      <span aria-hidden="true">${ICONE[c.resumo]}</span> Confiabilidade: ${ROTULO[c.resumo]}
      ${c.leitura ? `<span class="visually-hidden">. ${escaparHtml(c.leitura)}</span>` : ''}</span>
    ${vivos.map(htmlSelo).join('')}${semDado}</div>`;
}

// ---- Ponto de extensao da tabela de ativos -------------------------------
// A listagem /painel/ativos NAO traz confiabilidade (FONTES-GES-6, futuro). Hoje
// o unico dado de confiabilidade na linha e `situacaoRegistro` (selo CADASTRO).
// Quando a listagem trouxer `confiabilidade: {nivel}`, nivelDaLinha ja o usa.

/** Nivel de confiabilidade conhecido da linha da listagem. */
export function nivelDaLinha(item) {
  if (item?.confiabilidade?.nivel) return nivelValido(item.confiabilidade.nivel);
  const s = String(item?.situacaoRegistro || '').toUpperCase();
  if (!s) return 'SEM_DADO';
  if (s.startsWith('ATIVO')) return 'OK';
  if (s.startsWith('CANCELAD') || s.startsWith('SUSPENS')) return 'CRITICO';
  return 'ALERTA';
}

export const FILTROS_CONFIABILIDADE = Object.freeze({
  '': 'Todos', COM_RESTRICAO: 'Com restrição (alerta ou crítico)', CRITICO: 'Só críticos', OK: 'Só OK',
});

/** Filtra linhas ja carregadas; filtro vazio/desconhecido devolve tudo. */
export function filtrarPorConfiabilidade(itens, filtro) {
  const lista = itens || [];
  if (filtro === 'COM_RESTRICAO') return lista.filter((i) => ['ALERTA', 'CRITICO'].includes(nivelDaLinha(i)));
  if (filtro === 'CRITICO' || filtro === 'OK') return lista.filter((i) => nivelDaLinha(i) === filtro);
  return lista;
}
