import { BaseComponent } from '../components/base/BaseComponent.js';
import '../components/DiarioDeSinais.js';
import '../components/SaudeDosDados.js';
import '../components/BacktestPlacar.js';
import '../components/PlacarRanking.js';

// Unica responsabilidade: reunir a evidencia que permite julgar o ecossistema.
// A pagina nao recalcula nota nem promove regra: ela mostra o placar vivo
// (saude, backtest, ranking e diario), explicita o que ja e utilizavel e o que
// ainda depende de evidencia real. Operabilidade detalhada fica em #/operabilidade.

const AVALIADO_EM = '13-10-2026';
const AVISO =
  'Regra experimental. Simulação e backtest não são recomendação de investimento nem autorização para capital real.';

const VEREDITOS = [
  {
    titulo: 'Uso recomendado hoje',
    valor: 'Pesquisa, triagem e auditoria',
    classe: 'text-bg-primary',
    texto:
      'O painel junta fundamentos, comunicados, candles com análise técnica de 3 horizontes, opinião por horizonte, IA, operabilidade e validação. Serve para explicar evidências e lacunas, não para executar ordem.',
  },
  {
    titulo: 'Dinheiro real',
    valor: 'Ainda não',
    classe: 'text-bg-danger',
    texto:
      'Antes disso o diário operacional precisa acumular 3 a 6 meses de amostra, vencer CDI líquido de custos, respeitar drawdown e passar pela trava de operabilidade.',
  },
  {
    titulo: 'Sinal técnico',
    valor: 'Contexto e análise visual',
    classe: 'text-bg-warning',
    texto:
      'Momentum e reversão entram em placar próprio. O painel de Velas agora oferece 14 overlays de análise técnica (curto/médio/longo prazo), mas o sinal continua contexto — sem vantagem robusta medida.',
  },
  {
    titulo: 'Confiança',
    valor: 'Não calibrada',
    classe: 'text-bg-secondary',
    texto:
      'A curva já é extraível do diário, mas a UX deve tratar o score como não calibrado até execução real e DEC de recalibração ou remoção.',
  },
];

const PILARES = [
  {
    titulo: 'Dados',
    nota: 8,
    meta: 8,
    status: 'Bom, ainda auditável',
    texto:
      'CVM, COTAHIST amplo, Banco Central, proventos B3 + DVA/CVM e saúde das fontes aparecem em tela. A nota ainda depende de estabilidade por ciclos e de reduzir pendências por ticker antigo.',
    proximo:
      'Para subir: zerar aliases/tickers sem balanço, manter fontes verdes por várias rotinas e evidenciar cobertura por ano no painel.',
  },
  {
    titulo: 'Backtest',
    nota: 7,
    meta: 8,
    status: 'Amplo, com IC',
    texto:
      'O walk-forward já usa universo amplo point-in-time, deslistadas, COTAHIST 2016–2026, proventos históricos e IC. O resultado atual é honesto: não há vantagem robusta distinguível.',
    proximo:
      'Para subir: publicar execuções recorrentes, comparar versões técnicas no banco real e registrar decisões só quando o IC ficar todo acima da base.',
  },
  {
    titulo: 'Ranking / LAC',
    nota: 6,
    meta: 8,
    status: 'Experimental',
    texto:
      'O ranking mede ordenação por quintil e correlação, com hipótese registrada. É evidência melhor que olhar só classes, mas ainda precisa repetição real em janelas sucessivas.',
    proximo:
      'Para subir: validar depois do backfill completo, mostrar histórico de execuções e exigir correlação com IC acima de zero em mais de uma janela.',
  },
  {
    titulo: 'Diário real',
    nota: 4,
    meta: 8,
    status: 'Coletando',
    texto:
      'É a prova mais importante: sinais gravados antes do resultado. Enquanto a amostra for pequena, o painel deve preferir "inconclusivo".',
    proximo:
      'Para subir: acumular 3 a 6 meses, exibir curva do score por faixa e provar excesso contra base/CDI sem cruzar o intervalo.',
  },
  {
    titulo: 'Operabilidade',
    nota: 5,
    meta: 8,
    status: 'Paper trading V2',
    texto:
      'OPR v1 no painel com card enriquecido (retorno líquido, CDI, excesso, drawdown, patrimônio, posições, pregões). V2 em integração: status por ticker, bloqueios, timeline, consenso, tese, custos e IR estimado.',
    proximo:
      'Para subir: rodar migrations V25/V26, acumular diário, confirmar retorno líquido > CDI após custos e bloquear corretamente por liquidez/dado/evento.',
  },
  {
    titulo: 'IA',
    nota: 5,
    meta: 7,
    status: 'Assistente e card',
    texto:
      'O front consome chat, pacote do ativo, leitura e resumo de manchetes. A IA deve explicar fontes e limites; não gera opinião pelo painel.',
    proximo:
      'Para subir: validar com serviço real, mostrar fontes citadas de forma consistente e medir falhas/latência sem misturar IA com recomendação operacional.',
  },
];

