import { BaseComponent } from './base/BaseComponent.js';
import { buscarBacktest } from '../api/validacaoApi.js';
import { linhasLadoALado, nomeDaVersao, resumoDasCompras } from '../analise/backtest.js';
import {
  formatarIcPercentual,
  formatarPercentual,
  formatarTaxa,
  formatarTaxaComIc,
  leituraDoPlacar,
} from '../analise/diarioDeSinais.js';
import { formatarData } from './ComunicadoItem.js';
import { escaparHtml } from '../utils/html.js';
import './LoadingSpinner.js';

// Unica responsabilidade: mostrar o ultimo backtest walk-forward - v1
// (oficial) contra v2 (sombra), no periodo de teste congelado e no de
// calibracao. Dados de /validacao/backtest (infra#CTR-14); leitura em
// analise/backtest.js.

const ROTULO = {
  SINAL_POSITIVO_FORTE: 'Sinal positivo forte',
  SINAL_POSITIVO: 'Sinal positivo',
  SEM_MARGEM: 'Sem margem',
  NEUTRO: 'Neutro',
  COMPRA_FORTE: 'Compra forte',
  COMPRA_MODERADA: 'Compra moderada',
  VENDA_VALUATION: 'Venda (valuation)',
  MANTER: 'Manter',
  ALERTA_RISCO: 'Alerta de risco',
};
const CLASSE_DIRECAO = { 1: 'text-bg-success', '-1': 'text-bg-danger', 0: 'text-bg-light border' };

export class BacktestPlacar extends BaseComponent {
  template() {
    return '<div id="backtest-conteudo"><loading-spinner></loading-spinner></div>';
  }

  async afterRender() {
    this._horizonte = 63;
    this.addEventListener('change', (evento) => {
      if (evento.target.id !== 'backtest-horizonte') return;
      this._horizonte = Number(evento.target.value);
      this.desenhar();
    });
    try {
      this._dados = await buscarBacktest();
    } catch (erro) {
      this.querySelector('#backtest-conteudo').innerHTML = `<div class="alert alert-secondary small mb-0">
        Não foi possível carregar o backtest agora (${escaparHtml(erro.message)}).</div>`;
      return;
    }
    this.desenhar();
  }

  desenhar() {
    const area = this.querySelector('#backtest-conteudo');
    const dados = this._dados;
    if (!dados.execucao) {
      area.innerHTML = `<div class="alert alert-info small mb-0">Nenhum backtest rodou ainda.
        Rode <code>python -m app.validacao.backtest</code> no gerar-insights depois de carregar o COTAHIST.</div>`;
      return;
    }
    const e = dados.execucao;
    const versoes = (e.parametros && e.parametros.versoes) || [];
    const h = this._horizonte;
    area.innerHTML = `
      <div class="row row-cols-2 row-cols-md-4 g-2 mb-2">
        ${cartao(`${formatarData(e.inicioPeriodo)} – ${formatarData(e.fimPeriodo)}`, 'período dos sinais')}
        ${cartao(formatarData(e.corteCalibracao), 'fim da calibração; depois é teste')}
        ${cartao(e.ativos, 'ativos')}
        ${cartao(e.sinais.toLocaleString('pt-BR'), 'sinais mensais')}
      </div>
      <div class="d-flex align-items-center gap-2 my-2">
        <label for="backtest-horizonte" class="small text-muted mb-0">Horizonte</label>
        <select id="backtest-horizonte" class="form-select form-select-sm" style="width:auto">
          ${[21, 63, 126].map((x) => `<option value="${x}" ${x === h ? 'selected' : ''}>${x} pregões</option>`).join('')}
        </select>
      </div>
      ${renderResumo(dados.placar, versoes, h)}
      <h6 class="mt-3">Período de teste (congelado) — o que vale</h6>
      ${renderTabela(dados.placar, 'TESTE', h, versoes)}
      <details class="mt-2">
        <summary class="small">Período de calibração (visto ao ajustar as regras)</summary>
        ${renderTabela(dados.placar, 'CALIBRACAO', h, versoes)}
      </details>
      <p class="small text-muted mt-2 mb-1" style="white-space: pre-line">${escaparHtml(e.observacoes || '')}</p>
      ${renderProventos(dados.placar)}
      ${renderNotaIntervalo(dados.placar)}
      <p class="small text-muted mb-0">${escaparHtml(dados.aviso)}</p>
    `;
  }
}

/**
 * Quanto do placar tem retorno com proventos (infra#TASK-36). A B3 devolve so
 * os ~12 meses anteriores a cada consulta (coleta desde 2026-09-27): janela
 * mais antiga sem ajuste e, quase sempre, falta de dado.
 */
function renderProventos(placar) {
  const total = placar.reduce((s, l) => s + l.avaliados, 0);
  const comProvento = placar.reduce((s, l) => s + (l.janelasComProvento || 0), 0);
  const fracao = total ? ((comProvento / total) * 100).toFixed(1).replace('.', ',') : '0';
  return `<p class="small text-muted mb-1">Proventos no retorno: ${comProvento} de ${total} janelas (${fracao}%).
    A fonte (B3) só devolve os proventos dos ~12 meses anteriores à coleta; nas janelas mais antigas o
    preço é bruto, e pagadoras de dividendo aparecem piores do que são.</p>`;
}

