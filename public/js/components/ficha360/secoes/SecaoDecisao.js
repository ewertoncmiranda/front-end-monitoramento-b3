import { BaseComponent } from '../../base/BaseComponent.js';
import { montarPlano } from '../../../analise/ficha360/planoDeOperacao.js';
import { escaparHtml } from '../../../utils/html.js';
import { htmlAvisosPlano } from '../../../analise/ficha360/datasEx.js';

/**
 * F360-PAI-3: Seção Decisão - plano de operação e faixa de decisão
 * Exibe ação, força, entrada, alvo, stop, R/R, horizonte e taxa de acerto.
 * Emite evento f360:plano quando o plano estiver pronto.
 */
export class SecaoDecisao extends BaseComponent {
  constructor() {
    super();
    this.contexto = null;
    this.plano = null;
    this.carregando = false;
    this.erro = null;
  }

  set contexto(ctx) {
    this._contexto = ctx;
    this.carregarPlano();
  }

  get contexto() {
    return this._contexto;
  }

  async carregarPlano() {
    if (!this.contexto) return;
    
    this.carregando = true;
    this.erro = null;
    this.render();

    try {
      const [analise, fundamentosCvm, pregoes, backtest, opiniao, datasEx] = await Promise.all([
        this.contexto.obter('analise'),
        this.contexto.obter('fundamentosCvm'),
        this.contexto.obter('pregoes'),
        this.contexto.obter('backtest'),
        this.contexto.obter('opiniao'),
        this.contexto.obter('datasEx'),
      ]);

      this.plano = montarPlano({
        analise,
        fundamentosCvm,
        pregoes,
        backtest,
        opiniao,
        datasEx,
      });

      // Emitir evento f360:plano
      document.dispatchEvent(new CustomEvent('f360:plano', {
        detail: {
          simbolo: this.contexto.simbolo,
          acao: this.plano.acao,
          forca: this.plano.forca,
          entrada: this.plano.entrada,
          alvo: this.plano.alvo,
          stop: this.plano.stop,
          rr: this.plano.rr,
        },
      }));
    } catch (e) {
      console.error('Erro ao carregar plano de operação:', e);
      this.erro = e.message || 'Erro ao carregar plano';
    } finally {
      this.carregando = false;
      this.render();
    }
  }

  template() {
    if (this.carregando) {
      return `
        <div class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span class="ms-2 text-muted">Carregando plano...</span>
        </div>
      `;
    }

    if (this.erro) {
      return `
        <div class="alert alert-danger">
          ${escaparHtml(this.erro)}
        </div>
      `;
    }

    if (!this.plano) {
      return `
        <div class="text-center py-4 text-muted">
          Plano indisponível
        </div>
      `;
    }

    return this.renderPlano();
  }

  renderPlano() {
    const { acao, forca, entrada, alvo, stop, rr, upside_pct, horizonte, taxa_acerto, motivos } = this.plano;

    // Determinar cor e ícone baseado na ação
    let corVar = 'var(--f360-manter)';
    let icone = '■';
    
    if (acao === 'COMPRAR') {
      corVar = forca === 2 ? 'var(--f360-compra-forte)' : 'var(--f360-compra)';
      icone = '▲';
    } else if (acao === 'VENDER') {
      corVar = 'var(--f360-venda)';
      icone = '▼';
    }

    const entradaStr = entrada 
      ? `R$ ${entrada.min.toFixed(2)} - R$ ${entrada.max.toFixed(2)}`
      : '—';
    const alvoStr = alvo != null ? `R$ ${alvo.toFixed(2)}` : '—';
    const stopStr = stop != null ? `R$ ${stop.toFixed(2)}` : '—';
    const rrStr = rr != null ? rr.toFixed(2) : '—';
    const upsideStr = upside_pct != null ? `${upside_pct.toFixed(1)}%` : '—';
    const horizonteStr = horizonte ? escaparHtml(horizonte) : '—';
    const taxaAcertoStr = taxa_acerto != null ? `${(taxa_acerto * 100).toFixed(1)}%` : '—';

    return `
      <div class="card border-0" style="background-color: var(--f360-superficie-2);">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="d-flex align-items-center gap-2">
              <span style="color: ${corVar}; font-size: 1.5rem; font-weight: bold;">${icone}</span>
              <span style="color: ${corVar}; font-size: 1.25rem; font-weight: bold;">${acao}</span>
              ${forca > 0 ? `<span class="badge" style="background-color: ${corVar}; color: white;">Força ${forca}</span>` : ''}
            </div>
            ${taxa_acerto != null ? `
              <div class="text-end">
                <small class="text-muted d-block">Taxa de acerto</small>
                <strong>${taxaAcertoStr}</strong>
              </div>
            ` : ''}
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6 col-md-3">
              <small class="text-muted d-block">Entrada</small>
              <strong>${entradaStr}</strong>
            </div>
            <div class="col-6 col-md-3">
              <small class="text-muted d-block">Alvo (+%)</small>
              <strong>${alvoStr} <span class="text-muted small">(${upsideStr})</span></strong>
            </div>
            <div class="col-6 col-md-3">
              <small class="text-muted d-block">Stop (−%)</small>
              <strong style="color: var(--f360-venda);">${stopStr}</strong>
            </div>
            <div class="col-6 col-md-3">
              <small class="text-muted d-block">R/R</small>
              <strong>${rrStr}</strong>
            </div>
          </div>

          <div class="row g-2">
            <div class="col-6">
              <small class="text-muted d-block">Horizonte</small>
              <strong>${horizonteStr}</strong>
            </div>
            <div class="col-6">
              <small class="text-muted d-block">Relação risco/retorno</small>
              <strong>${rrStr}</strong>
            </div>
          </div>

          ${htmlAvisosPlano(this.plano)}

          ${motivos && motivos.length > 0 ? `
            <div class="mt-3 pt-3 border-top">
              <small class="text-muted">Motivos:</small>
              <ul class="mb-0 small text-muted ps-3">
                ${motivos.map(m => `<li>${escaparHtml(m)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('secao-decisao', SecaoDecisao);
