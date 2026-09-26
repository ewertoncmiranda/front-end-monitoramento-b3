import { BaseComponent } from '../components/base/BaseComponent.js';

// Unica responsabilidade: explicar como se le um grafico de candles e onde a
// leitura costuma dar errado. Conteudo 100% estatico, sem chamada de API.
//
// Fica separado do Glossario de proposito: la sao verbetes (termo -> definicao,
// com busca); aqui e texto com raciocinio, que nao cabe numa linha de tabela.
// Os nomes dos padroes citados abaixo tem verbete no Glossario.
//
// Estrutura declarativa, igual a FormulasPage e ArquiteturaPage.

// Parametros reais do sistema, para o texto nao falar de um sistema imaginario.
const PARAMETROS = {
  janela: 20,
  ranges: '5 dias, 1 mes e 3 meses',
  pregoesNoMaior: 63,
};

const PADROES_VELAS = [
  {
    nome: 'Martelo',
    sugere: 'Sombra inferior de pelo menos o dobro do corpo: derrubaram o preco e os compradores absorveram.',
    soValeSe: 'Aparece <strong>depois</strong> de uma queda. No meio de lateralizacao e so uma vela feia.',
  },
  {
    nome: 'Enforcado',
    sugere: 'Exatamente a mesma forma do martelo, em contexto oposto.',
    soValeSe: 'Aparece depois de alta. O desenho nao muda; o que muda e onde ele esta.',
  },
  {
    nome: 'Engolfo',
    sugere: 'O corpo da vela engole inteiro o da anterior: o lado contrario tomou a sessao.',
    soValeSe: 'Vem com volume acima da media. Engolfo em dia parado nao significa muito.',
  },
  {
    nome: 'Doji',
    sugere: 'Abertura praticamente igual ao fechamento: ninguem venceu a sessao.',
    soValeSe: 'Interrompe uma tendencia definida. Indecisao dentro de indecisao nao e informacao.',
  },
  {
    nome: 'Estrela da manha / da noite',
    sugere: 'Tres velas: tendencia, indecisao, reversao.',
    soValeSe: 'A terceira vela confirma. Sem ela, sao duas velas e uma esperanca.',
  },
];

const FORMACOES = [
  {
    nome: 'Topo duplo (M) e fundo duplo (W)',
    prazo: 'semanas',
    descricao: `Dois testes do mesmo nivel sem romper. O gatilho <strong>nao</strong> e o segundo topo -
      e o rompimento da linha de pescoco, tracada no fundo entre os dois picos.`,
    cabeNaJanela: true,
  },
  {
    nome: 'Ombro-Cabeca-Ombro',
    prazo: '3 a 6 meses',
    descricao: `Tres picos, o do meio mais alto. E a formacao de reversao mais citada e a mais mal
      usada, justamente porque quase nunca esta completa quando alguem a anuncia.`,
    cabeNaJanela: false,
  },
  {
    nome: 'Triangulos',
    prazo: 'semanas',
    descricao: `Ascendente (topos no mesmo nivel, fundos subindo) sugere pressao compradora
      acumulando; descendente e o inverso; simetrico e indefinicao e rompe para qualquer lado.`,
    cabeNaJanela: true,
  },
  {
    nome: 'Bandeira e flamula',
    prazo: 'dias',
    descricao: `Pausa curta depois de um movimento forte. Padrao de <strong>continuacao</strong>,
      nao de reversao — é o erro de leitura mais comum aqui.`,
    cabeNaJanela: true,
  },
];

