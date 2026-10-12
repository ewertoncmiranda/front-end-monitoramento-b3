import { BaseComponent } from '../components/base/BaseComponent.js';
import { escaparHtml } from '../utils/html.js';
import { formatarData, formatarDataHora } from '../utils/dataHora.js';
import { formatarMoeda, formatarPercentual } from '../utils/numero.js';
import { buscarBloqueios, buscarDiario, buscarOperacoes, buscarResumo, buscarSaude } from '../api/operacionalApi.js';
import { AVISO_SIMULACAO, STATUS, progresso, statusDe, venceuCdi } from '../analise/operabilidade.js';
import { htmlLegenda, htmlTabelaDiario, svgOperabilidade } from '../components/operacional/GraficoOperabilidade.js';
import { htmlCarteira } from '../components/operacional/CarteiraSimulada.js';
import { htmlBloqueios, htmlListaBloqueios } from '../components/operacional/BloqueiosOperacionais.js';
import { buscarAlertasOperacionais } from '../api/operacionalV2Api.js';
import { htmlAlertasOperacionais } from '../components/inicio/AlertasOperacionais.js';
import { guardarOperabilidade } from '../analise/operabilidadeStore.js';

// Unica responsabilidade: tela "Operabilidade" (Plano OPR, OPR-PAI-2, rota #/operabilidade). Mostra se
// o paper trading ja tem evidencia minima: status, retorno liquido x CDI liquido, drawdown, carteira
// simulada e bloqueios. Nao decide operacao e nunca usa linguagem de recomendacao.

export const MENSAGEM_INDISPONIVEL = 'Os dados operacionais ainda não estão disponíveis: o gestor desta versão '
  + 'não expõe as rotas /operacional (OPR-GES). A simulação continua rodando no gerar-insights.';
export const MENSAGEM_NAO_INICIADO = 'Diário ainda não iniciado: a simulação começa no próximo pregão processado pela rotina da manhã.';

const SEM = 'sem dado';
const pct = (v, sinal = true) => escaparHtml(formatarPercentual(v, 2, { sinal, vazio: SEM }));

function kpi(rotulo, valor, extra = '') {
  return `<div class="col-6 col-md-3"><div class="opr-kpi"><span class="small text-muted">${escaparHtml(rotulo)}</span>
    <strong>${valor}</strong>${extra}</div></div>`;
}

