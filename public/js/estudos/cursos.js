// Catálogo documental derivado dos PDFs disponíveis na biblioteca de estudos.
// As páginas mantêm a rastreabilidade entre cada aula e a fonte original.
export const cursos = [
  {
    id: 'historia-mercado-capitais',
    titulo: 'História e evolução do mercado de capitais',
    autoria: 'Diego Felipe Borges de Amorim',
    nivel: 'Introdutório', paginas: 17, ano: '2015',
    descricao: 'Formação histórica do mercado financeiro, sua evolução no Brasil e o papel econômico do mercado de capitais.',
    pdf: 'assets/pdfs/historia-mercado-capitais.pdf',
    aviso: 'Material histórico. Nomes de instituições, regras e dados de mercado devem ser conferidos em fontes atuais.',
    modulos: [
      { titulo: 'Origens do mercado financeiro', aulas: [
        { titulo: 'Poupança, investimento, juros e lucro', paginas: [1, 3], objetivo: 'Relacionar renda, poupança, investimento e financiamento.', topicos: ['Formação da poupança', 'Intermediação de recursos', 'Juros e remuneração do capital'], atividade: 'Desenhe o fluxo entre um agente poupador, um intermediário e uma empresa.' },
        { titulo: 'A evolução internacional das bolsas', paginas: [2, 3], objetivo: 'Reconhecer os fatores que deram origem aos mercados organizados.', topicos: ['Mercados organizados', 'Títulos e ações', 'Proteção e confiança institucional'], atividade: 'Monte uma linha do tempo com os principais marcos apresentados.' },
      ]},
      { titulo: 'O mercado brasileiro', aulas: [
        { titulo: 'Do Banco do Brasil ao sistema moderno', paginas: [4, 6], objetivo: 'Identificar os principais marcos institucionais brasileiros.', topicos: ['Banco do Brasil e SUMOC', 'Banco Central e CMN', 'Bovespa, BM&F e integração'], atividade: 'Explique a função de três instituições citadas no texto.' },
        { titulo: 'Governança e Novo Mercado', paginas: [5, 7], objetivo: 'Compreender por que proteção ao investidor e governança afetam o mercado.', topicos: ['Acionistas minoritários', 'Níveis de governança', 'Liquidez e confiança'], atividade: 'Liste práticas que reduzem conflitos entre controladores e minoritários.' },
      ]},
      { titulo: 'Estrutura e função econômica', aulas: [
        { titulo: 'Agentes, instituições e alocação de capital', paginas: [7, 12], objetivo: 'Explicar como o mercado transfere recursos para projetos produtivos.', topicos: ['Agentes superavitários e deficitários', 'Intermediários', 'Mercado primário e secundário'], atividade: 'Classifique exemplos de captação como mercado primário ou secundário.' },
        { titulo: 'Produtos, riscos e desenvolvimento', paginas: [12, 17], objetivo: 'Distinguir os instrumentos e os limites econômicos do mercado.', topicos: ['Ações, títulos, fundos e opções', 'Risco e retorno', 'Desenvolvimento econômico'], atividade: 'Produza uma síntese crítica separando descrição histórica e conclusão do autor.' },
      ]},
    ],
  },
  {
    id: 'atualidades-mercado-financeiro',
    titulo: 'Atualidades e transformação digital bancária',
    autoria: 'Willian Capriata / Capriata Educação',
    nivel: 'Introdutório', paginas: 30, ano: '2025',
    descricao: 'Canais digitais, novos modelos de negócio, meios de pagamento, moedas digitais e mudanças no relacionamento bancário.',
    pdf: 'assets/pdfs/atualidades-mercado-financeiro.pdf',
    aviso: 'Apostila preparatória. Produtos, regulações e cronologias digitais mudam rapidamente; valide-os em fontes oficiais.',
    modulos: [
      { titulo: 'Da automação ao banco digital', aulas: [
        { titulo: 'Linha do tempo da inovação bancária', paginas: [2, 5], objetivo: 'Reconhecer a transformação dos bancos e dos canais de atendimento.', topicos: ['Automação bancária', 'Internet banking', 'Mobile banking', 'Transformação digital'], atividade: 'Associe cada inovação a uma mudança para clientes e instituições.' },
        { titulo: 'Canais tradicionais e digitais', paginas: [5, 8], objetivo: 'Comparar agência, terminal, internet e dispositivos móveis.', topicos: ['Omnicanalidade', 'Conveniência', 'Segurança e disponibilidade'], atividade: 'Compare dois canais usando alcance, custo, risco e experiência.' },
      ]},
      { titulo: 'Novos arranjos financeiros', aulas: [
        { titulo: 'Fintechs, startups, big techs e shadow banking', paginas: [8, 15], objetivo: 'Distinguir novos participantes e modelos de negócio.', topicos: ['Fintechs', 'Big techs', 'Correspondentes', 'Sistema de bancos-sombra'], atividade: 'Crie uma tabela com função, oportunidade e risco de cada participante.' },
        { titulo: 'Open Finance e compartilhamento de dados', paginas: [15, 20], objetivo: 'Entender consentimento, portabilidade e competição baseada em dados.', topicos: ['APIs', 'Consentimento', 'Segurança', 'Personalização'], atividade: 'Descreva o percurso de um dado financeiro e os controles necessários.' },
      ]},
      { titulo: 'Dinheiro e pagamentos digitais', aulas: [
        { titulo: 'PIX, arranjos de pagamento e marketplace', paginas: [20, 25], objetivo: 'Diferenciar infraestrutura, instrumento e modelo comercial.', topicos: ['Pagamento instantâneo', 'Arranjos de pagamento', 'Marketplace'], atividade: 'Mapeie os participantes de uma compra paga por meio digital.' },
        { titulo: 'CBDC, moeda eletrônica e criptoativos', paginas: [6, 10], objetivo: 'Distinguir moeda soberana digital, saldo eletrônico e ativo criptográfico.', topicos: ['CBDC', 'Moeda eletrônica', 'Criptoativos', 'Stablecoins'], atividade: 'Monte um quadro comparativo sobre emissor, unidade de conta e risco.' },
        { titulo: 'Marketing e segmentação digital', paginas: [26, 30], objetivo: 'Examinar como dados permitem segmentar produtos e comunicação.', topicos: ['Segmentação demográfica', 'Socioeconômica', 'Comportamental', 'Mobile'], atividade: 'Proponha uma segmentação responsável sem usar dados excessivos.' },
      ]},
    ],
  },
  {
    id: 'pessoa-fisica-b3',
    titulo: 'O investidor pessoa física na B3',
    autoria: 'B3 - Brasil, Bolsa, Balcão',
    nivel: 'Intermediário', paginas: 53, ano: '1T25',
    descricao: 'Leitura orientada dos dados sobre participação de pessoas físicas nos mercados administrados pela B3.',
    pdf: 'assets/pdfs/pessoa-fisica-b3-1t25.pdf',
    aviso: 'Retrato estatístico do primeiro trimestre de 2025. Não extrapole percentuais para outros períodos sem nova medição.',
    modulos: [
      { titulo: 'Como ler o relatório', aulas: [
        { titulo: 'Escopo, métricas e definições', paginas: [1, 7], objetivo: 'Interpretar corretamente universo, período e indicadores.', topicos: ['ADTV e ADV', 'Contagem de investidores', 'Produtos incluídos', 'Recortes temporais'], atividade: 'Escreva uma nota metodológica com três limites do relatório.' },
      ]},
      { titulo: 'Classes de ativos', aulas: [
        { titulo: 'Renda variável', paginas: [8, 16], objetivo: 'Analisar evolução, atividade e participação de investidores.', topicos: ['Entrada de investidores', 'Volume negociado', 'Posição em custódia'], atividade: 'Escolha um gráfico e formule uma conclusão que ele sustenta e outra que não sustenta.' },
        { titulo: 'Renda fixa e Tesouro Direto', paginas: [17, 33], objetivo: 'Comparar expansão, estoque e comportamento nas duas categorias.', topicos: ['Produtos bancários e corporativos', 'Títulos públicos', 'Fluxos e estoque'], atividade: 'Compare crescimento absoluto e relativo sem confundir investidores com contas.' },
        { titulo: 'Derivativos', paginas: [34, 36], objetivo: 'Identificar participação e atividade de pessoas físicas em derivativos.', topicos: ['Contratos', 'Volume', 'Exposição e alavancagem'], atividade: 'Explique por que volume negociado não equivale ao patrimônio investido.' },
      ]},
      { titulo: 'Perfil e diversificação', aulas: [
        { titulo: 'Gênero e faixa etária', paginas: [37, 47], objetivo: 'Ler recortes demográficos sem transformar associação em causalidade.', topicos: ['Distribuição por gênero', 'Faixa etária', 'Valor em custódia'], atividade: 'Redija duas conclusões descritivas evitando estereótipos.' },
        { titulo: 'Diversificação das carteiras', paginas: [48, 53], objetivo: 'Avaliar quantidade de produtos e concentração dos investidores.', topicos: ['Número de ativos', 'Classes de produtos', 'Concentração'], atividade: 'Liste dados adicionais necessários para avaliar risco real das carteiras.' },
      ]},
    ],
  },
  {
    id: 'analise-empresas-vidal',
    titulo: 'Introdução à análise de empresas',
    autoria: 'Thiago Medeiros Vidal',
    nivel: 'Básico', paginas: 10, ano: '2014',
    descricao: 'Métodos qualitativos e quantitativos para compreender uma empresa antes de estimar seu valor.',
    pdf: 'assets/pdfs/analise-empresas-vidal.pdf',
    aviso: 'Texto acadêmico introdutório. Exemplos e referências refletem o período de elaboração.',
    modulos: [
      { titulo: 'Valor, preço e contexto', aulas: [
        { titulo: 'O problema da avaliação', paginas: [1, 2], objetivo: 'Diferenciar preço observado e estimativa de valor.', topicos: ['Valor justo', 'Preço de mercado', 'Cenário macroeconômico', 'Descrição da companhia'], atividade: 'Escolha uma empresa e separe fatos observáveis de hipóteses de valor.' },
      ]},
      { titulo: 'Análise qualitativa', aulas: [
        { titulo: 'SWOT, Porter e governança', paginas: [2, 5], objetivo: 'Estruturar uma análise de setor, competição e administração.', topicos: ['SWOT', 'Cinco forças de Porter', 'Controladores', 'Matriz de riscos'], atividade: 'Construa uma matriz de riscos e justifique impacto e probabilidade.' },
      ]},
      { titulo: 'Análise quantitativa', aulas: [
        { titulo: 'Demonstrações, ajustes e valuation', paginas: [5, 10], objetivo: 'Conectar contabilidade, geração de caixa e avaliação.', topicos: ['Balanço, DRE e DFC', 'Qualidade contábil', 'Fluxo de caixa descontado', 'Múltiplos'], atividade: 'Crie um roteiro de verificação das demonstrações antes do valuation.' },
      ]},
    ],
  },
  {
    id: 'fundamentos-analise-fundamentalista',
    titulo: 'Fundamentos da análise fundamentalista',
    autoria: 'Equipe de Análise Técnica e Derivativos da Ágora',
    nivel: 'Básico', paginas: 48, ano: '2018',
    descricao: 'Da leitura das demonstrações financeiras aos indicadores, múltiplos e modelos de valor justo.',
    pdf: 'assets/pdfs/analise-fundamentalista.pdf',
    aviso: 'Material educacional de 2018. Regras societárias e referências normativas precisam de verificação atual.',
    modulos: [
      { titulo: 'Fundamentos e retorno', aulas: [
        { titulo: 'O que é análise fundamentalista', paginas: [3, 4], objetivo: 'Entender finalidade, fontes e premissas da análise.', topicos: ['Conjuntura macroeconômica', 'Análise setorial', 'Projeções', 'Valor justo'], atividade: 'Explique por que valor justo não é uma cotação garantida.' },
        { titulo: 'Valorização, dividendos e estrutura acionária', paginas: [5, 12], objetivo: 'Identificar componentes de retorno e direitos associados às ações.', topicos: ['Dividendos e payout', 'Retorno total', 'Capital social', 'Tipos de ação'], atividade: 'Calcule um retorno total hipotético incluindo proventos.' },
      ]},
      { titulo: 'Contabilidade e caixa', aulas: [
        { titulo: 'Noções de contabilidade', paginas: [13, 19], objetivo: 'Reconhecer as principais demonstrações e relações contábeis.', topicos: ['Balanço patrimonial', 'DRE', 'Ativo, passivo e patrimônio líquido'], atividade: 'Classifique dez contas entre ativo, passivo, patrimônio, receita e despesa.' },
        { titulo: 'Análise e projeção de balanços', paginas: [20, 32], objetivo: 'Interpretar históricos e explicitar premissas de projeção.', topicos: ['Análise vertical e horizontal', 'Margens', 'Crescimento', 'Premissas operacionais'], atividade: 'Projete um cenário simples e registre todas as premissas.' },
        { titulo: 'A geração de caixa', paginas: [33, 36], objetivo: 'Distinguir lucro contábil e caixa gerado.', topicos: ['Fluxo de caixa', 'Capital de giro', 'Investimentos', 'Financiamento'], atividade: 'Liste razões pelas quais lucro e caixa podem divergir.' },
      ]},
      { titulo: 'Indicadores e avaliação', aulas: [
        { titulo: 'Indicadores por ação', paginas: [37, 38], objetivo: 'Calcular e interpretar LPA, VPA e geração de caixa por ação.', topicos: ['LPA', 'VPA', 'CFS'], atividade: 'Calcule os três indicadores com dados hipotéticos e declare suas unidades.' },
        { titulo: 'Enterprise Value e valor justo', paginas: [39, 43], objetivo: 'Entender valor da firma e o raciocínio de valuation.', topicos: ['Valor de mercado', 'Dívida líquida', 'Enterprise Value', 'Fluxo descontado'], atividade: 'Reconcilie valor da firma e valor do patrimônio em um exemplo.' },
        { titulo: 'Múltiplos de mercado', paginas: [44, 48], objetivo: 'Usar múltiplos como instrumentos comparativos, não como respostas isoladas.', topicos: ['P/L', 'P/VPA', 'P/CFS', 'EV/EBITDA'], atividade: 'Compare duas empresas do mesmo setor e explique as limitações.' },
      ]},
    ],
  },
  {
    id: 'value-investing-ibrx100',
    titulo: 'Value investing e evidência empírica',
    autoria: 'Bruno Estevam de Almeida e Émerson Nogueira Sales',
    nivel: 'Avançado', paginas: 20, ano: '2020',
    descricao: 'Estudo sobre indicadores fundamentalistas e retornos das ações do IBrX 100 entre 2009 e 2018.',
    pdf: 'assets/pdfs/value-investing-ibrx100.pdf',
    aviso: 'Resultados pertencem à amostra e ao método do artigo; associação estatística não garante retorno futuro.',
    modulos: [
      { titulo: 'Problema de pesquisa', aulas: [
        { titulo: 'Mercados eficientes e value investing', paginas: [1, 4], objetivo: 'Contrastar eficiência de mercado e seleção fundamentalista.', topicos: ['Hipóteses fraca, semiforte e forte', 'Prêmio de valor', 'Investidor defensivo e empreendedor'], atividade: 'Formule uma hipótese testável sem pressupor o resultado.' },
      ]},
      { titulo: 'Indicadores e método', aulas: [
        { titulo: 'Critérios de Graham e literatura', paginas: [4, 8], objetivo: 'Identificar filtros de valor e evidências anteriores.', topicos: ['Tamanho e liquidez', 'Endividamento', 'Estabilidade de lucros', 'Múltiplos'], atividade: 'Explique quais critérios dependem do contexto histórico.' },
        { titulo: 'Amostra e análise estatística', paginas: [8, 13], objetivo: 'Examinar seleção da amostra, variáveis e técnicas aplicadas.', topicos: ['IBrX 100', '36 variáveis', 'Análise fatorial', 'Regressão'], atividade: 'Liste riscos de viés de seleção, sobrevivência e especificação.' },
      ]},
      { titulo: 'Resultados e limites', aulas: [
        { titulo: 'Interpretação dos achados', paginas: [13, 20], objetivo: 'Distinguir significância estatística, explicação e previsão.', topicos: ['Fatores identificados', 'Retorno das ações', 'Limitações', 'Pesquisas futuras'], atividade: 'Produza uma conclusão que respeite período, amostra e incerteza.' },
      ]},
    ],
  },
  {
    id: 'fundamentalista-neoenergia',
    titulo: 'Análise fundamentalista aplicada: Neoenergia',
    autoria: 'Matheus de Brito Rosselli',
    nivel: 'Intermediário', paginas: 31, ano: '2023',
    descricao: 'Conceitos de análise fundamentalista aplicados a um estudo de caso com dados da Neoenergia.',
    pdf: 'assets/pdfs/analise-fundamentalista-neoenergia.pdf',
    aviso: 'O estudo de caso usa informações de um período específico e não constitui recomendação de investimento.',
    modulos: [
      { titulo: 'Base conceitual e método', aulas: [
        { titulo: 'Referencial e desenho do estudo', paginas: [9, 14], objetivo: 'Reconhecer objetivo, método e limites do estudo de caso.', topicos: ['Análise fundamentalista', 'Valor justo', 'Metodologia', 'Fontes'], atividade: 'Avalie se o método responde ao objetivo declarado.' },
      ]},
      { titulo: 'Indicadores econômico-financeiros', aulas: [
        { titulo: 'Liquidez, endividamento e rentabilidade', paginas: [14, 19], objetivo: 'Calcular e interpretar indicadores contábeis.', topicos: ['Liquidez corrente e seca', 'Endividamento', 'ROE', 'ROA', 'EBITDA'], atividade: 'Recalcule dois índices e confira numerador, denominador e período.' },
        { titulo: 'Indicadores de mercado', paginas: [18, 19], objetivo: 'Relacionar preço, lucro, patrimônio e dividendos.', topicos: ['P/L', 'P/VPA', 'LPA', 'Dividendos e payout'], atividade: 'Explique por que um múltiplo isolado não encerra a análise.' },
      ]},
      { titulo: 'Aplicação à Neoenergia', aulas: [
        { titulo: 'Empresa, resultados e demonstrações', paginas: [20, 22], objetivo: 'Contextualizar o negócio e os dados usados no caso.', topicos: ['Segmentos', 'Balanço energético', 'Fluxo de caixa'], atividade: 'Separe dados operacionais, financeiros e hipóteses.' },
        { titulo: 'Cálculos e conclusão crítica', paginas: [23, 28], objetivo: 'Examinar resultados sem transformar limiares em regras universais.', topicos: ['Cálculo dos indicadores', 'Comparação', 'Risco', 'Conclusão'], atividade: 'Reescreva a conclusão incluindo limitações e dados posteriores necessários.' },
      ]},
    ],
  },
  {
    id: 'mercados-financeiros-ufba',
    titulo: 'Mercados financeiros e Sistema Financeiro Nacional',
    autoria: 'Ronaldo Pesente / UFBA',
    nivel: 'Formação completa', paginas: 119, ano: '2019',
    descricao: 'Curso abrangente sobre intermediação, estrutura institucional, produtos financeiros, mercado de capitais e derivativos.',
    pdf: 'assets/pdfs/mercados-financeiros-ufba.pdf',
    aviso: 'Obra de 2019. Estruturas institucionais, tributação, limites e características de produtos podem ter mudado.',
    modulos: [
      { titulo: 'Funcionamento do mercado financeiro', aulas: [
        { titulo: 'Poupança, investimento e intermediação', paginas: [14, 24], objetivo: 'Entender o fluxo de recursos e a função dos intermediários.', topicos: ['Agentes superavitários e deficitários', 'Financiamento direto e indireto', 'Assimetria de informação'], atividade: 'Compare financiamento direto e indireto em dois exemplos.' },
        { titulo: 'Segmentos do mercado', paginas: [25, 32], objetivo: 'Distinguir mercados monetário, crédito, capitais e câmbio.', topicos: ['Prazo', 'Instrumentos', 'Participantes', 'Finalidade'], atividade: 'Classifique oito operações por segmento e justifique.' },
      ]},
      { titulo: 'Sistema Financeiro Nacional', aulas: [
        { titulo: 'Órgãos normativos e supervisores', paginas: [34, 43], objetivo: 'Mapear papéis de formulação, regulação e fiscalização.', topicos: ['CMN', 'BCB', 'CVM', 'SUSEP', 'PREVIC'], atividade: 'Monte um organograma funcional atualizado em fontes oficiais.' },
        { titulo: 'Instituições financeiras', paginas: [44, 54], objetivo: 'Diferenciar instituições captadoras, de crédito e auxiliares.', topicos: ['Bancos', 'Cooperativas', 'Financeiras', 'BNDES', 'Consórcios'], atividade: 'Associe cada instituição às suas principais operações.' },
      ]},
      { titulo: 'Produtos financeiros', aulas: [
        { titulo: 'Captação e crédito', paginas: [56, 69], objetivo: 'Identificar características de títulos e operações de financiamento.', topicos: ['Depósitos', 'CDB e debêntures', 'Títulos públicos', 'Crédito e leasing'], atividade: 'Compare liquidez, emissor, risco e remuneração de quatro produtos.' },
        { titulo: 'Fundos e previdência', paginas: [70, 77], objetivo: 'Entender estrutura de fundos e produtos previdenciários.', topicos: ['Fundos abertos e fechados', 'Classes de fundos', 'PGBL', 'VGBL'], atividade: 'Crie uma lista de perguntas para verificar custos, tributação e adequação.' },
      ]},
      { titulo: 'Capitais e derivativos', aulas: [
        { titulo: 'Ações, ofertas e negociação', paginas: [80, 93], objetivo: 'Compreender emissão, mercado secundário e infraestrutura.', topicos: ['Ações', 'Underwriting', 'Bolsa e balcão', 'Índices', 'BDRs'], atividade: 'Descreva o caminho de uma ação da emissão à negociação.' },
        { titulo: 'Derivativos e suas finalidades', paginas: [94, 100], objetivo: 'Distinguir termo, futuro, opções e swaps.', topicos: ['Hedge', 'Especulação', 'Arbitragem', 'Alavancagem'], atividade: 'Crie um exemplo de proteção e explicite o risco que permanece.' },
        { titulo: 'Vocabulário e revisão crítica', paginas: [101, 115], objetivo: 'Consolidar termos e identificar definições que exigem atualização.', topicos: ['Glossário financeiro', 'Indicadores econômicos', 'Termos de mercado'], atividade: 'Selecione dez verbetes e confronte-os com fontes oficiais atuais.' },
      ]},
    ],
  },
  {
    id: 'economia-financas-cpa10',
    titulo: 'Economia e finanças para CPA-10',
    autoria: 'ANBIMA - Material de Estudos CPA-10',
    nivel: 'Básico', paginas: 49, ano: '2023',
    descricao: 'Conceitos econômicos, juros, matemática financeira, risco, retorno e diversificação.',
    pdf: 'assets/pdfs/economia-financas-cpa10.pdf',
    aviso: 'Material de certificação publicado em 2023. Consulte o programa e a versão vigentes da ANBIMA antes de estudar para prova.',
    modulos: [
      { titulo: 'Indicadores econômicos', aulas: [
        { titulo: 'PIB, inflação e câmbio', paginas: [6, 12], objetivo: 'Definir indicadores e interpretar seus efeitos econômicos.', topicos: ['PIB', 'IPCA e IGP-M', 'Câmbio spot e PTAX'], atividade: 'Explique como cada indicador pode afetar uma empresa importadora.' },
        { titulo: 'Selic, DI, TR e Copom', paginas: [10, 14], objetivo: 'Distinguir taxas e compreender a decisão de política monetária.', topicos: ['Selic meta e over', 'Taxa DI', 'TR', 'Copom'], atividade: 'Monte um mapa relacionando decisão, taxa e efeito esperado.' },
      ]},
      { titulo: 'Matemática financeira', aulas: [
        { titulo: 'Juros nominais, reais e capitalização', paginas: [15, 25], objetivo: 'Calcular juros e separar retorno nominal de poder de compra.', topicos: ['Juros simples e compostos', 'Taxa nominal e real', 'Taxas equivalentes'], atividade: 'Resolva um exemplo de retorno real e outro de taxa equivalente.' },
        { titulo: 'Valor presente e fluxo de caixa', paginas: [25, 31], objetivo: 'Aplicar equivalência financeira a pagamentos no tempo.', topicos: ['Valor presente e futuro', 'Desconto', 'Fluxo de caixa'], atividade: 'Compare duas alternativas de pagamento numa mesma data focal.' },
      ]},
      { titulo: 'Risco e retorno', aulas: [
        { titulo: 'Benchmark, volatilidade e diversificação', paginas: [31, 37], objetivo: 'Relacionar medidas de desempenho e risco.', topicos: ['Benchmark', 'Retorno esperado', 'Volatilidade', 'Correlação e diversificação'], atividade: 'Explique por que diversificação reduz risco específico, mas não todo risco.' },
        { titulo: 'Glossário e revisão', paginas: [38, 49], objetivo: 'Consolidar os conceitos centrais do capítulo.', topicos: ['Produtos', 'Instituições', 'Política econômica', 'Risco'], atividade: 'Crie vinte cartões de revisão e confira termos na versão atual da ANBIMA.' },
      ]},
    ],
  },
];

export const obterCurso = id => cursos.find(curso => curso.id === id);