const ARMADILHAS = [
  {
    titulo: 'Preco nao ajustado por proventos',
    gravidade: 'alta',
    problema: `Quando a empresa paga dividendo, o preco cai no dia ex sem ninguem ter vendido — e
      ajuste mecanico. Desdobramento derruba o preco pela metade do mesmo jeito. No grafico, os
      dois parecem <strong>gap de baixa</strong>.`,
    comoEvitar: `Use sempre a serie ajustada. Medido nesta base: 47% dos candles tinham
      <code>fechamento_ajustado</code> diferente do bruto, chegando a 2,70% de divergencia no
      PETR4. O calculo tecnico deste sistema usava o bruto ate 26/09/2026; hoje usa o ajustado.`,
  },
  {
    titulo: 'Apofenia: o cerebro acha padrao em ruido',
    gravidade: 'alta',
    problema: `Gere um passeio aleatorio de 200 pontos e voce encontrara ombro-cabeca-ombro,
      triangulos e suportes impecaveis. Nao porque estao la, mas porque o cerebro humano e uma
      maquina de encontrar forma.`,
    comoEvitar: `Teste honesto: voce consegue descrever o padrao com regras precisas o bastante
      para um programa detecta-lo? Se nao consegue, provavelmente esta desenhando a conclusao
      que ja tinha.`,
  },
  {
    titulo: 'O candle ainda nao fechou',
    gravidade: 'alta',
    problema: `No grafico historico o padrao e obvio — <strong>porque ja terminou</strong>. Ao vivo
      voce decide com a vela em formacao, e um martelo as 14h vira uma vela de baixa as 17h.`,
    comoEvitar: `Padrao so conta no fechamento. Todo backtest feito a olho sofre disso: voce olha
      o passado ja sabendo o futuro.`,
  },
  {
    titulo: 'Z-score presume normalidade, e retorno de acao nao e normal',
    gravidade: 'media',
    problema: `Dois problemas empilhados. Retornos tem <strong>caudas gordas</strong>: um z de 3
      nao tem a probabilidade de 0,3% que a distribuicao normal sugere. E com apenas
      ${PARAMETROS.janela} amostras o proprio desvio-padrao e mal estimado — uma unica sessao
      violenta infla o denominador e reduz o z de tudo que vem depois, justamente quando a
      volatilidade aumentou.`,
    comoEvitar: `Trate o z-score como regua relativa, nao como probabilidade. "Esticado em relacao
      as ultimas ${PARAMETROS.janela} sessoes" e uma afirmacao honesta; "evento raro" nao e.`,
  },
  {
    titulo: 'Volume alto lido fora de contexto',
    gravidade: 'media',
    problema: `Volume tres vezes acima da media parece conviccao, mas pode ser causa mecanica:
      leilao de fechamento, vencimento de opcoes (terceira sexta-feira do mes), rebalanceamento
      de indice, entrada ou saida do IBOV.`,
    comoEvitar: `Antes de ler volume como interesse, elimine as datas mecanicas. E olhe volume
      <strong>financeiro</strong>, nao quantidade de acoes.`,
  },
  {
    titulo: 'Timeframe shopping',
    gravidade: 'media',
    problema: `Voce olha 1 mes e nao confirma; troca para 3 meses e confirma; opera. Isso nao e
      analise, e busca por concordancia.`,
    comoEvitar: `Escolha o range <strong>antes</strong> de olhar. Ironicamente, ter so tres botoes
      de range neste painel limita o estrago.`,
  },
  {
    titulo: 'Janela curta demais para o padrao',
    gravidade: 'media',
    problema: `O maior range aqui sao 3 meses, ~${PARAMETROS.pregoesNoMaior} pregoes. Nao da para
      calcular media de 200 periodos, nem ver um ombro-cabeca-ombro tipico, nem enxergar ciclo
      anual. Se alguem te mostrar um <em>golden cross</em> nesta janela, esta errado: ele precisa
      de 200 pregoes.`,
    comoEvitar: `Saiba qual formacao cabe no que voce esta vendo. Triangulo e bandeira cabem;
      OCO nao.`,
  },
  {
    titulo: 'Dois sinais opostos lidos como confirmacao',
    gravidade: 'alta',
    problema: `Este sistema emite <code>sinal_momentum</code> e <code>sinal_reversao</code>. Sao
      teses <strong>contrarias por construcao</strong>: momentum aposta que o que sobe continua,
      reversao aposta que o que esticou volta.`,
    comoEvitar: `Se os dois apontarem compra ao mesmo tempo, isso nao e confirmacao dupla — e
      indicio de que os parametros estao frouxos o bastante para dispararem juntos. Motivo para
      desconfiar, nao para comemorar.`,
  },
  {
    titulo: 'Multiplos testes sem correcao',
    gravidade: 'media',
    problema: `Testar 20 indicadores ate um "funcionar" e o mesmo que jogar moeda 20 vezes e
      celebrar a sequencia de caras. Com 20 tentativas, achar algo a 5% de significancia e o
      esperado, nao uma descoberta.`,
    comoEvitar: `Defina a hipotese antes de testar, e conte quantas voce testou.`,
  },
  {
    titulo: 'Liquidez: o preco que voce ve nao e o que voce paga',
    gravidade: 'media',
    problema: `Padrao bonito em acao de giro baixo e ilusao: o "fechamento" pode ter sido um
      negocio unico de 100 acoes, e o spread de compra e venda come o movimento inteiro.`,
    comoEvitar: `Cheque volume financeiro diario antes de confiar no desenho.`,
  },
  {
    titulo: 'Ancoragem no proprio preco de compra',
    gravidade: 'alta',
    problema: `"Vendo quando voltar ao que paguei." O mercado nao sabe quanto voce pagou e nao tem
      obrigacao nenhuma com esse numero.`,
    comoEvitar: `A decisao de hoje deveria ser a mesma se voce nao tivesse posicao. Se nao for,
      o que esta decidindo e o seu historico, nao o ativo.`,
  },
  {
    titulo: 'Escala linear em serie longa',
    gravidade: 'baixa',
    problema: `Em escala linear, ir de R$ 10 para R$ 20 (100%) parece igual a ir de R$ 100 para
      R$ 110 (10%).`,
    comoEvitar: `Series longas se leem em escala logaritmica. Nos 3 meses deste painel raramente
      distorce, mas passa a importar se a janela crescer.`,
  },
];

