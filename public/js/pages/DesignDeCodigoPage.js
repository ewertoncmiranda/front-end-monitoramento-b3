import { BaseComponent } from '../components/base/BaseComponent.js';

// Unica responsabilidade: descrever os 5 servicos em nivel totalmente
// tecnico (stack, camadas/pacotes, contratos entre servicos, decisoes de
// design) - complementa ArquiteturaPage (visao de negocio/produto) sem
// repetir o conteudo dela. Conteudo extraido do README de cada repositorio,
// nao reescrito do zero, para nao divergir da fonte-de-verdade de cada um.
// Estatico, sem chamada de API - mesmo padrao de FormulasPage/ArquiteturaPage.

const SERVICOS = [
  {
    nome: 'painel-ativos-frontend',
    stack: 'HTML + JS puro (ES modules), Web Components nativos (sem framework, sem bundler), Bootstrap 5 local, servidor Node/Express',
    decisoes: [
      'Sem build/bundler: <code>public/</code> e servido exatamente como esta - mais facil de empacotar num WebView.',
      'Zero CSS proprio: todo o visual vem de classes do Bootstrap; <code>app.css</code> so tem os 2 ajustes que o Bootstrap nao cobre.',
      'Web Components nativos, um por arquivo (SRP) - <code>components/</code> so renderiza, <code>pages/</code> so orquestra.',
      'Sem Shadow DOM, de proposito: o Bootstrap carregado uma vez em <code>index.html</code> precisa valer pra todos os componentes.',
      'Comunicacao por eventos customizados (<code>CustomEvent</code>) entre componentes de input e as paginas que os usam.',
      'Roteamento por hash (<code>#/rota</code>): funciona em qualquer hospedagem estatica e dentro de WebView sem configurar rewrite de URL.',
      'Servidor Node/Express com proxy reverso: o browser so chama caminho relativo na propria origem; o servidor decide pra onde mandar de verdade (elimina CORS). O mesmo servidor busca manchetes no Google News RSS direto (sem chave), convertendo XML pra JSON antes de responder ao browser.',
    ],
    estrutura: [
      ['public/js/api/', 'Um arquivo por grupo de endpoint (ativosApi, analisesApi, indicesMacroApi, setoresApi, noticiasApi...) - so <code>fetch</code>, sem logica.'],
      ['public/js/components/', 'Web Components de exibicao (cards, tabelas, formularios) - reaproveitados entre paginas (ex.: <code>AtivoQuoteCard</code> aparece em Consulta, Monitorados e Setores).'],
      ['public/js/pages/', 'Orquestram: buscam dado via <code>api/</code>, montam os componentes, tratam erro/loading.'],
      ['proxy/apiProxy.js', 'Registra o proxy reverso por rota (<code>/ativos</code>, <code>/analises</code>, <code>/setores</code>...) contra o backend Java.'],
      ['server.js', 'Entrypoint: sobe o Express, serve <code>public/</code>, liga o proxy, expoe <code>/noticias/:ticker</code> (fetch + parse de RSS, sem persistencia).'],
    ],
  },
  {
    nome: 'gestor-ativos-brutos',
    stack: 'Java 21, Spring Boot 3.3 (MVC + Actuator), Spring Data JPA/Hibernate, MySQL Connector/J, AWS SDK v2 (SQS), RestTemplate, ModelMapper, Micrometer/Prometheus, Logback/Logstash, Lombok',
    decisoes: [
      'Hibernate em <code>ddl-auto=validate</code> (nao <code>update</code>): o schema e fonte unica versionada (Flyway, <code>infra-b3-ecossytem/mysql-migrations</code>) - a app falha ao subir se uma entidade nao bater, em vez de alterar tabela em runtime.',
      'Cache-aside pra tudo que vem de fora (BRAPI, B3, BCB, IBGE): um <code>Servico*</code> escreve, agendadores decidem a cadencia, controllers so leem a tabela - nunca chamam a fonte externa na hora do clique.',
      'Cliente HTTP por fonte externa, todos no mesmo padrao (<code>ClienteBrApi</code>, <code>ClienteBancoCentral</code>, <code>ClienteIbgeSidra</code>, <code>ClienteB3Proventos</code>): <code>RestTemplate</code> proprio, sem SDK, parse tolerante a item malformado (um erro nao derruba a resposta inteira).',
    ],
    estrutura: [
      ['entrypoint/controller', 'Rotas REST e validacao basica da entrada.'],
      ['entrypoint/schedule', '<code>AgendadorCacheAtivos</code>: um <code>@Scheduled</code> por tipo de dado (cotacao 5s, historico 5min, perfil 1h, indices/proventos 24h) - cada um decide sozinho quem esta devido.'],
      ['service', 'Orquestra BRAPI/B3/BCB/IBGE, SQS, leitura das analises e a carteira de monitoramento.'],
      ['external/http', 'Um cliente por fonte externa (ver decisoes de design acima).'],
      ['external + external/dto', 'Entidades JPA e contratos de entrada/saida (DTOs com <code>record</code> pra respostas de API externa, <code>@Data</code>/<code>@Builder</code> pra DTOs proprios).'],
      ['repository', 'Spring Data JPA - uma interface por entidade, sem implementacao manual.'],
      ['tools', 'Serializacao, consolidacao e decisao deterministica (<code>MontadorDecisaoDeterministica</code>, <code>PerfilOperacaoClassificador</code>).'],
    ],
    endpoints: [
      ['GET /ativos/{ticker}', 'Consulta BRAPI + publica em <code>tratar-ativos</code> (GET com efeito colateral, conhecido)'],
      ['POST /ativos/registrar/{ticker}', 'Upsert em <code>ativo_monitorado</code>, dispara coleta imediata'],
      ['GET /analises/{ticker}/analise', 'Decisao consolidada por regras deterministicas'],
      ['GET /setores', 'Comparacao setorial - universo curado + cotacao do cache'],
      ['GET /indices-macro/{codigo}', 'Series do BCB (Selic/CDI/IPCA/IGP-M/dolar) e do IBGE (desemprego), mesma tabela <code>indice_macro</code>'],
      ['GET /proventos/{ticker}', 'Dividendo/JCP por emissora (<code>provento_distribuido</code>), normalizado por codigo de 4 letras da B3'],
    ],
  },
  {
    nome: 'gerar-insights',
    stack: 'Python 3, SQLAlchemy + PyMySQL, boto3, python-dotenv, python-json-logger',
    decisoes: [
      'Worker assincrono em loop infinito: consome SQS, sem API propria.',
      'Configuracao centralizada em <code>app/config/settings.py</code> - leitura de env com defaults seguros e validacao das obrigatorias, instanciada uma vez.',
      'Y do Graham ajustado = Selic meta vigente (nao CDI): e a unica taxa livre de risco que o ecossistema ja coleta. Sem Selic disponivel, o insight sai <code>SEM_DADOS</code> em vez de cair silenciosamente na formula sem ajuste.',
      'Motor de avaliacao unico (<code>app/validacao/avaliador.py</code>) compartilhado por backtest e diario: entrada na abertura do pregao seguinte ao sinal (nunca no proprio fechamento - viés de futuro), saida no fechamento do h-esimo pregao, custo de ida-e-volta descontado, proventos somados por data-com dentro da janela.',
      '<code>VERSAO_REGRA</code> gravada em todo insight: muda a regra, muda a versao - sinais de regras diferentes nunca caem no mesmo placar de acerto.',
      'Point-in-time estrito (<code>app/validacao/ponto_no_tempo.py</code>): no dia D so existe o balanco cuja data de entrega a CVM e <= D. Sem isso o backtest fica bonito e falso.',
    ],
    estrutura: [
      ['app/core/analysis/', 'Puro - <code>valuation.py</code> (Graham ajustado, LPA normalizado, Graham Number), <code>recommendation.py</code>, <code>limiares.py</code> (parametros versionados), <code>technical_series.py</code> (MM20, z-score, score de volume).'],
      ['app/core/service/', 'Orquestracao com I/O - <code>financial_analyzer_service.py</code> e o caminho real que gera o insight de producao.'],
      ['app/core/strategies/', '<code>MomentumStrategy</code>, <code>MeanReversionStrategy</code> - sinal tecnico, nao pesa na recomendacao principal ainda.'],
      ['app/validacao/', 'Backtest walk-forward, diario de sinais (paper trading), calibracao e o motor de avaliacao compartilhado pelos dois.'],
      ['app/external/', 'Fila SQS e persistencia (repositorios).'],
    ],
    contratos: [
      ['Consome', 'SQS <code>tratar-ativos</code> e <code>sqs-registrar-series-historicas</code> (publicadas pelo gestor)'],
      ['Grava', '<code>historico_acoes</code>, <code>serie_historica</code> (upsert por dia), <code>insight_acao</code>'],
      ['Le (tabelas de outros donos)', '<code>candle_diario</code>, <code>indice_macro</code>, <code>indicador_fundamentalista</code>, <code>ativo_identidade</code>, <code>cotacao_b3_diaria</code>, <code>provento_distribuido</code> - todas do gestor/ETL, lidas por SQL explicito, nunca por entidade ORM propria (evita virar segundo dono do schema)'],
    ],
  },
  {
    nome: 'etl-fundamentos-cvm',
    stack: 'Python 3.12, arquitetura hexagonal (portas e adaptadores), zero framework web',
    decisoes: [
      'Job em lote, nao servico: roda, grava e encerra - container dormindo e um scheduler ruim, o agendamento fica fora (cron do host).',
      'Camadas com dependencia apontando pra dentro: nada em <code>dominio/</code> ou <code>aplicacao/</code> importa SQLAlchemy, boto3, urllib ou zipfile.',
      'Chave estavel entre companhias: <code>ST_CONTA_FIXA=\'S\'</code> + <code>DS_CONTA</code> (descricao padronizada da CVM), com <code>CD_CONTA</code> so como desempate - o codigo de conta sozinho muda de significado entre empresas e setores.',
      'Denominador de LPA/VPA vem do FRE (<code>capital_social</code>), nao do DFP: unidade consistente entre companhias (DFP mistura unidade e milhar).',
      'Idempotencia em 3 camadas: <code>HEAD</code> antes de <code>GET</code> (ETag), cache de ZIP em volume, <code>INSERT ... ON DUPLICATE KEY UPDATE</code> em lote.',
      'DI por construtor com argumentos obrigatorios - sem <code>x or ClasseConcreta()</code>, que tornaria a injecao opcional e reacoplaria pelo default.',
    ],
    estrutura: [
      ['app/dominio/', 'Puro, zero I/O, testavel sem banco/rede/arquivo - <code>modelo.py</code>, <code>plano_contas/</code> (classificador de conta), <code>calculo/</code> (indicadores).'],
      ['app/portas/', 'Protocols - o que aplicacao/dominio conhecem, sem depender do adaptador concreto.'],
      ['app/adaptadores/', 'cvm/ (HTTP, cache, ZIP/CSV), persistencia/ (entidades, repositorios, unidade de trabalho), mensageria/ (SQS).'],
      ['app/aplicacao/', 'Caso de uso - orquestra as portas.'],
      ['main.py', 'Composition root - so instancia e injeta.'],
    ],
    contratos: [
      ['Persistencia', '<code>fato_contabil</code> (landing crua, so a whitelist do de-para) &rarr; <code>indicador_fundamentalista</code> (mart, unico contrato de leitura pro gestor)'],
      ['Universo', 'Le <code>ativo_monitorado</code> (mesma tabela que o gestor popula) - um lugar so pra escolher ativo'],
      ['Schema', 'De fora - <code>infra-b3-ecossytem/mysql-init</code>. Este app nao cria nem altera tabela'],
    ],
  },
  {
    nome: 'infra-b3-ecossytem',
    stack: 'Docker Compose, Terraform (LocalStack), Flyway (migrations standalone), MySQL 8',
    decisoes: [
      'Duas camadas de schema: <code>mysql-init/1 - schema.sql</code> pra volume novo (cria tudo do zero), <code>mysql-migrations/</code> (Flyway V2-V8) pra volume existente - toda tabela nova entra nas duas, senao diverge.',
      'Flyway roda como container standalone no compose (nao integrado ao Spring Boot do gestor) - separa "quem cria o schema" de "quem le/escreve nele".',
      'SQS/LocalStack simula fila real sem custo AWS - Terraform provisiona uma vez, container encerra.',
      'S3 e Gemini (LLM) foram removidos do ecossistema (2026-09-25): a decisao consolidada e 100% regras deterministicas, sem chamada externa de IA.',
    ],
    estrutura: [
      ['infra/', 'Terraform - filas SQS (modulo <code>sqs/</code>).'],
      ['mysql-init/', 'Schema completo pra banco novo.'],
      ['mysql-migrations/', 'Flyway - uma versao por mudanca incremental (V2 dedup, V3 comunicados, V4 diario de sinais, V5 benchmark carteira, V6 identidade/point-in-time/backtest, V7 tabelas que so existiam via Hibernate, V8 proventos).'],
      ['docker-compose.yml / -local.yml', 'Orquestracao - o <code>-local</code> builda a partir do codigo local em vez de puxar imagem publicada.'],
    ],
    contratos: [
      ['Filas SQS', '<code>tratar-ativos</code>, <code>sqs-registrar-series-historicas</code>'],
      ['MySQL', 'Fonte unica de schema pra gestor, gerar-insights e etl-fundamentos-cvm'],
    ],
  },
];

