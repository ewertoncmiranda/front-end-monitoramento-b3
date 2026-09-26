import { BaseComponent } from './base/BaseComponent.js';
import { badgeClassParaRecomendacao } from '../utils/recomendacaoBadge.js';

// Unica responsabilidade: renderizar o retrato bruto (nao mediado) da ultima
// analise de um ativo (contrato de GET /analises/{simbolo}/fundamentos) - os
// numeros e classificacoes exatos que o gerar-insights calculou naquele
// ciclo: cenarios de preco justo Graham, classificacoes, contexto tecnico,
// sinal tecnico de serie e os insights/fatores que levaram a recomendacao.
export class FundamentosCard extends BaseComponent {
  setFundamentos(fundamentos) {
    this._fundamentos = fundamentos;
    this.innerHTML = this.template();
  }

  template() {
    const f = this._fundamentos;
    if (!f || !f.detalhes) {
      return '<p class="text-muted">Nenhuma análise foi encontrada para este ativo.</p>';
    }

    const d = f.detalhes;
    const badge = badgeClassParaRecomendacao(f.recomendacao);

    return `
      <div class="card shadow-sm mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span class="fw-semibold">${f.simbolo || ''}</span>
          <span class="text-muted small">${formatarData(f.dataAnalise)}</span>
        </div>
        <div class="card-body">
          <div class="d-flex flex-wrap gap-2 mb-3">
            <span class="badge ${badge}">${f.recomendacao || 'SEM_DADOS'}</span>
            <span class="badge bg-secondary">Risco ${d.resumo?.nivel_risco || '-'}</span>
            <span class="badge bg-secondary">Confiança ${d.resumo?.confianca_score ?? '-'}</span>
          </div>

          ${secaoPerfilEmpresa(f.perfilEmpresa)}
          ${secaoSnapshot(d.snapshot_mercado)}
          ${secaoValuation(d.valuation)}
          ${secaoPerfilOperacao(f)}
          ${secaoContextoTecnico(d.contexto_tecnico)}
          ${secaoSinalTecnico(d.contexto_tecnico_serie)}
          ${secaoInsights(d.insights)}
          ${secaoFatores(d.fatores_decisao)}
        </div>
      </div>
    `;
  }
}

function secaoPerfilEmpresa(p) {
  if (!p) return '';
  return `
    <h6 class="mt-2">Perfil da empresa</h6>
    <div class="d-flex flex-wrap gap-2 mb-2">
      ${p.sector ? `<span class="badge bg-primary">${p.sector}</span>` : ''}
      ${p.industry ? `<span class="badge bg-secondary">${p.industry}</span>` : ''}
    </div>
    ${p.longBusinessSummary ? `<p class="small text-muted mb-3">${primeiroParagrafo(p.longBusinessSummary)}</p>` : ''}
  `;
}

function primeiroParagrafo(texto) {
  return texto.split('\n\n')[0];
}

function secaoSnapshot(s) {
  if (!s) return '';
  return `
    <h6 class="mt-2">Snapshot de mercado</h6>
    <div class="row row-cols-2 row-cols-md-4 g-2 small mb-3">
      ${campo('Preço', formatarMoeda(s.preco))}
      ${campo('Abertura', formatarMoeda(s.abertura))}
      ${campo('Fech. anterior', formatarMoeda(s.fechamento_anterior))}
      ${campo('Maxima dia', formatarMoeda(s.maxima_dia))}
      ${campo('Minima dia', formatarMoeda(s.minima_dia))}
      ${campo('Minima 52s', formatarMoeda(s.minima_52w))}
      ${campo('Maxima 52s', formatarMoeda(s.maxima_52w))}
      ${campo('P/L', formatarNumero(s.preco_lucro))}
      ${campo('LPA', formatarMoeda(s.lucro_por_acao))}
      ${campo('Volume', formatarInteiro(s.volume))}
    </div>
  `;
}