const GRAVIDADES = {
  alta: { rotulo: 'Derruba muita gente', classe: 'bg-danger' },
  media: { rotulo: 'Comum', classe: 'bg-warning text-dark' },
  baixa: { rotulo: 'Situacional', classe: 'bg-secondary' },
};

export class PadroesPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Padroes e armadilhas</h4>
      <p class="text-muted small">
        Como se le um grafico de candles e onde a leitura costuma dar errado. Os nomes dos
        padroes tem verbete no <a href="#/glossario">Glossario</a>; o que o sistema calcula
        esta em <a href="#/formulas">Formulas</a>.
      </p>

      ${aviso()}
      ${secaoOQueOCandleDiz()}
      ${secaoPadroesVelas()}
      ${secaoFormacoes()}
      ${secaoTendenciaEVolume()}
      ${secaoTraderVsLongoPrazo()}
      ${secaoArmadilhas()}
      ${secaoOQueOSistemaProtege()}
    `;
  }
}

function aviso() {
  return `
    <div class="alert alert-secondary small" role="alert">
      Material informativo sobre como as ferramentas funcionam. Explicar o que um padrao
      significa nao e sugerir compra ou venda — este painel nao faz recomendacao de
      investimento.
    </div>
  `;
}

function secaoOQueOCandleDiz() {
  return `
    <div class="card shadow-sm mb-3">
      <div class="card-header"><strong>O candle e o placar de uma sessao</strong></div>
      <div class="card-body small">
        <p>
          Cada vela guarda quatro numeros e uma narrativa. O <strong>corpo</strong>
          (abertura ate fechamento) mede conviccao; a <strong>sombra</strong> mede rejeicao.
          Uma vela de corpo minusculo com sombra inferior longa nao diz "caiu" — diz
          "tentaram derrubar e nao sustentaram".
        </p>
        <p class="mb-0 text-muted">
          Vale notar a diferenca de resolucao: o sinal tecnico deste sistema usa so o
          <em>fechamento</em> dos ultimos ${PARAMETROS.janela} pregoes. O grafico de candles
          mostra os quatro precos de cada sessao. Sao leituras distintas do mesmo dia, e a
          segunda tem mais informacao que a primeira.
        </p>
      </div>
    </div>
  `;
}

function secaoPadroesVelas() {
  const linhas = PADROES_VELAS.map(
    (p) => `
      <tr>
        <td class="fw-semibold">${p.nome}</td>
        <td>${p.sugere}</td>
        <td class="text-muted">${p.soValeSe}</td>
      </tr>`,
  ).join('');

  return `
    <div class="card shadow-sm mb-3">
      <div class="card-header"><strong>Padroes de 1 a 3 velas</strong></div>
      <div class="card-body">
        <p class="small text-muted">
          Sao os de curtissimo prazo, os que traders operam. A regra que quase todo iniciante
          ignora: <strong>padrao de vela isolado nao e sinal, e contexto</strong>.
        </p>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead><tr><th>Padrao</th><th>O que sugere</th><th>So vale se</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function secaoFormacoes() {
  const cartoes = FORMACOES.map(
    (f) => `
      <div class="col">
        <div class="border-start border-3 ps-3 h-100">
          <div class="fw-semibold">
            ${f.nome}
            ${
              f.cabeNaJanela
                ? '<span class="badge bg-success ms-1">cabe em 3 meses</span>'
                : '<span class="badge bg-danger ms-1">nao cabe em 3 meses</span>'
            }
          </div>
          <div class="text-muted small fst-italic">forma-se em ${f.prazo}</div>
          <p class="small mb-0 mt-1">${f.descricao}</p>
        </div>
      </div>`,
  ).join('');

  return `
    <div class="card shadow-sm mb-3">
      <div class="card-header"><strong>Formacoes graficas</strong></div>
      <div class="card-body">
        <p class="small text-muted">
          Levam semanas ou meses. O selo indica se a formacao cabe no maior range disponivel
          aqui (${PARAMETROS.ranges}) — limite do plano gratuito da BRAPI, nao do codigo.
        </p>
        <div class="row row-cols-1 row-cols-lg-2 g-3">${cartoes}</div>
      </div>
    </div>
  `;
}

