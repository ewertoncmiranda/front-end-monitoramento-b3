import { escaparHtml } from '../../utils/html.js';
import { formatarDataHora } from '../../utils/dataHora.js';

export function linkSeguro(valor) {
  try {
    const url = new URL(valor);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function filtrarTimeline(itens, filtro = {}) {
  const normalizados = (itens || []).map((item) => ({
    ...item,
    tipoEvento: item.tipoEvento || item.tipo,
    ocorridoEm: item.ocorridoEm || item.criadoEm || item.dataEvento || item.dataPregao || item.data,
    descricao: item.descricao || item.titulo || item.payload?.descricao || item.payload?.codigo,
  }));
  return normalizados
    .filter((item) => !filtro.tipo || item.tipoEvento === filtro.tipo)
    .filter((item) => !filtro.severidade || item.severidade === filtro.severidade)
    .sort((a, b) => String(b.ocorridoEm || b.dataPregao || '').localeCompare(String(a.ocorridoEm || a.dataPregao || '')));
}

export function htmlFiltrosTimeline(itens, filtro = {}) {
  const tipos = [...new Set((itens || []).map((i) => i.tipoEvento || i.tipo).filter(Boolean))].sort();
  return `<div class="d-flex flex-wrap gap-2 mb-2">
    <select class="form-select form-select-sm w-auto" data-timeline-tipo aria-label="Filtrar timeline por tipo">
      <option value="">Todos os eventos</option>${tipos.map((t) => `<option value="${escaparHtml(t)}"${filtro.tipo === t ? ' selected' : ''}>${escaparHtml(t)}</option>`).join('')}
    </select>
    <select class="form-select form-select-sm w-auto" data-timeline-severidade aria-label="Filtrar timeline por severidade">
      <option value="">Todas as severidades</option>${['INFO', 'ATENCAO', 'CRITICO'].map((s) => `<option value="${s}"${filtro.severidade === s ? ' selected' : ''}>${s}</option>`).join('')}
    </select></div>`;
}

export function htmlListaTimeline(itens, filtro = {}) {
  const visiveis = filtrarTimeline(itens, filtro);
  if (!visiveis.length) return '<p class="small text-muted mb-0">Nenhum evento com esse filtro.</p>';
  return `<ol class="list-group list-group-numbered">${visiveis.map((item) => {
    const link = linkSeguro(item.link || item.urlDocumento || item.documentoUrl);
    const texto = item.descricao || item.detalhe || item.codigo || item.tipoEvento || 'Evento';
    return `<li class="list-group-item d-flex justify-content-between gap-3">
      <div><strong>${escaparHtml(item.tipoEvento || item.categoria || 'Evento')}</strong>
        <p class="small mb-0">${escaparHtml(texto)}</p>
        ${link ? `<a class="small" href="${escaparHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir documento</a>` : ''}</div>
      <div class="text-end"><span class="badge text-bg-${item.severidade === 'CRITICO' ? 'danger' : item.severidade === 'ATENCAO' ? 'warning' : 'secondary'}">${escaparHtml(item.severidade || 'INFO')}</span>
        <div class="small text-muted text-nowrap">${escaparHtml(formatarDataHora(item.ocorridoEm || item.dataPregao, 'sem data'))}</div></div>
    </li>`;
  }).join('')}</ol>`;
}

export function htmlTimeline(dados, filtro = {}) {
  if (!dados || dados.indisponivel) {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Timeline do ativo</p><p class="small text-muted mb-0">Timeline ainda indisponível.</p></section>';
  }
  const itens = dados.itens || [];
  return `<section class="ficha-cartao"><p class="ficha-rotulo">Timeline do ativo</p>
    ${htmlFiltrosTimeline(itens, filtro)}<div data-timeline-lista>${htmlListaTimeline(itens, filtro)}</div></section>`;
}
