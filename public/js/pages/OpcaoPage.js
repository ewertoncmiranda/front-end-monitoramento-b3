import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarOpcoes, buscarSaudeOpcoes } from '../api/opcoesApi.js';
import { buscarFundamentos, buscarFundamentosCvm } from '../api/analisesApi.js';
import { buscarPregoes } from '../api/pregoesApi.js';
import { buscarProventosContabeis } from '../api/lacunasApi.js';
import { escaparHtml } from '../utils/html.js';
import '../components/OpcoesPainel.js';
import '../components/SeletorDeAtivos.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';
import '../components/SaudeCadeiaOpcoes.js';
import '../components/opcoes/AtivoContextoOpcoes.js';

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
function _montarContexto(fundamentos, cvm, pregoes, proventos) {
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
  const atr14 = _calcAtr14(velas);
  const volRelativo = _calcVolRelativo(velas);
  const saltos = (pregoes?.saltos || []).map((s) => ({
    data: s.data,
    variacao: s.variacao,
    fechamentoAnterior: s.fechamentoAnterior != null ? Number(s.fechamentoAnterior) : null,
    abertura: s.abertura != null ? Number(s.abertura) : null,
  }));
  const exDividendos = _extrairExDividendos(proventos);
  const dataMaxima = resumo?.dataMaxima || null;
  const dataMinima = resumo?.dataMinima || null;
  const variacaoPeriodo = resumo?.variacao != null ? Number(resumo.variacao) : null;
  const dataAnalise = fundamentos?.dataAnalise || null;

  const ticketMedio = _calcTicketMedio(velas);
  const amplitudeDia = _calcAmplitudeDia(velas);
  const retornoIntraday = _calcRetornoIntraday(velas);
  const gapAbertura = _calcGapAbertura(velas);
  const posicaoRangeDia = _calcPosicaoRangeDia(velas);
  const volumeContratos21d = _calcVolumeContratos21d(velas);
  const negocios21d = _calcNegocios21d(velas);

  return {
    precoAtual, variacaoDia, max63d, min63d, posicaoRange,
    lpa, vpa, pl, graham, recomendacao, margem,
    vol21d, atr14, volRelativo, saltos, exDividendos,
    ticketMedio, amplitudeDia, retornoIntraday, gapAbertura,
    posicaoRangeDia, volumeContratos21d, negocios21d,
    dataMaxima, dataMinima, variacaoPeriodo, dataAnalise,
  };
}

// ATR14 em R$: media do true range dos ultimos 14 pregoes.
function _calcAtr14(velas) {
  if (velas.length < 2) return null;
  const janela = velas.slice(-15);
  const trs = [];
  for (let i = 1; i < janela.length; i++) {
    const h = Number(janela[i].maxima), l = Number(janela[i].minima), c = Number(janela[i - 1].fechamento);
    if (!h || !l || !c) continue;
    trs.push(Math.max(h - l, Math.abs(h - c), Math.abs(l - c)));
  }
  if (trs.length < 5) return null;
  return trs.reduce((a, b) => a + b, 0) / trs.length;
}

// Volume relativo: volume financeiro do ultimo pregao / media dos 21 pregoes anteriores.
function _calcVolRelativo(velas) {
  if (velas.length < 5) return null;
  const ult = Number(velas[velas.length - 1].volumeFinanceiro ?? velas[velas.length - 1].volume ?? 0);
  if (!ult) return null;
  const prev = velas.slice(-22, -1).map((v) => Number(v.volumeFinanceiro ?? v.volume ?? 0)).filter((x) => x > 0);
  if (prev.length < 5) return null;
  const media = prev.reduce((a, b) => a + b, 0) / prev.length;
  return media > 0 ? ult / media : null;
}