function secaoTendenciaEVolume() {
  return `
    <div class="card shadow-sm mb-3">
      <div class="card-header"><strong>Tendencia, medias e volume</strong></div>
      <div class="card-body small">
        <p>
          A media movel <strong>nao preve nada: ela suaviza</strong>. Preco acima da media de
          ${PARAMETROS.janela} periodos significa que os ultimos ${PARAMETROS.janela}
          fechamentos, em media, foram menores que o de hoje. E descricao, nao profecia.
        </p>
        <p>
          Volume e o confirmador. Rompimento com volume fraco e suspeito, porque poucos
          participantes validaram o preco novo. E o que o <code>score_volume</code> mede:
          acima de 1 significa hoje acima da media da janela.
        </p>
        <p class="mb-0 text-muted">
          O <em>golden cross</em> (media de 50 cruzando a de 200) precisa de 200 pregoes e
          portanto <strong>nao existe</strong> nesta janela de ${PARAMETROS.pregoesNoMaior}.
        </p>
      </div>
    </div>
  `;
}

function secaoTraderVsLongoPrazo() {
  const linhas = [
    ['A pergunta', 'Para onde vai nos proximos dias?', 'Isto vale o preco que pedem?'],
    ['O grafico e', 'O objeto da analise', 'Ponto de entrada, no maximo'],
    ['Um topo duplo', 'Sinal de saida', 'Ruido irrelevante'],
    ['Horizonte do erro', 'Stop em dias', 'Tese em anos'],
    ['No painel', 'Candles, media movel, z-score', 'Graham, ROE, margem, divida liquida'],
  ]
    .map(([o, t, l]) => `<tr><td class="text-muted">${o}</td><td>${t}</td><td>${l}</td></tr>`)
    .join('');

  return `
    <div class="card shadow-sm mb-3">
      <div class="card-header"><strong>Trader e investidor de longo prazo leem a mesma figura de formas opostas</strong></div>
      <div class="card-body">
        <div class="table-responsive mb-2">
          <table class="table table-sm mb-0">
            <thead><tr><th></th><th>Trader</th><th>Longo prazo</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
        <p class="small mb-0">
          Este sistema tem os dois de proposito, e eles <strong>podem se contradizer com total
          legitimidade</strong>: acao barata que esta caindo e o caso normal, nao a excecao.
        </p>
      </div>
    </div>
  `;
}

function secaoArmadilhas() {
  const cartoes = ARMADILHAS.map((a) => {
    const g = GRAVIDADES[a.gravidade];
    return `
      <div class="card shadow-sm mb-3">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <strong>${a.titulo}</strong>
          <span class="badge ${g.classe}">${g.rotulo}</span>
        </div>
        <div class="card-body small">
          <p>${a.problema}</p>
          <p class="mb-0"><span class="text-muted">Como evitar:</span> ${a.comoEvitar}</p>
        </div>
      </div>`;
  }).join('');

  return `
    <h5 class="mt-4 mb-2">As armadilhas</h5>
    <p class="text-muted small">
      O que mais faz gente errar na leitura de grafico. A primeira esteve ativa no codigo
      deste proprio sistema ate 26/09/2026 — nenhuma delas e teorica.
    </p>
    ${cartoes}
  `;
}

function secaoOQueOSistemaProtege() {
  return `
    <div class="card shadow-sm mb-4 border-info">
      <div class="card-header"><strong>O que este painel protege, e o que nao protege</strong></div>
      <div class="card-body small">
        <p>
          <span class="badge bg-success">Protege</span>
          Os fundamentos da CVM nao dependem da sua leitura: ROE e margem sao fato contabil
          auditado. Quando uma metrica nao existe para aquele plano de contas, o painel diz
          que nao existe e explica por que, em vez de inventar numero.
        </p>
        <p class="mb-0">
          <span class="badge bg-danger">Nao protege</span>
          Nada aqui impede timeframe shopping, ancoragem no preco de compra ou apofenia. Essas
          continuam por sua conta.
        </p>
      </div>
    </div>
  `;
}

customElements.define('padroes-page', PadroesPage);
