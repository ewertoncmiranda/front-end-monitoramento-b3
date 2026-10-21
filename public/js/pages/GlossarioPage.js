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

// MACRO-PAI-4: verbetes dos planos MACRO, FONTES e MICRO. Cada um tem id unico,
// definicao curta, "como ler" e um link #/... para onde aparece no painel.
// Nenhum verbete recomenda compra ou venda: descreve como ler o dado.
const GRUPOS_MACRO_FONTES_MICRO = [
  {
    id: 'macro-juros',
    titulo: 'Juros, inflação e a régua da renda fixa',
    resumo: 'Como o painel compara uma ação com o que a renda fixa paga hoje.',
    termos: [
      {
        id: 'juro-real',
        termo: 'Juro real',
        definicao:
          'O que a Selic rende acima da inflação esperada. Se o banco paga 14,50% ao ano e se espera 5,22% de inflação, sobram cerca de 8,82% de ganho de verdade, depois de descontar a perda de poder de compra.',
        comoLer:
          'Juro real alto quer dizer que a renda fixa paga bem acima da inflação, e por isso o dinheiro "exige" mais de qualquer outro investimento. Juro real perto de zero quer dizer que a renda fixa mal repõe a inflação. A conta usa o IPCA esperado do boletim Focus (do ano seguinte depois de junho); se faltar, usa o IPCA acumulado em 12 meses, e o cartão informa qual fonte usou.',
        onde: 'Primeiro cartão do "Painel de decisão" da tela de Índices.',
        link: { rotulo: 'Índices', href: '#/indices' },
      },
      {
        id: 'ciclo-selic',
        termo: 'Ciclo da Selic',
        definicao:
          'A direção recente da taxa Selic: em alta, em queda ou estável. O painel compara a meta de hoje com a de cerca de 90 dias atrás.',
        comoLer:
          'O selo mostra ▲ ALTA, ▼ QUEDA ou ■ ESTÁVEL, sempre com texto, nunca só com cor. Variação menor que 0,01 ponto percentual conta como estável. Descreve o que já aconteceu nos últimos meses; não prevê a próxima decisão do Banco Central.',
        onde: 'Segundo cartão do "Painel de decisão" da tela de Índices.',
        link: { rotulo: 'Índices', href: '#/indices' },
      },
      {
        id: 'barreira-compra',
        termo: 'Barreira de compra',
        definicao:
          'O earnings yield mínimo que uma ação precisa ter para empatar com a Selic meta. Earnings yield é o lucro por ação dividido pelo preço, em %: o "juro" que o lucro da empresa representa sobre o que você paga.',
        comoLer:
          'Ação com earnings yield acima da barreira rende em lucro mais que a Selic; abaixo, menos. O cartão mostra também a mediana da base (o valor do meio entre todos os ativos analisados) e lista até 20 ativos acima da barreira, com a distância em pontos percentuais. Lucro é estimativa contábil e pode oscilar: estar acima da barreira não é garantia de nada.',
        onde: 'Cartão "barreira" e bloco "Ativos acima da barreira" da tela de Índices.',
        link: { rotulo: 'Índices', href: '#/indices' },
      },
      {
        id: 'expectativas-focus',
        termo: 'Expectativas do Focus',
        sigla: 'Boletim Focus do Banco Central',
        definicao:
          'Pesquisa semanal do Banco Central com a mediana das previsões do mercado para Selic, IPCA e outros números, ano a ano.',
        comoLer:
          'São opiniões de analistas, não resultados: servem de referência do que o mercado espera, e as previsões mudam de semana para semana. O painel guarda a mediana (todos os respondentes) da Selic e do IPCA para o ano corrente e o seguinte.',
        onde: 'Cartões "Focus" da tela de Índices (Selic e IPCA esperados).',
        link: { rotulo: 'Índices', href: '#/indices' },
      },
      {
        id: 'ipca-12m',
        termo: 'IPCA acumulado em 12 meses',
        definicao:
          'A inflação oficial somada ao longo dos últimos 12 meses (série 13522 do Banco Central). Em setembro de 2026 estava em 4,58%.',
        comoLer:
          'É a inflação que já aconteceu, diferente do IPCA esperado do Focus, que é previsão. O painel também calcula o acumulado a partir dos meses (exige 12 meses seguidos) e confere com a série oficial. Quando falta algum mês, o valor fica oculto em vez de ser inventado.',
        onde: 'Cartão "IPCA 12 meses" e variações da tela de Índices.',
        link: { rotulo: 'Índices', href: '#/indices' },
      },
      {
        id: 'curva-ntnb',
        termo: 'Curva de juros real (NTN-B / Tesouro IPCA+)',
        definicao:
          'NTN-B é o título público que paga inflação (IPCA) mais uma taxa fixa; no Tesouro Direto aparece como Tesouro IPCA+. A curva real mostra essa taxa fixa para cada vencimento.',
        comoLer:
          'Curva normal (▲): vencimentos longos pagam mais que os curtos. Invertida (▼): pagam menos. Plana (■): quase iguais. O painel usa como referência o vencimento mais perto de 5 anos a partir da data-base, e mostra qual vencimento foi usado. A taxa é a de compra do título naquele dia.',
        onde: 'Cartão "Juro real: NTN-B (Tesouro IPCA+)" da tela de Índices.',
        link: { rotulo: 'Índices', href: '#/indices' },
      },
      {
        id: 'premio-risco',
        termo: 'Prêmio de risco',
        definicao:
          'A diferença, em pontos percentuais, entre o earnings yield da ação e o juro real da NTN-B de referência. Mede o que a ação "paga a mais" (ou a menos) do que a renda fixa protegida da inflação.',
        comoLer:
          'O selo diz ▲ Acima, ▼ Abaixo ou = Igual à renda fixa. Exemplo: earnings yield de 12,50% menos juro real de 7,20% dá +5,30 p.p. Prêmio positivo não elimina o risco da ação; só mostra a comparação. Há também a linha "contra a Selic meta" (earnings yield menos Selic).',
        onde: 'Bloco "Rendimento contra renda fixa" da seção Valuation da ficha.',
        link: { rotulo: 'Ficha, seção Valuation', href: '#/ativo?secao=valuation' },
      },
      {
        id: 'graham-ajustado',
        termo: 'Graham ajustado pelo juro',
        definicao:
          'O valor de Graham (Graham Number) multiplicado por 4,4 e dividido por Y, onde Y é a Selic meta. A fórmula original de Graham usava 4,4% como o rendimento de títulos de alta qualidade da época; aqui Y nominal (a Selic) substitui esse rendimento.',
        comoLer:
          'Com juros altos o valor ajustado fica menor que o Graham Number puro, porque o dinheiro parado rende mais. Exemplo: 78,75 × 4,4 / 14,5 = 23,90. Sem Selic disponível o cartão não aparece. É só exibição: não altera a recomendação oficial do sistema.',
        onde: 'Ao lado do "Graham Number (valor atual)" na seção Valuation da ficha.',
        link: { rotulo: 'Ficha, seção Valuation', href: '#/ativo?secao=valuation' },
      },
    ],
  },
  {
    id: 'bancos-fontes',
    titulo: 'Bancos, quem está dentro e confiabilidade',
    resumo: 'Indicadores que só fazem sentido para bancos, sinais de quem administra a empresa e selos de alerta.',
    termos: [
      {
        id: 'basileia',
        termo: 'Índice de Basileia',
        definicao:
          'Quanto o banco tem de capital próprio em relação ao risco que assume nos empréstimos e aplicações. É uma regra internacional de segurança financeira.',
        comoLer:
          'Quanto maior, mais folga. O mínimo regulatório usado como referência é 10,5% (já com o adicional de conservação de capital). Exemplo: 15,2% está acima do mínimo, e o selo diz "Em dia". Os valores vêm do IF.data do Banco Central, por trimestre.',
        onde: 'Painel do banco na seção Fundamentos da ficha (só para bancos).',
        link: { rotulo: 'Ficha, seção Fundamentos', href: '#/ativo?secao=fundamentos' },
      },
      {
        id: 'capital-principal',
        termo: 'Capital principal',
        definicao:
          'A parte mais sólida do capital do banco (basicamente o patrimônio dos acionistas e lucros retidos), a que absorve prejuízos primeiro.',
        comoLer:
          'Também em % do risco assumido. Acompanhe a série trimestral: queda seguida indica que o banco está consumindo capital. Não tem selo próprio; o painel só exibe o valor e o gráfico pequeno de 8 trimestres.',
        onde: 'Painel do banco na seção Fundamentos da ficha.',
        link: { rotulo: 'Ficha, seção Fundamentos', href: '#/ativo?secao=fundamentos' },
      },
      {
        id: 'inadimplencia',
        termo: 'Inadimplência',
        definicao:
          'A fatia dos empréstimos do banco que os clientes deixaram de pagar no prazo.',
        comoLer:
          'O selo dispara "Atenção" quando a inadimplência subiu mais de 0,5 ponto percentual em 4 trimestres. Esse 0,5 é uma constante revisável: escolha de implementação do sistema, não regra regulatória. Taxa alta em si é normal em banco de crédito mais arriscado; o que o selo observa é a tendência.',
        onde: 'Painel do banco na seção Fundamentos da ficha.',
        link: { rotulo: 'Ficha, seção Fundamentos', href: '#/ativo?secao=fundamentos' },
      },
      {
        id: 'roe-banco',
        termo: 'ROE do banco (contra a Selic)',
        sigla: 'Retorno sobre o patrimônio líquido',
        definicao:
          'O lucro anual do banco dividido pelo patrimônio dos acionistas. É o indicador central para banco, onde dívida e EBITDA não servem como nas outras empresas.',
        comoLer:
          'O selo "Acima" aparece quando o ROE é maior ou igual à Selic meta, usada como custo de capital de referência (o que o acionista conseguiria sem risco). Exemplo: ROE de 21,5% contra Selic de 14,75%. Sem Selic, o selo fica "Sem dado". Veja também o verbete ROE na seção "Os indicadores".',
        onde: 'Painel do banco na seção Fundamentos da ficha.',
        link: { rotulo: 'Ficha, seção Fundamentos', href: '#/ativo?secao=fundamentos' },
      },
      {
        id: 'pvp-banco',
        termo: 'P/VP do banco',
        sigla: 'Preço sobre valor patrimonial',
        definicao:
          'O preço da ação dividido pelo patrimônio contábil por ação. Em banco, o patrimônio é a base do negócio, por isso o P/VP é a medida mais usada de "quanto se paga".',
        comoLer:
          'Perto de 1 significa pagar cerca de um real por real de patrimônio. Acima disso, o mercado desconta um ROE alto. O P/VP herda a limitação do VPA usado, que é do último exercício anual; sem o dado, o painel avisa o motivo.',
        onde: 'Painel do banco na seção Fundamentos da ficha.',
        link: { rotulo: 'Ficha, seção Fundamentos', href: '#/ativo?secao=fundamentos' },
      },
      {
        id: 'roe-sobre-pvp',
        termo: 'ROE/P/VP',
        definicao:
          'O ROE dividido pelo P/VP: quanto de retorno sobre o patrimônio vem para cada unidade de P/VP paga.',
        comoLer:
          'Exemplo: ROE 21,5 / P/VP 2,00 = 10,75. Maior indica mais retorno por unidade de preço pago sobre o patrimônio. Serve para comparar bancos entre si, não para dizer sozinho se vale a pena.',
        onde: 'Painel do banco na seção Fundamentos da ficha.',
        link: { rotulo: 'Ficha, seção Fundamentos', href: '#/ativo?secao=fundamentos' },
      },
      {
        id: 'compra-liquida-insiders',
        termo: 'Compra líquida de administradores (insiders)',
        definicao:
          'Insiders são diretores, conselheiros e controladores, que conhecem a empresa por dentro. Compra líquida é o que eles compraram menos o que venderam, em ações, nas janelas de 3, 6 e 12 meses.',
        comoLer:
          'O selo (▲ Compra líquida, ▼ Venda líquida, ● Neutro) usa a janela de 6 meses: compra líquida dividida por compras mais vendas; a partir de +0,10 é compra líquida, a partir de -0,10 é venda líquida. O corte de 0,10 e a janela de 6 meses são constantes revisáveis, escolhas de implementação. O dado chega com atraso, pois vale a partir da entrega à CVM. É sinal de confirmação, não gatilho.',
        onde: 'Seção "Quem está dentro" da ficha (depende da integração da FONTES-PAI-3).',
        link: { rotulo: 'Ficha, seção Quem está dentro', href: '#/ativo?secao=insiders' },
      },
      {
        id: 'recompra-liquida',
        termo: 'Recompra líquida',
        definicao:
          'Quanto a empresa comprou de ações dela mesma no período, medido pela mudança no saldo de ações em tesouraria (ações recompradas e guardadas).',
        comoLer:
          'O saldo de tesouraria é negativo no balanço; a recompra é a variação com o sinal trocado. Variação positiva do saldo pode ser cancelamento de ações ou entrega a plano de remuneração, e o dado não distingue. Quando as contas de tesouraria não estão carregadas, o painel diz o motivo.',
        onde: 'Bloco de recompras da seção "Quem está dentro" da ficha.',
        link: { rotulo: 'Ficha, seção Quem está dentro', href: '#/ativo?secao=insiders' },
      },
      {
        id: 'selos-confiabilidade',
        termo: 'Selos de confiabilidade',
        definicao:
          'Cinco avisos sobre a qualidade da empresa como emissora de dados e de dividendos: cadastro, auditor, dívida, fundos e dividendo. Cada um é OK, ALERTA, CRÍTICO ou SEM DADO.',
        comoLer:
          'O selo-resumo mostra o pior nível entre os cinco (CRÍTICO, depois ALERTA, depois OK); "sem dado" não conta como pior. Passe o mouse (ou use leitor de tela) para ler o detalhe. Os limiares (dívida 50%, dividendo 100%, auditor 24 meses) são constantes revisáveis do sistema. Um alerta pede atenção e pesquisa, não é veredito.',
        onde: 'Faixa sob o cabeçalho da ficha; filtro "Confiabilidade" na tabela de ativos (por enquanto só o cadastro CVM, na página carregada).',
        link: { rotulo: 'Ficha do ativo', href: '#/ativo' },
      },
      {
        id: 'selo-cadastro',
        termo: 'Selo de cadastro',
        definicao: 'Situação da empresa no registro da CVM.',
        comoLer: 'ATIVO é OK; suspensa ou cancelada é CRÍTICO; qualquer outra situação é ALERTA. O detalhe traz a data da situação e, se houver, o motivo.',
        onde: 'Faixa de confiabilidade da ficha e filtro da tabela de ativos.',
        link: { rotulo: 'Tabela de ativos', href: '#/ativos' },
      },
      {
        id: 'selo-auditor',
        termo: 'Selo de auditor',
        definicao: 'Avisa quando a empresa trocou de auditoria independente.',
        comoLer: 'Troca iniciada nos últimos 24 meses (constante revisável) é ALERTA e mostra auditor atual, anterior, data e justificativa. Troca por rodízio obrigatório é comum e não é, sozinha, sinal de problema.',
        onde: 'Faixa de confiabilidade da ficha.',
        link: { rotulo: 'Ficha do ativo', href: '#/ativo' },
      },
      {
        id: 'selo-divida',
        termo: 'Selo de dívida',
        definicao: 'Mede quanto da dívida em títulos (debêntures e similares) vence nos próximos 12 meses.',
        comoLer: 'Saldo que vence em 12 meses dividido pelo saldo total. Acima de 50% (constante revisável) é ALERTA. Exemplo: 600 de 1.000 = 60%. Vencimento concentrado exige que a empresa gere caixa ou refinancie.',
        onde: 'Faixa de confiabilidade da ficha.',
        link: { rotulo: 'Ficha do ativo', href: '#/ativo' },
      },
      {
        id: 'selo-fundos',
        termo: 'Selo de fundos',
        definicao: 'Mostra quantos fundos de investimento têm a ação e se entraram ou saíram fundos desde a competência anterior.',
        comoLer: 'É informativo: o nível é sempre OK. Atenção à defasagem em meses informada no detalhe, pois a posição dos fundos é divulgada com atraso.',
        onde: 'Faixa de confiabilidade da ficha.',
        link: { rotulo: 'Ficha do ativo', href: '#/ativo' },
      },
      {
        id: 'selo-dividendo',
        termo: 'Selo de dividendo',
        definicao: 'Verifica se o que a empresa pagou em dividendos e juros sobre capital próprio cabe no lucro do mesmo ano (payout).',
        comoLer: 'Payout acima de 100% do lucro líquido (constante revisável) é ALERTA: a empresa pagou mais do que lucrou, o que pode não se repetir. Exemplo: payout de 120%. Sem demonstração anual ou lucro do mesmo exercício, fica "sem dado".',
        onde: 'Faixa de confiabilidade da ficha.',
        link: { rotulo: 'Ficha do ativo', href: '#/ativo' },
      },
    ],
  },
  {
    id: 'microestrutura',
    titulo: 'Datas ex, ofertas e opções',
    resumo: 'O que acontece no dia do provento e como ler as ofertas de compra e venda.',
    termos: [
      {
        id: 'data-ex',
        termo: 'Data ex',
        definicao:
          'A partir deste dia, quem compra a ação deixa de ter direito ao provento (dividendo, JCP etc.) já declarado. O preço costuma abrir menor por isso.',
        comoLer:
          'A tabela lista os eventos dos últimos 24 meses com o tipo (dividendo, JCP, rendimento, bonificação, desdobramento...). A próxima data ex é uma estimativa por sazonalidade, com confiança MÉDIA ou BAIXA, e só indica a época provável. O plano de operação avisa quando a data estimada está a até 10 dias (constante revisável). No gráfico, o dia aparece com marcador e a mesma queda não conta como gap de mercado.',
        onde: 'Bloco "Datas ex" da seção Proventos; marcadores no gráfico; aviso no plano de operação.',
        link: { rotulo: 'Ficha, seção Proventos', href: '#/ativo?secao=proventos' },
      },
      {
        id: 'ajuste-implicito',
        termo: 'Ajuste implícito',
        definicao:
          'Quanto o preço caiu "sozinho" na data ex: fechamento do pregão anterior menos a abertura do dia ex. Também mostrado em % do fechamento anterior.',
        comoLer:
          'Exemplo da PETR4 (JCP, 02/06/2026): 42,37 menos 41,90 = R$ 0,47, ou 1,11%. Compare com o valor declarado do provento: a razão do ajuste (ajuste dividido pelo valor declarado) mostra quanto do provento o preço "descontou". Variação normal de mercado no dia se mistura com o ajuste.',
        onde: 'Tabela "Datas ex" da seção Proventos.',
        link: { rotulo: 'Ficha, seção Proventos', href: '#/ativo?secao=proventos' },
      },
      {
        id: 'yield-evento',
        termo: 'Yield do evento',
        definicao:
          'O valor declarado do provento dividido pelo fechamento do pregão anterior à data ex: o rendimento daquele pagamento sobre o preço.',
        comoLer:
          'Um provento de R$ 0,50 sobre fechamento de R$ 42,37 dá 1,18% (exemplo didático). A soma dos yields em 12 meses aparece no resumo. Fica vazio quando o valor declarado não foi encontrado.',
        onde: 'Tabela "Datas ex" e resumo da seção Proventos.',
        link: { rotulo: 'Ficha, seção Proventos', href: '#/ativo?secao=proventos' },
      },
      {
        id: 'preco-medio-dia',
        termo: 'Preço médio do dia',
        definicao:
          'O preço médio dos negócios do pregão (campo do arquivo COTAHIST da B3), diferente do fechamento, que é só o último negócio.',
        comoLer:
          'Uma linha tracejada "Preço médio do dia" pode ser ligada no gráfico de velas diárias. Fica desligada em velas de semana ou mês e nos períodos vindos da BRAPI, porque não há como compor a média confiável. No plano de operação, serve de entrada de referência ao lado do último preço.',
        onde: 'Gráfico de velas (caixa de seleção) e plano de operação.',
        link: { rotulo: 'Ficha, seção Gráfico', href: '#/ativo?secao=grafico' },
      },
      {
        id: 'melhor-oferta',
        termo: 'Melhor oferta de compra e de venda',
        definicao:
          'No livro de ofertas, a maior oferta de compra (o que alguém aceita pagar) e a menor oferta de venda (o que alguém aceita receber).',
        comoLer:
          'O fechamento é o último negócio, que pode ter acontecido horas antes; as melhores ofertas mostram onde o mercado está agora. Oferta ausente, zero ou cruzada (venda menor que compra) é tratada como sem oferta.',
        onde: 'Cadeia de opções e velas diárias do plano de operação.',
        link: { rotulo: 'Opções', href: '#/opcoes' },
      },
      {
        id: 'spread-ofertas',
        termo: 'Spread entre as ofertas (em %)',
        definicao:
          'A diferença entre a melhor venda e a melhor compra, dividida pelo preço justo e multiplicada por 100.',
        comoLer:
          'É o custo de entrar e sair na hora. Exemplo didático: compra 1,90 e venda 2,10 dão spread de 0,20 sobre 2,00, ou 10%. Para opções pouco negociadas é comum ser alto. Veja também "Spread" na seção "Como se analisa".',
        onde: 'Coluna "Spread %" da cadeia de opções; resumo da seção Opções.',
        link: { rotulo: 'Opções', href: '#/opcoes' },
      },
      {
        id: 'preco-justo-spread',
        termo: 'Preço justo pelo meio do spread',
        definicao:
          'A média entre a melhor oferta de compra e a de venda. É uma estimativa do preço "do momento" quando o último negócio está velho.',
        comoLer:
          'O painel usa esse meio no prêmio, no ponto de equilíbrio e no hedge das opções quando há oferta; sem oferta, volta ao último negócio. A coluna "Prêmio usado" diz qual dos dois foi usado: "pelo meio do spread" ou "último negócio". Não é cotação garantida de execução.',
        onde: 'Coluna "Preço justo" da cadeia de opções.',
        link: { rotulo: 'Opções', href: '#/opcoes' },
      },
      {
        id: 'strike-corrigido',
        termo: 'Strike corrigido (INDOPC)',
        definicao:
          'Strike é o preço de exercício da opção. Algumas séries têm o strike corrigido por um índice, indicado no campo INDOPC do COTAHIST.',
        comoLer:
          'O selo "⚠ strike corrigido" aparece quando o campo INDOPC traz qualquer valor diferente de vazio ou "0". O painel não interpreta qual índice é: mostra só o código no título do selo. Confira a série antes de comparar o strike com o preço da ação.',
        onde: 'Selo na cadeia de opções.',
        link: { rotulo: 'Opções', href: '#/opcoes' },
      },
      {
        id: 'defasagem-ultimo-negocio',
        termo: 'Defasagem do último negócio',
        definicao:
          'Quando o último fechamento está mais de 10% longe do meio do spread, o último negócio é considerado velho para representar o preço atual.',
        comoLer:
          'A regra: |fechamento − meio| / meio > 10% (constante revisável). Aparece o selo "⏱ último negócio defasado". Nesse caso desconfie de qualquer cálculo feito com o fechamento. Séries sem nenhuma oferta recebem o selo "∅ sem oferta" e podem ser escondidas pelo filtro "Só séries com oferta".',
        onde: 'Selos na cadeia de opções.',
        link: { rotulo: 'Opções', href: '#/opcoes' },
      },
      {
        id: 'custo-execucao',
        termo: 'Custo de execução',
        definicao:
          'O spread mediano dos últimos 21 pregões com oferta, tratado como o custo de entrar e sair da posição (ida e volta).',
        comoLer:
          'Mediana é o valor do meio, que ignora dias extremos. O plano de operação mostra esse custo e o alvo líquido: o alvo e o ganho potencial descontados do custo. Sem ofertas nas velas, nada é mostrado.',
        onde: 'Avisos do plano de operação, na seção Decisão.',
        link: { rotulo: 'Ficha, seção Decisão', href: '#/ativo?secao=decisao' },
      },
      {
        id: 'alvo-liquido',
        termo: 'Alvo líquido',
        definicao:
          'O alvo de preço do plano de operação e o ganho potencial já descontados do custo de execução (ida e volta).',
        comoLer:
          'Em operação de compra, o alvo líquido é o alvo menos o preço atual vezes o custo em %; em venda, o ajuste vai no sentido oposto. O ganho potencial cai pelo mesmo número de pontos percentuais. É a conta do plano, não uma promessa de resultado.',
        onde: 'Avisos do plano de operação, na seção Decisão.',
        link: { rotulo: 'Ficha, seção Decisão', href: '#/ativo?secao=decisao' },
      },
    ],
  },
];

