import { BaseComponent } from '../components/base/BaseComponent.js';
import '../components/DiarioDeSinais.js';
import '../components/SaudeDosDados.js';
import '../components/BacktestPlacar.js';
import '../components/PlacarRanking.js';

// Unica responsabilidade: reunir a evidencia que permite julgar o ecossistema.
// A pagina nao recalcula nota nem promove regra: ela mostra o placar vivo
// (saude, backtest, ranking e diario), explicita o que ja e utilizavel e o que
// ainda depende de evidencia real. Operabilidade detalhada fica em #/operabilidade.

const AVALIADO_EM = '11-10-2026';
const AVISO =
  'Regra experimental. Simulação e backtest não são recomendação de investimento nem autorização para capital real.';

const VEREDITOS = [
  {
    titulo: 'Uso recomendado hoje',
    valor: 'Pesquisa, triagem e aprendizado',
    classe: 'text-bg-primary',
    texto:
      'O painel junta fundamentos, comunicados, candles, opinião por horizonte, IA e validação. Serve para explicar o que olhar, não para executar ordem.',
  },
  {
    titulo: 'Dinheiro real',
    valor: 'Ainda não',
    classe: 'text-bg-danger',
    texto:
      'Antes disso o diário operacional precisa acumular amostra, vencer CDI líquido de custos, respeitar drawdown e passar pela trava de operabilidade.',
  },
  {
    titulo: 'Sinal técnico',
    valor: 'Separado da recomendação',
    classe: 'text-bg-warning',
    texto:
      'Momentum e reversão existem como contexto e placar próprio. Pela DEC-11, não entram na recomendação principal sem placar real com IC favorável.',
  },
  {
    titulo: 'Confiança',
    valor: 'Não calibrada',
    classe: 'text-bg-secondary',
    texto:
      'O score já pode ter curva real extraída do diário, mas a UX deve tratá-lo como não calibrado até execução real e DEC de recalibração ou remoção.',
  },
];

const PILARES = [
  {
    titulo: 'Dados',
    nota: 7,
    meta: 8,
    status: 'Em observação',
    texto:
      'CVM, COTAHIST, Banco Central, proventos e saúde das fontes aparecem em tela. A qualidade sobe quando cobertura, idade e divergências ficam verdes por vários ciclos.',
  },
  {
    titulo: 'Backtest',
    nota: 6,
    meta: 8,
    status: 'Com IC',
    texto:
      'O placar walk-forward mostra acerto, taxa-base, CDI, carteira e intervalo de confiança. Vantagem só conta quando o intervalo não cruza a base.',
  },
  {
    titulo: 'Ranking / LAC',
    nota: 5,
    meta: 8,
    status: 'Experimental',
    texto:
      'O ranking mede ordenação por quintil e correlação. É uma evidência melhor que olhar só classes, mas ainda precisa repetição em janelas sucessivas.',
  },
  {
    titulo: 'Diário real',
    nota: 4,
    meta: 8,
    status: 'Coletando',
    texto:
      'É a prova mais importante: sinais gravados antes do resultado. Enquanto a amostra for pequena, o painel deve preferir “inconclusivo”.',
  },
  {
    titulo: 'Operabilidade',
    nota: 4,
    meta: 8,
    status: 'Paper trading',
    texto:
      'Já existe tela própria para status, retorno líquido, CDI, drawdown, operações, bloqueios e IR estimado. Falta maturidade operacional acumulada.',
  },
  {
    titulo: 'IA',
    nota: 5,
    meta: 7,
    status: 'Assistente e card',
    texto:
      'O front consome chat, pacote do ativo, leitura e resumo de manchetes. A IA deve explicar fontes e limites; não gera opinião pelo painel.',
  },
];

const CRITERIOS_PROMOCAO = [
  'Backtest fora da amostra com limite inferior do IC acima da taxa-base ou do CDI, conforme o tipo de regra.',
  'Diário de sinais com amostra mínima por horizonte e leitura acima da base sem cruzar o intervalo.',
  'Operabilidade com janela mínima, retorno líquido acima do CDI, drawdown dentro do limite e zero violação crítica.',
  'Versão de regra nova quando qualquer sinal passar a alterar recomendação, sizing ou status operacional.',
  'Aviso legal e texto conservador em todas as telas: sinal analítico não é ordem, operabilidade não é recomendação.',
];

const STATUS_TRILHAS = [
  {
    trilha: 'Fundamentalista / valuation',
    estado: 'Principal, mas experimental',
    detalhe:
      'Segue como regra de produção auditável, com backtest e diário. O universo amplo reduziu o risco de escolher limiar por ruído.',
  },
  {
    trilha: 'Técnica',
    estado: 'Contexto separado',
    detalhe:
      'Momentum e reversão ajudam a explicar cenário, mas não mexem na recomendação principal sem DEC e placar real.',
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
      'A tela de Operabilidade mostra operações simuladas, custos, IR estimado, bloqueios e status do sistema.',
  },
  {
    trilha: 'Confiança do score',
    estado: 'Não calibrada',
    detalhe:
      'A curva real já tem base técnica para extração, mas ainda falta execução real e decisão documentada.',
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
          evidência medida, contrato estável e execução real.
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
          a leitura correta é “inconclusivo”.
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
