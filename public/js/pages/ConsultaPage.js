import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarCotacaoRobusta } from '../api/ativosApi.js';
import { buscarAnalise } from '../api/analisesApi.js';
import { buscarHistorico } from '../api/historicoApi.js';
import '../components/AtivoSearchForm.js';
import '../components/AtivoQuoteCard.js';
import '../components/AnaliseResultCard.js';
import '../components/HistoricoTable.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a tela de consulta - busca os dados nas
// APIs e delega a renderizacao a cada componente especializado. Nao sabe
// "como" renderizar um card ou uma tabela, so sabe "quando" pedir isso.
export class ConsultaPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-3">Consulta de ativo</h4>
      <ativo-search-form rotulo-botao="Consultar" placeholder="Ex.: PETR4"></ativo-search-form>
      <div id="consulta-resultado" class="mt-3"></div>
    `;
  }

  afterRender() {
    const form = this.querySelector('ativo-search-form');
    const resultado = this.querySelector('#consulta-resultado');

    form.addEventListener('ativo-buscado', async (event) => {
      const { simbolo } = event.detail;
      resultado.innerHTML = '<loading-spinner></loading-spinner>';

      try {
        // Cada chamada falha de forma independente: a cotacao publica em SQS como
        // efeito colateral do backend e pode falhar (ex.: fila indisponivel) sem que
        // isso deva esconder a analise e o historico, que ja podem ter respondido.
        const [ativo, analise, historico] = await Promise.all([
          buscarCotacaoRobusta(simbolo).catch(() => null),
          buscarAnalise(simbolo).catch(() => null),
          buscarHistorico(simbolo).catch(() => null),
        ]);

        if (!ativo && !analise && !historico) {
          resultado.innerHTML =
            '<status-alert mensagem="Nao foi possivel obter nenhum dado para esse ativo." variante="danger"></status-alert>';
          return;
        }

        resultado.innerHTML = `
          ${!ativo ? '<status-alert mensagem="Cotacao indisponivel no momento." variante="warning"></status-alert>' : '<ativo-quote-card></ativo-quote-card>'}
          <analise-result-card></analise-result-card>
          <h6 class="mt-3">Historico (1 mes)</h6>
          <historico-table></historico-table>
        `;

        if (ativo) {
          resultado.querySelector('ativo-quote-card').setAtivo(ativo);
        }

        if (analise) {
          resultado.querySelector('analise-result-card').setAnalise(analise);
        }

        const candles = historico?.results?.[0]?.data?.historicalDataPrice;
        resultado.querySelector('historico-table').setCandles(candles);
      } catch (erro) {
        resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
      }
    });
  }
}

customElements.define('consulta-page', ConsultaPage);