const CRITERIOS_PROMOCAO = [
  'Backtest fora da amostra com limite inferior do IC acima da taxa-base, do CDI ou da carteira, conforme o tipo de regra.',
  'Diário de sinais com amostra mínima por horizonte e leitura acima da base sem cruzar o intervalo por 3 a 6 meses.',
  'Operabilidade com janela mínima, retorno líquido acima do CDI depois de custos/IR, drawdown dentro do limite e zero violação crítica.',
  'Versão de regra nova quando qualquer sinal passar a alterar recomendação, sizing ou status operacional.',
  'Aviso legal e texto conservador em todas as telas: sinal analítico não é ordem, operabilidade não é recomendação.',
];

const STATUS_TRILHAS = [
  {
    trilha: 'Fundamentalista / valuation',
    estado: 'Principal, mas experimental',
    detalhe:
      'Segue como regra auditável, com backtest e diário. O universo amplo mostrou que ainda não há vantagem robusta para promover capital real.',
  },
  {
    trilha: 'Técnica',
    estado: 'Contexto separado',
    detalhe:
      'Momentum e reversão têm versões próprias no placar. Candles ganhou painel com 14 overlays (Pivôs S/R, Canal, Fibonacci, NR7, OCO, Triângulo, Bandeira, Tendência, Wyckoff, Elliott e outros), mas o sinal não mexe na recomendação sem DEC e evidência favorável.',
  },
  {
    trilha: 'Gráficos / análise técnica',
    estado: 'Entregue — curto/médio/longo',
    detalhe:
      'Painel lateral com 3 abas (Padrões de velas · Técnico · Notícias). 14 overlays ativáveis individualmente em 3 horizontes. Linhas diagonais (triângulo, bandeira, tendência, copa) sobre o gráfico lightweight-charts.',
  },
  {
    trilha: 'IA / Gemini',
    estado: 'Explicação e leitura',
    detalhe:
      'O painel lê resultados do serviço de IA, mostra card e conversa. Não chama rotas de geração de opinião nem reindexa.',
  },
  {
    trilha: 'OPR / paper trading',
    estado: 'Em observação',
    detalhe:
      'Tela de Operabilidade mostra operações simuladas, custos, IR estimado, bloqueios e status do sistema; V2 adiciona visão por ticker. Card "Paper trading real" exibe retorno líquido, CDI, excesso, drawdown, patrimônio e período.',
  },
  {
    trilha: 'Confiança do score',
    estado: 'Não calibrada',
    detalhe:
      'A curva real já tem base técnica para extração, mas ainda falta execução real e decisão documentada.',
  },
];

const ENTREGAS_RECENTES = [
  {
    area: 'Simulador / Cenário',
    item: 'Cards comparativos acumuláveis',
    detalhe: 'Cada simulação gera um card persistido em sessionStorage. Seletor de estratégia, badge CDI, P&L em 4 capitais, idade da simulação e remoção individual.',
  },
  {
    area: 'Simulador / Cenário',
    item: 'Validação entrada + janela futura',
    detalhe: 'Bloqueia envio quando data de entrada + janela (em pregões ≈ 7/5 dias) projeta saída futura — evita simulação sem cotações reais.',
  },
  {
    area: 'Simulador / Estratégias',
    item: 'Combobox de ativos e Universo completo',
    detalhe: 'Consulta rápida trocada por combobox filtrado por símbolo/nome. Seção "Universo completo" com filtros por Setor e UF.',
  },
  {
    area: 'Paper trading',
    item: 'Card enrichment',
    detalhe: 'Card "Paper trading real" exibe agora todos os campos disponíveis do /operacional/resumo em dois blocos: performance e posição.',
  },
  {
    area: 'Candles',
    item: '14 overlays de análise técnica',
    detalhe: 'Painel lateral com 3 abas. Curto: Pivôs S/R, Canal, Fibonacci, NR7/IB. Médio: OCO, Topo/Fundo Duplo, Triângulo, Bandeira, Fib+Extensão. Longo: Tendência, Canal, Wyckoff, Copa, Elliott.',
  },
  {
    area: 'Candles',
    item: 'Notícias integradas na aba lateral',
    detalhe: 'Comunicados CVM saem do offcanvas e entram na aba Notícias. Clique em vela abre a aba automaticamente com badge de total.',
  },
  {
    area: 'Seletor de ativos',
    item: 'Combobox em 4 páginas',
    detalhe: 'SeletorDeAtivos reescrito: chips removidos, campo único com dropdown filtrado por símbolo (startsWith) ou nome (includes). Afeta Velas, Consulta, Comunicados e Opções.',
  },
];

