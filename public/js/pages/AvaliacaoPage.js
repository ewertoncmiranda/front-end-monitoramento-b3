import { BaseComponent } from '../components/base/BaseComponent.js';

// Unica responsabilidade: mostrar a avaliacao do ecossistema - o quanto ele
// serve hoje, o que falta para ser confiavel e o que da para melhorar sem
// custo - do ponto de vista de negocio, operacao e mercado real.
//
// Conteudo 100% estatico e DATADO: e um retrato de um momento. Quando um item
// for resolvido, atualize o array correspondente e a data em AVALIADO_EM;
// nao deixe a pagina afirmar um problema que ja nao existe.
//
// Estrutura declarativa, mesmo padrao de ArquiteturaPage e FormulasPage.

const AVALIADO_EM = '26/09/2026';

const NOTAS = [
  {
    dimensao: 'Informação e estudo',
    nota: 8,
    porque:
      'Fundamentos da CVM, comunicados por vela, padrões com calibragem contra ruído e glossário. Poucos produtos gratuitos mostram quantas vezes um padrão aparece numa série aleatória.',
  },
  {
    dimensao: 'Engenharia',
    nota: 7,
    porque:
      'Arquitetura limpa, testes, idempotência e specs vivas. Em contrapartida, cinco serviços para um usuário é complexidade alta.',
  },
  {
    dimensao: 'Confiabilidade dos dados',
    nota: 5,
    porque:
      'CVM e B3 são fontes oficiais, mas há atraso (a base de comunicados é republicada ~1x/semana), lacunas de cobertura e nenhuma checagem cruzada de preço.',
  },
  {
    dimensao: 'Qualidade do sinal',
    nota: 3,
    porque:
      'As regras nunca foram testadas contra o passado; o preço justo de Graham não considera os juros brasileiros; o score de confiança não é calibrado.',
  },
  {
    dimensao: 'Operação',
    nota: 4,
    porque:
      'Roda numa máquina só, com AWS simulada (LocalStack); cargas disparadas à mão; sem alerta; banco sem backup.',
  },
  {
    dimensao: 'Pronto para o mercado real',
    nota: 2,
    porque:
      'Não considera custos, impostos, preço de execução, tamanho de posição nem regra de saída.',
  },
];

const DIFERENCIAIS = [
  {
    titulo: 'Honestidade estatística embutida',
    texto:
      'Taxa de acerto sempre ao lado da taxa-base, contagem no ruído e aviso de amostra pequena. É o que separa ferramenta séria de "sinal de compra".',
  },
  {
    titulo: 'Dados oficiais e gratuitos',
    texto: 'CVM (DFP, ITR, FCA, FRE, IPE), COTAHIST da B3 e Banco Central (Selic, CDI, IPCA). Nenhuma dependência paga.',
  },
  {
    titulo: 'Decisão determinística e auditável',
    texto: 'Desde a retirada da IA generativa, cada recomendação é reproduzível: mesma entrada, mesma saída.',
  },
  {
    titulo: 'Comunicado ligado ao preço',
    texto:
      'Clicar numa vela mostra os documentos oficiais daquele pregão e do anterior, sem afirmar causa que a fonte não permite afirmar.',
  },
];

const BLOQUEADORES = [
  {
    titulo: 'Nunca houve backtest',
    texto:
      'Limiares como "margem acima de 20% = compra forte" são opinião, não evidência. Não existe hoje código que meça o acerto das regras no passado.',
  },
  {
    titulo: 'Graham com viés de compra',
    texto:
      'O preço justo usa LPA × (8,5 + 2g) sem o fator 4,4 / Y da fórmula revisada. Com os juros brasileiros, isso infla o valor justo várias vezes.',
  },
  {
    titulo: 'Qualquer margem negativa vira venda',
    texto: 'Quase toda empresa de qualidade ou de crescimento sai como "venda por valuation".',
  },
  {
    titulo: 'Lucro de exercício fechado',
    texto:
      'Empresas cíclicas no pico do lucro parecem baratas. O ETL já calcula os últimos 12 meses (TTM), mas o valuation ainda não os usa.',
  },
  {
    titulo: 'Recomendação antiga pesa igual à de hoje',
    texto: 'A consolidação usa todo o histórico de análises do ativo, sem janela de tempo.',
  },
  {
    titulo: 'Sem custo, imposto nem tamanho de posição',
    texto: 'Um sinal que acerta 55% das vezes pode perder dinheiro depois de emolumentos, IR e spread.',
  },
];