export function htmlMaturidade(pregoes) {
  const valor = Number.isFinite(Number(pregoes)) ? Math.max(0, Number(pregoes)) : 0;
  return `<div class="row g-2 mb-3" aria-label="Maturidade da simulação">
    ${[63, 126].map((meta) => {
      const fracao = Math.min(1, valor / meta);
      return `<div class="col-md-6"><div class="d-flex justify-content-between small"><span>${meta === 63 ? 'Evidência mínima' : 'Janela ampliada'}</span><span>${valor} de ${meta} pregões</span></div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${meta}" aria-valuenow="${Math.min(valor, meta)}"><div class="progress-bar" style="width:${(fracao * 100).toFixed(1)}%"></div></div></div>`;
    }).join('')}</div>`;
}

export function htmlResumo(resumo, saude) {
  const chave = statusDe(resumo?.statusSistema);
  const st = STATUS[chave];
  const prog = progresso(resumo?.pregoesAvaliados, resumo?.pregoesMinimos);
  const venceu = venceuCdi(resumo);
  const comparacao = venceu === null ? '' : `<span class="small ${venceu ? 'text-success' : 'text-danger'}">${venceu ? 'acima' : 'abaixo'} do CDI líquido</span>`;
  const motivos = (resumo?.motivosStatus || []).map((m) => `<li>${escaparHtml(m.descricao || m.codigo || '')}</li>`).join('');
  const violacoes = (saude?.violacoes || []).map((v) => `<li>${escaparHtml(v.descricao || v.codigo || '')}</li>`).join('');
  const naoIniciado = !resumo?.ultimoPregao;
  return `<section class="ficha-cartao mb-3 opr-status">
    <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
      <span class="badge fs-6 ${st.classe}">${escaparHtml(st.rotulo)}</span>
      <span class="small text-muted">${resumo?.ultimoPregao ? `pregão de ${escaparHtml(formatarData(resumo.ultimoPregao))}` : ''}
        ${resumo?.versaoRegra ? ` · regra ${escaparHtml(resumo.versaoRegra)}` : ''}</span>
    </div>
    <p class="small mb-2">${escaparHtml(st.descricao)}</p>
    ${naoIniciado ? `<p class="small text-muted mb-2">${escaparHtml(MENSAGEM_NAO_INICIADO)}</p>` : ''}
    <div class="mb-2" aria-label="Pregões avaliados">
      <div class="d-flex justify-content-between small"><span>Pregões avaliados</span><span>${escaparHtml(prog.texto)}</span></div>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(prog.fracao * 100)}">
        <div class="progress-bar" style="width:${(prog.fracao * 100).toFixed(1)}%"></div></div>
    </div>
    ${htmlMaturidade(resumo?.pregoesAvaliados)}
    <div class="row g-2">
      ${kpi('Retorno líquido acumulado', pct(resumo?.retornoLiquidoAcumulado), comparacao)}
      ${kpi('CDI líquido de IR', pct(resumo?.cdiLiquidoIrAcumulado))}
      ${kpi('Excesso sobre o CDI líquido', pct(resumo?.excessoSobreCdiLiquido))}
      ${kpi('Drawdown máximo', pct(resumo?.drawdownMaximo, false))}
      ${kpi('Patrimônio simulado', escaparHtml(formatarMoeda(resumo?.patrimonio, SEM)),
    resumo?.capitalInicial ? `<span class="small text-muted">de ${escaparHtml(formatarMoeda(resumo.capitalInicial))}</span>` : '')}
      ${kpi('Posições abertas', escaparHtml(String(resumo?.posicoesAbertas ?? SEM)))}
      ${kpi('Operações encerradas', escaparHtml(String(resumo?.operacoesFechadas ?? SEM)))}
      ${kpi('IR estimado no mês', escaparHtml(formatarMoeda(resumo?.impostoEstimadoMes, SEM)))}
    </div>
    ${motivos ? `<p class="ficha-rotulo mt-3 mb-1">Por que este status</p><ul class="small mb-0">${motivos}</ul>` : ''}
    ${saude ? `<p class="small text-muted mt-2 mb-0">Dados do dia: ${saude.dadosDoDiaCompletos === false ? '<span class="text-danger">incompletos</span>' : saude.dadosDoDiaCompletos ? 'completos' : SEM}
      ${saude.ultimaExecucao ? ` · última execução ${escaparHtml(formatarDataHora(saude.ultimaExecucao))}` : ''}</p>` : ''}
    ${violacoes ? `<ul class="small text-danger mb-0">${violacoes}</ul>` : ''}
  </section>`;
}

export function htmlOperabilidade({ resumo, saude, diario, operacoes, bloqueios, alertas }, filtro = {}) {
  const grafico = svgOperabilidade(diario?.itens);
  return `${htmlResumo(resumo, saude)}
    <section class="ficha-cartao mb-3"><p class="ficha-rotulo">Alertas e eventos recentes</p>${htmlAlertasOperacionais(alertas)}</section>
    <section class="ficha-cartao mb-3">
      <p class="ficha-rotulo">Retorno líquido acumulado x CDI líquido de IR</p>
      ${grafico ? `${htmlLegenda()}<div class="grafico-operabilidade-caixa">${grafico}</div>` : `<p class="small text-muted">${escaparHtml(MENSAGEM_NAO_INICIADO)}</p>`}
      <details class="mt-2"><summary class="small">Diário pregão a pregão</summary>${htmlTabelaDiario(diario?.itens)}</details>
    </section>
    ${htmlCarteira(operacoes?.itens)}
    ${htmlBloqueios(bloqueios, filtro)}`;
}

export function htmlPagina(conteudo) {
  return `<div class="container py-3 operabilidade-pagina">
    <h1 class="h4 mb-1">Operabilidade</h1>
    <p class="text-muted small mb-2">O sistema simulado já tem evidência mínima? Retorno líquido de custos e IR estimado contra o CDI líquido.</p>
    <div class="alert alert-warning small py-2" role="note">${escaparHtml(AVISO_SIMULACAO)}</div>
    <div data-conteudo aria-live="polite">${conteudo}</div>
  </div>`;
}

export class OperabilidadePage extends BaseComponent {
  template() {
    return htmlPagina('<p class="small text-muted">Carregando…</p>');
  }

  async afterRender() {
    const alvo = this.querySelector('[data-conteudo]');
    let dados;
    try {
      const [resumo, saude, diario, operacoes, bloqueios, alertas] = await Promise.all([
        buscarResumo(), buscarSaude().catch(() => null), buscarDiario(), buscarOperacoes(), buscarBloqueios(),
        buscarAlertasOperacionais({ limite: 8 }).catch(() => ({ itens: [] }))]);
      dados = { resumo, saude: saude?.indisponivel ? null : saude, diario, operacoes, bloqueios, alertas };
    } catch (erro) {
      alvo.innerHTML = `<p class="small text-danger mb-0">Não foi possível carregar a operabilidade: ${escaparHtml(erro?.message || 'erro')}</p>`;
      return;
    }
    if (dados.resumo?.indisponivel) {
      alvo.innerHTML = `<p class="small text-muted mb-0">${escaparHtml(MENSAGEM_INDISPONIVEL)}</p>`;
      return;
    }
    const indisp = (d) => (d?.indisponivel ? { itens: [] } : d);
    dados = { ...dados, diario: indisp(dados.diario), operacoes: indisp(dados.operacoes), bloqueios: indisp(dados.bloqueios) };
    guardarOperabilidade(dados);
    this._dados = dados;
    this._filtro = { grupo: '', simbolo: '' };
    alvo.innerHTML = htmlOperabilidade(dados, this._filtro);
    this._ligarFiltros();
  }

  _ligarFiltros() {
    const atualizar = () => {
      const lista = this.querySelector('[data-lista-bloqueios]');
      if (lista) lista.innerHTML = htmlListaBloqueios(this._dados.bloqueios?.itens, this._filtro);
    };
    this.querySelector('[data-filtro-grupo]')?.addEventListener('change', (e) => { this._filtro.grupo = e.target.value; atualizar(); });
    this.querySelector('[data-filtro-simbolo]')?.addEventListener('input', (e) => { this._filtro.simbolo = e.target.value; atualizar(); });
  }
}

customElements.define('operabilidade-page', OperabilidadePage);