const OPORTUNIDADES_GRATUITAS = [
  {
    campo: 'perfilEmpresa.longBusinessSummary / website / fullTimeEmployees',
    onde: '/analises/{s}/fundamentos — já buscado',
    impacto: 'Exibir "Sobre a empresa" na ficha do ativo: descrição do negócio, site e número de funcionários. Zero chamada extra de API.',
  },
  {
    campo: 'opiniaoApi — curto / médio / longo prazo',
    onde: '/ativos/{s}/opiniao — só usado na ConsultaPage',
    impacto: 'Adicionar badge de opinião por horizonte no card de favoritos (InicioPage) e na linha da tabela AtivosPage. Dados já existem; basta consumir onde o usuário passa mais tempo.',
  },
  {
    campo: 'buscarTickers → tese e consenso por ticker',
    onde: '/operacional/tickers — funções existem, nenhum componente de lista as usa',
    impacto: 'Mostrar tese textual e consenso de estratégias diretamente na tabela de Ativos Monitorados. Endpoint já chamado; campos ignorados.',
  },
  {
    campo: 'resumo.dataMaxima / dataMinima (pregões banco)',
    onde: '/ativos/{s}/pregoes — buscado e ignorado na ConsultaPage',
    impacto: 'Exibir "Máxima histórica em DD/MM" e "Mínima histórica em DD/MM" na ficha do ativo — referência de amplitude sem custo algum.',
  },
  {
    campo: 'IndicesMacroPage — série histórica sem gráfico',
    onde: '/indices-macro/{codigo} — 8 séries com 6+ pontos históricos',
    impacto: 'Trocar a tabela de números por sparklines inline (lightweight-charts já carregado). Mesmo dado, visualização drasticamente mais clara.',
  },
  {
    campo: 'coberturaJson — razão de campos nulos nos fundamentos CVM',
    onde: '/analises/{s}/fundamentos-cvm — chega mas nunca exibido',
    impacto: 'Mostrar tooltip "Por que este campo está vazio?" nas métricas nulas da aba Fundamentos. Reduz a impressão de dado incompleto sem explicação.',
  },
];

export class AvaliacaoPage extends BaseComponent {
  template() {
    return `
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <h4 class="mb-1">Avaliação do sistema</h4>
          <p class="text-muted small mb-0">
            Cockpit de evidências: dados, backtest, ranking, diário, operabilidade e IA.
            <span class="badge text-bg-light border">Atualizado em ${AVALIADO_EM}</span>
          </p>
        </div>
        <a class="btn btn-sm btn-outline-primary" href="#/operabilidade">Abrir operabilidade</a>
      </div>

      <div class="alert alert-warning small" role="note">${AVISO}</div>

      ${secao('Veredito executivo', renderVereditos())}

      ${secao('Notas por pilar', renderPilares(), `
        <p class="small text-muted">
          As notas abaixo são de maturidade da plataforma, não de retorno esperado. Elas só sobem com
          evidência medida, contrato estável e execução real. São editoriais e datadas, não notas automáticas.
        </p>`)}

      <div class="row g-3 mb-4">
        <div class="col-lg-6">
          <section class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Saúde dos dados</h5>
              <p class="small text-muted">Idade, cobertura, proventos, preço oficial e pendências por ativo.</p>
              <saude-dos-dados></saude-dos-dados>
            </div>
          </section>
        </div>
        <div class="col-lg-6">
          <section class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Critérios para promover uma regra</h5>
              ${renderCriterios()}
            </div>
          </section>
        </div>
      </div>

      ${secao('Entregas recentes', renderEntregas(), `
        <p class="small text-muted">Funcionalidades entregues nesta e na sprint anterior. Nenhuma altera regras operacionais ou backtest.</p>`)}

      ${secao('Oportunidades de enriquecimento gratuito', renderOportunidades(), `
        <p class="small text-muted">
          Dados que <strong>já chegam nos payloads existentes</strong> mas não são exibidos na UI.
          Cada item pode ser implementado sem nenhuma nova rota no backend.
        </p>`)}

      ${secao('Backtest walk-forward', `
        <div class="card shadow-sm"><div class="card-body"><backtest-placar></backtest-placar></div></div>`, `
        <p class="small text-muted">
          Mede o sinal com dados point-in-time, entrada na abertura seguinte e comparação com CDI e carteira.
          Leia o intervalo de confiança antes do número pontual.
        </p>`)}

      ${secao('Ranking / Plano LAC', `
        <div class="card shadow-sm"><div class="card-body"><placar-ranking></placar-ranking></div></div>`, `
        <p class="small text-muted">
          Mede se a regra ordena ativos melhores acima dos piores. Correlação e quintis ajudam a evitar
          promoção por uma classe isolada.
        </p>`)}

      ${secao('Diário de sinais em tempo real', `
        <div class="card shadow-sm"><div class="card-body"><diario-de-sinais></diario-de-sinais></div></div>`, `
        <p class="small text-muted">
          A evidência mais honesta: o sistema grava o sinal antes de saber o resultado. Com pouca amostra,
          a leitura correta é "inconclusivo".
        </p>`)}

      ${secao('Estado das trilhas', renderStatusTrilhas())}
    `;
  }
}

