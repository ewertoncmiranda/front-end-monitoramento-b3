import { BaseComponent } from '../components/base/BaseComponent.js';
import { glossarioAcademico } from '../estudos/glossarioAcademico.js';
import { PADROES_DETALHADOS, padraoDetalhado } from '../estudos/glossarioPadroes.js';
import { normalizar } from '../estudos/texto.js';

// Unica responsabilidade: explicar o vocabulario do mercado financeiro pra
// quem nunca comprou uma acao. Conteudo 100% estatico, sem chamada de API.
//
// Tres regras de redacao seguidas aqui:
//   1. nenhum termo e definido usando outro termo ainda nao definido - por
//      isso a ordem dos grupos importa;
//   2. todo verbete diz onde aquilo aparece NESTE sistema, senao vira
//      dicionario generico, que a internet ja tem;
//   3. indicador vem com faixa de referencia E com a ressalva de que faixa boa
//      varia por setor - margem de 2% e otima pra supermercado e pessima pra
//      software.

const GLOSSARIO = [
  {
    id: 'mercado',
    titulo: 'Onde as acoes sao negociadas',
    resumo: 'O basico: o que voce compra, onde, e quem fiscaliza.',
    termos: [
      {
        termo: 'Acao',
        definicao:
          'Um pedaco da empresa. Quem tem 1 acao de 1.000 existentes e dono de 0,1% dela - dos lucros e tambem dos prejuizos.',
        onde: 'É o que você consulta na aba Gestão.',
      },
      {
        termo: 'B3',
        definicao:
          'A bolsa de valores brasileira, onde as acoes sao compradas e vendidas. Nome antigo: Bovespa.',
      },
      {
        termo: 'Ticker (codigo de negociacao)',
        definicao:
          'O apelido da acao no pregao, tipo PETR4 ou WEGE3. As letras identificam a empresa e o numero diz o tipo de acao.',
        onde: 'E o que voce digita no campo de busca.',
      },
      {
        termo: 'ON / PN / Unit',
        definicao:
          'O numero final do ticker. 3 = ordinaria (da direito a voto nas assembleias). 4 = preferencial (normalmente sem voto, mas com preferencia no recebimento de dividendos). 11 = unit, um pacote que junta as duas.',
      },
      {
        termo: 'Pregao',
        definicao:
          'O dia de negociacao. "Fechamento do pregao" e o preco do ultimo negocio daquele dia.',
        onde: 'Cada linha da tabela de historico e um pregao.',
      },
      {
        termo: 'Companhia aberta',
        definicao:
          'Empresa autorizada a vender acoes ao publico. Em troca, e obrigada por lei a publicar seus numeros - e essa obrigacao que torna este sistema possivel.',
      },
      {
        termo: 'CVM',
        definicao:
          'Comissao de Valores Mobiliarios, o orgao do governo que fiscaliza o mercado. Publica de graca tudo o que as empresas sao obrigadas a entregar.',
        onde: 'Fonte de todos os fundamentos contabeis deste sistema.',
      },
      {
        termo: 'Acoes em tesouraria',
        definicao:
          'Acoes que a propria empresa recomprou e mantem guardadas. Nao valem dividendo nem voto, entao saem da conta na hora de dividir o lucro por acao.',
        onde: 'Descontadas do denominador de LPA e VPA.',
      },
      {
        termo: 'Acionista controlador e minoritario',
        definicao:
          'O controlador manda na empresa; o minoritario so acompanha. Importa aqui porque parte do lucro de um grupo pertence a socios de outras empresas dele - e o mercado calcula os indicadores so sobre a parte do controlador.',
        onde: 'Por isso o ROE que mostramos usa o lucro do controlador.',
      },
    ],
  },
  {
    id: 'documentos',
    titulo: 'Os documentos que a empresa e obrigada a publicar',
    resumo: 'As siglas dos arquivos da CVM que alimentam este sistema.',
    termos: [
      {
        termo: 'DFP',
        sigla: 'Demonstracoes Financeiras Padronizadas',
        definicao:
          'O "boletim anual" da empresa. Sai uma vez por ano, com os numeros auditados do exercicio fechado.',
        onde: 'Origem de praticamente todo indicador contabil exibido.',
      },
      {
        termo: 'ITR',
        sigla: 'Informacoes Trimestrais',
        definicao:
          'A mesma coisa, mas a cada 3 meses: mais rapida e menos auditada que a DFP.',
        onde: 'Ainda nao usada - e o que falta para calcular TTM.',
      },
      {
        termo: 'FCA',
        sigla: 'Formulario Cadastral',
        definicao:
          'Quem e a empresa: CNPJ, endereco e quais tickers ela tem na B3.',
        onde: 'E o que permite ligar o ticker WEGE3 ao CNPJ da WEG.',
      },
      {
        termo: 'FRE',
        sigla: 'Formulario de Referencia',
        definicao:
          'O dossie completo da companhia. Aqui e usado por um motivo especifico: e a fonte confiavel da quantidade de acoes.',
        onde: 'Denominador de LPA e VPA.',
      },
      {
        termo: 'Exercicio social',
        definicao: 'O "ano" contabil da empresa. Quase sempre de janeiro a dezembro.',
        onde: 'O campo "periodo" nos fundamentos e a data de fechamento dele.',
      },
      {
        termo: 'Reapresentacao',
        definicao:
          'Quando a empresa republica um balanco corrigido. Por isso todo arquivo tem um numero de versao, e so a maior vale.',
      },
      {
        termo: 'Consolidado x individual',
        definicao:
          'O consolidado soma a empresa e todas as suas controladas; o individual e so a matriz. Comparacoes de mercado usam o consolidado.',
        onde: 'O campo "grupo" indica qual foi usado (con ou ind).',
      },
      {
        termo: 'IPE',
        sigla: 'Informações Periódicas e Eventuais',
        definicao:
          'A base da CVM que lista todo documento eventual entregue pelas companhias: fatos relevantes, comunicados, avisos, atas. Cada linha traz o link oficial do documento.',
        onde: 'Fonte da aba Comunicados. A CVM a republica cerca de uma vez por semana, por isso a aba informa até que data há dados.',
      },
      {
        termo: 'Fato relevante',
        definicao:
          'Comunicado obrigatório sobre qualquer decisão ou acontecimento capaz de influenciar o preço da ação ou a decisão de investir: aquisição, mudança de controle, resultado fora do esperado, renegociação de dívida. Deve ser divulgado a todos ao mesmo tempo.',
        onde: 'Aparece primeiro na edição semanal da aba Comunicados, em vermelho.',
        cuidado:
          'Nem todo fato relevante é notícia boa ou ruim; é o fato que a companhia considera capaz de mover o preço. Leia o documento antes de tirar conclusão.',
      },
      {
        termo: 'Comunicado ao mercado',
        definicao:
          'Informação que a companhia decide divulgar sem que seja fato relevante: esclarecimentos sobre notícias, contratos, eventos operacionais.',
      },
      {
        termo: 'Aviso aos acionistas',
        definicao:
          'Informação dirigida a quem tem a ação: datas de pagamento de proventos, direito de subscrição, prazos de assembleia.',
      },
      {
        termo: 'RAD',
        sigla: 'Rede de Atendimento Digital (ENET)',
        definicao:
          'O sistema da CVM onde os documentos das companhias ficam disponíveis. O link "Abrir documento na CVM" leva direto a ele.',
      },
    ],
  },
  {
    id: 'balanco',
    titulo: 'As pecas do balanco',
    resumo: 'De onde saem os numeros. Leia na ordem: cada termo usa so os anteriores.',
    termos: [
      {
        termo: 'Balanco patrimonial',
        definicao:
          'A foto do que a empresa tem e do que ela deve num dia especifico.',
      },
      {
        termo: 'Ativo',
        definicao: 'Tudo o que a empresa tem: caixa, estoque, fabrica, maquina.',
      },
      {
        termo: 'Passivo',
        definicao: 'Tudo o que ela deve: fornecedor, banco, imposto.',
      },
      {
        termo: 'Patrimonio liquido (PL)',
        definicao:
          'Ativo menos passivo. E o que sobraria para os donos se a empresa fosse liquidada hoje.',
        onde: 'Base do VPA e do ROE.',
      },
      {
        termo: 'Circulante x nao circulante',
        definicao:
          'Circulante vence em ate 12 meses; nao circulante, depois disso. Separa divida urgente de divida de longo prazo.',
      },
      {
        termo: 'DRE',
        sigla: 'Demonstracao do Resultado do Exercicio',
        definicao:
          'O filme do ano: quanto entrou de receita, quanto saiu de custo e quanto sobrou de lucro. Se o balanco e a foto, a DRE e o filme.',
      },
      {
        termo: 'Receita liquida',
        definicao: 'Tudo o que a empresa vendeu, ja sem os impostos sobre a venda.',
      },
      {
        termo: 'EBIT',
        sigla: 'Earnings Before Interest and Taxes',
        definicao:
          'Lucro antes de juros e impostos: o resultado so da operacao, ignorando divida e governo. Mede se o negocio em si funciona.',
        onde: 'Entra no calculo do ROIC.',
      },
      {
        termo: 'EBITDA',
        definicao:
          'O EBIT somado a depreciacao e amortizacao (despesas que nao saem do caixa). Aproxima a geracao de caixa da operacao.',
      },
      {
        termo: 'Lucro liquido',
        definicao:
          'O que sobrou no fim de tudo, depois de custo, despesa, juros e imposto. E o numero que vira dividendo.',
      },
      {
        termo: 'DFC',
        sigla: 'Demonstracao dos Fluxos de Caixa',
        definicao:
          'O dinheiro que de fato entrou e saiu, dividido em operacao, investimento e financiamento. Lucro e opiniao contabil; caixa e fato.',
      },
      {
        termo: 'Capex',
        definicao: 'Gasto em bens duraveis: fabrica, maquina, obra.',
        onde: 'Nao aparece aqui - a CVM nao padroniza essa conta, entao fica vazia de proposito.',
      },
      {
        termo: 'Fluxo de caixa livre (FCL)',
        definicao:
          'O caixa que sobra depois de manter a operacao de pe. E dele que saem dividendos e quitacao de divida.',
      },
      {
        termo: 'Caixa e equivalentes',
        definicao: 'Dinheiro disponivel na hora.',
      },
      {
        termo: 'Divida bruta x divida liquida',
        definicao:
          'Bruta e tudo o que se deve a bancos; liquida desconta o caixa. Empresa com mais caixa que divida tem divida liquida negativa - e isso e bom.',
        onde: 'Mostramos em verde quando e negativa.',
      },
    ],
  },
  {
    id: 'indicadores',
    titulo: 'Os indicadores',
    resumo:
      'Cada um responde uma pergunta diferente, e nenhum decide sozinho. Faixa boa varia muito por setor.',
    termos: [
      {
        termo: 'LPA',
        sigla: 'Lucro por acao',
        definicao: 'Lucro liquido dividido pelo numero de acoes.',
        pergunta: 'Quanto de lucro cabe a cada acao?',
        referencia: 'Compare so com o historico da propria empresa.',
      },
      {
        termo: 'VPA',
        sigla: 'Valor patrimonial por acao',
        definicao: 'Patrimonio liquido dividido pelo numero de acoes.',
        pergunta: 'Quanto de patrimonio cabe a cada acao?',
      },
      {
        termo: 'P/L',
        sigla: 'Preco sobre lucro',
        definicao: 'Preco da acao dividido pelo LPA.',
        pergunta: 'Em quantos anos o lucro atual paga o preco da acao?',
        referencia: 'Entre 8 e 15 costuma ser normal. Muito baixo as vezes e armadilha.',
        onde: 'Calculado na hora, cruzando o LPA do balanco com a cotacao atual.',
      },
      {
        termo: 'P/VP',
        sigla: 'Preco sobre valor patrimonial',
        definicao: 'Preco da acao dividido pelo VPA.',
        pergunta: 'Estou pagando quanto por cada R$ 1 de patrimonio?',
        referencia: 'Abaixo de 1 significa pagar menos que o patrimonio contabil.',
      },
      {
        termo: 'ROE',
        sigla: 'Retorno sobre o patrimonio liquido',
        definicao: 'Lucro liquido dividido pelo patrimonio liquido, em %.',
        pergunta: 'A empresa rende bem sobre o dinheiro dos socios?',
        referencia: 'Acima de 15% e considerado bom.',
      },
      {
        termo: 'ROIC',
        sigla: 'Retorno sobre o capital investido',
        definicao:
          'Lucro da operacao ja descontado o imposto, dividido por todo o capital empregado (dos socios e dos bancos).',
        pergunta: 'E o retorno sobre todo o capital, nao so o dos socios?',
        referencia: 'Precisa superar o custo da divida para a alavancagem valer a pena.',
        onde: 'O mais fraco dos nossos indicadores: usa aliquota nominal de 34%.',
      },
      {
        termo: 'NOPAT',
        definicao: 'EBIT multiplicado por (1 menos a aliquota de imposto).',
        onde: 'Numerador do ROIC.',
      },
      {
        termo: 'Margem liquida',
        definicao: 'Lucro liquido dividido pela receita, em %.',
        pergunta: 'De cada R$ 100 vendidos, quanto vira lucro?',
        referencia: 'Varia enormemente: supermercado ~2%, software ~30%.',
      },
      {
        termo: 'Earnings yield',
        definicao: 'LPA dividido pelo preco, em %. E o inverso do P/L.',
        pergunta: 'Facilita comparar a acao com a Selic.',
      },
      {
        termo: 'Dividend yield',
        definicao: 'Dividendos pagos no ano divididos pelo preco, em %.',
        pergunta: 'Quanto a acao paga de renda por ano?',
      },
      {
        termo: 'Beta',
        definicao:
          'Mede o quanto a acao balanca em relacao a bolsa inteira. Acima de 1, oscila mais que o mercado.',
      },
      {
        termo: 'TTM',
        sigla: 'Trailing twelve months',
        definicao:
          'Os ultimos 12 meses corridos, em vez do ano fechado no calendario.',
        onde:
          'IMPORTANTE: nossos numeros sao do exercicio fechado, nao TTM. E a principal razao de eles diferirem de sites como o Fundamentus - em empresa de lucro volatil a diferenca passa de 40%.',
      },
    ],
  },
  {
    id: 'analise',
    titulo: 'Como se analisa',
    resumo: 'Os metodos e as contas que o sistema aplica.',
    termos: [
      {
        termo: 'Analise fundamentalista',
        definicao:
          'Olha o negocio - lucro, divida, crescimento - e pergunta se a empresa vale o preco.',
        onde: 'E o que os dados da CVM alimentam.',
      },
      {
        termo: 'Analise tecnica',
        definicao:
          'Olha so o grafico de preco e volume, e pergunta para onde o preco esta indo.',
        onde: 'E o que o sinal tecnico da aba Como funciona faz.',
      },
      {
        termo: 'Valuation',
        definicao: 'O exercicio de estimar quanto a empresa deveria valer.',
      },
      {
        termo: 'Formula de Graham',
        definicao:
          'Um calculo simples de preco justo criado por Benjamin Graham. A versao usada aqui e: preco justo = LPA x (8,5 + 2 x crescimento), onde 8,5 seria o multiplo de uma empresa que nao cresce.',
        onde: 'Rodamos tres cenarios de crescimento: 0%, 3% e 5%.',
      },
      {
        termo: 'Margem de seguranca',
        definicao:
          'Quanto o preco justo esta acima do preco de mercado, em %. Positiva sugere desconto; negativa, que esta caro. Graham defendia so comprar com margem folgada, porque a conta pode estar errada.',
      },
      {
        termo: 'OHLCV / candle',
        definicao:
          'Os cinco numeros de um dia de pregao: abertura, maxima, minima, fechamento e volume.',
        onde: 'Cada barra do grafico da aba Candles.',
      },
      {
        termo: 'Volume',
        definicao:
          'Quantidade negociada. Volume alto da mais confianca ao movimento de preco.',
      },
      {
        termo: 'Media movel',
        definicao:
          'A media do preco dos ultimos N dias, que se atualiza a cada dia. Suaviza o ruido e mostra a tendencia.',
      },
      {
        termo: 'Z-score',
        definicao:
          'Quantos "desvios normais" o preco de hoje esta longe da media. Perto de 0 e normal; acima de 2, anormalmente esticado.',
      },
      {
        termo: 'Momentum',
        definicao: 'A estrategia que aposta na continuacao: se esta subindo, tende a continuar.',
      },
      {
        termo: 'Reversao a media',
        definicao: 'A aposta oposta: o que esticou demais tende a voltar.',
      },
      {
        termo: 'Maxima e minima de 52 semanas',
        definicao:
          'O maior e o menor preco do ultimo ano. Serve de regua pra saber onde o preco esta hoje.',
      },
    ],
  },
  {
    id: 'proventos',
    titulo: 'O que a empresa paga ao acionista',
    resumo: 'As formas de remuneracao - nem todas em dinheiro.',
    termos: [
      {
        termo: 'Provento',
        definicao: 'Nome guarda-chuva para tudo o que a empresa entrega ao acionista.',
      },
      {
        termo: 'Dividendo',
        definicao:
          'Parte do lucro paga em dinheiro. No Brasil e isento de imposto de renda para a pessoa fisica.',
      },
      {
        termo: 'JCP',
        sigla: 'Juros sobre Capital Proprio',
        definicao:
          'Parecido com dividendo, mas a empresa abate do imposto dela e o investidor paga 15% na fonte.',
      },
      {
        termo: 'Bonificacao',
        definicao: 'A empresa entrega acoes novas de graca, em vez de dinheiro.',
      },
      {
        termo: 'Desdobramento (split)',
        definicao:
          'Cada acao vira varias e o preco cai na mesma proporcao. Nao muda o valor total - so deixa a acao mais acessivel.',
      },
      {
        termo: 'Grupamento',
        definicao: 'O contrario do split: varias acoes viram uma e o preco sobe proporcionalmente.',
      },
      {
        termo: 'Subscricao',
        definicao:
          'O direito de comprar acoes novas antes do resto do mercado, normalmente com desconto.',
      },
    ],
  },
  {
    id: 'macro',
    titulo: 'Indicadores da economia',
    resumo: 'O pano de fundo contra o qual qualquer investimento e comparado.',
    termos: [
      {
        termo: 'Selic',
        definicao:
          'A taxa basica de juros do pais, definida pelo Banco Central. E o "rendimento sem risco": qualquer acao precisa render mais que ela para compensar.',
      },
      {
        termo: 'CDI',
        definicao:
          'Taxa que os bancos cobram entre si, quase sempre colada na Selic. E a regua da renda fixa.',
      },
      {
        termo: 'IPCA',
        definicao:
          'A inflacao oficial. Rendimento abaixo dele significa perder poder de compra.',
      },
      {
        termo: 'IGP-M',
        definicao: 'Outro indice de inflacao, usado principalmente em contratos de aluguel.',
      },
      {
        termo: 'PTAX',
        definicao: 'A cotacao oficial do dolar, calculada pelo Banco Central.',
      },
    ],
  },
  {
    id: 'padroes',
    titulo: 'Padroes de grafico',
    resumo:
      'Os desenhos que traders procuram no grafico. O raciocinio por tras de cada um, e quando confiar, esta na aba Padroes e armadilhas.',
    termos: [
      {
        termo: 'Corpo e sombra',
        definicao:
          'O corpo da vela vai da abertura ao fechamento e mede conviccao; a sombra e o que passou disso e mede rejeicao. Sombra longa significa que o preco chegou la e nao ficou.',
        onde: 'Cada barra do grafico da aba Candles.',
      },
      {
        termo: 'Martelo',
        definicao:
          'Vela de corpo pequeno com sombra inferior de pelo menos o dobro do corpo: derrubaram o preco e os compradores absorveram.',
        onde: 'So sugere reversao se aparecer depois de uma queda.',
      },
      {
        termo: 'Enforcado',
        definicao:
          'O mesmo desenho do martelo, mas aparecendo depois de uma alta. A forma nao muda; o que muda e o contexto.',
      },
      {
        termo: 'Engolfo',
        definicao:
          'O corpo de uma vela engole inteiro o da anterior, indicando que o lado oposto tomou conta da sessao.',
        onde: 'Vale mais quando vem com volume acima da media.',
      },
      {
        termo: 'Doji',
        definicao:
          'Abertura praticamente igual ao fechamento: a sessao terminou empatada. Sinal de indecisao.',
        onde: 'So informa alguma coisa quando interrompe uma tendencia definida.',
      },
      {
        termo: 'Estrela da manha / da noite',
        definicao:
          'Sequencia de tres velas — tendencia, indecisao, reversao. A terceira e a que confirma.',
      },
      {
        termo: 'Topo duplo e fundo duplo',
        definicao:
          'Dois testes do mesmo nivel de preco sem conseguir rompe-lo. O gatilho nao e o segundo topo, e o rompimento da linha tracada no fundo entre os dois.',
      },
      {
        termo: 'Ombro-Cabeca-Ombro',
        sigla: 'OCO',
        definicao:
          'Tres picos, com o do meio mais alto, sugerindo reversao de tendencia.',
        onde: 'Leva de 3 a 6 meses para se formar — nao cabe no range maximo de 3 meses deste painel.',
      },
      {
        termo: 'Triangulo',
        definicao:
          'Ascendente: topos no mesmo nivel e fundos subindo. Descendente: o inverso. Simetrico: os dois convergem, e rompe para qualquer lado.',
      },
      {
        termo: 'Bandeira e flamula',
        definicao:
          'Pausa curta logo depois de um movimento forte. Padrao de continuacao, nao de reversao — confundir os dois e erro comum.',
      },
      {
        termo: 'Linha de pescoco',
        definicao:
          'A linha que liga os fundos de uma formacao (topo duplo, OCO). O rompimento dela e o que confirma a figura.',
      },
      {
        termo: 'Golden cross e death cross',
        definicao:
          'Cruzamento da media de 50 periodos com a de 200. Golden cross e a de 50 subindo acima da de 200; death cross o contrario.',
        onde: 'Precisa de 200 pregoes, entao nao existe no range de 3 meses deste painel.',
      },
      {
        termo: 'Gap',
        definicao:
          'Salto entre o fechamento de um dia e a abertura do seguinte, sem negocio no meio. Atencao: dividendo e desdobramento produzem gap falso no preco nao ajustado.',
      },
      {
        termo: 'Rompimento',
        definicao:
          'Quando o preco atravessa um nivel que vinha segurando. Rompimento com volume fraco e suspeito: poucos participantes validaram o preco novo.',
      },
    ],
  },
  {
    id: 'vieses',
    titulo: 'Vieses e armadilhas de analise',
    resumo:
      'Os erros de leitura que mais custam dinheiro. Cada um esta explicado em detalhe na aba Padroes e armadilhas.',
    termos: [
      {
        termo: 'Apofenia',
        definicao:
          'A tendencia do cerebro de enxergar padrao onde so ha ruido. Uma serie de precos aleatoria produz figuras graficas impecaveis.',
        onde: 'O maior risco de qualquer analise visual de grafico.',
      },
      {
        termo: 'Look-ahead bias',
        definicao:
          'Avaliar uma decisao do passado ja sabendo o que aconteceu depois. No grafico historico o padrao e obvio porque ja terminou.',
      },
      {
        termo: 'Timeframe shopping',
        definicao:
          'Trocar o periodo do grafico ate encontrar um que confirme a tese que voce ja tinha. Nao e analise, e busca por concordancia.',
      },
      {
        termo: 'Ancoragem',
        definicao:
          'Decidir com base no proprio preco de compra ("vendo quando voltar ao que paguei"). O mercado nao sabe quanto voce pagou.',
      },
      {
        termo: 'Caudas gordas',
        definicao:
          'Retornos de acoes produzem eventos extremos com muito mais frequencia do que a distribuicao normal preve.',
        onde: 'Por isso um z-score de 3 aqui nao e tao raro quanto a estatistica classica sugeriria.',
      },
      {
        termo: 'Preco ajustado',
        definicao:
          'Serie corrigida por dividendos e desdobramentos. Sem o ajuste, o preco cai no dia ex sem ninguem ter vendido e parece queda de mercado.',
        onde: 'Coluna fechamento_ajustado; passou a alimentar o calculo tecnico em 26/09/2026.',
      },
      {
        termo: 'Spread',
        definicao:
          'Diferenca entre a melhor oferta de compra e a de venda. Em ativo pouco liquido, o spread pode consumir o movimento inteiro que o grafico mostra.',
      },
      {
        termo: 'Escala logaritmica',
        definicao:
          'Escala em que a mesma variacao percentual ocupa a mesma altura. E a leitura correta para series longas; a linear exagera os valores altos.',
      },
      {
        termo: 'p-hacking',
        definicao:
          'Testar muitos indicadores ate um parecer funcionar. Com 20 tentativas, achar algo "significativo" a 5% e o esperado, nao uma descoberta.',
      },
    ],
  },
  {
    id: 'tecnico',
    titulo: 'Termos tecnicos deste sistema',
    resumo: 'Vocabulario de engenharia que aparece nas telas e na documentacao.',
    termos: [
      {
        termo: 'ETL',
        sigla: 'Extract, Transform, Load',
        definicao:
          'Buscar o dado na fonte, arrumar e gravar no banco. E o que o etl-fundamentos-cvm faz com os arquivos da CVM.',
      },
      {
        termo: 'Landing e mart',
        definicao:
          'Landing e o dado cru como veio; mart e o dado pronto para consumo. Guardar os dois permite recalcular sem baixar tudo de novo.',
      },
      {
        termo: 'De-para',
        definicao:
          'A tabela de traducao entre o nome da conta na CVM e o nome do indicador aqui. E a peca mais delicada do sistema, porque o mesmo codigo de conta significa coisas diferentes em empresas diferentes.',
      },
      {
        termo: 'Plano de contas',
        definicao:
          'O indice padronizado das contas contabeis. Banco, seguradora e industria usam planos diferentes - dai a complicacao.',
        onde: 'O campo "plano de contas" nos fundamentos diz qual foi detectado.',
      },
      {
        termo: 'Idempotencia',
        definicao:
          'Rodar duas vezes produzir o mesmo resultado que rodar uma. Sem isso, reprocessar duplicaria dado.',
      },
      {
        termo: 'Upsert',
        definicao: 'Grava se nao existe, atualiza se ja existe. E o mecanismo que garante a idempotencia.',
      },
      {
        termo: 'ETag',
        definicao:
          'Uma "impressao digital" que o servidor da CVM da a cada arquivo. Se nao mudou, nao precisamos baixar de novo.',
      },
    ],
  },
];

