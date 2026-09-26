import { BaseComponent } from './base/BaseComponent.js';
import { buscarDiarioDeSinais } from '../api/validacaoApi.js';
import {
  agruparPorPregao,
  estadoDoHorizonte,
  formatarPercentual,
  formatarTaxa,
  leituraDoPlacar,
} from '../analise/diarioDeSinais.js';
import { formatarData } from './ComunicadoItem.js';
import { escaparHtml } from '../utils/html.js';
import './LoadingSpinner.js';

// Unica responsabilidade: mostrar o diario de sinais (paper trading) - a
// evidencia em tempo real de quanto as regras acertam. Tres blocos: estado,
// placar (recomendacao x horizonte, acerto sempre ao lado da taxa-base) e
// linha do tempo por pregao. Os dados vem de /validacao/diario
// (infra#CTR-11); a regra de leitura fica em analise/diarioDeSinais.js.

const ROTULO = {
  COMPRA_FORTE: 'Compra forte',
  COMPRA_MODERADA: 'Compra moderada',
  COMPRA_TECNICA: 'Compra técnica',
  VENDA_VALUATION: 'Venda (valuation)',
  VENDA_TECNICA: 'Venda técnica',
  MANTER: 'Manter',
  ALERTA_RISCO: 'Alerta de risco',
};

const CLASSE_DIRECAO = { 1: 'text-bg-success', '-1': 'text-bg-danger', 0: 'text-bg-light border' };

export class DiarioDeSinais extends BaseComponent {
  template() {
    return '<div id="diario-conteudo"><loading-spinner></loading-spinner></div>';
  }

  afterRender() {
    this._simbolo = '';
    this.addEventListener('change', (evento) => {
      if (evento.target.id !== 'diario-filtro') return;
      this._simbolo = evento.target.value;
      this.carregar();
    });
    this.carregar();
  }

  async carregar() {
    const area = this.querySelector('#diario-conteudo');
    let dados;
    try {
      dados = await buscarDiarioDeSinais({ simbolo: this._simbolo || undefined, limite: 200 });
    } catch (erro) {
      area.innerHTML = `<div class="alert alert-secondary small mb-0">
        Não foi possível carregar o diário agora (${escaparHtml(erro.message)}).</div>`;
      return;
    }
    area.innerHTML = this.renderizar(dados);
  }

  renderizar(dados) {
    if (!dados.totalSinais && !this._simbolo) {
      return renderVazio(dados);
    }
    return `
      ${renderEstado(dados)}
      <div class="d-flex align-items-center gap-2 my-3">
        <label for="diario-filtro" class="small text-muted mb-0">Ativo</label>
        <select id="diario-filtro" class="form-select form-select-sm" style="width:auto">
          <option value="">Todos</option>
          ${(dados.simbolosDisponiveis || []).map((s) =>
            `<option value="${escaparHtml(s)}" ${s === this._simbolo ? 'selected' : ''}>${escaparHtml(s)}</option>`).join('')}
        </select>
      </div>
      <h6 class="mt-2">Placar por recomendação e horizonte</h6>
      ${renderPlacar(dados)}
      <h6 class="mt-4">Linha do tempo dos sinais</h6>
      ${renderLinhaDoTempo(dados)}
      <p class="small text-muted mt-2 mb-0">${escaparHtml(dados.aviso || '')}</p>
    `;
  }
}

function renderVazio(dados) {
  return `
    <div class="alert alert-info mb-0">
      <strong>Nenhum sinal registrado ainda.</strong> O diário grava, depois de cada pregão, o
      sinal de cada ativo com a versão da regra que o gerou — antes de o resultado existir.
      <ul class="small mb-0 mt-2">
        <li>Primeiro registro: o próximo pregão, pela rotina diária (dias úteis, 19h).</li>
        <li>Primeiros resultados: ${Math.min(...dados.horizontes)} pregões depois (~1 mês).</li>
        <li>Placar com amostra mínima (${dados.amostraMinima} avaliações por linha): semanas para
          as recomendações comuns; as raras, como compra forte, levam meses.</li>
      </ul>
    </div>
  `;
}

function renderEstado(dados) {
  const cartao = (valor, rotulo) => `
    <div class="col"><div class="border rounded p-2 h-100">
      <div class="fs-5 fw-semibold">${valor}</div><div class="small text-muted">${rotulo}</div>
    </div></div>`;
  return `
    <div class="row row-cols-2 row-cols-md-4 g-2">
      ${cartao(dados.totalSinais, `sinais de ${dados.totalAtivos} ativo(s)`)}
      ${cartao(dados.primeiroPregao ? formatarData(dados.primeiroPregao) : '—', 'primeiro pregão')}
      ${cartao(dados.horizontesAvaliados, 'horizontes avaliados')}
      ${cartao(dados.horizontesPendentes, 'horizontes pendentes')}
    </div>
  `;
}

