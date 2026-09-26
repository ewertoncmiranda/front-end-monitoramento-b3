import { BaseComponent } from '../components/base/BaseComponent.js';
import '../components/DiarioDeSinais.js';
import '../components/SaudeDosDados.js';
import '../components/BacktestPlacar.js';

// Unica responsabilidade: mostrar a avaliacao do ecossistema - o quanto ele
// serve hoje, o que falta para ser confiavel e o que da para melhorar sem
// custo - do ponto de vista de negocio, operacao e mercado real.
//
// Duas partes de natureza diferente:
//   - a avaliacao, estatica e DATADA (AVALIADO_EM / ATUALIZADO_EM). Quando um
//     item for resolvido, atualize o array e a data; nao deixe a pagina
//     afirmar um problema que ja nao existe;
//   - tres blocos AO VIVO, a evidencia que faz as notas subirem ou nao:
//     <saude-dos-dados> (confiabilidade dos dados), <backtest-placar> e
//     <diario-de-sinais> (qualidade do sinal). Nota so muda com evidencia.
//
// Estrutura declarativa, mesmo padrao de ArquiteturaPage e FormulasPage.

const AVALIADO_EM = '26/09/2026';
const ATUALIZADO_EM = '26/09/2026, com identidade dos ativos, backtest, saúde dos dados e rotinas';

const NOTAS = [
  {
    dimensao: 'Informação e estudo',
    nota: 8,
    meta: 9,
    porque:
      'Fundamentos da CVM, comunicados por vela, padrões com calibragem contra ruído e glossário. Poucos produtos gratuitos mostram quantas vezes um padrão aparece numa série aleatória.',
    paraSubir: [
      'Dossiê único por ativo: preço, fundamentos, comunicados e sinal na mesma tela.',
      'Explicar cada decisão com os números do dia, não só o rótulo.',
    ],
  },
  {
    dimensao: 'Engenharia',
    nota: 7,
    meta: 8,
    porque:
      'Arquitetura limpa, testes, idempotência e specs vivas. Em contrapartida, cinco serviços para um usuário é complexidade alta.',
    paraSubir: [
      'Vocabulário único de recomendações entre os serviços (INT-01).',
      'Contratos em JSON Schema com teste nos dois lados; testes rodando no CI de todos os repositórios.',
    ],
  },
  {
    dimensao: 'Confiabilidade dos dados',
    nota: 6,
    meta: 7,
    porque:
      'Subiu de 5: cada empresa tem um código só (AXIA3, EMBJ3, JBSS32 e MBRF3 voltaram a juntar preço e balanço), todo balanço tem a data em que ficou público, o preço oficial da B3 (COTAHIST) está carregado desde 2016 e é comparado com a BRAPI, e a quantidade de ações passa por checagem (pegou VALE3 em milhar e BBAS3 2022 com pico isolado). Tudo isso é medido ao vivo abaixo.',
    paraSubir: [
      'Proventos no retorno (hoje o preço é bruto: pagadora de dividendo parece pior).',
      '30 dias seguidos com o painel de saúde verde, sem intervenção manual.',
      'Idade do dado também nas telas de ativo, não só aqui.',
    ],
  },
  {
    dimensao: 'Qualidade do sinal',
    nota: 4,
    meta: 6,
    porque:
      'Subiu de 3 porque agora é medida: backtest de 2017 a 2026 com o período de teste congelado. O resultado é modesto: as compras da v1 acertam poucos pontos acima da taxa-base no teste e não na calibração, ou seja, a vantagem ainda não é estável. A v2 (juros, lucro dos últimos 12 meses, faixa neutra) roda em sombra no diário e no backtest.',
    paraSubir: [
      'Uma regra que vença a taxa-base nos DOIS períodos, não só em um.',
      'Placar do diário com amostra mínima confirmando o backtest.',
      'Confiança calibrada: "80%" precisa acertar ~80% das vezes.',
    ],
  },
  {
    dimensao: 'Operação',
    nota: 5,
    meta: 7,
    porque:
      'Subiu de 4: diário, cargas do ETL (com backtest às sextas) e backup com restauração testada rodam sozinhos no Agendador do Windows, e cada rotina deixa rastro que o painel de saúde lê. Segue numa máquina só, com AWS simulada.',
    paraSubir: [
      'Alerta ativo: configurar o bot do Telegram (TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID).',
      'Cópia do backup fora desta máquina (nuvem ou disco externo).',
      'Painel de saúde também no Grafana.',
    ],
  },
  {
    dimensao: 'Pronto para o mercado real',
    nota: 2,
    meta: 5,
    porque:
      'Não considera impostos, tamanho de posição nem regra de saída. O motor de avaliação já usa a abertura do pregão seguinte e desconta custo; todo insight sai com aviso legal.',
    paraSubir: [
      'IR, filtro de liquidez, tamanho de posição e regra de saída.',
      '3 a 6 meses de diário vencendo o CDI depois dos custos, antes de qualquer capital.',
    ],
  },
];

