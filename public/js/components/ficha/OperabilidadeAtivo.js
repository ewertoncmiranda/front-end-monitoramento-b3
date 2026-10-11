import { BaseComponent } from '../base/BaseComponent.js';
import { buscarOperacoes } from '../../api/operacionalApi.js';
import { buscarConsenso, buscarSnapshot, buscarTese, buscarTimeline } from '../../api/operacionalV2Api.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { AVISO_SIMULACAO, STATUS, statusDe } from '../../analise/operabilidade.js';
import { htmlCarteira } from '../operacional/CarteiraSimulada.js';
import { htmlConsenso } from '../operacional/ConsensoSinais.js';
import { htmlTese } from '../operacional/TeseExplicada.js';
import { htmlListaTimeline, htmlTimeline } from '../operacional/TimelineAtivo.js';

const SEM = 'sem dado';

function listaMotivos(snapshot) {
  const itens = snapshot.motivosBloqueio || snapshot.bloqueios || snapshot.motivos || [];
  return itens.length ? `<ul class="small mb-0">${itens.map((m) => `<li>${escaparHtml(m.descricao || m.detalhe || m.codigo || m)}</li>`).join('')}</ul>` : '';
}

export function htmlSnapshot(snapshot) {
  if (!snapshot || snapshot.indisponivel) {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Elegibilidade operacional</p><p class="small text-muted mb-0">Snapshot operacional V2 ainda indisponível.</p></section>';
  }
  const dados = { ...(snapshot.payload || {}), ...snapshot };
  const status = statusDe(dados.statusOperacional || dados.statusSistema);
  const definicao = STATUS[status];
  const elegivel = dados.elegivel === true || status === 'PAPER_TRADING_ELEGIVEL';
  return `<section class="ficha-cartao">
    <div class="d-flex flex-wrap justify-content-between gap-2"><div><p class="ficha-rotulo mb-1">Elegibilidade operacional</p>
      <span class="badge ${definicao.classe}">${escaparHtml(definicao.rotulo)}</span>
      ${dados.faixaLiquidez ? `<span class="badge text-bg-light border ms-1">Liquidez ${escaparHtml(dados.faixaLiquidez)}</span>` : ''}</div>
      <span class="small text-muted">${escaparHtml(formatarData(dados.dataPregao, SEM))}</span></div>
    <p class="small mt-2 mb-1">${elegivel ? 'Elegível apenas para a carteira simulada.' : 'Não elegível para nova posição simulada neste pregão.'}</p>
    ${listaMotivos(dados)}
    <div class="row g-2 mt-1">
      <div class="col-6 col-md-3"><span class="small text-muted d-block">Tamanho teórico</span><strong>${escaparHtml(formatarMoeda(dados.tamanhoTeorico ?? dados.valorPosicao, SEM))}</strong></div>
      <div class="col-6 col-md-3"><span class="small text-muted d-block">Stop</span><strong>${escaparHtml(formatarMoeda(dados.stop ?? dados.stopInicial, SEM))}</strong></div>
      <div class="col-6 col-md-3"><span class="small text-muted d-block">Custos estimados</span><strong>${escaparHtml(formatarMoeda(dados.custosEstimados, SEM))}</strong></div>
      <div class="col-6 col-md-3"><span class="small text-muted d-block">Risco estimado</span><strong>${escaparHtml(formatarPercentual(dados.riscoEstimado, 2, { vazio: SEM }))}</strong></div>
    </div>
    <p class="small mt-2 mb-0"><strong>Regra de saída:</strong> ${escaparHtml(dados.regraSaida || SEM)}</p>
  </section>`;
}

export function htmlOperabilidadeAtivo({ simbolo, snapshot, consenso, tese, timeline, operacoes }, filtro = {}) {
  return `<div class="d-flex flex-column gap-3">
    <div class="alert alert-warning small py-2 mb-0" role="note">${escaparHtml(AVISO_SIMULACAO)}</div>
    ${htmlSnapshot(snapshot)}
    ${htmlConsenso(consenso)}
    ${htmlTese(tese)}
    ${htmlCarteira((operacoes?.itens || []).filter((o) => String(o.simbolo).toUpperCase() === String(simbolo).toUpperCase()))}
    ${htmlTimeline(timeline, filtro)}
  </div>`;
}

export class OperabilidadeAtivo extends BaseComponent {
  template() { return '<p class="small text-muted">Carregando operabilidade do ativo…</p>'; }

  async afterRender() {
    const simbolo = String(this.getAttribute('simbolo') || '').toUpperCase();
    if (!simbolo) return;
    try {
      const [snapshot, consenso, tese, timeline, operacoes] = await Promise.all([
        buscarSnapshot(simbolo), buscarConsenso(simbolo), buscarTese(simbolo), buscarTimeline(simbolo),
        buscarOperacoes({ simbolo }).catch(() => ({ itens: [] })),
      ]);
      if (!this.isConnected) return;
      this._dados = { simbolo, snapshot, consenso, tese, timeline, operacoes };
      this._filtro = { tipo: '', severidade: '' };
      this.innerHTML = htmlOperabilidadeAtivo(this._dados, this._filtro);
      this._ligarTimeline();
    } catch (erro) {
      this.innerHTML = `<p class="small text-danger">Não foi possível carregar a operabilidade: ${escaparHtml(erro?.message || 'erro')}</p>`;
    }
  }

  _ligarTimeline() {
    const atualizar = () => {
      const alvo = this.querySelector('[data-timeline-lista]');
      if (alvo) alvo.innerHTML = htmlListaTimeline(this._dados.timeline?.itens, this._filtro);
    };
    this.querySelector('[data-timeline-tipo]')?.addEventListener('change', (e) => { this._filtro.tipo = e.target.value; atualizar(); });
    this.querySelector('[data-timeline-severidade]')?.addEventListener('change', (e) => { this._filtro.severidade = e.target.value; atualizar(); });
  }
}

customElements.define('operabilidade-ativo', OperabilidadeAtivo);