function secaoValuation(v) {
  if (!v) return '';
  const cenarios = v.cenarios_graham || {};
  const linhas = ['conservador', 'base', 'otimista']
    .filter((chave) => cenarios[chave])
    .map((chave) => {
      const c = cenarios[chave];
      return `
        <tr>
          <td class="text-capitalize">${chave}</td>
          <td>${formatarNumero(c.crescimento_percent)}%</td>
          <td>${formatarNumero(c.multiplo_lucro_implicito)}x</td>
          <td>${formatarMoeda(c.preco_justo)}</td>
          <td class="${c.margem_seguranca_percent >= 0 ? 'text-success' : 'text-danger'}">${formatarNumero(c.margem_seguranca_percent)}%</td>
        </tr>
      `;
    })
    .join('');

  return `
    <h6 class="mt-2">Valuation (Graham)</h6>
    <div class="d-flex flex-wrap gap-3 small mb-2">
      ${campo('Earnings yield', `${formatarNumero(v.earnings_yield_percent)}%`)}
      ${campo('Classificacao P/L', v.classificacao_pl || '-')}
      ${campo('Classificacao earnings yield', v.classificacao_earnings_yield || '-')}
    </div>
    <div class="table-responsive mb-3">
      <table class="table table-sm">
        <thead>
          <tr><th>Cenário</th><th>Crescimento</th><th>Múltiplo</th><th>Preço justo</th><th>Margem de segurança</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function secaoContextoTecnico(c) {
  if (!c) return '';
  return `
    <h6 class="mt-2">Contexto técnico do dia</h6>
    <div class="row row-cols-2 row-cols-md-3 g-2 small mb-3">
      ${campo('Zona 52 semanas', c.zona_52w || '-')}
      ${campo('Posicao no range 52s', `${formatarNumero(c.posicao_range_52w_percent)}%`)}
      ${campo('Desconto da maxima 52s', `${formatarNumero(c.desconto_maxima_52w_percent)}%`)}
      ${campo('Distancia da minima 52s', `${formatarNumero(c.distancia_minima_52w_percent)}%`)}
      ${campo('Variacao desde abertura', `${formatarNumero(c.variacao_desde_abertura_percent)}%`)}
      ${campo('Variacao vs fech. anterior', `${formatarNumero(c.variacao_vs_fechamento_anterior_percent)}%`)}
      ${campo('Amplitude intradiaria', `${formatarNumero(c.amplitude_intradiaria_percent)}%`)}
    </div>
  `;
}

function secaoSinalTecnico(s) {
  if (!s) {
    return '<p class="text-muted small">Sem sinal técnico da série: o histórico deste ciclo é insuficiente.</p>';
  }
  return `
    <h6 class="mt-2">Sinal técnico da série</h6>
    <div class="d-flex flex-wrap gap-2 mb-2">
      ${badgeSinalTecnico('Momentum', s.sinal_momentum)}
      ${badgeSinalTecnico('Reversao', s.sinal_reversao)}
    </div>
    <div class="row row-cols-2 row-cols-md-4 g-2 small mb-3">
      ${campo('Media movel', formatarMoeda(s.media_movel))}
      ${campo('Z-score do fechamento', formatarNumero(s.z_score_fechamento))}
      ${campo('Score de volume', formatarNumero(s.score_volume))}
      ${campo('Amostras', s.amostras ?? '-')}
    </div>
  `;
}

function secaoPerfilOperacao(f) {
  const temPerfil = f.perfisAplicaveis?.length || f.riscoCompraAgora || f.riscoVendaAgora || f.confluenciaSinais;
  if (!temPerfil) return '';

  const perfis = f.perfisAplicaveis?.length
    ? f.perfisAplicaveis.map((p) => `<span class="badge bg-info text-dark me-1">${formatarPerfil(p)}</span>`).join('')
    : '<span class="text-muted">Sem sinal claro de perfil</span>';

  return `
    <h6 class="mt-2">Perfil de operação e riscos</h6>
    <div class="mb-2">${perfis}</div>
    <div class="d-flex flex-wrap gap-3 small mb-2">
      ${campo('Risco de comprar agora', badgeRisco(f.riscoCompraAgora))}
      ${campo('Risco de vender agora', badgeRisco(f.riscoVendaAgora))}
    </div>
    ${f.confluenciaSinais ? `<p class="small text-muted mb-3">${f.confluenciaSinais.resumo}</p>` : ''}
  `;
}

function badgeSinalTecnico(rotulo, sinal) {
  const mapa = {
    COMPRA_TECNICA: 'bg-success',
    VENDA_TECNICA: 'bg-danger',
    NEUTRO_TECNICO: 'bg-secondary',
  };
  const classe = mapa[sinal] || 'bg-secondary';
  return `<span class="badge ${classe}">${rotulo}: ${sinal || 'N/D'}</span>`;
}

function badgeRisco(risco) {
  const mapa = { ALTO: 'bg-danger', MEDIO: 'bg-warning text-dark', BAIXO: 'bg-success' };
  if (!risco) return '<span class="text-muted">-</span>';
  return `<span class="badge ${mapa[risco] || 'bg-secondary'}">${risco}</span>`;
}

function formatarPerfil(perfil) {
  const mapa = {
    DAY_TRADE: 'Day trade',
    SWING_REVERSAO: 'Swing / reversao',
    LONGO_PRAZO: 'Longo prazo',
  };
  return mapa[perfil] || perfil;
}

function secaoInsights(insights) {
  if (!insights || insights.length === 0) return '';
  const itens = insights
    .map((i) => `<li class="mb-1"><span class="badge ${badgeSeveridade(i.severidade)} me-1">${i.severidade}</span>${i.mensagem}</li>`)
    .join('');
  return `<h6 class="mt-2">Insights</h6><ul class="small mb-3">${itens}</ul>`;
}

function secaoFatores(fatores) {
  if (!fatores) return '';
  const lista = (rotulo, itens, classe) =>
    itens && itens.length
      ? `<div class="mb-1"><strong>${rotulo}:</strong> ${itens.map((it) => `<span class="badge ${classe} me-1">${it}</span>`).join('')}</div>`
      : '';
  return `
    <h6 class="mt-2">Fatores de decisão</h6>
    <div class="small mb-2">
      ${lista('Positivos', fatores.positivos, 'bg-success')}
      ${lista('Negativos', fatores.negativos, 'bg-danger')}
      ${lista('Neutros', fatores.neutros, 'bg-secondary')}
    </div>
  `;
}

function campo(rotulo, valor) {
  return `<div class="col"><span class="text-muted">${rotulo}:</span> ${valor}</div>`;
}

function badgeSeveridade(severidade) {
  const mapa = {
    POSITIVO: 'bg-success',
    POSITIVO_MODERADO: 'bg-success',
    NEGATIVO: 'bg-danger',
    ATENCAO: 'bg-warning text-dark',
    NEUTRO: 'bg-secondary',
  };
  return mapa[severidade] || 'bg-secondary';
}

function formatarMoeda(valor) {
  return valor === undefined || valor === null ? '-' : `R$ ${Number(valor).toFixed(2)}`;
}

function formatarNumero(valor) {
  return valor === undefined || valor === null ? '-' : Number(valor).toFixed(2);
}

function formatarInteiro(valor) {
  return valor === undefined || valor === null ? '-' : Number(valor).toLocaleString('pt-BR');
}

function formatarData(valor) {
  if (!valor) return '-';
  return String(valor).replace('T', ' ').slice(0, 19);
}

customElements.define('fundamentos-card', FundamentosCard);