const PROGRESSO = [
  { data: '26/09', item: 'Identidade do ativo: um código canônico por empresa (ELET3→AXIA3, EMBR3→EMBJ3, JBSS3→JBSS32, MRFG3→MBRF3), CSNA3 e RAIZ4 com CNPJ. O cadastro converte código antigo sozinho.' },
  { data: '26/09', item: 'Point-in-time: todo balanço (2016–2025) com a data de entrega na CVM; lucro dos últimos 12 meses (TTM) carregado pela primeira vez.' },
  { data: '26/09', item: 'COTAHIST oficial 2016–2026 (~79 mil pregões, com os códigos antigos emendados) e checagem cruzada com a BRAPI.' },
  { data: '26/09', item: 'Checagem da quantidade de ações entre anos: corrige unidade (milhar) e anula pico isolado, em vez de gravar LPA 1000× errado.' },
  { data: '26/09', item: 'Backtest walk-forward 2017–2026 publicado, v1 contra v2, calibração até 2022 e teste depois.' },
  { data: '26/09', item: 'Regra v2 em sombra: Graham com juros (CDI) e IPCA, TTM e faixa neutra de venda. Gravada no diário ao lado da v1.' },
  { data: '26/09', item: 'Consolidação das análises só com os últimos 30 dias; aviso legal em todo insight.' },
  { data: '26/09', item: 'Rotinas agendadas: cargas do ETL (dias úteis 20h), backup com restauração testada (todo dia) e alerta por Telegram quando configurado.' },
  { data: '26/09', item: 'Motor de avaliação único (backtest e diário): entrada na abertura seguinte, custo, excesso sobre o CDI e sobre a média da carteira, janela de desdobramento marcada.' },
  { data: '26/09', item: 'Versão da regra gravada em todo insight: regras diferentes nunca caem no mesmo placar.' },
  { data: '26/09', item: 'Diário de sinais: um sinal por ativo por pregão, só inclusão, com resultado por horizonte quando ele vence. Rotina diária ativa no Agendador do Windows.' },
  { data: '26/09', item: 'Histórico diário do CDI desde 2016 (2.693 pontos), completado sozinho na subida do gestor.' },
  { data: '26/09', item: 'Régua de mercado do diário: média simples da carteira monitorada no lugar do BOVA11 (que não é coletado). Mede se a regra escolhe melhor do que pegar todos por igual.' },
  { data: '26/09', item: 'Comunicados oficiais da CVM por ativo e por vela do gráfico.' },
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
    texto: 'Cada recomendação é reproduzível e agora carrega a versão da regra que a gerou.',
  },
  {
    titulo: 'Comunicado ligado ao preço',
    texto:
      'Clicar numa vela mostra os documentos oficiais daquele pregão e do anterior, sem afirmar causa que a fonte não permite afirmar.',
  },
];

const BLOQUEADORES = [
  {
    titulo: 'Vantagem medida, mas não estável',
    texto:
      'O backtest existe e o resultado é modesto: as compras batem a taxa-base por poucos pontos no teste e não na calibração. Vantagem que aparece num período e some no outro ainda não é vantagem.',
  },
  {
    titulo: 'A regra oficial ainda é a v1',
    texto:
      'Graham sem juros, lucro de exercício fechado e "qualquer margem negativa é venda" continuam nos insights da tela. A v2 corrige os três, mas só vira oficial se o placar mostrar que é melhor.',
  },
  {
    titulo: 'Preço sem proventos',
    texto: 'Backtest e diário usam preço bruto: empresas que pagam muito dividendo parecem piores do que são.',
  },
  {
    titulo: 'Universo de hoje olhando para trás',
    texto: 'O backtest usa as empresas monitoradas hoje, que sobreviveram até aqui. Isso favorece o passado (viés de sobrevivência).',
  },
  {
    titulo: 'Sem imposto nem tamanho de posição',
    texto: 'Um sinal que acerta 55% das vezes pode perder dinheiro depois de IR e spread.',
  },
];

