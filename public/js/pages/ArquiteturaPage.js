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
      relativo. O mesmo servidor tambem fala direto com uma fonte externa (Google News) para
      manchetes por ticker, sem chave.`,
    faz: [
      'Consulta de ativo: cotacao, decisao, fundamentos da CVM e historico',
      'Cadastro de ativo no monitoramento recorrente, com linha expansivel (cotacao + decisao + fundamentos + noticias) em Monitorados e Setores',
      'Setores (comparacao setorial) e Indices macro (Selic, CDI, IPCA, IGP-M, dolar, IBC-Br, desemprego)',
      'Aba dedicada de Noticias por ativo, com busca livre para qualquer ticker',
      'Grafico de candles com range selecionavel',
      'Referencia: formulas, arquitetura, design de codigo e glossario; avaliacao publica do proprio ecossistema',
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
    descricao: `A porta de entrada HTTP do ecossistema. Fala com a BRAPI (cotacao/historico) e,
      desde 27-09-2026, direto com endpoints publicos da B3 (proventos) e com o Banco Central e o
      IBGE (indices macro). Publica o dado bruto em filas SQS e le o MySQL pra devolver analises
      prontas. Schema agora e fonte unica versionada (Flyway, migrations V1-V8 em
      <code>infra-b3-ecossytem</code>) - o Hibernate roda em <code>ddl-auto=validate</code>, so
      confere, nunca altera tabela em runtime.`,
    faz: [
      '<code>GET /ativos/{ticker}</code> e <code>/ativos/robusto/{ticker}</code> — consulta na BRAPI e publica em SQS',
      '<code>POST /ativos/registrar/{ticker}</code> — entra no monitoramento recorrente',
      '<code>GET /analises/{ticker}/analise</code>, <code>/fundamentos</code> e <code>/fundamentos-cvm</code> — decisao, retrato bruto e fundamentos contabeis',
      '<code>GET /setores</code>, <code>/indices-macro/{codigo}</code> e <code>/proventos/{ticker}</code> — comparacao setorial, series do BCB/IBGE e dividendos/JCP da B3',
      'Cache de preco anterior/atual por ativo (so anda quando o preco de fato muda, nao a cada ciclo)',
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
    descricao: `Worker sem API propria: fica consumindo filas SQS. Para cada cotacao que chega,
      grava o snapshot, calcula o valuation de Graham (desde 27-09-2026, com ajuste de juros -
      Selic - e LPA normalizado por 3-5 anos, ver Design de codigo) e, quando ha serie historica
      suficiente, deriva o sinal tecnico. Roda tambem um backtest walk-forward e um diario de
      sinais (paper trading) que gravam evidencia de acerto contra a taxa-base, nao so a
      recomendacao.`,
    faz: [
      'Consome <code>tratar-ativos</code> e <code>sqs-registrar-series-historicas</code>',
      'Grava <code>historico_acoes</code> e <code>serie_historica</code> (esta com upsert por dia)',
      'Calcula preco justo de Graham (ajustado por juros), Graham Number e margem de seguranca',
      'Deriva sinal de momentum e de reversao a media',
      '<code>python -m app.validacao.backtest</code> e <code>diario</code> — mede a regra de producao contra a taxa-base, o CDI e a media da carteira, agora com proventos somados ao retorno',
    ],
    naoFaz: 'So chama API externa pra ler tabelas de outros donos (candle_diario, indice_macro, provento_distribuido) no mesmo MySQL - nao fala HTTP com nada de fora.',
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
    descricao: `Orquestra tudo: MySQL, LocalStack (simula SQS localmente), os quatro servicos
      acima e a pilha de observabilidade. Schema com duas camadas: <code>mysql-init</code> pra
      volume novo e <code>mysql-migrations</code> (Flyway, V2 a V8) pra volume existente -
      qualquer tabela nova (proventos, backtest, identidade de ativo) entra nas duas. O Terraform
      provisiona as filas num container que roda uma vez e encerra.`,
    faz: [
      '<code>docker-compose.yml</code> com as imagens publicadas; o <code>-local.yml</code> faz build do codigo local',
      'Terraform: filas SQS no LocalStack',
      '<code>mysql-init</code> + <code>mysql-migrations</code> (Flyway): fonte unica de schema, sem o Hibernate criar tabela em runtime',
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
  {
    nome: 'Banco Central (SGS) e IBGE (SIDRA)',
    url: 'https://api.bcb.gov.br',
    usa: 'gestor-ativos-brutos',
    entrega: 'Selic, CDI, IPCA, IGP-M, dolar PTAX, IBC-Br e desemprego — sem chave, sem custo',
    limite: 'Nenhum limite documentado. Series mensais/diarias, nao intraday',
  },
  {
    nome: 'B3 (endpoint publico nao-oficial)',
    url: 'https://sistemaswebb3-listados.b3.com.br',
    usa: 'gestor-ativos-brutos',
    entrega: 'Proventos (dividendo/JCP) por emissora, confirmado navegando o proprio site da B3',
    limite: 'So devolve os ultimos ~12 meses por consulta; nao documentado oficialmente pela B3',
  },
];

export class ArquiteturaPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Arquitetura</h4>
      <p class="text-muted small">
        O que o ecossistema faz hoje, em nivel de negocio. Cinco pecas independentes, cada uma com
        uma responsabilidade unica, com link para o codigo e para a imagem publicada. Termos
        desconhecidos estão no <a href="#/glossario">Glossário</a>; o detalhamento tecnico (stack,
        camadas, contratos entre servicos) esta em <a href="#/design-codigo">Design de código</a>.
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
    <pre class="small bg-body-tertiary p-3 rounded mb-3" style="white-space: pre-wrap;">Front (este app) --HTTP--> Java (gestor-ativos-brutos) --HTTP--> BRAPI (cotacao, historico)
                                      |                    +--HTTP--> B3 (proventos, sem chave)
                                      |                    +--HTTP--> Banco Central + IBGE (indices macro)
                                      v
                                SQS (LocalStack)
                                      |
                                      v
                          Python (gerar-insights) --grava--> MySQL <--- Flyway (mysql-migrations)
                                                              ^  ^        aplica schema versionado
CVM (dados abertos) --HTTP--> Python (etl-fundamentos-cvm) ---+  |
                              (lote semanal)                     |
                                                                 |
                      Java le o MySQL e devolve pro Front --------+

gerar-insights tambem roda backtest.py e diario.py (paper trading): leem
MySQL, nao chamam API nenhuma, e gravam evidencia de acerto contra a
taxa-base em backtest_placar/sinal_resultado.</pre>
  `;
}

function caminhoDoDado() {
  const passos = [
    'Você cadastra um ticker na aba Gestão; o gestor grava em <code>ativo_monitorado</code>.',
    'A cada 30s o agendador consulta a BRAPI e publica cotacao e historico em duas filas SQS; 1x/dia consulta a B3 (proventos) e o BCB/IBGE (indices macro).',
    'O gerar-insights consome as filas, grava o snapshot e calcula Graham (ajustado por juros), LPA normalizado e o sinal tecnico.',
    'Semanalmente o etl-fundamentos-cvm baixa as demonstracoes da CVM e grava os indicadores contabeis.',
    'O gestor le o MySQL, deriva P/L e P/VP com o preco mais recente e devolve tudo pronto.',
    'Diariamente, backtest.py e diario.py medem a regra de producao contra a taxa-base, o CDI e a media da carteira, com proventos somados ao retorno.',
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