/**
 * Qual intervalo o placar mostra (infra#TASK-31): o bootstrap em blocos de
 * meses respeita que ativos do mesmo mes andam juntos e que meses vizinhos se
 * sobrepoem; o analitico (backtest antigo) supoe janelas independentes.
 */
function renderNotaIntervalo(placar) {
  const blocos = placar.some((l) => l.metodoIntervalo === 'BOOTSTRAP_BLOCOS');
  return blocos
    ? `<p class="small text-muted mb-1">Entre parênteses, o intervalo de 95% por bootstrap em blocos de
        meses: reamostra meses inteiros, em sequências do tamanho do horizonte, porque ativos do mesmo mês
        andam juntos e janelas vizinhas se sobrepõem. É mais largo e mais honesto que tratar cada janela
        como independente.</p>`
    : `<p class="small text-muted mb-1">Entre parênteses, o intervalo de 95%. Ele supõe janelas
        independentes; como os sinais são mensais com horizonte de até 6 meses e os ativos andam juntos,
        o intervalo real é mais largo. Trate "acima da base" como indício, não prova.</p>`;
}

function cartao(valor, rotulo) {
  return `<div class="col"><div class="border rounded p-2 h-100">
    <div class="fw-semibold">${valor}</div><div class="small text-muted">${rotulo}</div></div></div>`;
}

function renderResumo(placar, versoes, h) {
  const linha = (versao) => {
    const r = resumoDasCompras(placar, versao, 'TESTE', h);
    if (!r) return '';
    return `<tr><td>${escaparHtml(nomeDaVersao(versao, versoes))}</td><td class="text-end">${r.n}</td>
      <td class="text-end text-nowrap">${formatarTaxaComIc(r.taxaAcerto, r.icAcerto)}</td><td class="text-end text-muted">${formatarTaxa(r.taxaBase)}</td>
      <td class="text-end">${formatarPercentual(r.excessoCdi)}</td><td class="text-end">${formatarPercentual(r.excessoCarteira)}
        <div class="text-muted text-nowrap" style="font-size:.75em">${formatarIcPercentual(r.icExcessoCarteira)}</div></td></tr>`;
  };
  return `
    <div class="card border-primary-subtle"><div class="card-body py-2">
      <div class="small fw-semibold mb-1">Quando a regra manda comprar (teste, ${h} pregões)</div>
      <div class="table-responsive"><table class="table table-sm small mb-0">
        <thead><tr><th>Regra</th><th class="text-end">janelas</th><th class="text-end">acerto</th>
          <th class="text-end">taxa-base</th><th class="text-end">excesso s/ CDI</th><th class="text-end">excesso s/ carteira</th></tr></thead>
        <tbody>${versoes.map(linha).join('')}</tbody>
      </table></div>
    </div></div>`;
}

function renderTabela(placar, periodo, h, versoes) {
  const grupos = linhasLadoALado(placar, periodo, h);
  if (!grupos.length) return '<p class="small text-muted">Sem janelas neste período.</p>';
  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle small mb-0">
        <thead><tr><th>Recomendação</th><th>Regra</th><th class="text-end">n</th><th class="text-end">Acerto</th>
          <th class="text-end">Taxa-base</th><th>Leitura</th><th class="text-end">Retorno médio</th>
          <th class="text-end">Excesso s/ CDI</th><th class="text-end">Excesso s/ carteira</th></tr></thead>
        <tbody>
          ${grupos.map((g) => g.linhas.map((l, i) => {
            const leitura = leituraDoPlacar(l);
            return `<tr>
              ${i === 0 ? `<td rowspan="${g.linhas.length}"><span class="badge ${CLASSE_DIRECAO[l.direcao]}">${escaparHtml(ROTULO[l.recomendacao] || l.recomendacao)}</span></td>` : ''}
              <td class="text-nowrap">${escaparHtml(nomeDaVersao(l.versaoRegra, versoes))}</td>
              <td class="text-end" title="${l.janelasComProvento || 0} janela(s) com retorno ajustado por provento">${l.avaliados}${l.janelasComProvento ? `<div class="text-muted" style="font-size:.75em">${l.janelasComProvento} c/ provento</div>` : ''}</td>
              <td class="text-end text-nowrap">${formatarTaxaComIc(l.taxaAcerto, l.icAcerto)}</td>
              <td class="text-end text-muted">${formatarTaxa(l.taxaBase)}</td>
              <td><span class="badge ${leitura.classe}">${leitura.rotulo}</span></td>
              <td class="text-end">${formatarPercentual(l.retornoMedio)}</td>
              <td class="text-end">${formatarPercentual(l.excessoMedioCdi)}</td>
              <td class="text-end">${formatarPercentual(l.excessoMedioCarteira)}
                <div class="text-muted text-nowrap" style="font-size:.75em">${formatarIcPercentual(l.icExcessoCarteira)}</div></td>
            </tr>`;
          }).join('')).join('')}
        </tbody>
      </table>
    </div>`;
}

customElements.define('backtest-placar', BacktestPlacar);