const MELHORIAS = [
  { item: 'Backtest walk-forward sem viés de futuro', impacto: 'Crítico', classe: 'text-bg-danger', porque: 'Anos de preço pelo COTAHIST e fundamentos pela data em que foram entregues à CVM. Retorno a 30/90/180 dias por classe de recomendação contra BOVA11 e CDI.' },
  { item: 'Diário de sinais (paper trading)', impacto: 'Crítico', classe: 'text-bg-danger', porque: 'Gravar cada sinal com data, preço e versão da regra, e medir depois. É o único teste honesto do que o backtest não pega.' },
  { item: 'Graham com juros reais', impacto: 'Alto', classe: 'text-bg-warning', porque: 'Usar a Selic ou a NTN-B como Y, pela série do Banco Central que o sistema já consulta.' },
  { item: 'TTM no valuation e faixa neutra', impacto: 'Alto', classe: 'text-bg-warning', porque: 'Aproveita o que o ETL já produz e evita "venda" para toda empresa sem margem de segurança.' },
  { item: 'Retorno total com proventos', impacto: 'Alto', classe: 'text-bg-warning', porque: 'Sem dividendos no cálculo, pagadoras de proventos parecem piores do que são.' },
  { item: 'Janela temporal na consolidação', impacto: 'Médio', classe: 'text-bg-info', porque: 'Considerar só as análises dos últimos N dias.' },
  { item: 'Checagem cruzada de preço', impacto: 'Médio', classe: 'text-bg-info', porque: 'BRAPI contra o fechamento oficial do COTAHIST; divergência acima de 1% vira alerta.' },
  { item: 'Idade do dado em toda tela', impacto: 'Médio', classe: 'text-bg-info', porque: 'A aba Comunicados já informa até quando há dado; estender a fundamentos e preço.' },
  { item: 'Agendamento e alertas', impacto: 'Médio', classe: 'text-bg-info', porque: 'Cron ou GitHub Actions para as cargas; alertas do Grafana por e-mail ou Telegram.' },
  { item: 'Backup diário do banco', impacto: 'Médio', classe: 'text-bg-info', porque: 'Todo o histórico vive num volume Docker de uma máquina só.' },
  { item: 'Aviso legal na resposta', impacto: 'Baixo esforço', classe: 'text-bg-secondary', porque: 'Obrigatório antes de mostrar o sistema a qualquer outra pessoa.' },
];

const CAMADAS = [
  {
    pergunta: 'Dados: posso confiar no que entrou?',
    itens: [
      'Tudo com a data em que ficou público (point-in-time): é a regra de ouro do backtest.',
      'Checagem de cobertura por carga: "28 de 31 tickers" vira alerta, não linha de log.',
      'Idade do dado visível para quem lê.',
    ],
  },
  {
    pergunta: 'Modelo: a regra funciona?',
    itens: [
      'Backtest com período fora da amostra: calibrar até 2022 e avaliar de 2023 em diante.',
      'Comparar sempre com BOVA11 comprado e mantido e com o CDI; sem vencer o CDI após custos, a regra não serve.',
      'Confiança calibrada: "80%" precisa significar acertar ~80% das vezes no histórico.',
      'Versão em cada regra, para comparar uma com a outra.',
    ],
  },
  {
    pergunta: 'Operação: o sistema está de pé e atualizado?',
    itens: [
      'Painel de saúde com a última carga de cada fonte, filas paradas e erros por serviço.',
      'Resolver as pendências de integração: vocabulário único de recomendações, dono do schema e fila de mensagens com falha.',
      'Backup e roteiro de restauração testado.',
    ],
  },
];

