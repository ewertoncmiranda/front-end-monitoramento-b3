import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarIndiceMacro } from '../api/indicesMacroApi.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

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
const INDICES = [
  { codigo: 'SELIC', nome: 'Selic (meta)', unidade: '% a.a.', fonte: 'https://tradingeconomics.com/brazil/interest-rate' },
  { codigo: 'SELIC_DIARIA', nome: 'Selic (over, diária)', unidade: '% a.d.', fonte: 'https://tradingeconomics.com/brazil/interest-rate' },
  { codigo: 'CDI', nome: 'CDI', unidade: '% a.d.', fonte: 'https://www.b3.com.br/pt_br/market-data-e-indices/indices/renda-fixa/taxas-referenciais-bm-fbovespa.htm' },
  { codigo: 'IPCA', nome: 'IPCA (mensal)', unidade: '%', fonte: 'https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html' },
  { codigo: 'IGPM', nome: 'IGP-M (mensal)', unidade: '%', fonte: 'https://portalibre.fgv.br/indicadores/igp' },
  { codigo: 'DOLAR', nome: 'Dólar comercial (PTAX venda)', unidade: 'R$', fonte: 'https://tradingeconomics.com/brazil/currency' },
  { codigo: 'IBCBR', nome: 'IBC-Br (proxy mensal do PIB)', unidade: 'índice', fonte: 'https://tradingeconomics.com/brazil/gdp-growth-annual' },
  { codigo: 'DESEMPREGO', nome: 'Desemprego (PNAD Contínua)', unidade: '%', fonte: 'https://sidra.ibge.gov.br/tabela/6381' },
];

export class IndicesMacroPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Indices macroeconomicos</h4>
      <p class="text-muted small">
        Direto das APIs publicas do Banco Central e do IBGE - sem chave, sem custo. Serve de referencia de custo
        de oportunidade: o earnings yield calculado em <a href="#/formulas">Formulas</a> so diz
        algo quando comparado contra a Selic do momento. Cada cartao linka pra uma segunda fonte,
        independente do BCB, pra conferir o numero antes de confiar nele.
      </p>
      <div id="indices-conteudo" class="row row-cols-1 row-cols-md-3 g-3"><loading-spinner></loading-spinner></div>
    `;
  }

  afterRender() {
    this.carregar();
  }

  async carregar() {
    const area = this.querySelector('#indices-conteudo');
    try {
      const resultados = await Promise.all(
        INDICES.map((indice) => buscarIndiceMacro(indice.codigo).catch(() => [])),
      );
      area.innerHTML = INDICES.map((indice, i) => renderIndice(indice, resultados[i])).join('');
    } catch (erro) {
      area.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
    }
  }
}

function renderIndice(indice, pontos) {
  const atual = pontos && pontos.length ? pontos[0] : null;
  const historico = (pontos || []).slice(0, 6);

  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="card-header"><strong>${indice.nome}</strong></div>
        <div class="card-body">
          ${
            atual
              ? `<p class="display-6 mb-0">${Number(atual.valor).toFixed(2)}<small class="fs-6 text-muted"> ${indice.unidade}</small></p>
                 <p class="small text-muted mb-2">${atual.data}</p>`
              : '<p class="text-muted small">Sem dado ainda - aguardando o primeiro ciclo do agendador (roda 1x/dia).</p>'
          }
          ${
            historico.length
              ? `<table class="table table-sm mb-0">
                   <tbody>
                     ${historico.map((p) => `<tr><td class="small">${p.data}</td><td class="text-end small">${Number(p.valor).toFixed(2)}</td></tr>`).join('')}
                   </tbody>
                 </table>`
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
