import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarCurvaReal, buscarIndiceMacro, buscarPainelMacro } from '../api/indicesMacroApi.js';
import { ativosAcima, distanciaTexto, indicadoresDecisao, pct, temDados } from '../analise/macro/painel.js';
import { curvaDisponivel, dataBr, formaCurva, leituraForma, linhaReferencia, pontosCurva, referenciaCurva, svgCurva, taxaTexto } from '../analise/macro/curvaReal.js';
import { formatarData } from '../utils/dataHora.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';
import { htmlSparkline } from '../components/ficha360/Sparkline.js';
import { escaparHtml } from '../utils/html.js';
import { acumulado12m, formatarVariacao, janela12m, mesesAntes, variacoes } from '../analise/macro/series.js';

// Unica responsabilidade: orquestrar a exibicao dos indices macroeconomicos -
// busca cada serie no cache do backend e delega a renderizacao a funcoes
// puras. Conteudo dinamico, mas fonte 100% publica e gratuita: API SGS do
// Banco Central (https://api.bcb.gov.br) pra Selic/CDI/IPCA/IGP-M/dolar/IBC-Br,
// e API de agregados do IBGE/SIDRA (https://servicodados.ibge.gov.br) pra
// series como desemprego - nenhuma das duas exige chave ou custo.
//
// Cada indice tem um link pra uma segunda fonte, independente do BCB, pra
// quem quiser conferir o numero antes de confiar nele - a maioria via
// Trading Economics (agregador publico), IGP-M e IPCA vao direto pro orgao
// que efetivamente calcula a serie (FGV e IBGE), mais confiavel que uma
// segunda leitura do proprio BCB.
// MACRO-PAI-2: cartoes agrupados por tema, com sparkline de 12 meses e
// variacao em 1/3/12 meses. 'variacao' diz como ler a mudanca: taxas em pontos
// percentuais (pp), precos e indices de nivel em % (pct). 'acumula12m' compoe os
// 12 ultimos meses de uma serie mensal (IGP-M nao tem serie de 12 meses no SGS).
const ANO = new Date().getFullYear();
export const GRUPOS = [
  {
    titulo: 'Juros',
    descricao: 'Custo de oportunidade: o que a renda fixa paga sem risco de bolsa.',
    indices: [
      { codigo: 'SELIC', nome: 'Selic (meta)', unidade: '% a.a.', variacao: 'pp', fonte: 'https://tradingeconomics.com/brazil/interest-rate' },
      { codigo: `FOCUS_SELIC_${ANO}`, nome: `Selic esperada fim de ${ANO} (Focus)`, unidade: '% a.a.', variacao: 'pp', fonte: 'https://www.bcb.gov.br/publicacoes/focus' },
      { codigo: `FOCUS_SELIC_${ANO + 1}`, nome: `Selic esperada fim de ${ANO + 1} (Focus)`, unidade: '% a.a.', variacao: 'pp', fonte: 'https://www.bcb.gov.br/publicacoes/focus' },
      { codigo: 'SELIC_DIARIA', nome: 'Selic (over, diária)', unidade: '% a.d.', variacao: 'pp', fonte: 'https://tradingeconomics.com/brazil/interest-rate' },
      { codigo: 'CDI', nome: 'CDI', unidade: '% a.d.', variacao: 'pp', fonte: 'https://www.b3.com.br/pt_br/market-data-e-indices/indices/renda-fixa/taxas-referenciais-bm-fbovespa.htm' },
    ],
  },
  {
    titulo: 'Inflação',
    descricao: 'Corrói o retorno real; juro real = Selic descontada da inflação esperada.',
    indices: [
      { codigo: 'IPCA_12M', nome: 'IPCA acumulado 12 meses', unidade: '%', variacao: 'pp', fonte: 'https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html' },
      { codigo: 'IPCA', nome: 'IPCA (mensal)', unidade: '%', variacao: 'pp', acumula12m: true, fonte: 'https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html' },
      { codigo: `FOCUS_IPCA_${ANO}`, nome: `IPCA esperado ${ANO} (Focus)`, unidade: '%', variacao: 'pp', fonte: 'https://www.bcb.gov.br/publicacoes/focus' },
      { codigo: `FOCUS_IPCA_${ANO + 1}`, nome: `IPCA esperado ${ANO + 1} (Focus)`, unidade: '%', variacao: 'pp', fonte: 'https://www.bcb.gov.br/publicacoes/focus' },
      { codigo: 'IGPM', nome: 'IGP-M (mensal)', unidade: '%', variacao: 'pp', acumula12m: true, fonte: 'https://portalibre.fgv.br/indicadores/igp' },
    ],
  },
  {
    titulo: 'Câmbio',
    descricao: 'Afeta exportadoras (ganham com real fraco) e importadoras.',
    indices: [
      { codigo: 'DOLAR', nome: 'Dólar comercial (PTAX venda)', unidade: 'R$', variacao: 'pct', fonte: 'https://tradingeconomics.com/brazil/currency' },
      { codigo: 'EURO', nome: 'Euro (PTAX venda)', unidade: 'R$', variacao: 'pct', fonte: 'https://tradingeconomics.com/euro-area/currency' },
    ],
  },
  {
    titulo: 'Atividade',
    descricao: 'Ritmo da economia: puxa receita de varejo, bancos e construção.',
    indices: [
      { codigo: 'IBCBR', nome: 'IBC-Br (proxy mensal do PIB)', unidade: 'índice', variacao: 'pct', fonte: 'https://tradingeconomics.com/brazil/gdp-growth-annual' },
      { codigo: 'DESEMPREGO', nome: 'Desemprego (PNAD Contínua)', unidade: '%', variacao: 'pp', fonte: 'https://sidra.ibge.gov.br/tabela/6381' },
    ],
  },
];