export const GLOSSARIO = [
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
        termo: 'COTAHIST',
        sigla: 'Cotacoes Historicas (arquivo da B3)',
        definicao:
          'O arquivo oficial de series historicas de cotacoes publicado pela propria B3 - o registro definitivo do que foi negociado em cada pregao, para todos os instrumentos (acoes, opcoes, termo, fracionario), desde a decada de 1980 ate hoje. E a fonte "verdade absoluta" de preco no mercado brasileiro: quando BRAPI ou qualquer outra fonte secundaria diverge, o COTAHIST e quem desempata.',
        exemplo:
          'Formato texto de largura fixa (posicional, nao CSV/JSON) - cada linha tem campos em posicoes de caractere fixas: codigo BDI (tipo de mercado), ticker, nome resumido da empresa, preco de abertura/maximo/minimo/medio/ultimo, melhor oferta de compra/venda, quantidade de negocios, quantidade de titulos negociados, volume financeiro, entre outros. Distribuido em arquivos anuais (COTAHIST_A{ano}.ZIP, ~80-90 MB cada), tambem existe versao mensal e diaria. Download direto, sem chave nem cadastro: bvmf.bmfbovespa.com.br/InstDados/SerHist/.',
        onde: 'Tabela cotacao_b3_diaria (mysql-migrations V6) - carregada a partir dos arquivos anuais desde 2016, usada pra checagem cruzada contra a BRAPI e como fonte de preco do backtest (o motor de avaliacao usa preco oficial, nao o da API de cotacao em tempo quase real).',
        cuidado:
          'O preco no COTAHIST e BRUTO (nao ajustado por proventos/desdobramentos) - um dividendo ou split aparece como salto no preco de um dia pro outro, sem ninguem ter vendido nada. Ajustar isso exige cruzar com a base de proventos/eventos corporativos separadamente (ver Preco ajustado e Provento neste glossario) - o arquivo em si nao devolve preco ja ajustado.',
      },
      {
        termo: 'Companhia aberta',
        definicao:
          'Empresa autorizada a vender acoes ao publico. Em troca, e obrigada por lei a publicar seus numeros - e essa obrigacao que torna este sistema possivel.',
      },
      {
        termo: 'CVM',
        sigla: 'Comissao de Valores Mobiliarios',
        definicao:
          'Autarquia federal criada pela Lei 6.385/1976, vinculada ao Ministerio da Fazenda, responsavel por regular, fiscalizar e disciplinar o mercado de valores mobiliarios brasileiro (acoes, debentures, fundos, derivativos). Equivalente brasileiro da SEC americana. Missao legal: proteger o investidor, assegurar o funcionamento eficiente do mercado e garantir acesso a informacao adequada - e essa terceira obrigacao que torna este sistema possivel: toda companhia aberta e obrigada por lei a publicar seus numeros, e a CVM os disponibiliza de graca.',
        exemplo:
          'Poderes praticos: registra companhias abertas e ofertas publicas (IPO), edita normas (as "Instrucoes"/"Resolucoes CVM" - ex.: Resolucao CVM 20/2021, que rege a certificacao de analistas), investiga e pune infracoes (processo administrativo sancionador, que pode culminar em multa, inabilitacao ou ate esfera penal em casos de fraude/insider trading).',
        onde: 'Fonte de todos os fundamentos contabeis deste sistema (via etl-fundamentos-cvm) e dos comunicados oficiais (aba Comunicados). Dois canais: o Portal de Dados Abertos (dados.cvm.gov.br, machine-readable, gratis, sem cadastro - o que este sistema consome) e o RAD/ENET (Rede de Atendimento Digital, onde a propria empresa protocola os documentos e o publico le em PDF).',
        cuidado:
          'A CVM e o orgao regulador - nao o mesmo que a B3 (a bolsa, empresa privada que opera o ambiente de negociacao) nem que o Banco Central (que regula o sistema financeiro/bancario e a politica monetaria). Confundir os tres e erro comum entre iniciantes.',
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
        id: 'pvp',
        termo: 'P/VP',
        sigla: 'Preco sobre valor patrimonial',
        definicao: 'Preco da acao dividido pelo VPA.',
        pergunta: 'Estou pagando quanto por cada R$ 1 de patrimonio?',
        referencia: 'Abaixo de 1 significa pagar menos que o patrimonio contabil.',
        comoLer: 'Compare com o ROE: P/VP alto com ROE alto pode ser coerente. Para banco, veja "P/VP do banco" na secao de bancos.',
        link: { rotulo: 'Ficha, seção Fundamentos', href: '#/ativo?secao=fundamentos' },
      },
      {
        id: 'roe',
        termo: 'ROE',
        sigla: 'Retorno sobre o patrimonio liquido',
        definicao: 'Lucro liquido dividido pelo patrimonio liquido, em %.',
        pergunta: 'A empresa rende bem sobre o dinheiro dos socios?',
        referencia: 'Acima de 15% e considerado bom.',
        comoLer: 'Olhe a serie de varios anos, nao um ano so, e lembre que a faixa boa varia por setor. Para banco o painel compara o ROE com a Selic meta.',
        link: { rotulo: 'Ficha, seção Fundamentos', href: '#/ativo?secao=fundamentos' },
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
          'Um calculo de preco justo criado por Benjamin Graham. A versao original (1962): preco justo = LPA x (8,5 + 2 x crescimento). A versao revisada (1974) multiplica isso por 4,4 / Y, onde Y e o rendimento de um titulo de referencia - sem esse ajuste, com juros de dois digitos como no Brasil, o preco justo sai inflado.',
        onde: 'Usamos a versao ajustada: Y = Selic meta vigente. Tres cenarios de crescimento (0%, 3%, 5%). A versao sem ajuste (fator 1) continua calculada, mas so como referencia historica - nao decide a recomendacao.',
      },
      {
        termo: 'Y (taxa livre de risco no Graham ajustado)',
        definicao:
          'O rendimento de referencia que divide o fator 4,4 na formula revisada de Graham. Quanto maior Y, menor o preco justo calculado - juros altos exigem desconto maior pra compensar o custo de oportunidade de nao deixar o dinheiro rendendo sem risco.',
        onde: 'Selic meta vigente no dia da analise (indice_macro, codigo SELIC). Sem Selic disponivel no cache, o insight sai SEM_DADOS em vez de usar a formula sem ajuste escondida.',
      },
      {
        termo: 'Graham Number',
        definicao:
          'Teto classico de Graham pro "investidor defensivo": raiz quadrada de 22,5 x LPA x VPA. Equivale a aceitar, no maximo, P/L 15 combinado com P/VP 1,5 ao mesmo tempo - nao usa juros, e um criterio patrimonial separado do preco justo.',
        onde: 'Segunda trava de COMPRA_FORTE: mesmo com margem de seguranca e earnings yield altos, se o preco passa do Graham Number (barato pelo lucro, caro pelo patrimonio), a recomendacao e rebaixada pra COMPRA_MODERADA.',
      },
      {
        termo: 'LPA normalizado',
        definicao:
          'Em vez do lucro por acao de um unico exercicio (que pode estar no pico de um ciclo), usa-se o menor valor entre o LPA atual e a media dos ultimos 3 a 5 anos entregues a CVM.',
        onde: 'Evita que uma empresa ciclica (banco, commodity) pareca "barata" so porque o lucro do ano esta anormalmente alto.',
      },
      {
        termo: 'Lucro ciclico (ciclica no pico)',
        definicao:
          'Empresa ciclica (banco, commodity) no pico do ciclo tem o LPA do ano bem acima da media historica; usar esse LPA sozinho faria a formula de Graham calcular um preco justo inflado e sair COMPRA_FORTE, mesmo com o lucro perto de cair. O LPA normalizado corrige isso antes do calculo (ver "LPA normalizado").',
        onde: 'Testado fixando o modo G_REAL (tests/test_valuation_selic_e_ciclo.py): esse modo nao depende do IPCA do dia, entao a proporcao entre LPA normalizado e preco justo sai exata; em G_NOMINAL/Y_REAL o resultado varia com o IPCA e nao daria um numero fixo pro teste.',
      },
      {
        termo: 'Referencia sem juros (cenario)',
        definicao:
          'Segundo calculo de preco justo pela formula de Graham, feito com a taxa fixa historica (Y = 4,4%, fator 1) em vez da Selic do dia, e sempre no modo G_REAL - nao depende do IPCA, por isso nunca fica sem dado. Fica ao lado do cenario oficial so como referencia historica: nao entra na recomendacao nem na margem de seguranca de COMPRA/VENDA.',
        onde: 'Calculado em paralelo ao valuation oficial (ValuationAnalyzer.analyze, campo "referencia"). Usa G_REAL mesmo quando o cenario oficial usa outro modo - hoje G_NOMINAL, escolhido no DEC-08/TASK-54.',
      },
      {
        termo: 'Faixa neutra (de venda)',
        definicao:
          'Intervalo de margem de seguranca negativa que ainda nao justifica VENDA_VALUATION - hoje, entre -15% e 0%. Abaixo disso e venda; dentro da faixa, o sistema classifica como MANTER.',
        onde: 'Sem faixa neutra, qualquer margem negativa virava "venda" e quase toda empresa de crescimento saia como venda, mesmo sendo so um pouco cara.',
      },
      {
        termo: 'Versao da regra',
        definicao:
          'Identificador (formato AAAA.MM.DD-N) que muda toda vez que um limiar ou formula da recomendacao muda para a mesma entrada. Existe pra sinais de regras diferentes nunca caırem no mesmo placar de acerto.',
        onde: 'Gravado em todo insight e no diario de sinais. Comparar regras (v1 vs. v2) so faz sentido separando por essa versao.',
      },
      {
        termo: 'Point-in-time (data de entrega)',
        definicao:
          'Usar, numa simulacao do passado, so a informacao que ja era publica naquela data - nao o balanco "do periodo", mas a data em que ele de fato foi entregue e ficou disponivel pro mercado (a CVM chama isso de DT_RECEB).',
        onde: 'Sem isso, o backtest usaria lucro que ninguem conhecia na epoca (look-ahead bias) - o balanco de um exercicio pode demorar meses para ser publicado.',
      },
      {
        termo: 'Universo amplo (backtest)',
        definicao:
          'O conjunto de ativos testado no backtest, ampliado pra incluir empresas que ja saíram da bolsa (deslistadas) - nao so as monitoradas hoje. Testar so quem sobreviveu ate agora infla artificialmente o resultado (vies de sobrevivencia): empresa que quebrou nunca aparece como "erro" da regra.',
        onde: 'Em uso desde 27/09/2026 (TASK-59/51): o universo de cada ano sai do COTAHIST - ativos com pelo menos 200 pregões e volume médio de R$ 5 milhões por dia no ano anterior, sem units nem BDRs, incluindo quem saiu da bolsa. O último backtest cobriu 258 ativos.',
      },
      {
        termo: 'Placar segmentado',
        definicao:
          'Separar, no resultado do backtest, as janelas que tiveram um ajuste aplicado (ex.: provento somado ao retorno) das que nao tiveram - em vez de misturar as duas no mesmo numero sem dizer quantas de cada.',
        onde: 'Proventos (ISS-F7/infra#TASK-36 e TASK-56): o retorno soma provento quando há dado, e o placar da aba Avaliação mostra quantas janelas de cada linha tiveram provento.',
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
  ...GRUPOS_MACRO_FONTES_MICRO,
  {
    id: 'estrutura',
    titulo: 'Tendência, suporte e resistência',
    resumo:
      'A leitura da estrutura do preço, que vem antes de qualquer indicador ou padrão de vela. Os padrões do grupo seguinte dependem destes termos.',
    termos: [
      {
        termo: 'Tendência de alta e de baixa',
        definicao:
          'Alta é uma sequência de topos e fundos cada vez mais altos; baixa, de topos e fundos cada vez mais baixos. Um candle sozinho não faz tendência: o que conta é o encadeamento dos extremos.',
        exemplo: 'Fundos em 30, 32 e 34 com topos em 33, 36 e 38 descrevem alta. Perder o último fundo (34) é o primeiro sinal de enfraquecimento.',
        cuidado: 'Marque os pivôs com uma regra fixa (ex.: maior máxima entre 5 pregões de cada lado); escolher os pontos no olho depois do fato cria a tendência que você queria ver.',
        onde: 'A posição no range de 52 semanas e o z-score da ficha dizem onde o preço está, não a direção da tendência - o sistema ainda não marca pivôs.',
      },
      {
        termo: 'Lateralização',
        definicao:
          'Preço oscilando dentro de uma faixa, sem topos nem fundos progressivos. É o regime em que rompimentos falham com mais frequência e médias móveis dão mais sinais falsos.',
        cuidado: 'Muitos sinais em mercado lateral multiplicam custos de corretagem e spread sem ganho correspondente.',
      },
      {
        termo: 'Teoria de Dow',
        definicao:
          'Leitura clássica que separa movimentos primários (meses a anos), secundários (semanas a meses, correções) e menores (dias). Deu origem à definição de tendência por topos e fundos.',
        cuidado: 'É uma forma de descrever o preço, não uma promessa de que o padrão se repete.',
      },
      {
        termo: 'Suporte e resistência',
        definicao:
          'Suporte é uma região de preço onde as quedas vinham parando (compradores apareciam); resistência, onde as altas vinham parando (vendedores apareciam). São faixas aproximadas, não um preço exato.',
        exemplo: 'Uma ação que recuou três vezes perto de R$ 32 tem resistência na região de R$ 31,50 a R$ 32,50. Superada, essa região pode virar suporte - mas não necessariamente.',
        cuidado: 'Quanto mais óbvia a região, mais gente olha para ela e mais comuns são os falsos rompimentos.',
        onde: 'A máxima e a mínima de 52 semanas funcionam como resistência e suporte de referência na ficha e nos cartões de padrão da aba Velas.',
      },
      {
        termo: 'Linha de tendência e canal',
        definicao:
          'Linha de tendência liga fundos ascendentes (alta) ou topos descendentes (baixa) e mostra inclinação e aceleração. Canal é o par de linhas paralelas que contém as oscilações.',
        cuidado: 'Não force a linha para o gráfico caber nela. Romper uma linha sozinha informa menos que uma mudança na sequência de topos e fundos.',
      },
      {
        termo: 'Falso rompimento',
        definicao:
          'O preço atravessa um suporte ou resistência e volta logo para dentro da faixa anterior. Também chamado de armadilha: pega quem entrou no rompimento.',
        exemplo: 'Fecha a R$ 32,40 acima da resistência de R$ 32 e, dois pregões depois, está de volta a R$ 31,20.',
        cuidado: 'Defina antes o que é rompimento válido (fechamento acima da faixa, não só sombra) e registre as falhas, não apenas os casos que deram certo.',
        onde: 'O cartão de rompimento da aba Velas avisa quando o volume foi fraco - o caso mais comum de falso rompimento.',
      },
      {
        termo: 'Reteste',
        definicao:
          'Depois de romper uma região, o preço volta até ela e a usa como apoio antes de seguir. Resistência rompida sendo testada como suporte é o caso clássico.',
        cuidado: 'Não presuma que o reteste vai acontecer: muitos rompimentos verdadeiros seguem sem voltar.',
      },
      {
        termo: 'Prazos operacionais (intradiário, swing, posição)',
        definicao:
          'Intradiário: abre e fecha no mesmo dia, gráficos de minutos. Swing trade: dias a semanas, gráfico diário. Posição: meses, gráfico semanal. O mesmo padrão tem peso diferente em cada prazo.',
        cuidado: 'Leia do maior para o menor: uma alta no diário pode ser só um repique dentro de uma baixa no semanal. Trocar de prazo até concordar com a sua tese é timeframe shopping.',
        onde: 'O sistema trabalha com pregões diários (COTAHIST) e agrupa em semana e mês na aba Velas; não há dado intradiário.',
      },
    ],
  },
  {
    id: 'indicadores-tecnicos',
    titulo: 'Indicadores técnicos',
    resumo:
      'Transformações do preço e do volume. Todos olham para trás e atrasam em relação ao movimento - e vários são versões do mesmo dado, não evidências independentes.',
    termos: [
      {
        termo: 'SMA e EMA (média simples e exponencial)',
        sigla: 'Simple / Exponential Moving Average',
        definicao:
          'A SMA dá o mesmo peso aos N últimos fechamentos. A EMA dá mais peso aos recentes: EMA de hoje = α × preço + (1 − α) × EMA de ontem, com α = 2 / (N + 1). A EMA reage mais rápido e erra mais em mercado lateral.',
        exemplo: 'SMA20 é a média dos últimos 20 fechamentos. Médias de 50 e 200 períodos são referências comuns, não leis.',
        cuidado: 'Cruzamento de médias costuma chegar tarde depois de um movimento forte. Preço acima de média subindo sugere regime de alta, não garante continuação.',
        onde: 'O sistema usa a SMA de 20 pregões (média móvel da ficha e base do z-score). EMA não é calculada.',
      },
      {
        termo: 'Sobrecompra e sobrevenda',
        definicao:
          'Faixas convencionais do RSI (IFR): acima de 70 chama-se sobrecompra; abaixo de 30, sobrevenda. A linha de 50 separa predomínio recente de ganhos (acima) e de perdas (abaixo). A configuração clássica de Wilder usa 14 períodos.',
        cuidado: 'Não são ordens de venda ou compra: em tendência forte o RSI fica semanas acima de 70 enquanto o preço segue subindo.',
        onde: 'O RSI não é calculado pelo sistema; o z-score da ficha cumpre papel parecido (preço esticado em relação à média).',
      },
      {
        termo: 'Divergência',
        definicao:
          'Preço e indicador contam histórias diferentes. De baixa: o preço faz topo mais alto e o RSI (ou MACD) faz topo mais baixo - o momentum está perdendo força. De alta: o preço faz fundo mais baixo e o indicador, fundo mais alto.',
        exemplo: 'Novo topo em R$ 42 com o RSI abaixo do topo anterior.',
        cuidado: 'Divergências podem durar muito antes de qualquer reversão. Compare pivôs equivalentes e confirme com perda de estrutura, não com a divergência sozinha.',
      },
      {
        termo: 'Histograma do MACD',
        definicao:
          'Barras com a diferença entre a linha MACD (EMA12 − EMA26) e a linha de sinal (EMA9 do MACD). Barras crescendo mostram momentum acelerando; encolhendo, desacelerando.',
        cuidado: 'Histograma positivo não garante alta futura, e em mercado lateral o MACD cruza o sinal o tempo todo.',
        onde: 'O MACD não é calculado pelo sistema.',
      },
      {
        termo: 'Volatilidade',
        definicao:
          'O quanto o preço oscila, independentemente da direção. Um ativo pode subir e ainda assim oscilar o bastante para acionar o stop de uma operação mal dimensionada.',
        cuidado: 'Direção e risco são perguntas diferentes: indicador de volatilidade não diz se o preço vai subir ou cair.',
        onde: 'A amplitude intradiária e o desvio-padrão por trás do z-score são as medidas de oscilação que o sistema calcula.',
      },
      {
        termo: 'True Range e ATR',
        sigla: 'Average True Range',
        definicao:
          'True Range é o maior entre: máxima − mínima do dia; |máxima − fechamento anterior|; |mínima − fechamento anterior| - ou seja, a amplitude contando o gap. ATR é a média suavizada do True Range, em geral de 14 períodos (Wilder).',
        exemplo: 'ATR14 de R$ 1,20 significa que o papel oscila, em média, R$ 1,20 por pregão. Um stop a 2 ATR ficaria R$ 2,40 abaixo da entrada.',
        cuidado: 'Stop baseado em ATR se adapta à volatilidade, mas não elimina perdas nem garante o preço de execução.',
        onde: 'O ATR não é calculado pelo sistema, mas as velas do banco (máxima, mínima e fechamento desde 2016) permitem calculá-lo.',
      },
      {
        termo: 'VWAP',
        sigla: 'Volume Weighted Average Price',
        definicao:
          'Preço médio do período ponderado pelo volume negociado em cada preço. Muito usado dentro do dia como referência de execução de ordens grandes.',
        cuidado: 'VWAP do dia não é preço justo fundamental - é só o preço médio pelo qual o mercado negociou.',
        onde: 'Exige dados intradiários, que o sistema não tem.',
      },
      {
        termo: 'OBV',
        sigla: 'On-Balance Volume',
        definicao:
          'Volume acumulado: soma o volume dos dias de alta e subtrai o dos dias de baixa. Usado para ver se o volume acompanha o preço ou diverge dele.',
        cuidado: 'Um dia de volume extraordinário (rebalanceamento de índice, leilão) distorce a série inteira dali para frente.',
      },
      {
        termo: 'Volume x número de negócios',
        definicao:
          'Volume é a quantidade (ou valor) negociada; número de negócios é quantas operações aconteceram. Um único negócio grande pode gerar volume alto com poucos participantes.',
        cuidado: 'Volume alto de poucos negócios confirma menos um movimento que o mesmo volume espalhado em muitos.',
        onde: 'O COTAHIST traz os dois; o sistema usa o volume (score de volume da análise técnica e filtro de liquidez do backtest).',
      },
      {
        termo: 'Liquidez de negociação',
        definicao:
          'Facilidade de comprar ou vender sem mover o preço: volume diário, spread entre compra e venda e profundidade do livro de ofertas. Diferente da liquidez corrente, que é um indicador contábil.',
        cuidado: 'Uma estratégia que funciona no papel pode ser inexecutável em ativo pouco líquido - a própria ordem move o preço.',
        onde: 'O universo do backtest exige volume médio de pelo menos R$ 5 milhões por dia no ano anterior; a aba Velas marca pregões de liquidez baixa.',
      },
    ],
  },
  {
    id: 'risco-operacao',
    titulo: 'Risco e resultado de uma operação',
    resumo:
      'Como medir se uma regra ou operação valeu a pena, e como limitar o estrago quando a hipótese estiver errada.',
    termos: [
      {
        termo: 'Stop (ordem de proteção)',
        definicao:
          'Ordem que encerra a posição se o preço atingir um nível definido antes da entrada, para limitar a perda quando a hipótese se mostra errada.',
        cuidado: 'Stop não garante preço: numa abertura com gap a ordem executa no primeiro preço disponível, que pode estar bem abaixo do planejado.',
        onde: 'O backtest do sistema não simula stop: mede o retorno do sinal em horizontes fixos de 21, 63 e 126 pregões.',
      },
      {
        termo: 'Relação retorno/risco',
        definicao:
          'Quanto se espera ganhar para cada real arriscado. Risco de R$ 2 por ação (entrada até o stop) e alvo de R$ 4 dão 2:1, antes de custos.',
        cuidado: 'Uma razão atraente não compensa sozinha uma taxa de acerto baixa: 2:1 acertando 30% das vezes perde dinheiro.',
      },
      {
        termo: 'Payoff',
        definicao:
          'Ganho médio das operações vencedoras dividido pela perda média das perdedoras. Junto com a taxa de acerto, define a expectativa da estratégia.',
        exemplo: 'Payoff 1,5 com 45% de acerto: 0,45 × 1,5 − 0,55 × 1 = +0,125 por unidade arriscada, antes de custos.',
        cuidado: 'Taxa de acerto isolada não diz nada; payoff isolado também não.',
      },
      {
        termo: 'Retorno simples e anualizado',
        definicao:
          'Retorno simples = preço final ÷ preço inicial − 1. Anualizado converte para uma base de um ano, para comparar horizontes diferentes: (1 + retorno) ^ (252 ÷ pregões) − 1.',
        exemplo: '+2% em 63 pregões equivale a cerca de +8,2% ao ano.',
        cuidado: 'Anualizar um período curto e bom extrapola sorte.',
        onde: 'O placar do backtest mostra o retorno médio por horizonte (21, 63, 126 pregões), com custo de 0,10% ida e volta e proventos quando há dado.',
      },
      {
        termo: 'Índice de Sharpe',
        definicao:
          'Retorno acima da taxa livre de risco dividido pela volatilidade desse retorno. Mede retorno por unidade de oscilação: quanto maior, melhor a recompensa pelo risco corrido.',
        cuidado: 'Supõe que volatilidade é todo o risco - ignora caudas gordas e sequências de perdas. Compare Sharpe só entre períodos e universos iguais.',
        onde: 'Não é calculado; o placar compara com o CDI e com a carteira pelo excesso médio e seu intervalo de confiança.',
      },
      {
        termo: 'Buy-and-hold',
        definicao:
          'Comprar e manter, sem operar. É a referência mínima de qualquer estratégia: se a regra não bate simplesmente segurar o mesmo universo no mesmo período, os sinais não agregaram nada.',
        onde: 'A "carteira" do placar do backtest é essa referência: a média de todos os ativos do universo em cada janela.',
      },
      {
        termo: 'Turnover',
        definicao:
          'Quanto da carteira é trocado por período. Turnover alto multiplica custos de corretagem, emolumentos, spread e impostos.',
        cuidado: 'Uma estratégia com resultado bruto bom pode virar prejuízo líquido só pelo giro.',
      },
      {
        termo: 'Ordem a mercado e ordem limitada',
        definicao:
          'A mercado executa já, no melhor preço disponível. Limitada só executa no preço definido ou melhor - pode não executar.',
        cuidado: 'A mercado troca certeza de execução por risco de preço (slippage); limitada troca certeza de preço por risco de ficar de fora.',
      },
      {
        termo: 'Custos de negociação',
        definicao:
          'Corretagem, emolumentos e taxa de liquidação da B3, spread, slippage e imposto sobre o ganho. Somados, podem consumir todo o resultado de uma estratégia de giro alto.',
        onde: 'O backtest desconta 0,10% por operação (ida e volta); impostos não entram.',
      },
      {
        termo: 'Diário de operações',
        definicao:
          'Registro feito ANTES do resultado: ativo, data e prazo; contexto do prazo maior; hipótese; gatilho objetivo; risco planejado e cenário de gap. Depois, o resultado líquido e se o plano foi seguido.',
        cuidado: 'Regra alterada depois de ver o desfecho não testa nada.',
        onde: 'O Diário de sinais da aba Avaliação é a versão automática: grava o sinal de cada regra no pregão em que foi dado e só depois mede o resultado.',
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
        onde: 'Leva de 3 a 6 meses para se formar: use os períodos de 1 ano ou 5 anos da aba Velas (pregões do banco desde 2016). O sistema não detecta OCO automaticamente.',
      },
      {
        termo: 'Triangulo',
        definicao:
          'Ascendente: topos no mesmo nivel e fundos subindo. Descendente: o inverso. Simetrico: os dois convergem, e rompe para qualquer lado.',
      },
      {
        termo: 'Retângulo',
        definicao:
          'Faixa lateral com topos e fundos em níveis parecidos: uma pausa em que compradores e vendedores se equilibram. O significado vem do lado por onde o preço sai da faixa.',
        cuidado: 'Não presuma continuação só pela aparência: o retângulo rompe para qualquer lado.',
      },
      {
        termo: 'Cunha',
        definicao:
          'Duas linhas convergentes inclinadas para o mesmo lado. Cunha ascendente (topos e fundos subindo cada vez mais devagar) costuma ser lida como perda de força da alta; descendente, o inverso.',
        cuidado: 'Definições vagas de onde começa e termina a cunha criam viés de seleção: qualquer oscilação vira cunha depois do fato.',
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
        onde: 'Precisa de 200 pregões: dá para observar nos períodos longos da aba Velas (banco desde 2016), mas o sistema não calcula nem desenha as médias de 50 e 200.',
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
        id: 'spread',
        termo: 'Spread',
        definicao:
          'Diferenca entre a melhor oferta de compra e a de venda. Em ativo pouco liquido, o spread pode consumir o movimento inteiro que o grafico mostra.',
        comoLer: 'Em porcentagem, o painel divide a diferenca pelo preco justo (meio das ofertas). Veja "Spread entre as ofertas (em %)".',
        link: { rotulo: 'Opções', href: '#/opcoes' },
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
    id: 'decisoes-fundamentadas',
    titulo: 'Decisões fundamentadas do ecossistema',
    resumo: 'Como o sistema transforma preço, balanço, juros e histórico em leitura de negócio.',
    termos: [
      {
        termo: 'Decisão consolidada',
        definicao:
          'A leitura final que o backend Java monta a partir de várias análises já gravadas. Ela combina o sinal predominante, a margem de segurança média, a família da recomendação e a quantidade de registros disponíveis.',
        onde: 'Aparece em Gestão e na tabela única de Ativos. Não é cálculo novo de valuation; é consolidação dos resultados produzidos pelo gerar-insights.',
        cuidado:
          'Mais registros aumentam a confiança operacional, mas não provam acerto futuro. O acerto é medido separadamente no diário e no backtest.',
      },
      {
        termo: 'Sinal quantitativo',
        definicao:
          'Classificação produzida por regra matemática sobre dados de mercado ou fundamentos. Pode ser positivo, neutro, negativo ou sem dados, mas não é uma ordem de compra ou venda.',
        onde: 'Vem do gerar-insights, é lido pelo gestor e exibido no front com aviso de regra experimental.',
        cuidado:
          'No Brasil, recomendar investimento é atividade regulada. Por isso o painel deve tratar o sinal como leitura automática, não como recomendação profissional.',
      },
      {
        termo: 'Margem de segurança',
        definicao:
          'Distância entre o preço de mercado e o preço justo estimado. Se o valor justo é 100 e o preço é 70, a margem é 30%.',
        onde: 'Calculada pelo gerar-insights com os cenários de Graham e usada pelo gestor para risco e decisão consolidada.',
        cuidado:
          'Margem alta pode indicar oportunidade ou problema escondido no balanço. Ela depende da qualidade do LPA, da taxa de juros e do setor.',
      },
      {
        termo: 'Preço justo de Graham ajustado por juros',
        definicao:
          'Estimativa de valor que parte do LPA e de uma taxa de crescimento, depois ajusta pelo nível de juros. Juros mais altos reduzem o preço justo aceitável.',
        onde: 'Calculado no gerar-insights usando Selic como referência de juros e gravado no payload de fundamentos.',
        referencia: 'Benjamin Graham; ajuste 4,4 / Y, com Y representado no sistema pela Selic vigente.',
      },
      {
        termo: 'LPA normalizado',
        definicao:
          'Lucro por ação suavizado com histórico de 3 a 5 anos para reduzir o efeito de um ano excepcionalmente bom ou ruim.',
        onde: 'Usado pelo gerar-insights antes do valuation, quando a base CVM oferece histórico suficiente.',
        cuidado:
          'Empresas cíclicas podem parecer baratas no pico do lucro. Normalizar o LPA reduz esse viés.',
      },
      {
        termo: 'Graham Number',
        definicao:
          'Trava complementar de valor que combina LPA e VPA. Ajuda a evitar que uma ação pareça barata só pelo lucro, mas esteja cara em relação ao patrimônio.',
        onde: 'Calculado pelo gerar-insights quando há VPA válido vindo da CVM.',
      },
      {
        termo: 'Momentum',
        definicao:
          'Leitura de continuação de tendência: preço acima da média móvel com volume relativo forte sugere força compradora; abaixo da média com volume fraco sugere perda de força.',
        onde: 'Calculado sobre a série histórica como sinal técnico e medido no backtest como regra própria.',
        cuidado:
          'Momentum não substitui fundamento. O projeto mede esse sinal separado do valuation para não misturar hipóteses antes de provar acerto.',
      },
      {
        termo: 'Reversão à média',
        definicao:
          'Hipótese de que preços muito afastados da média tendem a voltar para perto dela. O sistema observa z-score e proximidade de mínimas ou máximas de 52 semanas.',
        onde: 'Calculada pelo gerar-insights e registrada como regra técnica própria no backtest.',
        cuidado:
          'Preço barato pode continuar barato se o fundamento piorou. A reversão só faz sentido quando o desvio não é explicado por mudança real do negócio.',
      },
      {
        termo: 'Taxa-base',
        definicao:
          'A proporção de janelas que subiram ou caíram no mesmo período, independentemente da regra. Serve para saber se a regra venceu o ambiente geral ou só surfou o mercado.',
        onde: 'Mostrada no backtest e no diário de sinais.',
        exemplo:
          'Se 60% das ações subiram em 63 pregões, uma regra de compra com 58% de acerto não agregou valor.',
      },
      {
        termo: 'Intervalo de confiança',
        definicao:
          'Faixa estatística que mostra a incerteza da estimativa. Se o intervalo cruza a taxa-base, o resultado ainda é inconclusivo.',
        onde: 'Usado no placar de backtest, ranking e diário para evitar promover regra por ruído.',
      },
      {
        termo: 'Retorno total',
        definicao:
          'Retorno que soma a variação do preço e os proventos recebidos no período. É mais fiel que olhar só o preço, especialmente para bancos, elétricas e empresas pagadoras de dividendos.',
        onde: 'Backtest e diário somam proventos B3/CVM quando disponíveis.',
      },
      {
        termo: 'Viés de futuro',
        definicao:
          'Erro de teste em que a regra usa informação que ainda não existia no momento da decisão. Faz uma estratégia parecer melhor do que seria na vida real.',
        onde: 'O backtest evita isso entrando na abertura do pregão seguinte ao sinal e usando apenas balanços já entregues à CVM na data.',
      },
      {
        termo: 'Ponto no tempo',
        definicao:
          'Princípio de usar somente os dados conhecidos naquela data histórica. Um balanço entregue depois não pode influenciar uma decisão passada.',
        onde: 'Base dos fundamentos no backtest e dos fatores mensais.',
      },
      {
        termo: 'Cobertura da métrica',
        definicao:
          'Explicação de por que um indicador existe ou está nulo. Nulo pode ser ausência de dado, regra setorial ou conta incompatível.',
        onde: 'Vem do ETL CVM em `cobertura_json` e ajuda o front a não confundir nulo com zero.',
      },
      {
        termo: 'Base de fundamentos',
        definicao:
          'Conjunto de demonstrações CVM transformadas em indicadores como ROE, ROIC, margem, dívida líquida, LPA, VPA e fluxo de caixa.',
        onde: 'Produzida pelo etl-fundamentos-cvm nas tabelas `fato_contabil` e `indicador_fundamentalista`.',
        referencia: 'DFP, ITR, FCA, FRE, DRE, balanço patrimonial, DFC e DVA.',
      },
      {
        termo: 'Provento contábil x provento de evento',
        definicao:
          'Provento contábil vem da DVA/DFP/ITR e representa dividendos e JCP declarados no período. Provento de evento vem da B3 e traz data-com e pagamento aprovados.',
        onde: 'O backtest combina as duas fontes para estimar retorno total histórico sem dupla contagem.',
        cuidado:
          'A B3 pública costuma cobrir só uma janela recente; a CVM cobre histórico, mas nem sempre tem a data exata do evento.',
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

    // Chegando por `#/glossario?q=<termo>` (busca global do cabecalho):
    // pre-preenche e dispara o mesmo filtro que a digitacao manual usaria.
    const consulta = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const termoDaBusca = consulta.get('q');
    if (termoDaBusca) busca.value = termoDaBusca;

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
  const indice = normalizar([t.termo, t.sigla, t.definicao, t.comoLer, t.pergunta, t.onde, t.exemplo, t.cuidado]
    .filter(Boolean)
    .join(' '));

  return `
    <div class="col" data-verbete="${escapar(indice)}">
      <div ${t.id ? `id="verbete-${t.id}" ` : ''}class="border-start border-3 ps-3 h-100">
        <div class="fw-semibold">${t.termo}</div>
        ${t.sigla ? `<div class="text-muted small fst-italic">${t.sigla}</div>` : ''}
        <p class="small mb-1 mt-1">${t.definicao}</p>
        ${t.exemplo ? `<p class="small mb-1"><strong>Exemplo:</strong> ${t.exemplo}</p>` : ''}
        ${t.cuidado ? `<p class="small mb-1 text-secondary"><strong>Cuidado:</strong> ${t.cuidado}</p>` : ''}
        ${t.pergunta ? `<p class="small mb-1"><span class="text-muted">Responde:</span> ${t.pergunta}</p>` : ''}
        ${t.comoLer ? `<p class="small mb-1"><strong>Como ler:</strong> ${t.comoLer}</p>` : ''}
        ${t.referencia ? `<p class="small mb-1"><span class="badge bg-light text-dark">Referencia</span> ${t.referencia}</p>` : ''}
        ${t.onde ? `<p class="small text-muted mb-0">Aqui: ${t.onde}</p>` : ''}
        ${t.link ? `<p class="small mb-0"><a href="${t.link.href}">Abrir: ${t.link.rotulo}</a></p>` : ''}
      </div>
    </div>
  `;
}

function escapar(texto) {
  return texto.replace(/"/g, '&quot;');
}

customElements.define('glossario-page', GlossarioPage);