function renderPlacar(dados) {
  if (!dados.placar || dados.placar.length === 0) {
    return `<p class="small text-muted">Nenhum horizonte venceu ainda: o mais curto fecha
      ${Math.min(...dados.horizontes)} pregões depois do sinal.</p>`;
  }
  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle small">
        <thead><tr>
          <th>Recomendação</th><th>Horizonte</th><th class="text-end">n</th>
          <th class="text-end">Acerto</th><th class="text-end">Taxa-base</th>
          <th class="text-end">Excesso s/ CDI</th><th class="text-end">Excesso s/ BOVA11</th>
          <th>Leitura</th><th>Regra</th>
        </tr></thead>
        <tbody>
          ${dados.placar.map((l) => {
            const leitura = leituraDoPlacar(l);
            return `<tr>
              <td><span class="badge ${CLASSE_DIRECAO[l.direcao]}">${escaparHtml(ROTULO[l.recomendacao] || l.recomendacao)}</span></td>
              <td>${l.horizonte} pregões</td>
              <td class="text-end">${l.avaliados}</td>
              <td class="text-end">${formatarTaxa(l.taxaAcerto)}</td>
              <td class="text-end text-muted">${formatarTaxa(l.taxaBase)}</td>
              <td class="text-end">${formatarPercentual(l.excessoMedioCdi)}</td>
              <td class="text-end">${formatarPercentual(l.excessoMedioBova11)}</td>
              <td><span class="badge ${leitura.classe}">${leitura.rotulo}</span></td>
              <td class="text-muted">${escaparHtml(l.versaoRegra)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="small text-muted mb-0">
      Acerto só informa comparado com a taxa-base: se a maioria das janelas subiu, uma compra que
      acerta na mesma proporção não acrescenta nada. Janelas com provável desdobramento ficam fora.
    </p>
  `;
}

function renderLinhaDoTempo(dados) {
  const blocos = agruparPorPregao(dados.linhaDoTempo);
  if (blocos.length === 0) {
    return '<p class="small text-muted">Nenhum sinal para este filtro.</p>';
  }
  return `
    <div class="d-flex flex-column gap-2">
      ${blocos.map((bloco) => `
        <div class="border rounded p-2">
          <div class="small fw-semibold mb-2">${formatarData(bloco.dataPregao)}
            <span class="text-muted fw-normal">· ${bloco.sinais.length} sinal(is)</span></div>
          <div class="d-flex flex-wrap gap-2">
            ${bloco.sinais.map((s) => renderSinal(s, dados.horizontes)).join('')}
          </div>
        </div>`).join('')}
    </div>
    <p class="small text-muted mt-2 mb-0">
      ⏳ pendente · ✓ acertou · ✗ errou · ○ sem direção (só o retorno) · ⚠ provável desdobramento.
      Retorno líquido, entrando na abertura do pregão seguinte.
    </p>
  `;
}

const ICONE = { pendente: '⏳', acerto: '✓', erro: '✗', neutro: '○', suspeito: '⚠' };
const COR = { acerto: 'text-success', erro: 'text-danger', neutro: 'text-muted', suspeito: 'text-warning', pendente: 'text-muted' };

function renderSinal(sinal, horizontes) {
  const marcas = horizontes.map((h) => {
    const { estado, retorno } = estadoDoHorizonte(sinal, h);
    const texto = estado === 'pendente' ? '' : ` ${formatarPercentual(retorno)}`;
    return `<span class="${COR[estado]}" title="${h} pregões: ${estado}">${h}${ICONE[estado]}${texto}</span>`;
  }).join(' ');

  return `
    <div class="border rounded px-2 py-1 small" title="Regra ${escaparHtml(sinal.versaoRegra)}">
      <div class="d-flex align-items-center gap-1">
        <strong>${escaparHtml(sinal.simbolo)}</strong>
        <span class="badge ${CLASSE_DIRECAO[sinal.direcao]}">${escaparHtml(ROTULO[sinal.recomendacao] || sinal.recomendacao)}</span>
      </div>
      <div class="text-nowrap">${marcas}</div>
    </div>
  `;
}

customElements.define('diario-de-sinais', DiarioDeSinais);