export class GlossarioPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Glossário</h4>
      <p class="text-muted small">
        Do primeiro contato aos conceitos acadêmicos: definições, exemplos e cuidados de interpretação.
        Organize seu aprendizado em <a href="#/estudos">Estudos</a> ou explore
        <a href="#/padroes">Padrões e armadilhas</a>.
      </p>

      ${avisoEducativo()}

      <div class="mb-3">
        <label for="glossario-busca" class="form-label">Buscar no glossário</label>
        <input id="glossario-busca" type="search" class="form-control"
               placeholder="Termo, definição ou exemplo (ex.: ROE, WACC, sobreajuste)"
               autocomplete="off">
        <div id="glossario-contador" class="form-text" role="status"></div>
      </div>

      <div id="glossario-grupos">
        ${[...GLOSSARIO, ...glossarioAcademico].map((grupo) => renderGrupo(grupo)).join('')}
        ${renderPadroesDetalhados()}
      </div>
    `;
  }

  afterRender() {
    const busca = this.querySelector('#glossario-busca');
    const contador = this.querySelector('#glossario-contador');
    this.destacarPadraoDoLink();

    busca.addEventListener('input', () => {
      const termo = normalizar(busca.value.trim());
      let visiveis = 0;

      this.querySelectorAll('[data-verbete]').forEach((elemento) => {
        const combina = !termo || elemento.dataset.verbete.includes(termo);
        elemento.classList.toggle('d-none', !combina);
        if (combina) visiveis += 1;
      });

      // Grupo sem nenhum verbete visivel some junto, senao sobra um titulo orfao.
      this.querySelectorAll('[data-grupo]').forEach((grupo) => {
        const algumVisivel = grupo.querySelector('[data-verbete]:not(.d-none)');
        grupo.classList.toggle('d-none', !algumVisivel);
      });

      contador.textContent = termo
        ? `${visiveis} termo(s) encontrado(s)`
        : `${visiveis} verbetes disponíveis`;
    });
    busca.dispatchEvent(new Event('input'));
  }

  /**
   * Chegando por `#/glossario?padrao=<id>` (o "?" dos cartoes da aba Velas),
   * rola ate o verbete e o destaca. Ancora com `#` nao serve aqui: o hash ja
   * e a rota.
   */
  destacarPadraoDoLink() {
    const consulta = window.location.hash.split('?')[1] || '';
    const id = new URLSearchParams(consulta).get('padrao');
    if (!id || !padraoDetalhado(id)) return;

    const verbete = this.querySelector(`#padrao-${id}`);
    if (!verbete) return;

    verbete.classList.add('glossario-destaque');

    // O "?" do cartao abre esta pagina numa aba nova, ou seja, carga
    // completa. Rolar antes do `load` nao adianta: o navegador reposiciona a
    // pagina depois dele. Ja na navegacao interna (hashchange) o load passou.
    const rolar = () => requestAnimationFrame(() => verbete.scrollIntoView({ block: 'start' }));
    if (document.readyState === 'complete') rolar();
    else window.addEventListener('load', rolar, { once: true });
  }
}

