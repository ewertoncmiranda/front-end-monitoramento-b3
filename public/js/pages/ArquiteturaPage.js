import { BaseComponent } from '../components/base/BaseComponent.js';

// Unica responsabilidade: descrever o que o ecossistema faz hoje - as cinco
// pecas, o caminho do dado e de onde cada numero vem - com link para o
// repositorio e para a imagem publicada de cada uma. Conteudo 100% estatico,
// sem chamada de API; a contrapartida "com numeros reais" fica na aba
// "Como funciona".
//
// Estrutura declarativa (array PECAS) em vez de um metodo por peca: peca nova
// e um objeto a mais e o render nao muda. Mesmo padrao de FormulasPage e
// GlossarioPage.

const GITHUB = 'https://github.com/ewertoncmiranda';
const DOCKERHUB = 'https://hub.docker.com/r/ewertonmiranda';

const PECAS = [
  {
    numero: 1,
    nome: 'painel-ativos-frontend',
    papel: 'Frontend',
    stack: 'HTML + JS puro, Web Components nativos, Bootstrap 5 via CDN',
    repo: 'front-end-monitoramento-b3',
    imagem: 'front-end-monitoramento-b3',
    porta: '8082',
    descricao: `Este app. Sem framework e sem bundler: os arquivos em <code>public/</code> sao
      servidos exatamente como estao. Um servidor Node/Express minimo serve o estatico e atua
      como proxy reverso para o backend Java, o que elimina CORS - o browser so chama caminho
      relativo.`,
    faz: [
      'Consulta de ativo: cotacao, decisao, fundamentos da CVM e historico',
      'Cadastro de ativo no monitoramento recorrente',
      'Lista de monitorados com a decisao de cada um, expansivel',
      'Grafico de candles com range selecionavel',
      'Referencia: formulas, arquitetura e glossario',
    ],
    naoFaz: 'Nenhuma regra de negocio. So exibe o que os outros servicos calculam.',
  },
  {
    numero: 2,
    nome: 'gestor-ativos-brutos',
    papel: 'API e coleta',
    stack: 'Java 21, Spring Boot 3.3',
    repo: 'gestor-ativos-brutos',
    imagem: 'gestor-ativos-brutos',
    porta: '8091',
    descricao: `A porta de entrada HTTP do ecossistema e o unico servico que fala com a BRAPI.
      Consulta cotacao e historico, publica o dado bruto em duas filas SQS e le o MySQL para
      devolver analises prontas. Um agendador reprocessa a carteira monitorada a cada 30s.`,
    faz: [
      '<code>GET /ativos/{ticker}</code> e <code>/ativos/robusto/{ticker}</code> — consulta na BRAPI e publica em SQS',
      '<code>POST /ativos/registrar/{ticker}</code> — entra no monitoramento recorrente',
      '<code>GET /analises/{ticker}/analise</code> — decisao consolidada por regras deterministicas',
      '<code>GET /analises/{ticker}/fundamentos</code> — o retrato bruto de um unico ciclo',
      '<code>GET /analises/{ticker}/fundamentos-cvm</code> — fundamentos contabeis, com P/L e P/VP',
    ],
    naoFaz: 'Nao calcula valuation nem sinal tecnico; isso e do gerar-insights.',
  },
  {
    numero: 3,
    nome: 'gerar-insights',
    papel: 'Worker de analise',
    stack: 'Python 3, SQLAlchemy, boto3',
    repo: 'gerar-insights',
    imagem: 'gerar-insights',
    porta: '—',
    descricao: `Worker sem API propria: fica consumindo as duas filas SQS. Para cada cotacao que
      chega, grava o snapshot, calcula o valuation de Graham em tres cenarios de crescimento e,
      quando ha serie historica suficiente, deriva o sinal tecnico (media movel, z-score e score
      de volume). O resultado vai para <code>insight_acao</code>.`,
    faz: [
      'Consome <code>tratar-ativos</code> e <code>sqs-registrar-series-historicas</code>',
      'Grava <code>historico_acoes</code> e <code>serie_historica</code> (esta com upsert por dia)',
      'Calcula preco justo de Graham e margem de seguranca',
      'Deriva sinal de momentum e de reversao a media',
    ],
    naoFaz: 'Nao chama API externa nenhuma; so recebe o que o gestor publica.',
  },
  {
    numero: 4,
    nome: 'etl-fundamentos-cvm',
    papel: 'ETL de fundamentos',
    stack: 'Python 3.12, arquitetura hexagonal',
    repo: 'etl-fundamentos-cvm',
    imagem: 'etl-fundamentos-cvm',
    porta: '—',
    descricao: `Job em lote, nao servico: roda, grava e encerra. Baixa as demonstracoes
      financeiras dos dados abertos da CVM e deriva os indicadores contabeis. E a peca que
      fornece ROE, ROIC, margens, divida liquida e fluxo de caixa livre - justamente o que o
      plano gratuito da BRAPI nao entrega. Carrega so os ativos de
      <code>ativo_monitorado</code>, o mesmo lugar onde você cadastra na aba Gestão.`,
    faz: [
      'Le DFP (demonstracoes), FCA (ticker para CNPJ) e FRE (quantidade de acoes)',
      'Grava <code>fato_contabil</code> (landing crua) e <code>indicador_fundamentalista</code> (mart)',
      'Pula o download quando o ETag do arquivo da CVM nao mudou',
      'Declara metrica ausente com a razao, em vez de inventar numero',
    ],
    naoFaz: 'Nao sobe no <code>docker compose up</code> normal — roda sob demanda, com o profile "etl".',
  },
  {
    numero: 5,
    nome: 'infra-b3-ecossytem',
    papel: 'Infraestrutura',
    stack: 'Docker Compose, Terraform, LocalStack',
    repo: 'infra-b3-ecossystem',
    imagem: 'infra-b3-ecossystem',
    porta: '—',
    descricao: `Orquestra tudo: MySQL, LocalStack (simula SQS e S3 localmente), os quatro
      servicos acima e a pilha de observabilidade. O schema do banco e definido uma unica vez em
      <code>mysql-init</code> e compartilhado por todos. O Terraform provisiona as filas num
      container que roda uma vez e encerra.`,
    faz: [
      '<code>docker-compose.yml</code> com as imagens publicadas; o <code>-local.yml</code> faz build do codigo local',
      'Terraform: filas SQS e bucket S3 no LocalStack',
      '<code>mysql-init</code>: fonte unica do schema, incluindo as tabelas da CVM',
      'Observabilidade: Prometheus, Grafana e a pilha ELK',
      '<code>GLOSSARIO.md</code>: fonte canonica do vocabulario que a aba Glossario espelha',
    ],
    naoFaz: 'Nao contem codigo de aplicacao; os quatro projetos sao pastas irmas.',
  },
];

