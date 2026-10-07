// Unica responsabilidade: desenhar a tabela unica de ativos (REQ-UX-8,
// contrato GET /painel/ativos do gestor, TASK-UX-5). Modulo puro, sem DOM:
// devolve HTML; a AtivosPage so liga eventos e paginacao.
import { formatarData } from '../utils/dataHora.js';
import { escaparHtml } from '../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../utils/numero.js';
import { htmlSelo } from '../utils/selos.js';
import { leituraDaRecomendacao } from './fichaDoAtivo.js';
import { htmlEstadoVazio } from '../components/EstadoVazio.js';

/** Filtros fixos de cada visao (chip) em GET /painel/ativos. */
export function filtrosDaVisao(visao) {
  if (visao === 'favoritos') return { favoritos: true };
  if (visao === 'monitorados') return { monitorados: true };
  return {};
}

const VAZIO_POR_VISAO = {
  favoritos: 'Nenhum favorito com esses filtros. Escolha ativos em "Todos" com o botão + Favoritos.',
  monitorados: 'Nenhum ativo monitorado com esses filtros.',
};

export function htmlTabelaAtivos(itens, { visao = 'todos' } = {}) {
  if (!itens || itens.length === 0) {
    return htmlEstadoVazio({
      titulo: 'Nenhum ativo encontrado',
      causa: VAZIO_POR_VISAO[visao] || 'Nenhum ativo bate com esses filtros. Limpe a busca ou escolha outro setor.',
    });
  }
  // So na visao de favoritos o botao vira "Remover" (pausa a coleta BRAPI);
  // nas demais, favorito aparece como selo.
  const permitirRemoverFavorito = visao === 'favoritos';
  const linhas = itens.map((item) => htmlLinhaAtivo(item, { permitirRemoverFavorito })).join('');
  return `
    <div class="table-responsive tabela-rolavel">
      <table class="table table-sm table-hover align-middle tabela-cartoes">
        <thead>
          <tr>
            <th>Símbolo</th><th>Empresa</th>
            <th class="text-end">Fechamento</th><th class="text-end">Variação</th>
            <th>20 pregões</th><th>Sinal</th><th>Último comunicado</th><th>Selos</th><th class="text-end">Ação</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

export function htmlLinhaAtivo(item, { permitirRemoverFavorito = false } = {}) {
  const selos = item.selos || {};
  return `
    <tr>
      <td data-label="Símbolo" class="fw-semibold">
        <a class="link-body-emphasis" href="#/gestao/${encodeURIComponent(item.simbolo)}">${escaparHtml(item.simbolo)}</a>
      </td>
      <td data-label="Empresa">${escaparHtml(item.nome ?? '-')}<div class="small text-muted">${escaparHtml(item.setor ?? 'Setor não informado')}</div></td>
      <td data-label="Fechamento" class="text-end">
        <div>${formatarMoeda(item.ultimoFechamento)}</div>
        <div class="small text-muted">${formatarData(item.dataUltimoFechamento, 'sem pregão')}</div>
      </td>
      <td data-label="Variação" class="text-end ${classeVariacao(item.variacaoPercentual)}">${formatarVariacao(item.variacaoPercentual)}</td>
      <td data-label="20 pregões">${htmlSparkline(item.serieFechamentos, item.simbolo)}</td>
      <td data-label="Sinal">${htmlSinal(item.sinal)}</td>
      <td data-label="Último comunicado">${htmlComunicado(item.ultimoComunicado)}</td>
      <td data-label="Selos"><div class="d-flex flex-wrap gap-1">${htmlSelos(selos)}</div></td>
      <td data-label="Ação" class="text-end">${htmlAcaoFavorito(item.simbolo, Boolean(selos.favorito), permitirRemoverFavorito)}</td>
    </tr>`;
}

/**
 * Sparkline em SVG dos fechamentos (mais antigo primeiro). Menos de 2 pontos
 * nao forma linha. A cor segue o periodo (ultimo x primeiro) e sempre vem com
 * texto equivalente no titulo, para quem nao enxerga a cor.
 */
export function htmlSparkline(valores, simbolo = 'ativo') {
  const pontos = (valores || []).map(Number).filter(Number.isFinite);
  if (pontos.length < 2) return '<span class="text-muted">—</span>';
  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const largura = 96;
  const altura = 28;
  const margem = 2;
  const escalaY = max === min
    ? () => altura / 2
    : (v) => margem + (altura - 2 * margem) * (1 - (v - min) / (max - min));
  const coords = pontos.map((v, i) => {
    const x = (i / (pontos.length - 1)) * largura;
    return `${x.toFixed(1)},${escalaY(v).toFixed(1)}`;
  }).join(' ');
  const sobe = pontos[pontos.length - 1] >= pontos[0];
  const titulo = `${escaparHtml(simbolo)}: ${pontos.length} pregões, ${sobe ? 'alta ou estável' : 'queda'} no período`;
  return `<svg class="ativo-sparkline ${sobe ? 'sobe' : 'desce'}" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="${titulo}"><title>${titulo}</title><polyline points="${coords}"></polyline></svg>`;
}

function formatarVariacao(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '-';
  return formatarPercentual(Number(valor) / 100, 2, { sinal: true });
}

function classeVariacao(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return 'text-muted';
  return Number(valor) > 0 ? 'text-success' : Number(valor) < 0 ? 'text-danger' : 'text-muted';
}

// Mesmo rotulo e tom da ficha; o titulo carrega o aviso de regra experimental
// (Res. CVM 20) e a versao da regra que produziu o sinal.
export function htmlSinal(sinal) {
  if (!sinal || !sinal.recomendacao) return htmlSelo('SEM_DADO', 'Sem sinal');
  const { rotulo, tom } = leituraDaRecomendacao(sinal.recomendacao);
  const titulo = `Regra experimental${sinal.versaoRegra ? ` ${sinal.versaoRegra}` : ''}: não é recomendação de investimento`;
  const quando = sinal.dataAnalise ? `<span class="small text-muted">${formatarData(sinal.dataAnalise)}</span>` : '';
  return `<div class="d-flex flex-column gap-1"><span class="badge text-bg-${tom}" title="${escaparHtml(titulo)}">${escaparHtml(rotulo)}</span>${quando}</div>`;
}

function htmlComunicado(comunicado) {
  if (!comunicado) return '<span class="text-muted">—</span>';
  const assunto = comunicado.assunto || comunicado.categoria || 'Comunicado';
  const resumo = assunto.length > 60 ? `${assunto.slice(0, 57)}…` : assunto;
  const texto = `<span class="small" title="${escaparHtml(assunto)}">${escaparHtml(resumo)}</span>`;
  const linha = comunicado.link
    ? `<a href="${escaparHtml(comunicado.link)}" target="_blank" rel="noopener noreferrer">${texto}</a>`
    : texto;
  const meta = [comunicado.categoria, formatarData(comunicado.dataEntrega)].filter(Boolean).map(escaparHtml).join(' · ');
  return `${linha}<div class="small text-muted">${meta}</div>`;
}

function htmlSelos(selos) {
  return [
    selos.favorito ? htmlSelo('FAVORITO') : '',
    selos.monitorado && !selos.favorito ? htmlSelo('OK', 'Monitorado') : '',
    selos.temFundamento ? '' : htmlSelo('SEM_DADO', 'Sem balanço'),
    selos.pregaoDefasado ? htmlSelo('ATENCAO', 'Preço antigo') : '',
  ].filter(Boolean).join('');
}

function htmlAcaoFavorito(simbolo, favorito, permitirRemoverFavorito) {
  const s = escaparHtml(simbolo);
  if (favorito && permitirRemoverFavorito) {
    return `<button type="button" class="btn btn-sm btn-outline-danger" data-remover-favorito="${s}" title="Pausar a coleta intradiária">Remover</button>`;
  }
  if (favorito) return '';
  return `<button type="button" class="btn btn-sm btn-outline-primary" data-favoritar="${s}">+ Favoritos</button>`;
}