const EXECUCAO = [
  { tema: 'Custos', hoje: 'Ignorados', fazer: 'Modelar emolumentos B3 (~0,03%), spread e IR: 15% em operação comum, com isenção para vendas de ações até R$ 20 mil/mês.' },
  { tema: 'Preço de execução', hoje: 'O sinal usa o fechamento do dia', fazer: 'Executar na abertura do pregão seguinte, que é quando dá para agir de fato.' },
  { tema: 'Liquidez', hoje: 'Existe o alerta de liquidez baixa', fazer: 'Tirar do universo tickers com volume médio abaixo de um piso.' },
  { tema: 'Tamanho de posição', hoje: 'Inexistente', fazer: 'Regra simples: risco máximo de 1–2% da carteira por posição e limite por setor.' },
  { tema: 'Saída', hoje: 'Só há sinal de entrada', fazer: 'Definir quando sair (prazo, stop ou reversão do sinal).' },
  { tema: 'Validação antes do dinheiro', hoje: '—', fazer: 'Backtest, depois 3 a 6 meses de diário de sinais, e só então capital pequeno.' },
];

const NEGOCIO = [
  { titulo: 'Para uso próprio', texto: 'Custo zero e valor de aprendizado alto. Faz sentido continuar.' },
  { titulo: 'Regulatório', texto: 'Recomendar compra ou venda a terceiros é atividade de analista credenciado (CVM Res. 20/2021). Para compartilhar, os rótulos viram "sinal quantitativo", com aviso legal.' },
  { titulo: 'Licença de dados', texto: 'Dados abertos da CVM são tranquilos; redistribuir dados da B3 e da BRAPI tem termos próprios a checar.' },
  { titulo: 'Concorrência', texto: 'Status Invest, Fundamentus e Investidor10 já são gratuitos em fundamentos. O diferencial defensável é a transparência estatística e a ligação de comunicado com preço.' },
];

const ROTEIRO = [
  { periodo: 'Dias 1–30', foco: 'Base confiável', itens: 'Backup diário, agendamento das cargas, aviso legal, Graham com juros reais, faixa neutra e janela na consolidação.' },
  { periodo: 'Dias 31–60', foco: 'Evidência', itens: 'Backtest walk-forward com COTAHIST, CVM pela data de entrega, proventos e custos, contra BOVA11 e CDI; recalibrar limiares só com dados até 2022.' },
  { periodo: 'Dias 61–90', foco: 'Prova em tempo real', itens: 'Diário de sinais em produção, painel de saúde e revisão: manter, ajustar ou descartar cada regra pelos números.' },
];

export class AvaliacaoPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Avaliação do sistema</h4>
      <p class="text-muted small mb-2">
        O quanto o ecossistema serve hoje, o que falta para ser confiável e o que dá para melhorar
        sem custo, do ponto de vista de negócio, operação e mercado real.
        <span class="badge text-bg-light border">Avaliado em ${AVALIADO_EM}</span>
      </p>

      <div class="alert alert-primary">
        <strong>Veredito.</strong> Hoje o sistema é uma <strong>boa ferramenta de pesquisa e
        aprendizado</strong>, com uma honestidade estatística rara, mas <strong>ainda não é um
        instrumento para decidir dinheiro real</strong>. O que falta é, em grande parte, gratuito:
        validar as regras contra o passado, corrigir o viés do valuation e registrar os sinais
        para medir o acerto depois.
      </div>

      <div class="alert alert-secondary small">
        Esta avaliação é sobre o software e o método, não uma recomendação de investimento.
      </div>

      ${secao('Nota por dimensão', renderNotas())}
      ${secao('O que já é diferencial', renderCartoes(DIFERENCIAIS, 'border-success'))}
      ${secao('Por que ainda não serve para decidir dinheiro', renderCartoes(BLOQUEADORES, 'border-danger'))}
      ${secao('Melhorias gratuitas, por impacto', renderMelhorias())}
      ${secao('Como aumentar a confiabilidade', renderCamadas())}
      ${secao('Execução no mercado real', renderExecucao(), `
        <p class="small text-muted">
          O horizonte do sistema é diário ou semanal: latência não importa, e a pessoa física não
          compete com robôs nesse jogo. Uso recomendado hoje: <strong>triagem e dossiê</strong>. O
          sistema aponta o que olhar e junta fundamentos, comunicados e contexto técnico; a
          decisão fica com quem usa.
        </p>`)}
      ${secao('Visão de negócio', renderCartoes(NEGOCIO, 'border-secondary'))}
      ${secao('Sequência sugerida (90 dias, custo zero)', renderRoteiro())}
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

