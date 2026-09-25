import { BaseComponent } from '../components/base/BaseComponent.js';

// Unica responsabilidade: documentar, por tema, as formulas e regras de
// calculo do ecossistema - conteudo 100% estatico, sem chamada de API. Os
// numeros reais de um ativo ficam na aba "Como funciona".
//
// Estrutura pensada pra crescer: cada tema é um cartao/coluna com uma lista
// de itens. Pra descrever um indicador novo (implementado ou so proposto),
// basta acrescentar um item na lista `itens` do tema certo - nao é preciso
// escrever HTML novo. `status` distingue o que já roda (implementado) do que
// é so uma especificacao pronta pra implementar (proposta), e `cenarios`
// marca em qual contexto de uso (day trade, swing, longo prazo, setorial,
// macro) aquele numero faz sentido.

const CENARIOS = {
  DAY_TRADE: { rotulo: 'Day trade', classe: 'bg-danger' },
  SWING: { rotulo: 'Swing / reversao', classe: 'bg-warning text-dark' },
  LONGO_PRAZO: { rotulo: 'Longo prazo', classe: 'bg-success' },
  SETORIAL: { rotulo: 'Comparacao setorial', classe: 'bg-primary' },
  MACRO: { rotulo: 'Contexto macro', classe: 'bg-info text-dark' },
};

const STATUS = {
  implementado: { rotulo: 'Implementado', classe: 'bg-success' },
  proposta: { rotulo: 'Proposta futura', classe: 'bg-secondary' },
  gratis: { rotulo: 'Gratis hoje', classe: 'bg-success' },
  pago: { rotulo: 'Requer upgrade', classe: 'bg-warning text-dark' },
};