export class IndicesMacroPage extends BaseComponent {
  template() {
    // htmlSparkline devolve so o SVG; o estilo vive no componente <f360-sparkline>.
    return `
      <style>
        indices-macro-page .f360-sparkline { width: 100%; max-width: 12rem; height: 2rem; overflow: visible; }
        indices-macro-page .f360-sparkline polyline { fill: none; stroke: var(--bs-primary); stroke-width: 2; vector-effect: non-scaling-stroke; }
      </style>
      <h4 class="mb-1">Indices macroeconomicos</h4>
      <p class="text-muted small">
        Direto das APIs publicas do Banco Central e do IBGE - sem chave, sem custo. Serve de referencia de custo
        de oportunidade: o earnings yield calculado em <a href="#/formulas">Fórmulas</a> só diz
        algo quando comparado contra a Selic do momento. Cada cartao linka pra uma segunda fonte,
        independente do BCB, pra conferir o numero antes de confiar nele.
      </p>
      <div id="indices-painel" aria-live="polite"></div>
      <div id="indices-curva-real"></div>
      <div id="indices-conteudo"><loading-spinner></loading-spinner></div>
    `;
  }

  afterRender() {
    this.curva = null;
    this.painel = null;
    this.carregarPainel();
    this.carregarCurva();
    this.carregar();
  }

  // FONTES-PAI-5: curva NTN-B. 503/motivo/erro viram aviso discreto; nada mais muda.
  async carregarCurva() {
    const area = this.querySelector('#indices-curva-real');
    try {
      this.curva = await buscarCurvaReal();
    } catch {
      this.curva = { motivo: 'Curva de juro real indisponível: o backend não respondeu.' };
    }
    area.innerHTML = renderCurvaReal(this.curva);
    this.redesenharPainel();
  }

  // Liga a curva ao cabecalho de decisao quando ela chega depois do painel.
  redesenharPainel() {
    if (!this.painel || !temDados(this.painel, ANO)) return;
    this.querySelector('#indices-painel').innerHTML = renderPainel(this.painel, ANO, this.curva);
  }

  // Cabecalho de decisao: falha ou painel vazio nunca derruba os cartoes.
  async carregarPainel() {
    const area = this.querySelector('#indices-painel');
    try {
      const painel = await buscarPainelMacro();
      this.painel = painel;
      area.innerHTML = temDados(painel, ANO)
        ? renderPainel(painel, ANO, this.curva)
        : '<p class="small text-body-secondary">Painel de decisão sem dados no momento.</p>';
    } catch {
      area.innerHTML = '<p class="small text-body-secondary">Painel de decisão indisponível: o backend não respondeu.</p>';
    }
  }