const FONTES_EXTERNAS = [
  {
    nome: 'BRAPI',
    url: 'https://brapi.dev',
    usa: 'gestor-ativos-brutos',
    entrega: 'Cotacao em tempo quase real, historico OHLCV diario e perfil da empresa',
    limite: 'No plano gratuito, historico so ate 3 meses. Multiplos e demonstracoes sao pagos',
  },
  {
    nome: 'CVM Dados Abertos',
    url: 'https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp',
    usa: 'etl-fundamentos-cvm',
    entrega: 'DFP, ITR, FCA e FRE — demonstracoes financeiras completas e auditadas',
    limite: 'Gratuito e sem limite de requisicao. Sai em lote, nao em tempo real',
  },
];

export class ArquiteturaPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Arquitetura</h4>
      <p class="text-muted small">
        O que o ecossistema faz hoje. Cinco pecas independentes, cada uma com uma
        responsabilidade unica, com link para o codigo e para a imagem publicada.
        Termos desconhecidos estão no <a href="#/glossario">Glossário</a>.
      </p>

      ${diagrama()}
      ${caminhoDoDado()}

      <h5 class="mt-4 mb-3">As cinco pecas</h5>
      ${PECAS.map((p) => renderPeca(p)).join('')}

      <h5 class="mt-4 mb-3">De onde vem o dado</h5>
      ${renderFontes()}
    `;
  }
}

function diagrama() {
  return `
    <pre class="small bg-body-tertiary p-3 rounded mb-3" style="white-space: pre-wrap;">Front (este app) --HTTP--> Java (gestor-ativos-brutos) --HTTP--> BRAPI
                                      |                         (cotacao, historico)
                                      v
                                SQS (LocalStack)
                                      |
                                      v
                          Python (gerar-insights) --grava--> MySQL
                                                              ^  ^