const TEMAS = [
  {
    id: 'valuation',
    titulo: 'Valuation fundamentalista',
    resumo: 'Quanto a acao custa hoje frente ao que a empresa entrega de lucro.',
    fonte: 'BRAPI /quote - gratis (priceEarnings, earningsPerShare)',
    itens: [
      {
        status: 'implementado',
        nome: 'Preco justo por Graham (3 cenarios)',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Para crescimento conservador (0%), base (3%) e otimista (5%), o multiplo de lucro implicito e o preco justo resultante.',
        formula: 'multiplo = 8.5 + 2 x crescimento; preco justo = LPA x multiplo; margem = (preco justo - preco atual) / preco justo',
      },
      {
        status: 'implementado',
        nome: 'Earnings yield e classificacao do P/L',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'O inverso do P/L, em %. Quanto maior, mais a empresa "paga" pelo preco pago pela acao.',
        formula: 'earnings yield = LPA / preco; Atrativo >=12%, Razoavel >=8%, Baixo >=6%, senao Muito baixo',
      },
    ],
  },
  {
    id: 'contexto-tecnico',
    titulo: 'Contexto tecnico do dia',
    resumo: 'Onde o preco de hoje esta dentro da propria historia recente do ativo.',
    fonte: 'BRAPI /quote - gratis (fiftyTwoWeekLow/High, regularMarketDayHigh/Low)',
    itens: [
      {
        status: 'implementado',
        nome: 'Posicao no range de 52 semanas',
        cenarios: ['SWING', 'LONGO_PRAZO'],
        descricao: '0% = minima das 52 semanas, 100% = maxima. Zona "Proximo da minima" (<=25%), "Proximo da maxima" (>=85%) ou "Meio do range".',
        formula: 'posicao = (preco - minima 52s) / (maxima 52s - minima 52s)',
      },
      {
        status: 'implementado',
        nome: 'Variacoes intradiarias',
        cenarios: ['DAY_TRADE'],
        descricao: 'Variacao desde a abertura, contra o fechamento anterior e amplitude entre maxima e minima do dia.',
        formula: 'variacao = (preco atual - referencia) / referencia',
      },
    ],
  },
  {
    id: 'sinal-tecnico',
    titulo: 'Sinal tecnico de serie',
    resumo: 'Tendencia e anomalia estatistica nos ultimos 20 candles coletados.',
    fonte: 'BRAPI /historical - gratis, limitado a 3 meses / candle diario',
    itens: [
      {
        status: 'implementado',
        nome: 'Sinal de momentum',
        cenarios: ['DAY_TRADE'],
        descricao: 'Tendencia confirmada por volume: compra tecnica com preco acima da media movel e volume acima da media; venda tecnica no inverso.',
        formula: 'compra se preco > MM20 e volume / volume medio > 1.3; venda se preco < MM20 e essa razao < 0.7',
      },
      {
        status: 'implementado',
        nome: 'Sinal de reversao',
        cenarios: ['SWING'],
        descricao: 'Extremo estatistico: compra tecnica em desconto anormal perto da minima de 52 semanas; venda tecnica em sobrecompra perto da maxima.',
        formula: 'compra se z-score < -1.5 e preco a <=10% da minima 52s; venda se z-score > 1.5 ou preco a <=5% da maxima 52s',
      },
    ],
  },
  {
    id: 'perfil-operacao',
    titulo: 'Perfil de operacao e riscos',
    resumo: 'Pra qual tipo de operacao o ativo serve agora, e o risco de comprar/vender neste exato momento.',
    fonte: 'Derivado no Java a partir dos sinais acima - sem consulta nova',
    itens: [
      {
        status: 'implementado',
        nome: 'Perfis aplicaveis (nao exclusivos)',
        cenarios: ['DAY_TRADE', 'SWING', 'LONGO_PRAZO'],
        descricao: 'Um ativo pode servir a mais de um perfil ao mesmo tempo.',
        formula: 'Day trade se sinal de momentum != neutro; Swing/reversao se sinal de reversao != neutro; Longo prazo se margem conservadora >=20% e earnings yield Atrativo/Razoavel',
      },
      {
        status: 'implementado',
        nome: 'Risco de comprar / vender agora',
        cenarios: ['DAY_TRADE', 'SWING', 'LONGO_PRAZO'],
        descricao: 'Separado em dois numeros - o risco de comprar nao e o inverso do risco de vender.',
        formula: 'risco de comprar: Alto se perto da maxima 52s e margem base <10%; risco de vender: Alto se perto da minima 52s e margem base >=10%',
      },
      {
        status: 'implementado',
        nome: 'Confluencia de sinais',
        cenarios: ['DAY_TRADE', 'SWING', 'LONGO_PRAZO'],
        descricao: 'Quantos dos 3 sinais independentes (fundamentalista, momentum, reversao) apontam pro mesmo lado. E concordancia, nao e probabilidade de sucesso.',
        formula: 'contagem de sinais em COMPRA vs. VENDA vs. NEUTRO',
      },
    ],
  },
  {
    id: 'decisao-consolidada',
    titulo: 'Decisao consolidada (historico)',
    resumo: 'A mesma logica de valuation acima, mas resumida sobre todo o historico de analises do ativo - nao um ciclo isolado.',
    fonte: 'Media de detalhes_json de todas as analises do simbolo',
    itens: [
      {
        status: 'implementado',
        nome: 'Recomendacao, risco e confianca',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Regras fixas sobre margem de seguranca media e earnings yield medio, mostradas em Consulta e na coluna "Decisao" de Monitorados.',
        formula: 'COMPRA_FORTE: margem conservadora >=20% e earnings yield >=12%; VENDA_VALUATION: margem base negativa; senao MANTER',
      },
    ],
  },
  {
    id: 'contexto-setorial',
    titulo: 'Contexto setorial',
    resumo: 'Comparar multiplos do ativo contra o proprio setor, em vez de contra limiares fixos e iguais pra qualquer empresa.',
    fonte: 'BRAPI /v2/stocks/profile - confirmado gratis pra qualquer ticker (validado em 2026-09-25 com WEGE3)',
    itens: [
      {
        status: 'implementado',
        nome: 'Setor, industria e resumo do negocio',
        cenarios: ['SETORIAL'],
        descricao: 'Buscado ao vivo no Java (ServicoAtivo.buscarPerfilEmpresa) e anexado a resposta de /fundamentos - degrada pra null se a BRAPI falhar, sem quebrar o resto da resposta.',
        formula: 'campo direto: profile.sector / profile.industry / profile.longBusinessSummary',
      },
      {
        status: 'proposta',
        nome: 'P/L e earnings yield relativos ao setor',
        cenarios: ['SETORIAL', 'LONGO_PRAZO'],
        descricao: 'Em vez de "Atrativo >=12%" fixo pra qualquer ativo, comparar contra a media do earnings yield dos outros ativos monitorados do mesmo setor.',
        formula: 'earnings yield relativo = earnings yield do ativo - media do earnings yield do setor (entre os ativos monitorados)',
      },
    ],
  },
  {
    id: 'risco-mercado',
    titulo: 'Risco relativo ao mercado (proposta)',
    resumo: 'Quao volatil o ativo e, isolado e comparado ao Ibovespa - hoje o painel nao distingue uma recomendacao estavel de uma extremamente arriscada.',
    fonte: 'BRAPI /historical do ativo + do indice ^BVSP - ambos gratis, limitados a 3 meses',
    itens: [
      {
        status: 'proposta',
        nome: 'Volatilidade historica',
        cenarios: ['DAY_TRADE', 'SWING', 'LONGO_PRAZO'],
        descricao: 'Desvio-padrao dos retornos diarios dos candles ja coletados em serie_historica. Nao exige nova coleta.',
        formula: 'volatilidade = desvio-padrao(retorno diario); retorno diario = (fechamento[i] - fechamento[i-1]) / fechamento[i-1]',
      },
      {
        status: 'proposta',
        nome: 'Beta vs. Ibovespa',
        cenarios: ['LONGO_PRAZO', 'SETORIAL'],
        descricao: 'O quanto o ativo amplifica ou amortece o movimento do indice. Precisa coletar a serie do ^BVSP no mesmo range ja usado pros ativos monitorados.',
        formula: 'beta = covariancia(retorno do ativo, retorno do Ibovespa) / variancia(retorno do Ibovespa)',
      },
      {
        status: 'proposta',
        nome: 'Persistencia do sinal',
        cenarios: ['DAY_TRADE', 'SWING', 'LONGO_PRAZO'],
        descricao: 'Quantos ciclos consecutivos a recomendacao se mantem no mesmo sentido. Nao mede se a recomendacao "deu certo" - so mede estabilidade do sinal atual.',
        formula: 'contagem de analises consecutivas do simbolo com a mesma recomendacao, do mais recente pra tras',
      },
    ],
  },
  {
    id: 'contexto-macro',
    titulo: 'Contexto macroeconomico (proposta)',
    resumo: 'Um earnings yield de 8% e otimo com Selic a 6% e ruim com Selic a 14% - hoje a classificacao ignora isso.',
    fonte: 'BRAPI /macro (Selic/CDI/IPCA) exige plano Startup - alternativa gratis: API SGS do Banco Central (api.bcb.gov.br), sem chave',
    itens: [
      {
        status: 'proposta',
        nome: 'Earnings yield vs. taxa livre de risco',
        cenarios: ['MACRO', 'LONGO_PRAZO'],
        descricao: 'Mede o quanto o earnings yield da acao compensa (ou nao) o risco extra frente a simplesmente deixar o dinheiro na Selic.',
        formula: 'premio de risco = earnings yield do ativo - taxa Selic anual',
      },
    ],
  },
];