// Extrai datas ex-dividendo futuras (ou recentes 30d) dos proventos contabeis.
function _extrairExDividendos(proventos) {
  if (!Array.isArray(proventos)) return [];
  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setDate(hoje.getDate() - 30);
  return proventos
    .filter((p) => p.data_ex && new Date(p.data_ex) >= limite)
    .map((p) => ({ data: p.data_ex, tipo: p.tipo_provento || p.tipo || '', valor: Number(p.valor_por_acao ?? 0) }))
    .sort((a, b) => a.data.localeCompare(b.data));
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

// Ticket médio = volume financeiro / número de negócios do último pregão.
function _calcTicketMedio(velas) {
  if (!velas.length) return null;
  const v = velas[velas.length - 1];
  const vf = Number(v.volumeFinanceiro ?? 0), neg = Number(v.numeroNegocios ?? 0);
  return vf > 0 && neg > 0 ? vf / neg : null;
}

// Amplitude intraday = (máxima − mínima) / fechamento.
function _calcAmplitudeDia(velas) {
  if (!velas.length) return null;
  const v = velas[velas.length - 1];
  const h = Number(v.maxima), l = Number(v.minima), c = Number(v.fechamento);
  return h && l && c ? (h - l) / c : null;
}

// Retorno intraday = (fechamento − abertura) / abertura.
function _calcRetornoIntraday(velas) {
  if (!velas.length) return null;
  const v = velas[velas.length - 1];
  const o = Number(v.abertura), c = Number(v.fechamento);
  return o > 0 && c > 0 ? (c - o) / o : null;
}

// Gap de abertura = (abertura[t] − fechamento[t−1]) / fechamento[t−1].
function _calcGapAbertura(velas) {
  if (velas.length < 2) return null;
  const prev = Number(velas[velas.length - 2].fechamento);
  const aber = Number(velas[velas.length - 1].abertura);
  return prev > 0 && aber > 0 ? (aber - prev) / prev : null;
}

// Posição no range do dia = (fechamento − mínima) / (máxima − mínima).
function _calcPosicaoRangeDia(velas) {
  if (!velas.length) return null;
  const v = velas[velas.length - 1];
  const h = Number(v.maxima), l = Number(v.minima), c = Number(v.fechamento);
  return h && l && c && h !== l ? (c - l) / (h - l) : null;
}

// Soma de contratos (QUATOT) nos últimos 21 pregões.
function _calcVolumeContratos21d(velas) {
  const vals = velas.slice(-21).map((v) => Number(v.volume ?? 0)).filter((x) => x > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}

// Soma de negócios (TOTNEG) nos últimos 21 pregões.
function _calcNegocios21d(velas) {
  const vals = velas.slice(-21).map((v) => Number(v.numeroNegocios ?? 0)).filter((x) => x > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}

// Unica responsabilidade: painel de opcoes de um ativo.
// Rota #/opcoes/PETR4 ou #/opcoes?ativo=PETR4.
// Enriquece com precoAtual (moneyness real), range 63d, vol21d, Graham e recomendacao.
// Layout (Plano OPCX): contexto do ativo na sidebar ao lado da cadeia; a saude
// da cadeia fica num <details> no rodape - aberto ate o usuario escolher um ativo.
export class OpcaoPage extends BaseComponent {
  template() {
    return `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 class="mb-0">Painel de opções</h4>
      </div>
      <seletor-de-ativos rotulo-botao="Ver opções" placeholder="Ex.: PETR4"></seletor-de-ativos>
      <div id="opcao-resultado" class="mt-3"></div>
      <details id="opcao-saude-detalhes" class="mt-4" open>
        <summary class="fw-semibold small">Saúde da cadeia de opções</summary>
        <div id="opcao-saude" class="mt-2"><loading-spinner></loading-spinner></div>
      </details>
    `;
  }

  afterRender() {
    const seletor = this.querySelector('seletor-de-ativos');
    seletor.addEventListener('ativo-buscado', (e) => this._abrir(e.detail.simbolo));

    this._carregarSaude();

    // Link direto (#/opcoes/PETR4): o SeletorDeAtivos nao tem mais selecionar();
    // preenche o campo e abre o ativo aqui mesmo.
    const inicial = ativoDoHash();
    if (inicial) {
      const campo = seletor.querySelector('input');
      if (campo) campo.value = inicial;
      this._abrir(inicial);
    }
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
    // Com ativo escolhido, a saude da cadeia vira rodape recolhido.
    this.querySelector('#opcao-saude-detalhes')?.removeAttribute('open');
    history.replaceState(null, '', `#/opcoes/${encodeURIComponent(simbolo)}`);

    try {
      // Busca paralela: opcoes (obrigatório) + 4 enriquecedores (degradam graciosamente).
      const [dadosR, fundR, cvmR, pregoesR, proventosR] = await Promise.allSettled([
        buscarOpcoes(simbolo),
        buscarFundamentos(simbolo),
        buscarFundamentosCvm(simbolo),
        buscarPregoes(simbolo, { de: _data90dAtras(), intervalo: 'dia' }),
        buscarProventosContabeis(simbolo),
      ]);

      if (dadosR.status === 'rejected') throw dadosR.reason;
      const dados = dadosR.value;
      const fundamentos = fundR.status === 'fulfilled' ? fundR.value : null;
      const cvm       = cvmR.status === 'fulfilled'   ? cvmR.value   : null;
      const pregoes   = pregoesR.status === 'fulfilled' ? pregoesR.value : null;
      const proventos = proventosR.status === 'fulfilled' ? proventosR.value : null;

      this._contexto = _montarContexto(fundamentos, cvm, pregoes, proventos);
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
      <div class="opcoes-layout">
        <aside class="opcoes-sidebar"><ativo-contexto-opcoes></ativo-contexto-opcoes></aside>
        <div class="opcoes-principal">
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
        </div>
      </div>
    `;

    const painel = resultado.querySelector('opcoes-painel');
    painel.setDados(dados);
    resultado.querySelector('ativo-contexto-opcoes').setContexto(this._contexto);

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
