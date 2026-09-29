// Cursos documentais de macroeconomia, curvas, derivativos, risco e métodos quantitativos.
const aula = (titulo, paginas, objetivo, topicos, atividade) => ({ titulo, paginas, objetivo, topicos, atividade });
const modulo = (titulo, aulas) => ({ titulo, aulas });

export const cursosAvancados = [
  {
    id: 'metodos-quantitativos-financas', titulo: 'Métodos quantitativos em finanças', nivel: 'Avançado', paginas: 14, ano: '2024',
    autoria: 'Autores do estudo bibliométrico', origem: 'Revista Observatorio de la Economía Latinoamericana, v. 22, n. 5', instituicao: 'Periódico científico',
    descricao: 'Panorama bibliométrico das técnicas estatísticas usadas em pesquisas de finanças entre 2021 e 2023.', pdf: 'assets/pdfs/10-metodos-quantitativos-em-financas.pdf',
    aviso: 'O levantamento descreve frequência de métodos em 66 artigos; frequência de uso não comprova adequação a qualquer problema.',
    modulos: [
      modulo('Desenho e levantamento', [aula('Pesquisa bibliométrica em finanças', [1, 6], 'Entender universo, seleção e classificação dos artigos.', ['Bibliometria', 'Amostra de artigos', 'Estatística descritiva'], 'Reconstrua os critérios de inclusão e identifique possíveis vieses.')]),
      modulo('Técnicas recorrentes', [aula('Regressão e dados em painel', [7, 14], 'Distinguir os métodos mais encontrados e suas finalidades.', ['Regressão linear', 'Dados em painel', 'Testes estatísticos'], 'Associe cada método a uma pergunta de pesquisa e às premissas necessárias.')]),
    ],
  },
  {
    id: 'sustentabilidade-divida-publica', titulo: 'Sustentabilidade da dívida pública', nivel: 'Avançado', paginas: 19, ano: '2009',
    autoria: 'Carlos Eugênio Ellery Lustosa da Costa', origem: 'Dívida Pública: a experiência brasileira - capítulo 3', instituicao: 'Tesouro Nacional',
    descricao: 'Restrição orçamentária intertemporal, solvência fiscal e critérios práticos de sustentabilidade.', pdf: 'assets/pdfs/11-sustentabilidade-divida-publica.pdf',
    aviso: 'Capítulo conceitual; exemplos institucionais e números devem ser lidos no contexto de publicação.',
    modulos: [
      modulo('Fundamentos fiscais', [aula('Restrição orçamentária do governo', [1, 7], 'Relacionar dívida, juros, déficit e condição de transversalidade.', ['Resultado primário', 'Restrição intertemporal', 'Condição de transversalidade'], 'Derive a dinâmica da dívida e explique cada variável.')]),
      modulo('Avaliação de sustentabilidade', [aula('Solvência, expectativas e testes', [8, 19], 'Avaliar critérios teóricos e empíricos sem confundir identidade e causalidade.', ['Dívida/PIB', 'Taxa de juros real', 'Crescimento', 'Credibilidade fiscal'], 'Compare dois cenários para a trajetória dívida/PIB.')]),
    ],
  },
  {
    id: 'regras-fiscais-divida-brasil', titulo: 'Regras fiscais e sustentabilidade da dívida no Brasil', nivel: 'Avançado', paginas: 25, ano: '2003',
    autoria: 'Ilan Goldfajn e Eduardo Refinetti Guardia', origem: 'Notas Técnicas do Banco Central do Brasil, nº 39', instituicao: 'Banco Central do Brasil',
    descricao: 'Análise das regras fiscais e das condições para estabilização da dívida pública brasileira.', pdf: 'assets/pdfs/12-regras-fiscais-sustentabilidade-divida-brasil.pdf',
    aviso: 'A codificação interna deste PDF prejudica a extração automática de texto; consulte visualmente tabelas e fórmulas.',
    modulos: [
      modulo('Regras e instituições', [aula('Disciplina e credibilidade fiscal', [1, 12], 'Examinar objetivos, desenho e limites de regras fiscais.', ['Regra fiscal', 'Resultado primário', 'Credibilidade', 'Ciclicidade'], 'Compare regras por transparência, flexibilidade e capacidade de correção.')]),
      modulo('Dinâmica da dívida', [aula('Cenários para a dívida brasileira', [13, 25], 'Relacionar juros, crescimento, câmbio e resultado fiscal.', ['Dívida líquida', 'Juros reais', 'Crescimento do PIB', 'Choques cambiais'], 'Monte uma análise de sensibilidade da dívida/PIB.')]),
    ],
  },
  {
    id: 'derivativos-valor-empresas', titulo: 'Derivativos e valor das empresas', nivel: 'Avançado', paginas: 20, ano: '2020',
    autoria: 'Lais Neves Borgheti, Rogiene Batista dos Santos e Fabiano Guasti Lima', origem: 'Congresso USP de Iniciação Científica em Contabilidade', instituicao: 'USP/FIPECAFI',
    descricao: 'Estudo empírico do impacto do uso de derivativos sobre o valor de companhias brasileiras não financeiras.', pdf: 'assets/pdfs/13-derivativos-valor-das-empresas.pdf',
    aviso: 'Os achados dependem da amostra, do período e da especificação econométrica; não estabelecem causalidade automaticamente.',
    modulos: [
      modulo('Hedge corporativo', [aula('Risco de mercado e criação de valor', [1, 8], 'Entender por que empresas usam derivativos e como isso pode afetar valor.', ['Hedge', 'Risco cambial', 'Custos de dificuldades financeiras'], 'Desenhe os canais pelos quais o hedge pode criar ou destruir valor.')]),
      modulo('Evidência empírica', [aula('Modelo, resultados e limitações', [9, 20], 'Ler variáveis, regressões e conclusões com cautela.', ['Dados em painel', 'Valor da firma', 'Variáveis de controle'], 'Separe associação, explicação teórica e evidência causal.')]),
    ],
  },
  {
    id: 'derivativos-conceitos-contabilizacao', titulo: 'Derivativos: conceitos e contabilização', nivel: 'Intermediário', paginas: 12, ano: '2011',
    autoria: 'Sandra Ludvig Bones, Margarete Luisa Arbugeri Menegotto e Marcia Rohr da Cruz', origem: 'Artigo acadêmico',
    descricao: 'História, tipos, contabilização e evidenciação de instrumentos derivativos.', pdf: 'assets/pdfs/14-derivativos-conceitos-contabilizacao.pdf',
    aviso: 'Normas contábeis mudam; confirme CPCs e IFRS vigentes antes de aplicar procedimentos.',
    modulos: [
      modulo('Instrumentos', [aula('Termo, futuro, opções e swap', [1, 6], 'Distinguir contratos, direitos, obrigações e liquidação.', ['Ativo subjacente', 'Contrato a termo', 'Futuro', 'Opção', 'Swap'], 'Monte um quadro de payoff e obrigação de cada instrumento.')]),
      modulo('Contabilidade', [aula('Reconhecimento e evidenciação', [7, 12], 'Entender valor justo, registro e divulgação.', ['Valor justo', 'Hedge accounting', 'Notas explicativas'], 'Identifique quais informações permitem avaliar exposição e resultado.')]),
    ],
  },
  {
    id: 'juros-acoes-brasil', titulo: 'Juros e mercado de ações brasileiro (2014-2024)', nivel: 'Intermediário', paginas: 37, ano: '2024',
    autoria: 'Gabriela Viana Quaresma', faculdade: 'Universidade São Judas Tadeu', curso: 'Ciências Econômicas', origem: 'Trabalho de conclusão de curso',
    descricao: 'Investigação da relação entre taxa Selic e Ibovespa ao longo de dez anos.', pdf: 'assets/pdfs/15-juros-mercado-acoes-brasil-2014-2024.pdf',
    aviso: 'Relação inversa é hipótese econômica, não regra mecânica; período, defasagens e variáveis omitidas importam.',
    modulos: [
      modulo('Mecanismos econômicos', [aula('Selic, desconto e atividade', [5, 18], 'Explicar canais entre juros, consumo, investimento e preços das ações.', ['Selic', 'Custo de capital', 'Taxa de desconto', 'Ibovespa'], 'Construa um diagrama causal incluindo canais concorrentes.')]),
      modulo('Análise do período', [aula('Dados de 2014 a 2024', [19, 37], 'Avaliar episódios e evidências sem confundir correlação com causalidade.', ['Série temporal', 'Correlação', 'Choques macroeconômicos'], 'Compare subperíodos e registre possíveis variáveis de confusão.')]),
    ],
  },
  {
    id: 'mercado-futuro-taxas-juros', titulo: 'Mercado futuro de taxas de juros', nivel: 'Intermediário', paginas: 2, ano: 'Histórico',
    autoria: 'Fonte histórica digitalizada', origem: 'Artigo sobre a Bolsa Brasileira de Futuros',
    descricao: 'Registro histórico da formação e do funcionamento inicial do mercado futuro de juros no Brasil.', pdf: 'assets/pdfs/16-mercado-futuro-taxas-juros.pdf',
    aviso: 'Digitalização com OCR muito degradado. Use como fonte histórica e confira trechos diretamente nas páginas.',
    modulos: [
      modulo('Contexto histórico', [aula('Origem do futuro de juros', [1, 1], 'Reconhecer o contexto monetário que motivou o contrato.', ['Bolsa de futuros', 'Taxa de juros', 'Hedge'], 'Registre apenas afirmações legíveis e marque lacunas do OCR.')]),
      modulo('Funcionamento', [aula('Negociação e liquidação', [2, 2], 'Identificar noções de posição, preço e liquidação.', ['Contrato futuro', 'Posição', 'Liquidação'], 'Compare a descrição histórica com a especificação atual de um contrato DI.')]),
    ],
  },
  {
    id: 'regimes-inflacionarios-ciclos', titulo: 'Regimes inflacionários e ciclos econômicos', nivel: 'Avançado', paginas: 19, ano: '2018',
    autoria: 'Luckas Sabioni Lopes e Thiago Costa Soares', origem: 'Revista Brasileira de Economia, v. 72, n. 4', instituicao: 'FGV EPGE',
    descricao: 'Experiência brasileira pós-Plano Real modelada por regimes e cadeias de Markov.', pdf: 'assets/pdfs/17-regimes-inflacionarios-ciclos-economicos.pdf',
    aviso: 'Resultados dependem da identificação econométrica dos regimes e das séries usadas.',
    modulos: [
      modulo('Inflação e expectativas', [aula('Metas, incerteza e ciclos', [1, 8], 'Relacionar formação de expectativas e mudanças de regime.', ['Metas de inflação', 'Incerteza', 'Hiato do produto'], 'Identifique mecanismos de transição entre regimes.')]),
      modulo('Modelos de regime', [aula('Cadeias de Markov e resultados', [9, 19], 'Interpretar probabilidades de transição e persistência.', ['Markov switching', 'Probabilidade de transição', 'Regime latente'], 'Explique por que um regime estimado não é diretamente observável.')]),
    ],
  },
  {
    id: 'leitura-curvas-expectativas', titulo: 'Leitura das curvas de juros e expectativas', nivel: 'Intermediário', paginas: 4, ano: '2017',
    autoria: 'Estêvão Kopschitz Xavier Bastos', origem: 'Carta de Conjuntura nº 35 - Boletim de Expectativas', instituicao: 'Ipea / Dimac',
    descricao: 'Leitura aplicada das curvas nominal, real e de inflação implícita em um episódio econômico.', pdf: 'assets/pdfs/18-leitura-curvas-juros-expectativas.pdf',
    aviso: 'Análise conjuntural de 2017; use para aprender o método, não como retrato atual.',
    modulos: [
      modulo('Componentes da curva', [aula('Juros nominais, reais e inflação implícita', [1, 2], 'Decompor informações embutidas nas curvas.', ['ETTJ', 'Juro real', 'Inflação implícita', 'Prêmio de risco'], 'Explique por que inflação implícita não é previsão pura.')]),
      modulo('Choques e deslocamentos', [aula('Interpretação de mudanças da curva', [2, 4], 'Distinguir inclinação, nível, horizonte e choque político.', ['Deslocamento paralelo', 'Inclinação', 'Taxa neutra'], 'Compare as curvas por vértice e formule hipóteses alternativas.')]),
    ],
  },
  {
    id: 'estrategias-investimento-iniciantes', titulo: 'Estratégias de renda fixa e ações de commodities', nivel: 'Básico', paginas: 16, ano: '2025',
    autoria: 'Hugo Vinicius Carvalho Rocha, Jesus Anderson de Arruda Oliveira e Valdério Gadi dos Reis', faculdade: 'Centro Paula Souza - Etec de Cubatão', curso: 'Ensino Técnico em Contabilidade', origem: 'Trabalho acadêmico',
    descricao: 'Alternativas de investimento e diversificação para investidores iniciantes no primeiro semestre de 2025.', pdf: 'assets/pdfs/19-estrategias-renda-fixa-acoes-commodities.pdf',
    aviso: 'Recomendações refletem o cenário do primeiro semestre de 2025 e não substituem análise de adequação ao investidor.',
    modulos: [
      modulo('Produtos e cenário', [aula('Renda fixa e commodities', [1, 9], 'Comparar liquidez, risco e sensibilidade ao cenário.', ['Selic', 'Títulos de renda fixa', 'Ações de commodities'], 'Monte uma matriz de risco, prazo e liquidez.')]),
      modulo('Construção de carteira', [aula('Diversificação para iniciantes', [10, 16], 'Organizar objetivos e limites antes de alocar.', ['Carteira', 'Diversificação', 'Perfil de risco'], 'Crie três carteiras hipotéticas e justifique diferenças.')]),
    ],
  },
  {
    id: 'microestrutura-informacao-privada', titulo: 'Microestrutura e informação privada', nivel: 'Especialização', paginas: 86, ano: '2003',
    autoria: 'Pedro Miguel Bento Pereira da Silva', faculdade: 'Universidade Técnica de Lisboa', instituto: 'Instituto Superior de Economia e Gestão', curso: 'Mestrado em Economia Monetária e Financeira', origem: 'Dissertação de mestrado',
    descricao: 'Formação de preços sob informação assimétrica, expectativas racionais e modelos de microestrutura.', pdf: 'assets/pdfs/20-microestrutura-informacao-privada.pdf',
    aviso: 'Síntese teórica avançada; os modelos dependem de hipóteses fortes sobre informação, agentes e equilíbrio.',
    modulos: [
      modulo('Informação e preços', [aula('Aquisição e agregação de informação', [9, 37], 'Entender quando preços revelam informação privada.', ['Expectativas racionais', 'Informação assimétrica', 'Noise traders'], 'Compare equilíbrio com revelação total e parcial.')]),
      modulo('Microestrutura', [aula('Dealers, inventário e seleção adversa', [38, 70], 'Explicar spread e formação de preços em modelos de negociação.', ['Market maker', 'Bid-ask spread', 'Risco de inventário', 'Seleção adversa'], 'Decomponha o spread em custos e risco informacional.')]),
      modulo('Eficiência informacional', [aula('Implicações e limites dos modelos', [71, 86], 'Avaliar eficiência, liquidez e papel da informação.', ['Eficiência informacional', 'Liquidez', 'Descoberta de preço'], 'Liste previsões testáveis e hipóteses não observáveis.')]),
    ],
  },
  {
    id: 'politica-fiscal-divida-liquidez', titulo: 'Política fiscal, dívida e liquidez dos títulos', nivel: 'Avançado', paginas: 29, ano: '2008',
    autoria: 'Fernando Motta Correia e Roberto Meurer', origem: 'Estudos Econômicos, v. 38, n. 3', instituicao: 'Universidade de São Paulo',
    descricao: 'Relação entre esforço fiscal, sustentabilidade da dívida e liquidez dos títulos públicos brasileiros.', pdf: 'assets/pdfs/21-politica-fiscal-divida-liquidez-titulos.pdf',
    aviso: 'Cenários e parâmetros refletem o período estudado; o mecanismo analítico permanece útil.',
    modulos: [
      modulo('Dívida e esforço fiscal', [aula('Superávit e dinâmica da dívida', [1, 12], 'Relacionar resultado primário e estabilização da dívida.', ['Superávit primário', 'Dívida/PIB', 'Meta de inflação'], 'Reproduza qualitativamente os cenários do modelo.')]),
      modulo('Mercado de títulos', [aula('Liquidez, prazo e custo fiscal', [13, 29], 'Entender como demanda e liquidez afetam financiamento público.', ['Liquidez', 'Alongamento', 'Prêmio de risco', 'Benchmark de emissão'], 'Explique o canal entre liquidez do título e custo da dívida.')]),
    ],
  },
  {
    id: 'cambio-derivativos-cambiais', titulo: 'Mercado de câmbio e derivativos cambiais', nivel: 'Intermediário', paginas: 7, ano: '2019',
    autoria: 'Banco Central do Brasil', origem: 'Estudo Especial nº 41/2019', instituicao: 'Banco Central do Brasil',
    descricao: 'Estrutura, liquidez e desenvolvimento dos mercados de câmbio à vista e de derivativos no Brasil.', pdf: 'assets/pdfs/22-mercado-cambio-derivativos-cambiais.pdf',
    aviso: 'Estatísticas se referem ao período encerrado em 2018.',
    modulos: [
      modulo('Mercado à vista', [aula('Participantes, fluxos e liquidez', [1, 4], 'Compreender segmentos e indicadores do mercado cambial.', ['Mercado primário', 'Interbancário', 'Spread cambial', 'Conversibilidade'], 'Mapeie participantes e fluxos de uma operação cambial.')]),
      modulo('Derivativos cambiais', [aula('Futuros e formação da taxa', [4, 7], 'Relacionar mercado futuro, hedge e preço à vista.', ['Dólar futuro', 'Cupom cambial', 'Hedge', 'Arbitragem'], 'Descreva como os mercados podem transmitir informação entre si.')]),
    ],
  },
  {
    id: 'opcoes-capital-ficticio', titulo: 'Opções de ações e capital fictício', nivel: 'Avançado', paginas: 14, ano: '2024',
    autoria: 'Gabriela Fioretti e Rosa Maria Marques', faculdade: 'PUC-SP', instituto: 'Programa de Pós-Graduação em Economia Política', origem: 'Artigo acadêmico',
    descricao: 'Leitura do mercado brasileiro de opções de ações sob a perspectiva do capital fictício.', pdf: 'assets/pdfs/23-opcoes-acoes-capital-ficticio.pdf',
    aviso: 'A interpretação segue uma abordagem teórica específica; confronte-a com outras teorias de derivativos.',
    modulos: [
      modulo('Base teórica', [aula('Capital a juros e capital fictício', [1, 7], 'Compreender os conceitos usados para interpretar ativos e derivativos.', ['Capital fictício', 'Capital acionário', 'Financeirização'], 'Diferencie a categoria teórica do funcionamento contratual da opção.')]),
      modulo('Mercado brasileiro de opções', [aula('Evolução, concentração e negociação', [8, 14], 'Analisar dados e características do mercado de opções.', ['Opções de ações', 'Contratos negociados', 'Concentração'], 'Separe achados empíricos e interpretação teórica.')]),
    ],
  },
  {
    id: 'inovacoes-financeiras-juros', titulo: 'Inovações financeiras, juros e mercado de capitais', nivel: 'Intermediário', paginas: 46, ano: '2022',
    autoria: 'João Pedro Gouvêa Freitas de Carvalho', faculdade: 'Universidade Federal de Uberlândia', instituto: 'Instituto de Economia e Relações Internacionais', curso: 'Ciências Econômicas', origem: 'Monografia de graduação',
    descricao: 'Efeitos de inflação, juros e indexação sobre ações, fundos imobiliários e renda fixa.', pdf: 'assets/pdfs/24-inovacoes-financeiras-juros-mercado-capitais.pdf',
    aviso: 'Análise qualitativa e histórica; rentabilidades citadas não são projeções.',
    modulos: [
      modulo('História e comportamento', [aula('Mercados, portfólios e vieses', [8, 20], 'Relacionar desenvolvimento do mercado e decisões dos investidores.', ['Gestão de portfólio', 'Finanças comportamentais', 'Indexação'], 'Identifique como vieses podem alterar alocação em ambientes inflacionários.')]),
      modulo('Juros e classes de ativos', [aula('Ações, FIIs e renda fixa', [21, 46], 'Comparar sensibilidade das classes a juros e inflação.', ['Pós-fixação', 'Fundos imobiliários', 'Renda fixa', 'Mercado acionário'], 'Construa cenários sem assumir reação uniforme de todos os ativos.')]),
    ],
  },
  {
    id: 'evidenciacao-derivativos', titulo: 'Evidenciação de derivativos pelas companhias', nivel: 'Avançado', paginas: 20, ano: '2017',
    autoria: 'Lucas Rafael da Cunha e Silva e Thaiseany de Freitas Rêgo', faculdade: 'Universidade Federal Rural do Semi-Árido', curso: 'Ciências Contábeis', origem: 'Trabalho de conclusão de curso',
    descricao: 'Avaliação do grau de divulgação das operações com derivativos por companhias do Ibovespa.', pdf: 'assets/pdfs/25-evidenciacao-derivativos-companhias.pdf',
    aviso: 'Critérios contábeis e amostra pertencem ao período do estudo; confira pronunciamentos vigentes.',
    modulos: [
      modulo('Divulgação financeira', [aula('Evidenciação obrigatória e voluntária', [1, 6], 'Entender materialidade, transparência e utilidade da informação.', ['Disclosure', 'Materialidade', 'Notas explicativas'], 'Crie um checklist mínimo de divulgação de riscos.')]),
      modulo('Derivativos nas companhias', [aula('Classificação, mensuração e resultados', [7, 20], 'Examinar tipos de derivativos e qualidade das divulgações.', ['Termo', 'Futuro', 'Opções', 'Swap', 'Valor justo'], 'Avalie se uma nota permite reconstruir exposição e resultado.')]),
    ],
  },
  {
    id: 'testes-regressao-multipla', titulo: 'Testes estatísticos em regressão múltipla', nivel: 'Avançado', paginas: 20, ano: '2003',
    autoria: 'Carlos Aurélio Nadal, Katia Aparecida Juliano e Eduardo Ratton', faculdade: 'Universidade Federal do Paraná', origem: 'Boletim de Ciências Geodésicas, v. 9, n. 2',
    descricao: 'Validação de regressões múltiplas por meio de um estudo aplicado à avaliação de imóveis urbanos.', pdf: 'assets/pdfs/26-testes-estatisticos-regressao-multipla.pdf',
    aviso: 'A aplicação é imobiliária, mas os diagnósticos estatísticos são transferíveis a pesquisas financeiras.',
    modulos: [
      modulo('Modelo linear', [aula('Variáveis, mínimos quadrados e ajuste', [1, 9], 'Compreender construção e estimação da regressão múltipla.', ['MQO', 'Variável dependente', 'Variáveis explicativas', 'R²'], 'Especifique um modelo financeiro e justifique as variáveis.')]),
      modulo('Diagnóstico', [aula('Premissas e testes estatísticos', [10, 20], 'Avaliar resíduos e validade das inferências.', ['Normalidade', 'Heterocedasticidade', 'Autocorrelação', 'Multicolinearidade'], 'Monte uma sequência de diagnóstico e ações corretivas.')]),
    ],
  },
  {
    id: 'manual-curvas-b3', titulo: 'Manual de curvas da B3', nivel: 'Especialização', paginas: 62, ano: '2023',
    autoria: 'B3 - Brasil, Bolsa, Balcão', origem: 'Manual técnico de informação pública', instituicao: 'B3',
    descricao: 'Metodologias de construção, interpolação e divulgação de curvas locais, internacionais, spreads e índices.', pdf: 'assets/pdfs/27-manual-curvas-b3.pdf',
    aviso: 'Manual técnico de 11-12-2023; consulte a edição vigente antes de uso operacional.',
    modulos: [
      modulo('Estruturas matemáticas', [aula('Vértices, valores e interpolação', [4, 12], 'Entender os elementos comuns às curvas publicadas.', ['Vértice', 'Taxa zero', 'Fator de desconto', 'Interpolação'], 'Implemente conceitualmente uma interpolação entre dois vértices.')]),
      modulo('Curvas locais', [aula('PRE, DI x IPCA e cupons', [13, 33], 'Distinguir estruturas nominais, reais e cambiais.', ['Curva PRE', 'Cupom IPCA', 'Cupom cambial', 'Dias úteis'], 'Mapeie entradas, transformações e saídas de uma curva.')]),
      modulo('Curvas internacionais e índices', [aula('Moedas, spreads e índices', [34, 61], 'Reconhecer convenções das demais famílias de curvas.', ['Curva de spread', 'Curva de índice', 'Interpolação 252'], 'Compare duas metodologias e identifique convenções incompatíveis.')]),
    ],
  },
  {
    id: 'politica-metodologia-risco', titulo: 'Política e metodologia de risco', nivel: 'Avançado', paginas: 6, ano: '2019',
    autoria: 'Aguila Capital', origem: 'Política interna de gerenciamento de risco', instituicao: 'Aguila Capital',
    descricao: 'Exemplo aplicado de governança, limites, VaR, testes de estresse e controles de estratégias.', pdf: 'assets/pdfs/28-politica-metodologia-risco.pdf',
    aviso: 'Documento institucional específico; limites não devem ser transplantados para outra carteira sem análise.',
    modulos: [
      modulo('Governança e riscos', [aula('Identificação e responsabilidades', [1, 3], 'Distinguir riscos de mercado, liquidez, concentração, contraparte e operação.', ['Governança de risco', 'Risco de contraparte', 'Risco operacional'], 'Crie uma matriz entre risco, indicador, limite e responsável.')]),
      modulo('Mensuração e limites', [aula('VaR, estresse, delta e vega', [3, 6], 'Interpretar métricas e políticas de redução de exposição.', ['Value at Risk', 'Stress test', 'Delta', 'Vega', 'Stop'], 'Explique o que cada limite controla e o que deixa de controlar.')]),
    ],
  },
  {
    id: 'previsao-curva-juros', titulo: 'Previsão da curva de juros com macroeconomia', nivel: 'Especialização', paginas: 29, ano: '2009',
    autoria: 'André Luís Leite, Romeu Braz Pereira Gomes Filho e José Valentim Machado Vicente', origem: 'Trabalhos para Discussão nº 186', instituicao: 'Banco Central do Brasil',
    descricao: 'Modelo estatístico da curva brasileira que combina fatores da estrutura a termo e variáveis macroeconômicas.', pdf: 'assets/pdfs/29-previsao-curva-juros-macroeconomia.pdf',
    aviso: 'Artigo de pesquisa; opiniões são dos autores e resultados dependem do período e da especificação.',
    modulos: [
      modulo('Estrutura a termo', [aula('Taxas spot, forward e fatores da curva', [4, 12], 'Representar nível, inclinação e curvatura.', ['ETTJ', 'Taxa a termo', 'Nelson-Siegel-Svensson', 'Prêmio de risco'], 'Interprete economicamente uma mudança em cada fator.')]),
      modulo('Modelo macrofinanceiro', [aula('Inflação, Selic e previsão', [13, 23], 'Entender como variáveis macroeconômicas entram na previsão.', ['Expectativa de inflação', 'Regra de Taylor', 'Componentes principais'], 'Desenhe uma validação temporal sem informação futura.')]),
      modulo('Avaliação', [aula('Resultados fora da amostra', [24, 29], 'Comparar previsões e limitações do modelo.', ['Erro de previsão', 'Fora da amostra', 'Benchmark'], 'Defina métricas e um modelo simples de referência.')]),
    ],
  },
];