// Catalogo de dados da BRAPI, validado ao vivo em 2026-09-25 com curl direto
// contra a chave real do plano Gratuito (nao e so leitura da doc) - o mesmo
// metodo usado antes pra descobrir o limite de range do historico.
const FONTES_DADOS = {
  titulo: 'BRAPI: o que e gratis hoje',
  resumo: 'Validacao ao vivo do plano Gratuito atual, dado a dado, antes de assumir que algo esta disponivel.',
  itens: [
    { status: 'gratis', nome: 'Cotacao (/quote)', detalhe: 'Preco, variacao, volume, range do dia e de 52 semanas, P/L, LPA - pra qualquer ticker, nao so os de demonstracao.' },
    { status: 'gratis', nome: 'Historico OHLCV (/historical)', detalhe: 'So candle diario (1d), ate 3 meses de janela - 1y devolve 400 pra qualquer ticker fora da lista de demonstracao (PETR4, MGLU3...).' },
    { status: 'gratis', nome: 'Perfil da empresa (summaryProfile / /profile)', detalhe: 'Setor, industria, CNPJ, endereco, resumo do negocio. Confirmado gratis mesmo em ticker real (testado com WEGE3).' },
    { status: 'pago', nome: 'Multiplos e estatisticas (defaultKeyStatistics)', detalhe: 'ROE, ROIC, P/VP, beta, dividend yield - exige plano Startup, R$ 119,99/mes.' },
    { status: 'pago', nome: 'Dados financeiros (financialData)', detalhe: 'Margens, divida liquida, fluxo de caixa livre - exige plano Pro, R$ 139,99/mes.' },
    { status: 'pago', nome: 'Balanco, DRE, fluxo de caixa e valor adicionado', detalhe: 'Demonstracoes completas - Startup (so anual, ultimos 5 anos) ou Pro (trimestral, desde 2009).' },
    { status: 'pago', nome: 'Dividendos e proventos (/dividends)', detalhe: 'JCP, bonificacoes, desdobramentos, subscricoes - exige plano Startup.' },
    { status: 'pago', nome: 'Macroeconomia (Selic, CDI, IPCA, IGP-M...)', detalhe: 'Exige plano Startup - mas a mesma serie esta disponivel de graca direto na API do Banco Central (SGS), sem passar pela BRAPI.' },
    { status: 'pago', nome: 'Cambio e criptomoedas', detalhe: 'Ambos exigem plano Startup.' },
  ],
};

