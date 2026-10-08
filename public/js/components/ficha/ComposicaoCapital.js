import { BaseComponent } from '../base/BaseComponent.js';

// Unica responsabilidade: mostrar a composicao acionaria (ON x PN x tesouraria)
// recebida de GET /ativos/{simbolo}/composicao-capital. Sem dado = sem render.
export class ComposicaoCapital extends BaseComponent {
  setDados(dados) {
    this._dados = dados;
    this.innerHTML = dados ? this._template(dados) : '';
  }

  _template(d) {
    const on = Number(d.qt_acao_ordinaria ?? 0);
    const pn = Number(d.qt_acao_preferencial ?? 0);
    const total = Number(d.qt_acao_total ?? (on + pn)) || 1;
    const tesoura = Number(d.qt_acao_ex_tesouraria ?? 0);
    const emCirculacao = total - tesoura;

    const pctOn = ((on / total) * 100).toFixed(1);
    const pctPn = ((pn / total) * 100).toFixed(1);

    const barras = [
      on > 0 ? { label: 'ON', pct: (on / total) * 100, cor: 'bg-primary' } : null,
      pn > 0 ? { label: 'PN', pct: (pn / total) * 100, cor: 'bg-info' } : null,
      tesoura > 0 ? { label: 'Tesouraria', pct: (tesoura / total) * 100, cor: 'bg-secondary' } : null,
    ].filter(Boolean);

    const barra = barras.map((b) =>
      `<div class="progress-bar ${b.cor}" style="width:${b.pct.toFixed(1)}%" title="${b.label}: ${b.pct.toFixed(1)}%"></div>`
    ).join('');

    const leg = barras.map((b) =>
      `<span><span class="badge ${b.cor}">${b.label}</span> ${b.pct.toFixed(1)}%</span>`
    ).join(' ');

    const fmt = (n) => n > 0 ? n.toLocaleString('pt-BR') : '—';

    return `
      <div class="card shadow-sm mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span class="fw-semibold">Composição acionária</span>
          <span class="text-muted small">${d.tipo_doc || ''} ${d.dt_refer ? new Date(d.dt_refer + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : ''}</span>
        </div>
        <div class="card-body">
          <div class="progress mb-2" style="height:18px">${barra}</div>
          <div class="d-flex flex-wrap gap-2 small mb-3">${leg}</div>
          <div class="row row-cols-2 row-cols-md-4 g-2 small">
            ${_campo('ON', fmt(on) + (on > 0 ? ` (${pctOn}%)` : ''))}
            ${_campo('PN', fmt(pn) + (pn > 0 ? ` (${pctPn}%)` : ''))}
            ${_campo('Em circulação', fmt(emCirculacao))}
            ${_campo('Total emitidas', fmt(total))}
          </div>
        </div>
      </div>
    `;
  }
}

function _campo(rotulo, valor) {
  return `<div class="col"><span class="text-muted">${rotulo}:</span> <strong>${valor}</strong></div>`;
}

customElements.define('composicao-capital', ComposicaoCapital);