const STATUS = {
  feito: { rotulo: 'Feito', classe: 'text-bg-success' },
  andamento: { rotulo: 'Em andamento', classe: 'text-bg-primary' },
  pendente: { rotulo: 'Pendente', classe: 'text-bg-light border' },
};

const MELHORIAS = [
  { item: 'Diário de sinais (paper trading)', impacto: 'Crítico', classe: 'text-bg-danger', status: 'andamento', porque: 'Rotina ativa (dias úteis, 19h), agora com v1 e v2 lado a lado. Primeiros resultados ~21 pregões depois de 28/09.' },
  { item: 'Backtest walk-forward sem viés de futuro', impacto: 'Crítico', classe: 'text-bg-danger', status: 'feito', porque: 'COTAHIST + CVM pela data de entrega, 2017–2026, calibração até 2022. Roda toda sexta.' },
  { item: 'Mapa de tickers renomeados', impacto: 'Alto', classe: 'text-bg-warning', status: 'feito', porque: 'Tabela ativo_identidade; o cadastro e o ETL usam o código canônico.' },
  { item: 'Graham com juros reais', impacto: 'Alto', classe: 'text-bg-warning', status: 'andamento', porque: 'Na v2, em sombra: 4,4 / CDI anualizado, crescimento nominal com IPCA.' },
  { item: 'TTM no valuation e faixa neutra', impacto: 'Alto', classe: 'text-bg-warning', status: 'andamento', porque: 'Na v2, em sombra. Venda só abaixo de −30% de margem.' },
  { item: 'Retorno total com proventos', impacto: 'Alto', classe: 'text-bg-warning', status: 'pendente', porque: 'Próximo passo: proventos da base IPE ou dos eventos da B3.' },
  { item: 'Janela temporal na consolidação', impacto: 'Médio', classe: 'text-bg-info', status: 'feito', porque: 'Só as análises dos últimos 30 dias; sem nenhuma, a mais recente.' },
  { item: 'Checagem cruzada de preço', impacto: 'Médio', classe: 'text-bg-info', status: 'feito', porque: 'BRAPI contra o fechamento oficial do COTAHIST; acima de 1% aparece na saúde dos dados.' },
  { item: 'Idade do dado em toda tela', impacto: 'Médio', classe: 'text-bg-info', status: 'andamento', porque: 'Painel de saúde com a idade de cada fonte; falta levar às telas de ativo.' },
  { item: 'Agendamento e alertas', impacto: 'Médio', classe: 'text-bg-info', status: 'feito', porque: 'Três rotinas no Agendador do Windows; alerta por Telegram quando o bot estiver configurado.' },
  { item: 'Backup diário do banco', impacto: 'Médio', classe: 'text-bg-info', status: 'feito', porque: 'Dump diário restaurado num banco descartável e conferido; guarda 14. Falta cópia fora da máquina.' },
  { item: 'Aviso legal na resposta', impacto: 'Baixo esforço', classe: 'text-bg-secondary', status: 'feito', porque: 'Campo aviso_legal em todo insight e aviso nas telas de validação.' },
];

