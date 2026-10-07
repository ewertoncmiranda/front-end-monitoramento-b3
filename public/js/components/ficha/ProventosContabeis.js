import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { buscarProventosContabeis } from '../../api/lacunasApi.js';
import {
  MODO_ANUAL, MODO_TRIMESTRAL, MAXIMO_TRIMESTRES, chaveDaLinha, pontosDoModo, svgProventos, totalDoPonto,
} from '../../analise/graficoProventos.js';
import { htmlEstadoVazio } from '../EstadoVazio.js';
import { formatarMoedaCompacta, rotuloOrigem, totalDoProvento } from '../../analise/lacunas.js';

// Unica responsabilidade: proventos por periodo contabil (LAC-FE-3), da DVA da
// CVM, marcando a origem de cada valor. Por periodo (ano/trimestre), nao por
// data de pagamento - complementa os eventos com data-com da B3.
// Dados de /ativos/{s}/proventos-contabeis (LAC-GES-3). Valor ausente aparece
// como "—", nunca como zero.
//
// Grafico e tabela andam juntos (REQ-UX-11): passar o mouse (ou o foco) numa
// coluna destaca as linhas do periodo na tabela, e vice-versa; clique fixa o
// destaque (no celular nao ha hover); setas navegam entre colunas.
export class ProventosContabeis extends BaseComponent {
  template() {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Proventos por período contábil</p><div data-corpo class="small text-muted">Carregando…</div></section>';
  }

  async afterRender() {
    const simbolo = this.getAttribute('simbolo');
    const corpo = this.querySelector('[data-corpo]');
    if (!simbolo) return;
    try {
      const proventos = await buscarProventosContabeis(simbolo);
      if (this.getAttribute('simbolo') !== simbolo) return;
      this._proventos = proventos;
      this._modo = MODO_ANUAL;
      corpo.innerHTML = renderizar(proventos, this._modo);
      this.ligarInteracao(corpo);
    } catch {
      corpo.innerHTML = htmlEstadoVazio({ titulo: 'Proventos contábeis indisponíveis', causa: 'A DVA ainda não foi carregada, ou o gestor/banco ainda não tem o Plano LAC (V16).', acaoHref: '#/avaliacao', acaoRotulo: 'Ver saúde dos dados' });
    }
  }

