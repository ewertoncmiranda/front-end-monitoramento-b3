import { BaseComponent } from '../components/base/BaseComponent.js';
import '../components/DiarioDeSinais.js';

// Unica responsabilidade: mostrar a avaliacao do ecossistema - o quanto ele
// serve hoje, o que falta para ser confiavel e o que da para melhorar sem
// custo - do ponto de vista de negocio, operacao e mercado real.
//
// Duas partes de natureza diferente:
//   - a avaliacao, estatica e DATADA (AVALIADO_EM / ATUALIZADO_EM). Quando um
//     item for resolvido, atualize o array e a data; nao deixe a pagina
//     afirmar um problema que ja nao existe;
//   - o diario de sinais, AO VIVO (<diario-de-sinais>): a evidencia que faz a
//     nota de "qualidade do sinal" subir ou nao. As notas so devem mudar
//     quando essa evidencia existir.
//
// Estrutura declarativa, mesmo padrao de ArquiteturaPage e FormulasPage.

const AVALIADO_EM = '26/09/2026';
const ATUALIZADO_EM = '26/09/2026, com o diário de sinais';

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
    nota: 5,
    meta: 7,
    porque:
      'CVM e B3 são fontes oficiais, mas há atraso, lacunas de cobertura e nenhuma checagem cruzada de preço. Achado de 26/09: quatro empresas monitoradas estão partidas em dois tickers.',
    paraSubir: [
      'Mapa de tickers renomeados: a BRAPI já devolve AXIA3, EMBJ3, JBSS32 e MBRF3, enquanto os fundamentos estão em ELET3, EMBR3, JBSS3 e MRFG3 (0 candles). Preço e balanço dessas empresas nunca se encontram.',
      'Data de entrega (DT_RECEB) dos balanços e COTAHIST oficial desde 2016, com checagem contra a BRAPI.',
      'Resolver os tickers sem CNPJ (CSNA3, RAIZ4) e mostrar a idade do dado em toda tela.',
    ],
  },
  {
    dimensao: 'Qualidade do sinal',
    nota: 3,
    meta: 6,
    porque:
      'As regras ainda não foram medidas contra o passado; o Graham não considera os juros brasileiros; a confiança não é calibrada. O diário de sinais começou a gravar a evidência, mas ela leva semanas para existir.',
    paraSubir: [
      'Backtest publicado, com o período de teste congelado.',
      'Graham com juros reais, faixa neutra de venda e lucro dos últimos 12 meses.',
      'Só depois: placar do diário com amostra mínima mostrando acerto acima da taxa-base.',
    ],
  },
  {
    dimensao: 'Operação',
    nota: 4,
    meta: 7,
    porque:
      'Roda numa máquina só, com AWS simulada; cargas do ETL disparadas à mão; sem alerta; banco sem backup. Já automáticos: o diário de sinais (dias úteis, 19h) e o histórico do CDI.',
    paraSubir: [
      'Agendar as cargas de fundamentos e comunicados, como já está o diário de sinais.',
      'Backup diário do MySQL com restauração testada.',
      'Painel de saúde no Grafana com alerta por e-mail ou Telegram.',
    ],
  },
  {
    dimensao: 'Pronto para o mercado real',
    nota: 2,
    meta: 5,
    porque:
      'Não considera impostos, tamanho de posição nem regra de saída. O motor de avaliação já usa a abertura do pregão seguinte e desconta custo.',
    paraSubir: [
      'IR, filtro de liquidez, tamanho de posição e regra de saída.',
      '3 a 6 meses de diário vencendo o CDI depois dos custos, antes de qualquer capital.',
    ],
  },
];

