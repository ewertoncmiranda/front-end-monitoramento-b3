import { BaseComponent } from '../components/base/BaseComponent.js';

// Unica responsabilidade: descrever os 4 componentes que formam o ecossistema
// e como eles se conectam. Conteudo 100% estatico, sem chamada de API - a
// contrapartida "com numeros reais" fica na aba "Como funciona".
export class ArquiteturaPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-3">Arquitetura</h4>
      <p class="text-muted small">O ecossistema é formado por 4 peças independentes, cada uma com uma responsabilidade única.</p>

      ${this.diagrama()}
      ${this.secaoFrontend()}
      ${this.secaoJava()}
      ${this.secaoPython()}
      ${this.secaoInfra()}
    `;
  }

  diagrama() {
    return `
      <pre class="small bg-body-tertiary p-3 rounded mb-4" style="white-space: pre-wrap;">Front (este app) --HTTP--> Java (gestor-ativos-brutos)
                                    |  \\
                                    |   --HTTP--> BRAPI (cotação/histórico externo)
                                    v
                              SQS (LocalStack)
                                    |
                                    v
                        Python (gerar-insights) --grava--> MySQL (insight_acao, serie_historica)
                                    ^
                                    |
                    Java le o MySQL e devolve pro Front --------------------</pre>
    `;
  }

  secaoFrontend() {
    return `
      <h6 class="mt-2">1. Frontend — <code>painel-ativos-frontend</code></h6>
      <p class="small">HTML + JS puro (Web Components nativos, sem framework/bundler) servido por um pequeno servidor Node/Express, que também atua como proxy reverso para o backend Java. Não tem regra de negócio: só exibe o que os outros dois serviços calculam e permite cadastrar ativos para monitoramento.</p>
    `;
  }

  secaoJava() {
    return `
      <h6 class="mt-2">2. Java — <code>gestor-ativos-brutos</code></h6>
      <p class="small">A porta de entrada HTTP do ecossistema. Consulta a BRAPI (cotação e histórico), publica os dados brutos em duas filas SQS, e lê o MySQL para consolidar/classificar as análises que o Python já gravou. Também é responsável pelo agendador que reprocessa a carteira monitorada a cada 30s.</p>
    `;
  }

  secaoPython() {
    return `
      <h6 class="mt-2">3. Python — <code>gerar-insights</code></h6>
      <p class="small">Um worker sem API HTTP própria: fica consumindo as duas filas SQS continuamente. A cada mensagem, calcula o valuation (fórmula de Graham) e, quando há histórico suficiente, o sinal técnico de série (média móvel, z-score, momentum, reversão) — e grava o resultado no MySQL (<code>insight_acao</code>, <code>serie_historica</code>).</p>
    `;
  }

  secaoInfra() {
    return `
      <h6 class="mt-2">4. Infra — <code>infra-b3-ecossytem</code></h6>
      <p class="small">Docker Compose orquestrando os 3 serviços acima, mais MySQL, LocalStack (simula SQS/AWS localmente) e a pilha de observabilidade (Prometheus, Grafana, Elasticsearch, Logstash, Kibana). O schema do banco é definido uma única vez ali (<code>mysql-init</code>) e compartilhado pelos dois backends.</p>
    `;
  }
}

customElements.define('arquitetura-page', ArquiteturaPage);