function renderNotas() {
  return `
    <div class="card shadow-sm">
      <ul class="list-group list-group-flush">
        ${NOTAS.map((n) => {
          const cor = n.nota >= 7 ? 'bg-success' : n.nota >= 5 ? 'bg-warning' : 'bg-danger';
          return `
            <li class="list-group-item">
              <div class="d-flex justify-content-between align-items-center gap-2">
                <strong>${n.dimensao}</strong>
                <span class="fw-semibold">${n.nota}/10</span>
              </div>
              <div class="progress my-1" role="progressbar" aria-label="${n.dimensao}"
                   aria-valuenow="${n.nota}" aria-valuemin="0" aria-valuemax="10" style="height: 6px">
                <div class="progress-bar ${cor}" style="width: ${n.nota * 10}%"></div>
              </div>
              <p class="small text-muted mb-0">${n.porque}</p>
            </li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

function renderCartoes(itens, borda) {
  return `
    <div class="row row-cols-1 row-cols-md-2 g-3">
      ${itens.map((i) => `
        <div class="col">
          <div class="card h-100 border-start border-3 ${borda}">
            <div class="card-body py-2">
              <div class="fw-semibold">${i.titulo}</div>
              <p class="small mb-0 mt-1">${i.texto}</p>
            </div>
          </div>
        </div>`).join('')}
    </div>
  `;
}

function renderMelhorias() {
  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead><tr><th>#</th><th>Melhoria</th><th>Impacto</th><th>Por quê</th></tr></thead>
        <tbody>
          ${MELHORIAS.map((m, i) => `
            <tr>
              <td class="text-muted">${i + 1}</td>
              <td class="fw-semibold">${m.item}</td>
              <td><span class="badge ${m.classe}">${m.impacto}</span></td>
              <td class="small">${m.porque}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="small text-muted mb-0">Custo de todas: R$ 0. Os dados necessários são abertos.</p>
  `;
}

function renderCamadas() {
  return `
    <div class="row row-cols-1 row-cols-lg-3 g-3">
      ${CAMADAS.map((c) => `
        <div class="col">
          <div class="card h-100 shadow-sm">
            <div class="card-header small fw-semibold">${c.pergunta}</div>
            <div class="card-body">
              <ul class="small mb-0 ps-3">${c.itens.map((i) => `<li>${i}</li>`).join('')}</ul>
            </div>
          </div>
        </div>`).join('')}
    </div>
  `;
}

function renderExecucao() {
  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead><tr><th>Tema</th><th>Hoje</th><th>O que fazer</th></tr></thead>
        <tbody>
          ${EXECUCAO.map((e) => `
            <tr>
              <td class="fw-semibold">${e.tema}</td>
              <td class="small text-muted">${e.hoje}</td>
              <td class="small">${e.fazer}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderRoteiro() {
  return `
    <div class="row row-cols-1 row-cols-md-3 g-3">
      ${ROTEIRO.map((r) => `
        <div class="col">
          <div class="card h-100">
            <div class="card-body">
              <div class="small text-muted">${r.periodo}</div>
              <div class="fw-semibold mb-1">${r.foco}</div>
              <p class="small mb-0">${r.itens}</p>
            </div>
          </div>
        </div>`).join('')}
    </div>
  `;
}

customElements.define('avaliacao-page', AvaliacaoPage);