CVM (dados abertos) --HTTP--> Python (etl-fundamentos-cvm) ---+  |
                              (lote semanal)                     |
                                                                 |
                      Java le o MySQL e devolve pro Front --------+</pre>
  `;
}

function caminhoDoDado() {
  const passos = [
    'Você cadastra um ticker na aba Gestão; o gestor grava em <code>ativo_monitorado</code>.',
    'A cada 30s o agendador consulta a BRAPI e publica cotacao e historico em duas filas SQS.',
    'O gerar-insights consome as filas, grava o snapshot e calcula Graham e o sinal tecnico.',
    'Semanalmente o etl-fundamentos-cvm baixa as demonstracoes da CVM e grava os indicadores contabeis.',
    'O gestor le o MySQL, deriva P/L e P/VP com o preco mais recente e devolve tudo pronto.',
    'Este front so exibe.',
  ];

  return `
    <div class="card shadow-sm mb-3">
      <div class="card-header"><strong>O caminho do dado, do cadastro ate a tela</strong></div>
      <div class="card-body">
        <ol class="small mb-0">
          ${passos.map((p) => `<li class="mb-1">${p}</li>`).join('')}
        </ol>
      </div>
    </div>
  `;
}

function renderPeca(p) {
  return `
    <div class="card shadow-sm mb-3">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span>
          <strong>${p.numero}. ${p.papel}</strong>
          <code class="ms-2">${p.nome}</code>
        </span>
        <span class="d-flex gap-2 align-items-center">
          ${p.porta !== '—' ? `<span class="badge bg-light text-dark">porta ${p.porta}</span>` : ''}
          <a class="btn btn-outline-dark btn-sm" target="_blank" rel="noopener"
             href="${GITHUB}/${p.repo}">GitHub</a>
          <a class="btn btn-outline-primary btn-sm" target="_blank" rel="noopener"
             href="${DOCKERHUB}/${p.imagem}">Docker Hub</a>
        </span>
      </div>
      <div class="card-body">
        <p class="small text-muted mb-2"><em>${p.stack}</em></p>
        <p class="small">${p.descricao}</p>
        <div class="row row-cols-1 row-cols-lg-2 g-2 small">
          <div class="col">
            <span class="text-muted">O que faz:</span>
            <ul class="mb-0 ps-3">
              ${p.faz.map((f) => `<li>${f}</li>`).join('')}
            </ul>
          </div>
          <div class="col">
            <span class="text-muted">O que nao faz:</span>
            <p class="mb-0">${p.naoFaz}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFontes() {
  const linhas = FONTES_EXTERNAS.map(
    (f) => `
      <tr>
        <td class="fw-semibold">
          <a href="${f.url}" target="_blank" rel="noopener">${f.nome}</a>
        </td>
        <td><code class="small">${f.usa}</code></td>
        <td class="small">${f.entrega}</td>
        <td class="small text-muted">${f.limite}</td>
      </tr>`,
  ).join('');

  return `
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <p class="small text-muted mb-2">
          Duas fontes externas com papeis complementares: a BRAPI da o preco de agora, a CVM da
          o balanco auditado. O detalhamento do que e gratis em cada uma esta na aba
          <a href="#/formulas">Fórmulas</a>.
        </p>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead><tr><th>Fonte</th><th>Usada por</th><th>Entrega</th><th>Limite</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

customElements.define('arquitetura-page', ArquiteturaPage);