  async carregar() {
    const area = this.querySelector('#indices-conteudo');
    // 13 meses: 12 de janela + folga para a variacao de 12 meses. Gestor sem o
    // filtro (MACRO-GES-4) ignora o parametro e devolve a serie inteira.
    const desde = mesesAntes(new Date().toISOString().slice(0, 10), 13);
    try {
      const indices = GRUPOS.flatMap((g) => g.indices);
      const resultados = await Promise.all(indices.map((indice) => buscarIndiceMacro(indice.codigo, desde).catch(() => [])));
      const porCodigo = Object.fromEntries(indices.map((indice, i) => [indice.codigo, resultados[i]]));
      area.innerHTML = renderGrupos(GRUPOS, porCodigo);
    } catch (erro) {
      area.innerHTML = `<status-alert mensagem="${escaparHtml(erro.message)}" variante="danger"></status-alert>`;
    }
  }
}

export function renderPainel(painel, ano, curva = null) {
  const refNtnb = linhaReferencia(curva);
  const cartoes = indicadoresDecisao(painel, ano).map((i) => `
    <div class="col">
      <div class="card h-100 border-primary-subtle" data-decisao="${i.id}">
        <div class="card-body py-2">
          <div class="small text-body-secondary">${escaparHtml(i.titulo)}</div>
          ${i.selo ? `<p class="h4 mb-1"><span class="badge text-bg-${i.selo.tom}"><span aria-hidden="true">${i.selo.icone}</span> ${i.selo.rotulo}</span></p>` : ''}
          ${i.valor ? `<p class="h4 mb-1">${escaparHtml(i.valor)}</p>` : ''}
          ${i.detalhe ? `<p class="small mb-1">${escaparHtml(i.detalhe)}</p>` : ''}
          ${i.leitura ? `<p class="small text-body-secondary mb-0">${escaparHtml(i.leitura)}</p>` : ''}
          ${i.id === 'juro-real' && refNtnb ? `<p class="small mb-0 mt-1" data-ntnb-ref>${escaparHtml(refNtnb)}</p>` : ''}
          ${!i.valor && !i.selo ? `<p class="small text-body-secondary mb-0"><span aria-hidden="true">⚠</span> ${escaparHtml(i.motivo || 'Sem dado')}</p>` : ''}
        </div>
      </div>
    </div>`).join('');
  return `
    <section class="mb-4" aria-label="Painel de decisão">
      <h5 class="mb-2">Painel de decisão</h5>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">${cartoes}</div>
      ${renderAtivosAcima(painel?.barreira)}
    </section>`;
}

export function renderCurvaReal(curva) {
  if (!curvaDisponivel(curva)) {
    const motivo = curva?.motivo || 'Curva de juro real sem dados no momento.';
    return `<p class="small text-body-secondary mb-3" data-curva-aviso><span aria-hidden="true">⚠</span> Juro real NTN-B: ${escaparHtml(motivo)}</p>`;
  }
  const ref = referenciaCurva(curva);
  const pontos = pontosCurva(curva);
  const forma = formaCurva(pontos);
  const tabela = pontos.length
    ? `<details class="mt-2"><summary class="small">Pontos da curva (${pontos.length})</summary>
        <table class="table table-sm mb-0"><thead><tr><th scope="col" class="small">Vencimento</th><th scope="col" class="small text-end">Compra</th><th scope="col" class="small text-end">Venda</th></tr></thead>
        <tbody>${pontos.map((p) => `<tr><td class="small">${escaparHtml(dataBr(p.vencimento))}</td><td class="small text-end">${taxaTexto(p.taxa)}</td><td class="small text-end">${taxaTexto(p.taxaVenda)}</td></tr>`).join('')}</tbody></table></details>`
    : '';
  return `
    <section class="mb-4" aria-label="Juro real: NTN-B (Tesouro IPCA+)" data-bloco="curva-real">
      <div class="card shadow-sm"><div class="card-body">
        <h5 class="card-title mb-1">Juro real: NTN-B (Tesouro IPCA+)</h5>
        ${ref
          ? `<p class="h3 mb-0" data-curva-ref>${taxaTexto(ref.taxa)}<small class="fs-6 text-muted"> a.a. + IPCA</small></p>
             <p class="small text-body-secondary mb-2">Referência: vencimento mais próximo de 5 anos (${escaparHtml(dataBr(ref.vencimento))}). Data-base ${escaparHtml(dataBr(curva.dataBase))}.</p>`
          : `<p class="small text-body-secondary mb-2">Data-base ${escaparHtml(dataBr(curva.dataBase))}.</p>`}
        ${forma ? `<p class="mb-2" data-curva-forma><span class="badge text-bg-${forma.tom}"><span aria-hidden="true">${forma.icone}</span> ${forma.rotulo}</span> <span class="small">${escaparHtml(leituraForma(forma))}</span></p>` : ''}
        ${svgCurva(pontos)}${tabela}
      </div></div>
    </section>`;
}

