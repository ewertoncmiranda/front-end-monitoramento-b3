import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarOpcoes, buscarSaudeOpcoes } from '../api/opcoesApi.js';
import { buscarFundamentos, buscarFundamentosCvm } from '../api/analisesApi.js';
import { buscarPregoes } from '../api/pregoesApi.js';
import { escaparHtml } from '../utils/html.js';
import '../components/OpcoesPainel.js';
import '../components/SeletorDeAtivos.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';
import '../components/SaudeCadeiaOpcoes.js';

// Extrai o ativo do hash: #/opcoes/PETR4 ou #/opcoes?ativo=PETR4
function ativoDoHash() {
  const [caminho, consulta = ''] = window.location.hash.split('?');
  const doCaminho = decodeURIComponent(caminho.replace(/^#\/opcoes\/?/, ''));
  return (doCaminho || new URLSearchParams(consulta).get('ativo') || '').trim().toUpperCase();
}

// Data de 90 dias atras (≈ 63 pregoes) em AAAA-MM-DD.
function _data90dAtras() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

// Constroi o contexto do ativo-objeto a partir dos dados enriquecidos.
// Nunca lanca excecao — campos ausentes ficam null.
function _montarContexto(fundamentos, cvm, pregoes) {
  const velas = pregoes?.velas || [];
  const resumo = pregoes?.resumo;

  const precoAtual = Number(resumo?.fechamento ?? cvm?.preco_referencia ?? 0) || null;
  const variacaoDia = _calcVarDia(velas);
  const max63d = Number(resumo?.maxima) || null;
  const min63d = Number(resumo?.minima) || null;
  const posicaoRange = (precoAtual && max63d && min63d && max63d !== min63d)
    ? (precoAtual - min63d) / (max63d - min63d)
    : null;

  const lpa = Number(cvm?.lpa) || null;
  const vpa = Number(cvm?.vpa) || null;
  const pl = Number(cvm?.preco_lucro) || null;
  // Graham Number = sqrt(22.5 × LPA × VPA) quando ambos positivos; fallback ao preco_justo_graham do gerar-insights.
  const graham = (lpa > 0 && vpa > 0)
    ? Math.sqrt(22.5 * lpa * vpa)
    : (fundamentos?.precoJustoGraham ? Number(fundamentos.precoJustoGraham) : null);

  const recomendacao = fundamentos?.recomendacao || null;
  const margem = fundamentos?.margemSegurancaPercent != null
    ? Number(fundamentos.margemSegurancaPercent) : null;

  const vol21d = _calcVol21d(velas);

  return { precoAtual, variacaoDia, max63d, min63d, posicaoRange, lpa, vpa, pl, graham, recomendacao, margem, vol21d };
}

function _calcVarDia(velas) {
  if (velas.length < 2) return null;
  const ult = Number(velas[velas.length - 1].fechamento);
  const ant = Number(velas[velas.length - 2].fechamento);
  if (!ult || !ant) return null;
  return (ult - ant) / ant;
}

function _calcVol21d(velas) {
  const closes = velas.slice(-22).map((v) => Number(v.fechamento)).filter((x) => x > 0);
  if (closes.length < 5) return null;
  const logRets = [];
  for (let i = 1; i < closes.length; i++) logRets.push(Math.log(closes[i] / closes[i - 1]));
  const mean = logRets.reduce((a, b) => a + b, 0) / logRets.length;
  const variance = logRets.reduce((s, r) => s + (r - mean) ** 2, 0) / (logRets.length - 1);
  return Math.sqrt(variance * 252);
}

// Unica responsabilidade: painel de opcoes de um ativo.
// Rota #/opcoes/PETR4 ou #/opcoes?ativo=PETR4.
// Enriquece com precoAtual (moneyness real), range 63d, vol21d, Graham e recomendacao.
export class OpcaoPage extends BaseComponent {
  template() {
    return `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 class="mb-0">Painel de opções</h4>
      </div>
      <seletor-de-ativos rotulo-botao="Ver opções" placeholder="Ex.: PETR4"></seletor-de-ativos>
      <div id="opcao-saude" class="mt-3"><loading-spinner></loading-spinner></div>
      <div id="opcao-resultado" class="mt-3"></div>
    `;
  }

  afterRender() {
    const seletor = this.querySelector('seletor-de-ativos');
    seletor.addEventListener('ativo-buscado', (e) => this._abrir(e.detail.simbolo));

    this._carregarSaude();

    const inicial = ativoDoHash();
    if (inicial) seletor.selecionar(inicial);
  }

  async _carregarSaude() {
    const alvo = this.querySelector('#opcao-saude');
    try {
      const dados = await buscarSaudeOpcoes();
      alvo.innerHTML = '<saude-cadeia-opcoes></saude-cadeia-opcoes>';
      alvo.querySelector('saude-cadeia-opcoes').setDados(dados);
    } catch (erro) {
      alvo.innerHTML = `<status-alert variante="danger" mensagem="${escaparHtml(erro.message)}"></status-alert>`;
    }
  }

  async _abrir(simbolo) {
    this._simbolo = simbolo;
    const resultado = this.querySelector('#opcao-resultado');
    resultado.innerHTML = '<loading-spinner></loading-spinner>';
    history.replaceState(null, '', `#/opcoes/${encodeURIComponent(simbolo)}`);

    try {
      // Busca paralela: opcoes (obrigatório) + 3 enriquecedores (degradam graciosamente).
      const [dadosR, fundR, cvmR, pregoesR] = await Promise.allSettled([
        buscarOpcoes(simbolo),
        buscarFundamentos(simbolo),
        buscarFundamentosCvm(simbolo),
        buscarPregoes(simbolo, { de: _data90dAtras(), intervalo: 'dia' }),
      ]);

      if (dadosR.status === 'rejected') throw dadosR.reason;
      const dados = dadosR.value;
      const fundamentos = fundR.status === 'fulfilled' ? fundR.value : null;
      const cvm       = cvmR.status === 'fulfilled'   ? cvmR.value   : null;
      const pregoes   = pregoesR.status === 'fulfilled' ? pregoesR.value : null;

      this._contexto = _montarContexto(fundamentos, cvm, pregoes);
      this._renderizar(resultado, simbolo, { ...dados, contexto: this._contexto }, null);
    } catch (erro) {
      resultado.innerHTML = `<status-alert variante="danger" mensagem="${escaparHtml(erro.message)}"></status-alert>`;
    }
  }

  _renderizar(resultado, simbolo, dados, vencimentoAtual) {
    const vencimentos = dados.vencimentos || [];
    const opcoes = vencimentos.map((v) => {
      const ano = v.slice(0, 4);
      const mes = v.slice(4, 6);
      const rotulo = new Date(`${ano}-${mes}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const sel = v === vencimentoAtual ? 'selected' : '';
      return `<option value="${escaparHtml(v)}" ${sel}>${rotulo}</option>`;
    }).join('');

    resultado.innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <span class="fw-semibold">${escaparHtml(dados.simboloCanonico || dados.simbolo || simbolo)}</span>
        ${dados.aliasAplicado ? `<span class="badge text-bg-info">solicitado: ${escaparHtml(dados.simboloSolicitado || simbolo)}</span>` : ''}
        ${vencimentos.length > 0 ? `
          <label class="small text-muted mb-0" for="opcao-vencimento">Vencimento:</label>
          <select class="form-select form-select-sm w-auto" id="opcao-vencimento">
            <option value="">Mais próximo</option>
            ${opcoes}
          </select>` : ''}
      </div>
      <opcoes-painel></opcoes-painel>
    `;

    const painel = resultado.querySelector('opcoes-painel');
    painel.setDados(dados);

    const sel = resultado.querySelector('#opcao-vencimento');
    if (sel) {
      sel.addEventListener('change', async () => {
        painel.innerHTML = '<loading-spinner></loading-spinner>';
        try {
          const novos = await buscarOpcoes(simbolo, sel.value || undefined);
          // preserva o contexto ja carregado para nao rebuscar pregoes/fundamentos
          painel.setDados({ ...novos, contexto: this._contexto });
        } catch (erro) {
          painel.innerHTML = `<status-alert variante="danger" mensagem="${escaparHtml(erro.message)}"></status-alert>`;
        }
      });
    }
  }
}

customElements.define('opcao-page', OpcaoPage);