const PROGRESSO = [
  { data: '26/09', item: 'Motor de avaliação único (backtest e diário): entrada na abertura seguinte, custo, excesso sobre CDI e BOVA11, janela de desdobramento marcada.' },
  { data: '26/09', item: 'Versão da regra gravada em todo insight: regras diferentes nunca caem no mesmo placar.' },
  { data: '26/09', item: 'Diário de sinais: um sinal por ativo por pregão, só inclusão, com resultado por horizonte quando ele vence. Rotina diária ativa no Agendador do Windows.' },
  { data: '26/09', item: 'Histórico diário do CDI desde 2016 (2.693 pontos), completado sozinho na subida do gestor.' },
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
    titulo: 'As regras ainda não foram medidas',
    texto:
      'O backtest ainda não rodou e o diário acabou de começar. Limiares como "margem acima de 20% = compra forte" continuam opinião até existir o placar.',
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
  { item: 'Diário de sinais (paper trading)', impacto: 'Crítico', classe: 'text-bg-danger', status: 'andamento', porque: 'Rotina ativa (dias úteis, 19h). Primeiro sinal no pregão de 28/09; primeiros resultados ~21 pregões depois.' },
  { item: 'Backtest walk-forward sem viés de futuro', impacto: 'Crítico', classe: 'text-bg-danger', status: 'andamento', porque: 'Motor de avaliação e CDI prontos; faltam a data de entrega dos balanços (DT_RECEB) e o COTAHIST desde 2016 com o BOVA11.' },
  { item: 'Mapa de tickers renomeados', impacto: 'Alto', classe: 'text-bg-warning', status: 'pendente', porque: 'Liga AXIA3/ELET3, EMBJ3/EMBR3, JBSS32/JBSS3 e MBRF3/MRFG3: hoje preço e balanço dessas empresas não se encontram.' },
  { item: 'Graham com juros reais', impacto: 'Alto', classe: 'text-bg-warning', status: 'pendente', porque: 'Usar a Selic ou a NTN-B como Y, pela série do Banco Central que o sistema já consulta.' },
  { item: 'TTM no valuation e faixa neutra', impacto: 'Alto', classe: 'text-bg-warning', status: 'pendente', porque: 'Aproveita o que o ETL já produz e evita "venda" para toda empresa sem margem de segurança.' },
  { item: 'Retorno total com proventos', impacto: 'Alto', classe: 'text-bg-warning', status: 'pendente', porque: 'Sem dividendos no cálculo, pagadoras de proventos parecem piores do que são.' },
  { item: 'Janela temporal na consolidação', impacto: 'Médio', classe: 'text-bg-info', status: 'pendente', porque: 'Considerar só as análises dos últimos N dias.' },
  { item: 'Checagem cruzada de preço', impacto: 'Médio', classe: 'text-bg-info', status: 'pendente', porque: 'BRAPI contra o fechamento oficial do COTAHIST; divergência acima de 1% vira alerta.' },
  { item: 'Idade do dado em toda tela', impacto: 'Médio', classe: 'text-bg-info', status: 'pendente', porque: 'A aba Comunicados já informa até quando há dado; estender a fundamentos e preço.' },
  { item: 'Agendamento e alertas', impacto: 'Médio', classe: 'text-bg-info', status: 'pendente', porque: 'Rotina do diário pronta para o Agendador do Windows; faltam as cargas e os alertas do Grafana.' },
  { item: 'Backup diário do banco', impacto: 'Médio', classe: 'text-bg-info', status: 'pendente', porque: 'Todo o histórico, inclusive o diário, vive num volume Docker de uma máquina só.' },
  { item: 'Aviso legal na resposta', impacto: 'Baixo esforço', classe: 'text-bg-secondary', status: 'pendente', porque: 'Obrigatório antes de mostrar o sistema a qualquer outra pessoa.' },
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
      'Comparar sempre com BOVA11 comprado e mantido e com o CDI; sem vencer o CDI após custos, a regra não serve.',
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
  { tema: 'Validação antes do dinheiro', hoje: 'Diário começando', fazer: 'Backtest, depois 3 a 6 meses de diário, e só então capital pequeno.' },
];

const NEGOCIO = [
  { titulo: 'Para uso próprio', texto: 'Custo zero e valor de aprendizado alto. Faz sentido continuar.' },
  { titulo: 'Regulatório', texto: 'Recomendar compra ou venda a terceiros é atividade de analista credenciado (CVM Res. 20/2021). Para compartilhar, os rótulos viram "sinal quantitativo", com aviso legal.' },
  { titulo: 'Licença de dados', texto: 'Dados abertos da CVM são tranquilos; redistribuir dados da B3 e da BRAPI tem termos próprios a checar.' },
  { titulo: 'Concorrência', texto: 'Status Invest, Fundamentus e Investidor10 já são gratuitos em fundamentos. O diferencial defensável é a transparência estatística, a ligação de comunicado com preço e, quando existir, o placar público do próprio acerto.' },
];

const ROTEIRO = [
  { periodo: 'Dias 1–30', foco: 'Base confiável', itens: 'Backup diário, agendamento das cargas, mapa de tickers renomeados, aviso legal, Graham com juros reais, faixa neutra e janela na consolidação.' },
  { periodo: 'Dias 31–60', foco: 'Evidência', itens: 'Backtest walk-forward com COTAHIST, CVM pela data de entrega, proventos e custos, contra BOVA11 e CDI; recalibrar limiares só com dados até 2022.' },
  { periodo: 'Dias 61–90', foco: 'Prova em tempo real', itens: 'Primeiros placares do diário com amostra mínima, painel de saúde e revisão: manter, ajustar ou descartar cada regra pelos números.' },
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
        instrumento para decidir dinheiro real</strong>. O caminho começou: o diário de sinais
        grava cada previsão antes do resultado existir. As notas só sobem quando a evidência chegar.
      </div>

      <div class="alert alert-secondary small">
        Esta avaliação é sobre o software e o método, não uma recomendação de investimento.
      </div>

      ${secao('Evidência em tempo real: diário de sinais', `
        <div class="card shadow-sm"><div class="card-body"><diario-de-sinais></diario-de-sinais></div></div>`, `
        <p class="small text-muted">
          Depois de cada pregão, o sinal de cada ativo é gravado com a versão da regra, e o resultado
          é medido 21, 63 e 126 pregões depois — entrando na abertura do pregão seguinte, com custo, contra o
          CDI e o BOVA11. É o placar que decide se a nota de "qualidade do sinal" sobe.
        </p>`)}
      ${secao('Nota por dimensão — e o que falta para subir', renderNotas())}
      ${secao('Progresso desde a avaliação', renderProgresso())}
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