export function renderAtivosAcima(barreira) {
  if (!barreira) return '';
  const lista = ativosAcima(barreira);
  const mediana = barreira.earningsYieldMediano != null ? `; mediana da base em ${pct(barreira.earningsYieldMediano)}` : '';
  const corpo = lista.length
    ? `<ul class="list-unstyled d-flex flex-wrap gap-2 mb-0">${lista.map((a) => `
        <li><a class="btn btn-outline-success text-start" href="#/ativo/${encodeURIComponent(a.simbolo)}" data-acima="${escaparHtml(a.simbolo)}">
          <strong>${escaparHtml(a.simbolo)}</strong>
          <span class="d-block small">Earnings yield ${pct(a.earningsYield)}</span>
          <span class="d-block small">${distanciaTexto(a.distancia)}</span>
        </a></li>`).join('')}</ul>`
    : `<p class="small mb-0" data-acima-vazio>Nenhum ativo acima da barreira${mediana}.</p>`;
  return `
    <div class="mt-3" data-bloco="acima-barreira">
      <h6 class="mb-2">Ativos acima da barreira</h6>${corpo}
    </div>`;
}

export function renderGrupos(grupos, porCodigo) {
  return grupos.map((grupo) => `
    <section class="mb-4">
      <h5 class="mb-0">${grupo.titulo}</h5>
      <p class="small text-body-secondary mb-2">${grupo.descricao}</p>
      <div class="row row-cols-1 row-cols-md-3 g-3">
        ${grupo.indices.map((indice) => renderIndice(indice, porCodigo[indice.codigo] || [])).join('')}
      </div>
    </section>`).join('');
}

const numero = (v, casas = 2) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export function renderIndice(indice, pontos) {
  const { atual, m1, m3, m12 } = variacoes(pontos, indice.variacao);
  const janela = janela12m(pontos);
  const acumulado = indice.acumula12m ? acumulado12m(pontos) : null;
  const historico = (pontos || []).slice(0, 6);
  const chip = (rotulo, v) => `<span class="badge text-bg-light border me-1">${rotulo} ${formatarVariacao(v, indice.variacao)}</span>`;

  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="card-header"><strong>${indice.nome}</strong></div>
        <div class="card-body">
          ${
            atual
              ? `<p class="display-6 mb-0">${numero(atual.valor)}<small class="fs-6 text-muted"> ${indice.unidade}</small></p>
                 <p class="small text-muted mb-2">${formatarData(atual.data)}</p>
                 ${acumulado !== null ? `<p class="small mb-2">Acumulado 12 meses: <strong>${numero(acumulado)}%</strong></p>` : ''}
                 <div class="mb-2">${htmlSparkline(janela.map((p) => p.valor), janela.map((p) => formatarData(p.data)), indice.nome)}</div>
                 <div class="mb-2">${chip('1m', m1)}${chip('3m', m3)}${chip('12m', m12)}</div>`
              : '<p class="text-muted small">Sem dado ainda - aguardando o primeiro ciclo do agendador (roda 1x/dia).</p>'
          }
          ${
            historico.length
              ? `<details><summary class="small">Últimos pontos</summary>
                 <table class="table table-sm mb-0">
                   <tbody>
                     ${historico.map((p) => `<tr><td class="small">${formatarData(p.data)}</td><td class="text-end small">${numero(p.valor)}</td></tr>`).join('')}
                   </tbody>
                 </table></details>`
              : ''
          }
          <a href="${indice.fonte}" target="_blank" rel="noopener noreferrer" class="small d-block mt-2">
            Conferir em outra fonte ↗<span class="visually-hidden"> (nova aba)</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

customElements.define('indices-macro-page', IndicesMacroPage);
