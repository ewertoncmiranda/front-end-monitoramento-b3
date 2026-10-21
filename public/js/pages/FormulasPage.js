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

export const TEMAS = [
  {
    id: 'valuation',
    titulo: 'Valuation fundamentalista',
    resumo: 'Quanto a acao custa hoje frente ao que a empresa entrega de lucro.',
    fonte: 'BRAPI /quote (priceEarnings, earningsPerShare) + CVM (LPA/VPA de varios anos) + Selic (indice_macro) - tudo gratis',
    itens: [
      {
        status: 'implementado',
        nome: 'Preco justo por Graham ajustado por juros (3 cenarios)',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Formula revisada de Graham (1974): o multiplo classico e multiplicado por 4,4/Y, onde Y e a Selic meta vigente. Sem esse ajuste, com juros de dois digitos, o preco justo sai varias vezes inflado (correcao de 27-09-2026 - ver Glossario). O cenario sem ajuste (Y=4,4) continua calculado so como referencia historica, fora da recomendacao.',
        formula: 'fator = 4,4 / Selic; multiplo = (8,5 + 2 x crescimento) x fator; preco justo = LPA_normalizado x multiplo; margem = (preco justo - preco atual) / preco justo',
      },
      {
        status: 'implementado',
        nome: 'LPA normalizado',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'O LPA usado no valuation e o menor entre o atual e a media dos ultimos 3 a 5 exercicios entregues a CVM - evita que uma ciclica no pico do lucro pareca barata so por causa do ano.',
        formula: 'LPA_usado = min(LPA_atual, media(LPA dos ultimos 3-5 anos)); sem 3 anos de historico, fica so o LPA atual',
      },
      {
        status: 'implementado',
        nome: 'Graham Number (segunda trava de COMPRA_FORTE)',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Teto classico de Graham pro investidor defensivo: aceita, no maximo, P/L 15 e P/VP 1,5 ao mesmo tempo. Preco acima disso rebaixa COMPRA_FORTE pra COMPRA_MODERADA, mesmo com margem de seguranca alta.',
        formula: 'graham_number = sqrt(22,5 x LPA_normalizado x VPA)',
      },
      {
        status: 'implementado',
        nome: 'Faixa neutra de venda',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'So e VENDA_VALUATION com margem de seguranca do cenario base abaixo de -15% - entre -15% e 0% a recomendacao e MANTER, nao venda. Antes, qualquer margem negativa virava venda.',
        formula: 'VENDA_VALUATION se margem_base < -15%; senao MANTER (dentro da faixa) ou outra regra de compra',
      },
      {
        status: 'implementado',
        nome: 'Earnings yield e classificacao do P/L',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'O inverso do P/L, em %. Quanto maior, mais a empresa "paga" pelo preco pago pela acao.',
        formula: 'earnings yield = LPA_normalizado / preco; Atrativo >=12%, Razoavel >=8%, Baixo >=6%, senao Muito baixo',
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
    titulo: 'Contexto macroeconomico',
    resumo: 'Um earnings yield de 8% e otimo com Selic a 6% e ruim com Selic a 14% - a classificacao fixa por si so ignora isso.',
    fonte: 'API SGS do Banco Central (api.bcb.gov.br) - gratis, sem chave. Ver a serie em <a href="#/indices">Indices</a>.',
    itens: [
      {
        status: 'implementado',
        nome: 'Earnings yield vs. taxa livre de risco',
        cenarios: ['MACRO', 'LONGO_PRAZO'],
        descricao: 'Mede o quanto o earnings yield da acao compensa (ou nao) o risco extra frente a simplesmente deixar o dinheiro na Selic. Selic buscada 1x/dia e cacheada (indice_macro); nunca ao vivo na hora do clique.',
        formula: 'premio de risco = earnings yield do ativo - taxa Selic anual (o mais recente ponto de indice_macro)',
      },
    ],
  },
  // MACRO-PAI-4: temas dos planos MACRO, FONTES e MICRO. Cada item traz a
  // expressao, as variaveis, um exemplo numerico e os limites. Os exemplos
  // marcados como "didatico" sao contas de ilustracao, nao dados de um ativo.
  {
    id: 'macro-juros',
    titulo: 'Juros, inflação e renda fixa (Índices)',
    resumo: 'Como o painel compara a Selic, a inflação e o lucro de uma ação.',
    fonte: 'Séries do Banco Central (SGS e Focus) e curva da NTN-B do Tesouro; tela <a href="#/indices">Índices</a>.',
    itens: [
      {
        id: 'juro-real',
        status: 'implementado',
        nome: 'Juro real',
        cenarios: ['MACRO'],
        descricao: 'Quanto a Selic rende acima da inflação esperada. Usa o IPCA esperado do Focus (do ano seguinte depois de junho, senão do ano corrente); se faltar, o IPCA acumulado em 12 meses.',
        formula: 'juro real = (1 + Selic) / (1 + IPCA esperado) - 1',
        variaveis: 'Selic = Selic meta vigente, em % a.a.; IPCA esperado = mediana do Focus, em % a.a.',
        exemplo: 'Exemplo ilustrativo: Selic 14,50% e IPCA esperado 5,22%: 1,1450 / 1,0522 - 1 = 8,82% a.a.',
        limites: 'Sem Selic ou sem nenhuma das duas fontes de IPCA, o bloco mostra o motivo em vez do número. Não é previsão: a inflação esperada muda toda semana.',
      },
      {
        id: 'barreira-compra',
        status: 'implementado',
        nome: 'Barreira de compra',
        cenarios: ['MACRO', 'LONGO_PRAZO'],
        descricao: 'O earnings yield mínimo para a ação empatar com a Selic meta. O painel lista até 20 ativos acima da barreira e a mediana da base.',
        formula: 'barreira = Selic meta; distância = earnings yield do ativo - barreira (em p.p.)',
        variaveis: 'Earnings yield = LPA normalizado / preço, em %; vem do último insight de cada ativo.',
        exemplo: 'Earnings yield 12,50% com Selic meta 14,50%: distância de -2,00 p.p. (abaixo). Um ativo com +3,05 p.p. está 3,05 pontos acima.',
        limites: 'Só entram ativos que têm insight e earnings yield numérico. Lucro contábil pode oscilar; estar acima da barreira não é garantia de retorno.',
      },
      {
        id: 'ciclo-selic',
        status: 'implementado',
        nome: 'Ciclo da Selic',
        cenarios: ['MACRO'],
        descricao: 'Direção da Selic meta nos últimos 90 dias.',
        formula: 'ALTA se meta hoje - meta 90 dias antes > 0,01; QUEDA se < -0,01; senão ESTÁVEL',
        variaveis: 'Meta 90 dias antes = último ponto em ou antes de 90 dias atrás; 0,01 p.p. é a tolerância.',
        exemplo: 'Exemplo didático: meta de 15,00% há 90 dias e 13,75% hoje: -1,25 p.p., selo QUEDA.',
        limites: 'Descreve o passado recente; não antecipa a decisão do Banco Central.',
      },
      {
        id: 'ipca-12m',
        status: 'implementado',
        nome: 'IPCA acumulado em 12 meses',
        cenarios: ['MACRO'],
        descricao: 'Inflação oficial composta mês a mês. Série oficial 13522 do Banco Central; o painel confere com o acumulado calculado dos meses.',
        formula: 'acumulado 12m = (1 + i1) x (1 + i2) x ... x (1 + i12) - 1',
        variaveis: 'i = IPCA de cada um dos 12 meses seguidos, em fração (0,40% = 0,0040).',
        exemplo: 'Setembro de 2026: acumulado calculado pelo painel de 4,58%, igual à série oficial.',
        limites: 'Exige 12 meses consecutivos; com buraco, o valor fica oculto (não é inventado).',
      },
      {
        id: 'referencia-ntnb',
        status: 'implementado',
        nome: 'NTN-B de referência e forma da curva',
        cenarios: ['MACRO'],
        descricao: 'A referência é o vencimento da NTN-B (Tesouro IPCA+) mais perto de 5 anos a partir da data-base, usando a taxa de compra. A forma da curva compara o primeiro e o último vencimento.',
        formula: 'alvo = data-base + 5 anos; referência = vencimento mais próximo do alvo (empate: o menor); curva INVERTIDA se taxa longa < taxa curta; PLANA se a diferença < 0,005; senão NORMAL',
        variaveis: 'Taxa = taxa de compra do título, em % a.a. acima do IPCA.',
        exemplo: 'Referência com vencimento em 15/08/2031 e taxa de 7,20% (data-base 16/10/2026).',
        limites: 'Pontos sem taxa de compra não concorrem. Sem a curva, o cartão vira aviso e o resto da tela não muda.',
      },
    ],
  },
  {
    id: 'premio-ntnb',
    titulo: 'Prêmio de risco e Graham ajustado',
    resumo: 'Ação contra renda fixa protegida da inflação, e o valor de Graham corrigido pelo juro.',
    fonte: 'Gestor: /ativos/{simbolo}/premio-risco e /indices-macro/curva-real; seção Valuation da <a href="#/ativo?secao=valuation">ficha</a>.',
    itens: [
      {
        id: 'premio-risco',
        status: 'implementado',
        nome: 'Prêmio de risco contra a NTN-B',
        cenarios: ['MACRO', 'LONGO_PRAZO'],
        descricao: 'Quanto o lucro da ação rende a mais (ou a menos) que o juro real da NTN-B de referência. Há também a linha contra a Selic meta.',
        formula: 'prêmio de risco = earnings yield - juro real da NTN-B de referência (vencimento mais perto de 5 anos); contra a Selic = earnings yield - Selic meta',
        variaveis: 'Earnings yield = LPA normalizado / preço, em %; juro real = taxa de compra da NTN-B de referência, em % a.a.',
        exemplo: 'Earnings yield 12,50% - juro real 7,20% = +5,30 p.p. (Acima da renda fixa). Contra a Selic meta de 14,50%: -2,00 p.p. (Abaixo).',
        limites: 'Prêmio exatamente zero = Igual à renda fixa. Sem insight ou sem a curva, os campos vêm vazios com o motivo.',
      },
      {
        id: 'graham-ajustado-juro',
        status: 'implementado',
        nome: 'Graham ajustado pelo juro (sobre o Graham Number)',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'O valor de Graham multiplicado por 4,4 / Y. A fórmula original usa o rendimento de títulos de alta qualidade; aqui Y nominal (a Selic meta) o substitui.',
        formula: 'Graham ajustado = V x 4,4 / Y',
        variaveis: 'V = Graham Number = raiz(22,5 x LPA x VPA); Y = Selic meta, em % a.a.',
        exemplo: 'V = 78,75 e Y = 14,5: 78,75 x 4,4 / 14,5 = 23,90.',
        limites: 'Sem Selic (ausente ou menor ou igual a zero) o cartão não aparece. Só exibição: a recomendação oficial não usa este valor.',
      },
    ],
  },
  {
    id: 'bancos-formulas',
    titulo: 'Bancos (Basileia, inadimplência, ROE e P/VP)',
    resumo: 'Bancos são avaliados por P/VP, ROE e capital, não por dívida e EBITDA.',
    fonte: 'IF.data do Banco Central (trimestral) e fundamentos CVM; seção Fundamentos da <a href="#/ativo?secao=fundamentos">ficha</a>.',
    itens: [
      {
        id: 'banco-basileia',
        status: 'implementado',
        nome: 'Selo de Basileia',
        cenarios: ['SETORIAL'],
        descricao: 'Compara o índice de Basileia do último trimestre com o mínimo regulatório.',
        formula: 'OK se Basileia >= 10,5%',
        variaveis: 'Basileia = capital / ativos ponderados pelo risco, em %. 10,5% = mínimo com adicional de conservação.',
        exemplo: 'Basileia de 15,2% contra 10,5%: OK.',
        limites: 'O 10,5% é o único valor regulatório da lista. Valores do IF.data entram como percentual (15,2 = 15,2%).',
      },
      {
        id: 'banco-inadimplencia',
        status: 'implementado',
        nome: 'Selo de inadimplência',
        cenarios: ['SETORIAL'],
        descricao: 'Avisa quando a inadimplência subiu muito em 4 trimestres.',
        formula: 'ALERTA se inadimplência do último trimestre - inadimplência 4 trimestres antes > 0,5 p.p.',
        variaveis: 'Compara o último registro com o 5º mais recente da série.',
        exemplo: 'Exemplo do contrato: subiu 0,6 p.p. em 4 trimestres (limite 0,5): ALERTA.',
        limites: 'O 0,5 p.p. é constante revisável: escolha de implementação, não regra regulatória. Assume série sem buracos.',
      },
      {
        id: 'banco-roe-selic',
        status: 'implementado',
        nome: 'Selo de ROE contra a Selic',
        cenarios: ['SETORIAL'],
        descricao: 'O ROE do banco contra o custo de capital de referência.',
        formula: 'ACIMA se ROE >= Selic meta; senão ABAIXO',
        variaveis: 'ROE = lucro líquido / patrimônio líquido, em %. Selic meta em % a.a. como custo de capital.',
        exemplo: 'ROE de 21,5% contra Selic de 14,75%: ACIMA.',
        limites: 'Sem Selic o selo fica SEM_DADO. A Selic como custo de capital é uma simplificação.',
      },
      {
        id: 'roe-sobre-pvp',
        status: 'implementado',
        nome: 'ROE/P/VP',
        cenarios: ['SETORIAL'],
        descricao: 'Retorno sobre o patrimônio por unidade de P/VP paga. Maior indica mais retorno por unidade de preço pago.',
        formula: 'ROE/P/VP = ROE / P/VP; P/VP = preço / VPA',
        variaveis: 'ROE em %; VPA = patrimônio líquido por ação (do último exercício anual).',
        exemplo: 'ROE 21,5 / P/VP 2,00 = 10,75.',
        limites: 'Sem P/VP (sem preço ou VPA), o painel mostra o motivo. Para comparar bancos entre si.',
      },
    ],
  },
  {
    id: 'insiders-formulas',
    titulo: 'Insiders e recompras',
    resumo: 'O que administradores e a própria empresa fizeram com as ações.',
    fonte: 'CVM (negociação de administradores e balanço); seção "Quem está dentro" da <a href="#/ativo?secao=insiders">ficha</a>.',
    itens: [
      {
        id: 'compra-liquida',
        status: 'implementado',
        nome: 'Compra líquida de administradores',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Saldo entre compras e vendas de diretores, conselheiros e controladores, em quantidade de ações. O selo usa a janela de 6 meses.',
        formula: 'compra líquida = (compras - vendas) / (compras + vendas); COMPRA_LIQUIDA se >= 0,10; VENDA_LIQUIDA se <= -0,10; senão NEUTRO',
        variaveis: 'Compras e vendas em ações (compra à vista, venda à vista e compra a termo; ações e units).',
        exemplo: 'Janela de 3 meses (contrato): 1.000 compradas e 200 vendidas: 800 / 1.200 = 0,67. O selo usa a janela de 6 meses.',
        limites: 'O corte de 0,10 e a janela de 6 meses são constantes revisáveis. Sem movimento, NEUTRO. O dado vale a partir da entrega à CVM.',
      },
      {
        id: 'recompra-liquida',
        status: 'implementado',
        nome: 'Recompra líquida',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Compras de ações próprias medidas pela variação do saldo de tesouraria entre balanços consecutivos.',
        formula: 'recompra líquida = -(saldo de tesouraria no fim - saldo no início)',
        variaveis: 'Saldo de tesouraria: conta negativa do balanço (ações recompradas).',
        exemplo: 'Exemplo didático: saldo vai de -500 para -800: -(-800 - (-500)) = 300 de recompra.',
        limites: 'Variação positiva do saldo pode ser cancelamento de ações ou entrega a plano; o dado não distingue. Sem as contas de tesouraria, o painel mostra o motivo.',
      },
    ],
  },
  {
    id: 'confiabilidade-formulas',
    titulo: 'Selos de confiabilidade',
    resumo: 'Cinco verificações com limiares fixos; o resumo é o pior nível.',
    fonte: 'Gestor: /ativos/{simbolo}/confiabilidade (cadastro, auditor, dívida, fundos e dividendo da CVM).',
    itens: [
      {
        id: 'selo-divida',
        status: 'implementado',
        nome: 'Selo de dívida',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Parte da dívida em títulos que vence em 12 meses.',
        formula: 'ALERTA se saldo devedor vencendo em 12 meses / saldo total > 50%',
        variaveis: 'Saldos da referência e versão mais recentes.',
        exemplo: '600 de 1.000 = 60%: ALERTA.',
        limites: '50% é constante revisável. Sem linhas ou saldo zero, SEM_DADO.',
      },
      {
        id: 'selo-dividendo',
        status: 'implementado',
        nome: 'Selo de dividendo (payout)',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Se os proventos do último exercício cabem no lucro.',
        formula: 'payout = (JCP + dividendos do último DFP) / lucro líquido anual do mesmo exercício; ALERTA se payout > 100%',
        variaveis: 'Lucro líquido total (não só o do controlador).',
        exemplo: 'Payout de 120% do lucro líquido: ALERTA.',
        limites: '100% é constante revisável. Lucro não positivo com proventos = ALERTA; sem DFP, SEM_DADO.',
      },
      {
        id: 'selo-auditor-cadastro',
        status: 'implementado',
        nome: 'Selos de auditor, cadastro e fundos',
        cenarios: ['LONGO_PRAZO'],
        descricao: 'Troca de auditor, situação no registro da CVM e posição dos fundos.',
        formula: 'auditor: ALERTA se houve troca de CNPJ de auditor iniciada nos últimos 24 meses; cadastro: ATIVO = OK, suspenso ou cancelado = CRÍTICO, outro = ALERTA; fundos: sempre OK (informativo); resumo = pior nível (CRÍTICO > ALERTA > OK)',
        variaveis: '24 meses é constante revisável. SEM_DADO não conta como pior nível.',
        exemplo: 'PETR4 no contrato: auditor ALERTA, dívida ALERTA, dividendo ALERTA, cadastro e fundos OK: resumo ALERTA.',
        limites: 'Alerta pede atenção e pesquisa; não é veredito.',
      },
    ],
  },
  {
    id: 'eventos-ex-formulas',
    titulo: 'Datas ex e custo de execução',
    resumo: 'O ajuste do preço no dia do provento e o custo de entrar e sair.',
    fonte: 'Gestor: /ativos/{simbolo}/datas-ex (COTAHIST da B3 e proventos); seção Proventos da <a href="#/ativo?secao=proventos">ficha</a>.',
    itens: [
      {
        id: 'ajuste-implicito',
        status: 'implementado',
        nome: 'Ajuste implícito',
        cenarios: ['SWING'],
        descricao: 'Queda do preço explicada pela data ex.',
        formula: 'ajuste implícito = fechamento do pregão anterior - abertura do dia ex; ajuste % = ajuste / fechamento anterior x 100',
        variaveis: 'Fechamento anterior e abertura em R$.',
        exemplo: 'PETR4, JCP, 02/06/2026: 42,37 - 41,90 = R$ 0,47 (1,11%).',
        limites: 'Mistura o movimento normal de mercado do dia. O COTAHIST repete a marca ex em cerca de 8 pregões; vale o primeiro dia da janela.',
      },
      {
        id: 'yield-evento',
        status: 'implementado',
        nome: 'Yield do evento e razão do ajuste',
        cenarios: ['SWING', 'LONGO_PRAZO'],
        descricao: 'O rendimento do provento sobre o preço e quanto dele foi "descontado" no preço.',
        formula: 'yield do evento = valor declarado / fechamento anterior; razão do ajuste = ajuste implícito / valor declarado',
        variaveis: 'Valor declarado por ação, em R$.',
        exemplo: 'Exemplo didático: R$ 0,50 sobre fechamento de R$ 42,37: 0,50 / 42,37 = 1,18%.',
        limites: 'Sem valor declarado, os dois ficam vazios. A data estimada do próximo evento é indicativa (sazonalidade).',
      },
      {
        id: 'alerta-data-ex',
        status: 'implementado',
        nome: 'Alerta de data ex no plano',
        cenarios: ['SWING'],
        descricao: 'Avisa quando a próxima data ex estimada está perto.',
        formula: 'alerta se 0 <= dias até a próxima data ex estimada <= 10',
        variaveis: 'Dias de calendário.',
        exemplo: 'Data estimada daqui a 7 dias: "data ex em 7 dias".',
        limites: 'O limite de 10 dias é constante revisável. A estimativa tem confiança MÉDIA ou BAIXA.',
      },
      {
        id: 'custo-execucao',
        status: 'implementado',
        nome: 'Custo de execução e alvo líquido',
        cenarios: ['DAY_TRADE', 'SWING'],
        descricao: 'Spread mediano dos últimos 21 pregões com oferta (ida e volta) e o alvo descontado dele.',
        formula: 'custo % = mediana(spread das velas) dos últimos 21 pregões; alvo líquido (compra) = alvo - preço atual x custo / 100; ganho potencial líquido = ganho potencial - custo',
        variaveis: 'Spread da vela = (melhor venda - melhor compra) / meio x 100.',
        exemplo: 'Exemplo didático: custo de 0,40% e ganho potencial de 6,00% dão ganho líquido de 5,60%.',
        limites: 'Sem ofertas nas velas, nada é exibido. Em operação de venda o ajuste vai no sentido oposto.',
      },
    ],
  },
  {
    id: 'opcoes-micro-formulas',
    titulo: 'Microestrutura das opções',
    resumo: 'Preço justo, spread e selos de qualidade do preço na cadeia de opções.',
    fonte: 'COTAHIST da B3 e gestor; tela <a href="#/opcoes">Opções</a>.',
    itens: [
      {
        id: 'preco-justo-spread',
        status: 'implementado',
        nome: 'Preço justo pelo meio do spread',
        cenarios: ['DAY_TRADE', 'SWING'],
        descricao: 'Média entre a melhor oferta de compra e a de venda.',
        formula: 'preço justo = (melhor compra + melhor venda) / 2',
        variaveis: 'Ofertas em R$ do prêmio da opção.',
        exemplo: 'Exemplo didático: compra 1,90 e venda 2,10: (1,90 + 2,10) / 2 = 2,00.',
        limites: 'Oferta ausente, zero ou cruzada (venda < compra): sem preço justo, e o painel usa o último negócio.',
      },
      {
        id: 'spread-pct',
        status: 'implementado',
        nome: 'Spread %',
        cenarios: ['DAY_TRADE', 'SWING'],
        descricao: 'Distância entre as ofertas, em relação ao preço justo.',
        formula: 'spread % = (venda - compra) / preço justo x 100',
        variaveis: 'Venda e compra: melhores ofertas.',
        exemplo: 'Exemplo didático: (2,10 - 1,90) / 2,00 x 100 = 10%.',
        limites: 'Sem oferta válida, vazio.',
      },
      {
        id: 'defasagem-ultimo-negocio',
        status: 'implementado',
        nome: 'Defasagem do último negócio',
        cenarios: ['DAY_TRADE', 'SWING'],
        descricao: 'O último fechamento está longe do meio do spread?',
        formula: 'defasado se |fechamento - preço justo| / preço justo > 10%',
        variaveis: 'Fechamento = último negócio.',
        exemplo: 'Exemplo didático: fechamento 1,50 e preço justo 2,00: 25% > 10%, defasado.',
        limites: 'O 10% é constante revisável. Só avalia quando existe preço justo.',
      },
      {
        id: 'strike-corrigido',
        status: 'implementado',
        nome: 'Strike corrigido (INDOPC)',
        cenarios: ['SWING'],
        descricao: 'Marca séries cujo strike é corrigido por índice.',
        formula: 'strike corrigido se INDOPC (1 caractere do COTAHIST) for diferente de vazio e de "0"',
        variaveis: 'INDOPC = campo de correção da opção.',
        exemplo: 'INDOPC = "0" ou vazio: sem correção; qualquer outro código: selo "strike corrigido".',
        limites: 'O painel não interpreta qual índice é; só mostra o código.',
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
    { status: 'pago', nome: 'Multiplos e estatisticas (defaultKeyStatistics)', detalhe: 'ROE, ROIC, P/VP, beta, dividend yield - exige plano Startup, R$ 119,99/mes. SUBSTITUIDO: ROE, ROIC, LPA, VPA, P/L e P/VP agora vem da CVM de graca (ver card abaixo).' },
    { status: 'pago', nome: 'Dados financeiros (financialData)', detalhe: 'Margens, divida liquida, fluxo de caixa livre - exige plano Pro, R$ 139,99/mes. SUBSTITUIDO: os tres vem da CVM de graca (ver card abaixo).' },
    { status: 'pago', nome: 'Balanco, DRE, fluxo de caixa e valor adicionado', detalhe: 'Demonstracoes completas - Startup (so anual, ultimos 5 anos) ou Pro (trimestral, desde 2009). SUBSTITUIDO: a CVM publica as mesmas demonstracoes de graca, e e a fonte primaria delas.' },
    { status: 'pago', nome: 'Dividendos e proventos (/dividends)', detalhe: 'JCP, bonificacoes, desdobramentos, subscricoes - exige plano Startup.' },
    { status: 'pago', nome: 'Macroeconomia (Selic, CDI, IPCA, IGP-M...)', detalhe: 'Exige plano Startup - mas a mesma serie esta disponivel de graca direto na API do Banco Central (SGS), sem passar pela BRAPI.' },
    { status: 'pago', nome: 'Cambio e criptomoedas', detalhe: 'Ambos exigem plano Startup.' },
  ],
};

// Fontes gratuitas que substituem o que a BRAPI cobra. Validadas ao vivo em
// 2026-09-25/26 com requisicao real, nao leitura de documentacao.
const FONTES_CVM = {
  titulo: 'CVM Dados Abertos: o substituto gratuito',
  resumo: 'As demonstracoes financeiras sao publicas por obrigacao legal. Sao a fonte primaria que os servicos pagos revendem - oficiais, auditadas e sem limite de requisicao.',
  itens: [
    { status: 'gratis', nome: 'DFP - Demonstracoes Financeiras Padronizadas', detalhe: 'Balanco, DRE, fluxo de caixa e DVA do exercicio fechado, por ano. Alimenta ROE, ROIC, margem, divida liquida e FCL.' },
    { status: 'gratis', nome: 'ITR - Informacoes Trimestrais', detalhe: 'As mesmas demonstracoes a cada trimestre. Necessario para calcular TTM (12 meses moveis) - ainda nao implementado.' },
    { status: 'gratis', nome: 'FCA - Formulario Cadastral', detalhe: 'Liga o ticker ao CNPJ da companhia (WEGE3 -> 84.429.695/0001-11). Sem ele nao da para juntar cotacao com balanco.' },
    { status: 'gratis', nome: 'FRE - Formulario de Referencia', detalhe: 'Quantidade de acoes com unidade consistente. E o denominador de LPA e VPA: a composicao do DFP mistura unidades e milhares entre companhias.' },
    { status: 'gratis', nome: 'Banco Central SGS', detalhe: 'Selic, CDI, IPCA, IGP-M e cambio PTAX, series completas e oficiais. Substitui o pacote de macroeconomia da BRAPI.' },
    { status: 'proposta', nome: 'B3 - proventos e eventos corporativos', detalhe: 'Dividendos, JCP, bonificacoes e desdobramentos na fonte oficial. Ainda nao integrado.' },
  ],
};

export class FormulasPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Fundamentos de mercado</h4>
      <p class="text-muted small">Cada cartão abaixo é um tema. “Implementado” já roda no ecossistema hoje; “Proposta futura” é uma especificação pronta para implementar, ainda sem código. Veja os números reais de um ativo na aba <a href="#/gestao">Gestão</a> (subaba “Como funciona”).</p>

      ${legenda()}

      <div class="row row-cols-1 row-cols-lg-2 g-3 mb-4">
        ${TEMAS.map((tema) => renderTema(tema)).join('')}
      </div>

      <h5 class="mt-2">Fontes de dados</h5>
      <p class="text-muted small">O que a BRAPI cobra e o que conseguimos de graça em outro lugar. Termos desconhecidos estão explicados no <a href="#/glossario">Glossário</a>.</p>
      <div class="mb-3">
        ${renderFonteDados(FONTES_DADOS)}
      </div>
      <div class="mb-4">
        ${renderFonteDados(FONTES_CVM)}
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
    <div ${item.id ? `id="f-${item.id}" ` : ''}class="mb-3 pb-2 border-bottom">
      <div class="d-flex flex-wrap gap-1 align-items-center mb-1">
        <span class="badge ${badgeStatus.classe}">${badgeStatus.rotulo}</span>
        ${badgesCenarios}
      </div>
      <div class="fw-semibold small">${item.nome}</div>
      <p class="small mb-1">${item.descricao}</p>
      <code class="small d-block">${item.formula}</code>
      ${item.variaveis ? `<p class="small mb-1 mt-1"><strong>Variáveis:</strong> ${item.variaveis}</p>` : ''}
      ${item.exemplo ? `<p class="small mb-1"><strong>Exemplo:</strong> ${item.exemplo}</p>` : ''}
      ${item.limites ? `<p class="small text-secondary mb-0"><strong>Limites:</strong> ${item.limites}</p>` : ''}
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