function secao(titulo, conteudo, introducao = '') {
  return `
    <section class="mb-4">
      <h5 class="mb-2">${titulo}</h5>
      ${introducao}
      ${conteudo}
    </section>
  `;
}

function renderVereditos() {
  return `
    <div class="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3">
      ${VEREDITOS.map((v) => `
        <div class="col">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="small text-muted">${v.titulo}</div>
              <span class="badge ${v.classe} mb-2">${v.valor}</span>
              <p class="small mb-0">${v.texto}</p>
            </div>
          </div>
        </div>`).join('')}
    </div>
  `;
}

function corDaNota(nota) {
  return nota >= 7 ? 'bg-success' : nota >= 5 ? 'bg-warning' : 'bg-danger';
}

function renderPilares() {
  return `
    <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
      ${PILARES.map((p) => `
        <div class="col">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <h6 class="mb-1">${p.titulo}</h6>
                  <span class="badge text-bg-light border">${p.status}</span>
                </div>
                <div class="text-end fw-semibold">${p.nota}/10
                  <div class="small text-muted fw-normal">meta ${p.meta}</div>
                </div>
              </div>
              <div class="progress my-2" role="progressbar" aria-label="${p.titulo}"
                   aria-valuenow="${p.nota}" aria-valuemin="0" aria-valuemax="10" style="height: 6px">
                <div class="progress-bar ${corDaNota(p.nota)}" style="width: ${p.nota * 10}%"></div>
                <div class="progress-bar bg-secondary-subtle" style="width: ${Math.max(0, p.meta - p.nota) * 10}%"></div>
              </div>
              <p class="small text-muted mb-0">${p.texto}</p>
              <p class="small mb-0 mt-2"><strong>Próximo passo:</strong> ${p.proximo}</p>
            </div>
          </div>
        </div>`).join('')}
    </div>
  `;
}

function renderCriterios() {
  return `
    <ol class="small mb-0 ps-3">
      ${CRITERIOS_PROMOCAO.map((c) => `<li class="mb-1">${c}</li>`).join('')}
    </ol>
  `;
}

function renderEntregas() {
  const porArea = ENTREGAS_RECENTES.reduce((acc, e) => {
    (acc[e.area] ||= []).push(e);
    return acc;
  }, {});
  return `
    <div class="row row-cols-1 row-cols-md-2 g-3">
      ${Object.entries(porArea).map(([area, itens]) => `
        <div class="col">
          <div class="card h-100">
            <div class="card-header small fw-semibold py-1">${area}</div>
            <ul class="list-group list-group-flush small">
              ${itens.map((e) => `
                <li class="list-group-item py-2">
                  <strong>${e.item}</strong>
                  <div class="text-muted" style="font-size:11px">${e.detalhe}</div>
                </li>`).join('')}
            </ul>
          </div>
        </div>`).join('')}
    </div>
  `;
}

function renderOportunidades() {
  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle tabela-cartoes">
        <thead>
          <tr>
            <th>Campo disponível</th>
            <th>Origem</th>
            <th>Impacto estimado</th>
          </tr>
        </thead>
        <tbody>
          ${OPORTUNIDADES_GRATUITAS.map((o) => `
            <tr>
              <td data-label="Campo" class="fw-semibold small"><code>${o.campo}</code></td>
              <td data-label="Origem" class="small text-muted">${o.onde}</td>
              <td data-label="Impacto" class="small">${o.impacto}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderStatusTrilhas() {
  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle tabela-cartoes">
        <thead><tr><th>Trilha</th><th>Estado</th><th>Leitura correta</th></tr></thead>
        <tbody>
          ${STATUS_TRILHAS.map((t) => `
            <tr>
              <td data-label="Trilha" class="fw-semibold">${t.trilha}</td>
              <td data-label="Estado"><span class="badge text-bg-light border">${t.estado}</span></td>
              <td data-label="Leitura correta" class="small">${t.detalhe}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

customElements.define('avaliacao-page', AvaliacaoPage);