  ligarInteracao(corpo) {
    this._fixada = null;
    corpo.addEventListener('mouseover', (e) => {
      if (this._fixada) return;
      const alvo = e.target.closest('[data-chave], tr[data-ano]');
      if (alvo) this.ativar(this.chaveDoElemento(alvo), !alvo.matches('tr'));
    });
    corpo.addEventListener('mouseleave', () => { if (!this._fixada) this.ativar(null); });
    corpo.addEventListener('focusin', (e) => {
      const coluna = e.target.closest('.grafico-proventos [data-chave]');
      if (coluna) this.ativar(coluna.dataset.chave, true);
    });
    corpo.addEventListener('click', (e) => {
      const modo = e.target.closest('[data-modo]');
      if (modo) { this.trocarModo(corpo, modo.dataset.modo); return; }
      const alvo = e.target.closest('.grafico-proventos [data-chave], tr[data-ano]');
      if (!alvo) return;
      const chave = this.chaveDoElemento(alvo);
      this._fixada = this._fixada === chave ? null : chave;
      this.ativar(this._fixada ?? chave, !alvo.matches('tr'));
    });
    corpo.addEventListener('keydown', (e) => {
      const coluna = e.target.closest('.grafico-proventos [data-chave]');
      if (!coluna || !['ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Escape') { this._fixada = null; this.ativar(null); return; }
      const vizinha = e.key === 'ArrowRight' ? coluna.nextElementSibling : coluna.previousElementSibling;
      if (vizinha?.dataset?.chave) this.focarColuna(vizinha);
    });
  }

  chaveDoElemento(el) {
    if (!el.matches('tr')) return el.dataset.chave;
    return this._modo === MODO_TRIMESTRAL ? el.dataset.fim : el.dataset.ano;
  }

  focarColuna(coluna) {
    this.querySelectorAll('.grafico-proventos [data-chave]').forEach((c) => { c.tabIndex = -1; });
    coluna.tabIndex = 0;
    coluna.focus();
  }

  trocarModo(corpo, modo) {
    if (modo === this._modo) return;
    this._modo = modo;
    this._fixada = null;
    corpo.querySelector('[data-grafico]').innerHTML = htmlGrafico(this._proventos, modo);
    corpo.querySelectorAll('[data-modo]').forEach((b) => {
      const ativo = b.dataset.modo === modo;
      b.classList.toggle('active', ativo);
      b.setAttribute('aria-pressed', String(ativo));
    });
    this.ativar(null);
  }

  /** Destaca a coluna e as linhas da chave; `rolarTabela` so quando veio do grafico. */
  ativar(chave, rolarTabela = false) {
    const svg = this.querySelector('.grafico-proventos');
    const dica = this.querySelector('[data-dica]');
    if (!svg || !dica) return;
    svg.classList.toggle('tem-ativo', Boolean(chave));
    svg.querySelectorAll('[data-chave]').forEach((g) => g.classList.toggle('ativo', g.dataset.chave === chave));
    const linhas = [...this.querySelectorAll('tr[data-ano]')];
    linhas.forEach((tr) => tr.classList.toggle('ativo', Boolean(chave) && this.chaveDoElemento(tr) === chave));
    if (!chave) { dica.hidden = true; dica.textContent = ''; return; }

    const ponto = pontosDoModo(this._proventos, this._modo).find((p) => p.chave === chave);
    dica.innerHTML = htmlDica(ponto, this._modo);
    dica.hidden = false;
    posicionarDica(dica, svg.querySelector(`[data-chave="${CSS.escape(chave)}"] .alvo`));
    if (rolarTabela) rolarParaLinha(this.querySelector('.tabela-rolavel'), linhas.find((tr) => tr.classList.contains('ativo')));
  }
}

function htmlGrafico(proventos, modo) {
  return svgProventos(proventos, modo)
    || '<p class="small text-muted mb-0">Sem valores nos últimos trimestres.</p>';
}

export function htmlDica(ponto, modo) {
  if (!ponto) return '';
  if (ponto.semDado) return `<strong>${escaparHtml(ponto.rotulo)}</strong><div>Sem dado na DVA (ausente, não zero)</div>`;
  const titulo = modo === MODO_TRIMESTRAL
    ? `${formatarData(ponto.periodo?.inicio)} a ${formatarData(ponto.periodo?.fim)} · ${ponto.periodo?.tipoDoc || ''}`
    : `${ponto.rotulo}${ponto.parcial ? ' · parcial (sem DFP do ano ainda)' : ''}`;
  const extra = modo === MODO_TRIMESTRAL
    ? `<div>Por ação: ${ponto.porAcao === null ? '—' : `R$ ${ponto.porAcao.toFixed(4).replace('.', ',')}`}</div>
       <div class="text-muted">Entregue em ${escaparHtml(formatarData(ponto.periodo?.entrega))}</div>`
    : `<div class="text-muted">${ponto.periodos} período(s) somado(s)</div>`;
  return `<strong>${escaparHtml(titulo)}</strong>
    <div><span class="marca-legenda jcp"></span>JCP ${escaparHtml(formatarMoedaCompacta(ponto.jcp))}</div>
    <div><span class="marca-legenda dividendos"></span>Dividendos ${escaparHtml(formatarMoedaCompacta(ponto.dividendos))}</div>
    <div class="fw-semibold">Total ${escaparHtml(formatarMoedaCompacta(totalDoPonto(ponto)))}</div>${extra}`;
}

/** A dica acima da coluna, sem sair do cartao. */
function posicionarDica(dica, alvo) {
  if (!alvo || typeof alvo.getBoundingClientRect !== 'function') return;
  const caixa = dica.parentElement.getBoundingClientRect();
  const coluna = alvo.getBoundingClientRect();
  const meio = coluna.left + coluna.width / 2 - caixa.left;
  const largura = dica.offsetWidth || 180;
  const esquerda = Math.min(Math.max(meio - largura / 2, 0), Math.max(caixa.width - largura, 0));
  dica.style.left = `${esquerda}px`;
}

/** Rola so a tabela (nunca a pagina) ate a linha ficar visivel. */
function rolarParaLinha(container, linha) {
  if (!container || !linha) return;
  const topo = linha.offsetTop;
  const cabecalho = container.querySelector('thead')?.offsetHeight || 0;
  if (topo - cabecalho < container.scrollTop || topo + linha.offsetHeight > container.scrollTop + container.clientHeight) {
    container.scrollTop = Math.max(topo - cabecalho - container.clientHeight / 3, 0);
  }
}

export function renderizar(proventos, modo = MODO_ANUAL) {
  if (!proventos || !proventos.length) {
    return htmlEstadoVazio({ titulo: 'Sem dado ainda', causa: 'Nenhum provento contábil (DVA) carregado para esta empresa.' });
  }
  const botao = (m, rotulo) => `<button type="button" class="btn btn-outline-secondary${m === modo ? ' active' : ''}" data-modo="${m}" aria-pressed="${m === modo}">${rotulo}</button>`;
  return `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
      <div class="legenda-proventos"><span class="marca-legenda jcp"></span>JCP <span class="marca-legenda dividendos ms-2"></span>Dividendos</div>
      <div class="btn-group btn-group-sm" role="group" aria-label="Agrupamento do gráfico">
        ${botao(MODO_ANUAL, 'Anual')}${botao(MODO_TRIMESTRAL, `Trimestral (${MAXIMO_TRIMESTRES})`)}
      </div>
    </div>
    <div class="grafico-proventos-caixa">
      <div data-grafico>${htmlGrafico(proventos, modo)}</div>
      <div class="dica-grafico small" data-dica role="status" aria-live="polite" hidden></div>
    </div>
    <p class="small text-muted mb-2">Passe o mouse (ou toque) numa coluna para ver o período na tabela; * = ano parcial, sem DFP ainda.</p>
    <div class="table-responsive tabela-rolavel tabela-proventos"><table class="table table-sm align-middle small mb-0 tabela-cartoes">
      <thead><tr><th>Período</th><th>Doc.</th><th class="text-end">JCP</th><th class="text-end">Dividendos</th>
        <th class="text-end">Total</th><th class="text-end">Por ação</th><th>Origem</th></tr></thead>
      <tbody>${proventos.map((p) => `<tr data-ano="${escaparHtml(chaveDaLinha(p, MODO_ANUAL))}" data-fim="${escaparHtml(chaveDaLinha(p, MODO_TRIMESTRAL))}">
        <td data-label="Período">${escaparHtml(formatarData(p.dtInicioExercicio))} a ${escaparHtml(formatarData(p.dtFimExercicio))}
          <div class="text-muted">entregue em ${escaparHtml(formatarData(p.dataEntrega))}</div></td>
        <td data-label="Doc.">${escaparHtml(p.tipoDoc || '—')}</td>
        <td data-label="JCP" class="text-end">${formatarMoedaCompacta(p.jcp)}</td>
        <td data-label="Dividendos" class="text-end">${formatarMoedaCompacta(p.dividendos)}</td>
        <td data-label="Total" class="text-end fw-semibold">${formatarMoedaCompacta(totalDoProvento(p))}</td>
        <td data-label="Por ação" class="text-end">${p.porAcao === null || p.porAcao === undefined ? '—' : `R$ ${Number(p.porAcao).toFixed(4).replace('.', ',')}`}</td>
        <td data-label="Origem"><span class="badge text-bg-light border">${escaparHtml(rotuloOrigem(p.origem))}</span></td>
      </tr>`).join('')}</tbody>
    </table></div>
    <p class="small text-muted mt-2 mb-0">Valores em reais, declarados na DVA da CVM por período; "—" é dado ausente, não zero.</p>`;
}

customElements.define('proventos-contabeis', ProventosContabeis);
