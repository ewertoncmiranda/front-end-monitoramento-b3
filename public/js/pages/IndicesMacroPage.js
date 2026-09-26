import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarIndiceMacro } from '../api/indicesMacroApi.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a exibicao dos indices macroeconomicos
// (Selic, CDI, IPCA) - busca cada serie no cache do backend e delega a
// renderizacao a funcoes puras. Conteudo dinamico, mas fonte 100% publica e
// gratuita (API SGS do Banco Central).
const INDICES = [
  { codigo: 'SELIC', nome: 'Selic (meta)', unidade: '% a.a.' },
  { codigo: 'CDI', nome: 'CDI', unidade: '% a.a.' },
  { codigo: 'IPCA', nome: 'IPCA (mensal)', unidade: '%' },
];

export class IndicesMacroPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Indices macroeconomicos</h4>
      <p class="text-muted small">
        Selic, CDI e IPCA direto da API SGS do Banco Central - sem chave, sem custo. Serve de
        referencia de custo de oportunidade: o earnings yield calculado em
        <a href="#/formulas">Formulas</a> so diz algo quando comparado contra a Selic do momento.
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
        </div>
      </div>
    </div>
  `;
}

customElements.define('indices-macro-page', IndicesMacroPage);