function renderPadroesDetalhados() {
  return `
    <div class="card shadow-sm mb-3" data-grupo="padroes-detalhados" id="padroes-detalhados">
      <div class="card-header">
        <strong>Padrões de velas em detalhe</strong>
      </div>
      <div class="card-body">
        <p class="small text-muted mb-3">
          Um verbete para cada padrão que a aba <a href="#/candles">Velas</a> detecta:
          o fundamento, o que indica, em que cenários costuma ser usado e quais outros
          padrões fazem sentido observar junto. Nenhum deles é sinal de compra ou venda
          sozinho — compare sempre com a taxa-base e com a contagem no ruído mostradas no cartão.
        </p>
        <div class="row row-cols-1 g-3">
          ${PADROES_DETALHADOS.map((p) => renderPadraoDetalhado(p)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderPadraoDetalhado(p) {
  const indice = normalizar(
    [p.termo, p.fundamento, p.indica, ...p.cenarios, p.nestePainel].join(' '),
  );

  const combina = p.combinaCom
    .map((id) => padraoDetalhado(id))
    .filter(Boolean)
    .map(
      (outro) =>
        `<a href="#/glossario?padrao=${outro.id}" class="badge rounded-pill text-bg-light border text-decoration-none">${outro.termo}</a>`,
    )
    .join(' ');

  return `
    <div class="col" data-verbete="${escapar(indice)}">
      <div id="padrao-${p.id}" class="glossario-padrao border-start border-3 ps-3 h-100">
        <div class="fw-semibold">${p.termo}</div>
        <p class="small mb-1 mt-2"><strong>Fundamento:</strong> ${p.fundamento}</p>
        <p class="small mb-1"><strong>O que indica:</strong> ${p.indica}</p>
        <p class="small mb-1"><strong>Cenários de uso:</strong></p>
        <ul class="small mb-2">
          ${p.cenarios.map((c) => `<li>${c}</li>`).join('')}
        </ul>
        <p class="small mb-1"><strong>Faz sentido observar junto:</strong> ${combina}</p>
        <p class="small text-muted mb-0">Neste painel: ${p.nestePainel}</p>
      </div>
    </div>
  `;
}

function avisoEducativo() {
  return `
    <div class="alert alert-secondary small" role="alert">
      Material informativo. Explicar o que um indicador significa nao e sugerir
      compra ou venda - este painel nao faz recomendacao de investimento.
    </div>
  `;
}

function renderGrupo(grupo) {
  return `
    <div class="card shadow-sm mb-3" data-grupo="${grupo.id}">
      <div class="card-header">
        <strong>${grupo.titulo}</strong>
      </div>
      <div class="card-body">
        <p class="small text-muted mb-3">${grupo.resumo}</p>
        <div class="row row-cols-1 row-cols-lg-2 g-3">
          ${grupo.termos.map((t) => renderTermo(t)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTermo(t) {
  // O dataset concentra tudo que a busca varre: termo, sigla e definicao.
  const indice = normalizar([t.termo, t.sigla, t.definicao, t.pergunta, t.onde, t.exemplo, t.cuidado]
    .filter(Boolean)
    .join(' '));

  return `
    <div class="col" data-verbete="${escapar(indice)}">
      <div class="border-start border-3 ps-3 h-100">
        <div class="fw-semibold">${t.termo}</div>
        ${t.sigla ? `<div class="text-muted small fst-italic">${t.sigla}</div>` : ''}
        <p class="small mb-1 mt-1">${t.definicao}</p>
        ${t.exemplo ? `<p class="small mb-1"><strong>Exemplo:</strong> ${t.exemplo}</p>` : ''}
        ${t.cuidado ? `<p class="small mb-1 text-secondary"><strong>Cuidado:</strong> ${t.cuidado}</p>` : ''}
        ${t.pergunta ? `<p class="small mb-1"><span class="text-muted">Responde:</span> ${t.pergunta}</p>` : ''}
        ${t.referencia ? `<p class="small mb-1"><span class="badge bg-light text-dark">Referencia</span> ${t.referencia}</p>` : ''}
        ${t.onde ? `<p class="small text-muted mb-0">Aqui: ${t.onde}</p>` : ''}
      </div>
    </div>
  `;
}

function escapar(texto) {
  return texto.replace(/"/g, '&quot;');
}

customElements.define('glossario-page', GlossarioPage);
