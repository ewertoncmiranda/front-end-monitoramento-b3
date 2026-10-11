import { escaparHtml } from '../../utils/html.js';
import { formatarDataHora } from '../../utils/dataHora.js';

const PESO = { CRITICO: 3, ATENCAO: 2, INFO: 1 };

export function ordenarAlertas(itens) {
  return [...(itens || [])].sort((a, b) => (PESO[b.severidade] || 0) - (PESO[a.severidade] || 0)
    || String(b.createdAt || b.criadoEm || '').localeCompare(String(a.createdAt || a.criadoEm || '')));
}
export function htmlAlertasOperacionais(dados, { compacto = false } = {}) {
  if (dados?.indisponivel) return '<p class="small text-muted mb-0">Alertas operacionais V2 ainda indisponíveis.</p>';
  const itens = ordenarAlertas((dados?.itens || []).filter((a) => a.ativo === true)).slice(0, compacto ? 5 : 30);
  if (!itens.length) return '<p class="small text-muted mb-0">Nenhum alerta operacional ativo.</p>';
  return `<div class="list-group list-group-flush">${itens.map((a) => {
    const simbolo = a.simbolo ? String(a.simbolo).toUpperCase() : '';
    const href = simbolo ? `#/gestao/${encodeURIComponent(simbolo)}?aba=operabilidade` : '#/operabilidade';
    const tom = a.severidade === 'CRITICO' ? 'danger' : a.severidade === 'ATENCAO' ? 'warning' : 'secondary';
    return `<a class="list-group-item list-group-item-action px-0" href="${href}">
      <div class="d-flex justify-content-between gap-2"><span><span class="badge text-bg-${tom}">${escaparHtml(a.severidade || 'INFO')}</span>
        <strong class="ms-1">${escaparHtml(a.titulo || a.categoria || a.codigo || 'Alerta')}</strong>${simbolo ? ` · ${escaparHtml(simbolo)}` : ''}</span>
        <span class="small text-muted text-nowrap">${escaparHtml(formatarDataHora(a.createdAt || a.criadoEm || a.data, ''))}</span></div>
      <div class="small mt-1">${escaparHtml(a.descricao || a.detalhe || '')}</div></a>`;
  }).join('')}</div>`;
}