export class DesignDeCodigoPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Design de código</h4>
      <p class="text-muted small">
        Detalhamento técnico dos 5 serviços - stack, camadas/pacotes e contratos entre eles.
        Extraído do <code>README.md</code> de cada repositório, não reescrito do zero (evita
        divergir da fonte). Visão de negócio/produto está em
        <a href="#/arquitetura">Arquitetura</a>; vocabulário em <a href="#/glossario">Glossário</a>.
      </p>

      ${SERVICOS.map((s) => renderServico(s)).join('')}
    `;
  }
}

function renderServico(s) {
  return `
    <div class="card shadow-sm mb-3">
      <div class="card-header"><code>${s.nome}</code></div>
      <div class="card-body">
        <p class="small text-muted mb-3"><em>${s.stack}</em></p>

        <h6 class="small text-uppercase text-muted">Decisões de design</h6>
        <ul class="small mb-3">${s.decisoes.map((d) => `<li>${d}</li>`).join('')}</ul>

        <h6 class="small text-uppercase text-muted">Estrutura / camadas</h6>
        <div class="table-responsive mb-3">
          <table class="table table-sm mb-0">
            <tbody>
              ${s.estrutura.map(([caminho, resp]) => `
                <tr><td class="fw-semibold text-nowrap"><code>${caminho}</code></td><td class="small">${resp}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${s.endpoints ? `
          <h6 class="small text-uppercase text-muted">Endpoints</h6>
          <div class="table-responsive mb-1">
            <table class="table table-sm mb-0">
              <tbody>
                ${s.endpoints.map(([rota, desc]) => `
                  <tr><td class="text-nowrap"><code>${rota}</code></td><td class="small">${desc}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${s.contratos ? `
          <h6 class="small text-uppercase text-muted">Contratos entre serviços</h6>
          <div class="table-responsive">
            <table class="table table-sm mb-0">
              <tbody>
                ${s.contratos.map(([tipo, desc]) => `
                  <tr><td class="fw-semibold text-nowrap">${tipo}</td><td class="small">${desc}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

customElements.define('design-codigo-page', DesignDeCodigoPage);