const CAMADAS = [
  {
    pergunta: 'Dados: posso confiar no que entrou?',
    itens: [
      'Tudo com a data em que ficou público (point-in-time): é a regra de ouro do backtest.',
      'Checagem de cobertura por carga: "28 de 31 tickers" vira alerta, não linha de log.',
      'Identidade estável do ativo quando o ticker muda de código.',
      'Idade do dado visível para quem lê.',
    ],
  },
  {
    pergunta: 'Modelo: a regra funciona?',
    itens: [
      'Backtest com período fora da amostra: calibrar até 2022 e avaliar de 2023 em diante.',
      'Comparar sempre com a média da carteira (pegar todos por igual) e com o CDI; sem vencer o CDI após custos, a regra não serve.',
      'Confiança calibrada: "80%" precisa significar acertar ~80% das vezes no histórico.',
      'Versão em cada regra, para comparar uma com a outra (já em uso).',
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
  { tema: 'Custos', hoje: 'Custo de 0,10% no motor; IR ainda não', fazer: 'Modelar IR: 15% em operação comum, com isenção para vendas de ações até R$ 20 mil/mês.' },
  { tema: 'Preço de execução', hoje: 'Motor entra na abertura do pregão seguinte', fazer: 'Manter essa convenção em qualquer relatório; nunca medir pelo fechamento do próprio sinal.' },
  { tema: 'Liquidez', hoje: 'Existe o alerta de liquidez baixa', fazer: 'Tirar do universo tickers com volume médio abaixo de um piso.' },
  { tema: 'Tamanho de posição', hoje: 'Inexistente', fazer: 'Regra simples: risco máximo de 1–2% da carteira por posição e limite por setor.' },
  { tema: 'Saída', hoje: 'Horizontes fixos só para medir', fazer: 'Definir quando sair (prazo, stop ou reversão do sinal).' },
  { tema: 'Validação antes do dinheiro', hoje: 'Backtest publicado; diário começando', fazer: 'Backtest, depois 3 a 6 meses de diário, e só então capital pequeno.' },
];

const NEGOCIO = [
  { titulo: 'Para uso próprio', texto: 'Custo zero e valor de aprendizado alto. Faz sentido continuar.' },
  { titulo: 'Regulatório', texto: 'Recomendar compra ou venda a terceiros é atividade de analista credenciado (CVM Res. 20/2021). Para compartilhar, os rótulos viram "sinal quantitativo", com aviso legal.' },
  { titulo: 'Licença de dados', texto: 'Dados abertos da CVM são tranquilos; redistribuir dados da B3 e da BRAPI tem termos próprios a checar.' },
  { titulo: 'Concorrência', texto: 'Status Invest, Fundamentus e Investidor10 já são gratuitos em fundamentos. O diferencial defensável é a transparência estatística, a ligação de comunicado com preço e, quando existir, o placar público do próprio acerto.' },
];

const ROTEIRO = [
  { periodo: 'Dias 1–30', foco: 'Base confiável', itens: 'Feito: identidade dos ativos, data de entrega, COTAHIST, checagem de preço e de ações, backup, rotinas e aviso legal. Falta: Telegram e cópia do backup fora da máquina.' },
  { periodo: 'Dias 31–60', foco: 'Evidência', itens: 'Proventos no retorno; recalibrar limiares só com dados até 2022 e conferir no teste; confiança calibrada.' },
  { periodo: 'Dias 61–90', foco: 'Prova em tempo real', itens: 'Placares do diário com amostra mínima (v1 x v2) e decisão pelos números: manter, promover a v2 ou descartar cada regra.' },
];

export class AvaliacaoPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Avaliação do sistema</h4>
      <p class="text-muted small mb-2">
        O quanto o ecossistema serve hoje, o que falta para ser confiável e o que dá para melhorar
        sem custo, do ponto de vista de negócio, operação e mercado real.
        <span class="badge text-bg-light border">Avaliado em ${AVALIADO_EM}</span>
        <span class="badge text-bg-light border">Atualizado em ${ATUALIZADO_EM}</span>
      </p>

      <div class="alert alert-primary">
        <strong>Veredito.</strong> Hoje o sistema é uma <strong>boa ferramenta de pesquisa e
        aprendizado</strong>, com uma honestidade estatística rara, mas <strong>ainda não é um
        instrumento para decidir dinheiro real</strong>. Agora a evidência existe: dados checados ao vivo,
        backtest de 2017 a 2026 e o diário gravando cada previsão antes do resultado. Ela mostra
        uma vantagem pequena e ainda instável, e é por isso que as notas sobem pouco.
      </div>

      <div class="alert alert-secondary small">
        Esta avaliação é sobre o software e o método, não uma recomendação de investimento.
      </div>

      ${secao('Nota por dimensão — e o que falta para subir', renderNotas())}
      ${secao('Ao vivo: saúde dos dados', `
        <div class="card shadow-sm"><div class="card-body"><saude-dos-dados></saude-dos-dados></div></div>`, `
        <p class="small text-muted">
          A régua da nota de confiabilidade: idade de cada fonte contra o prazo da rotina dela, preço e
          balanço juntos por ativo, e o fechamento da BRAPI contra o oficial da B3.
        </p>`)}
      ${secao('Ao vivo: backtest walk-forward', `
        <div class="card shadow-sm"><div class="card-body"><backtest-placar></backtest-placar></div></div>`, `
        <p class="small text-muted">
          Um sinal por ativo no primeiro pregão de cada mês, só com o que se sabia no dia (balanço pela data
          de entrega na CVM), medido pelo mesmo motor do diário. A v1 é a regra da tela; a v2 roda em sombra.
        </p>`)}
      ${secao('Ao vivo: diário de sinais', `
        <div class="card shadow-sm"><div class="card-body"><diario-de-sinais></diario-de-sinais></div></div>`, `
        <p class="small text-muted">
          Depois de cada pregão, o sinal de cada ativo é gravado com a versão da regra, e o resultado
          é medido 21, 63 e 126 pregões depois — entrando na abertura do pregão seguinte, com custo, contra o
          CDI e a média da carteira monitorada. É a prova que o backtest não consegue dar.
        </p>`)}
      ${secao('Progresso desde a avaliação', renderProgresso())}
      ${secao('Melhorias gratuitas, por impacto', renderMelhorias())}
      <details class="mb-4">
        <summary class="h5">Referência: diferenciais, bloqueios, método, execução e negócio</summary>
        <div class="mt-3">
      ${secao('O que já é diferencial', renderCartoes(DIFERENCIAIS, 'border-success'))}
      ${secao('Por que ainda não serve para decidir dinheiro', renderCartoes(BLOQUEADORES, 'border-danger'))}
      ${secao('Como aumentar a confiabilidade', renderCamadas())}
      ${secao('Execução no mercado real', renderExecucao(), `
        <p class="small text-muted">
          O horizonte do sistema é diário ou semanal: latência não importa, e a pessoa física não
          compete com robôs nesse jogo. Uso recomendado hoje: <strong>triagem e dossiê</strong>. O
          sistema aponta o que olhar e junta fundamentos, comunicados e contexto técnico; a
          decisão fica com quem usa.
        </p>`)}
      ${secao('Visão de negócio', renderCartoes(NEGOCIO, 'border-secondary'))}
        </div>
      </details>
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

function corDaNota(nota) {
  return nota >= 7 ? 'bg-success' : nota >= 5 ? 'bg-warning' : 'bg-danger';
}

function renderNotas() {
  return `
    <div class="card shadow-sm">
      <ul class="list-group list-group-flush">
        ${NOTAS.map((n) => `
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-center gap-2">
              <strong>${n.dimensao}</strong>
              <span class="fw-semibold">${n.nota}/10
                <span class="text-muted fw-normal small">→ meta ${n.meta}</span></span>
            </div>
            <div class="progress my-1" role="progressbar" aria-label="${n.dimensao}"
                 aria-valuenow="${n.nota}" aria-valuemin="0" aria-valuemax="10" style="height: 6px">
              <div class="progress-bar ${corDaNota(n.nota)}" style="width: ${n.nota * 10}%"></div>
              <div class="progress-bar bg-secondary-subtle" style="width: ${(n.meta - n.nota) * 10}%"
                   title="Distância até a meta"></div>
            </div>
            <p class="small text-muted mb-1">${n.porque}</p>
            <div class="small"><span class="fw-semibold">Para chegar a ${n.meta}:</span>
              <ul class="mb-0 ps-3">${n.paraSubir.map((p) => `<li>${p}</li>`).join('')}</ul>
            </div>
          </li>`).join('')}
      </ul>
    </div>
  `;
}

function renderProgresso() {
  return `
    <ul class="list-group">
      ${PROGRESSO.map((p) => `
        <li class="list-group-item d-flex gap-2 align-items-start">
          <span class="badge text-bg-success">${p.data}</span>
          <span class="small">${p.item}</span>
        </li>`).join('')}
    </ul>
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
        <thead><tr><th>#</th><th>Melhoria</th><th>Impacto</th><th>Status</th><th>Por quê</th></tr></thead>
        <tbody>
          ${MELHORIAS.map((m, i) => `
            <tr>
              <td class="text-muted">${i + 1}</td>
              <td class="fw-semibold">${m.item}</td>
              <td><span class="badge ${m.classe}">${m.impacto}</span></td>
              <td><span class="badge ${STATUS[m.status].classe}">${STATUS[m.status].rotulo}</span></td>
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