export class FormulasPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Fundamentos de mercado</h4>
      <p class="text-muted small">Cada cartao abaixo e um tema. "Implementado" ja roda no ecossistema hoje; "Proposta futura" e uma especificacao pronta pra implementar, ainda sem codigo. Veja os numeros reais de um ativo na aba <a href="#/gestao">Gestao</a> (sub-aba "Como funciona").</p>

      ${legenda()}

      <div class="row row-cols-1 row-cols-lg-2 g-3 mb-4">
        ${TEMAS.map((tema) => renderTema(tema)).join('')}
      </div>

      <h5 class="mt-2">Fontes de dados</h5>
      <div class="mb-4">
        ${renderFonteDados(FONTES_DADOS)}
      </div>

      ${secaoLimitacoes()}
    `;
  }
}

function legenda() {
  return `
    <div class="d-flex flex-wrap gap-2 mb-3 small">
      <span class="badge ${STATUS.implementado.classe}">${STATUS.implementado.rotulo}</span>
      <span class="badge ${STATUS.proposta.classe}">${STATUS.proposta.rotulo}</span>
      <span class="badge ${STATUS.gratis.classe}">${STATUS.gratis.rotulo}</span>
      <span class="badge ${STATUS.pago.classe}">${STATUS.pago.rotulo}</span>
      ${Object.values(CENARIOS).map((c) => `<span class="badge ${c.classe}">${c.rotulo}</span>`).join('')}
    </div>
  `;
}

function renderTema(tema) {
  const itens = tema.itens.map((item) => renderItem(item)).join('');
  return `
    <div class="col">
      <div class="card h-100 shadow-sm" id="${tema.id}">
        <div class="card-header"><strong>${tema.titulo}</strong></div>
        <div class="card-body">
          <p class="small text-muted mb-2">${tema.resumo}</p>
          <p class="small mb-3"><em>Fonte:</em> ${tema.fonte}</p>
          ${itens}
        </div>
      </div>
    </div>
  `;
}

function renderItem(item) {
  const badgeStatus = STATUS[item.status];
  const badgesCenarios = (item.cenarios || [])
    .map((c) => `<span class="badge ${CENARIOS[c].classe} me-1">${CENARIOS[c].rotulo}</span>`)
    .join('');
  return `
    <div class="mb-3 pb-2 border-bottom">
      <div class="d-flex flex-wrap gap-1 align-items-center mb-1">
        <span class="badge ${badgeStatus.classe}">${badgeStatus.rotulo}</span>
        ${badgesCenarios}
      </div>
      <div class="fw-semibold small">${item.nome}</div>
      <p class="small mb-1">${item.descricao}</p>
      <code class="small d-block">${item.formula}</code>
    </div>
  `;
}

function renderFonteDados(fonte) {
  const linhas = fonte.itens
    .map((item) => {
      const badge = STATUS[item.status];
      return `
        <tr>
          <td><span class="badge ${badge.classe}">${badge.rotulo}</span></td>
          <td class="fw-semibold">${item.nome}</td>
          <td class="text-muted">${item.detalhe}</td>
        </tr>
      `;
    })
    .join('');
  return `
    <div class="card shadow-sm">
      <div class="card-header"><strong>${fonte.titulo}</strong></div>
      <div class="card-body">
        <p class="small text-muted mb-2">${fonte.resumo}</p>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <tbody>${linhas}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function secaoLimitacoes() {
  return `
    <h6 class="mt-3">O que isso nao responde (ainda)</h6>
    <p class="small text-muted">Nenhum numero desta pagina mede se uma recomendacao passada "deu certo" (se o preco realmente se moveu como o sinal indicava). Isso exigiria acompanhar o resultado futuro de cada analise ao longo do tempo - um mecanismo que nao existe hoje. Por isso o painel nao mostra "taxa de acerto" nem probabilidade de sucesso de uma operacao: seria um numero inventado, nao medido.</p>
  `;
}

customElements.define('formulas-page', FormulasPage);
