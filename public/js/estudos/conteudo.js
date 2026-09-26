// Unica responsabilidade: fornecer o catálogo editorial de estudos, sem lógica de interface.
export const fontes = [
  { id: 'cnpi', titulo: 'Certificações CNPI, CNPI-T e CNPI-P', url: 'https://www.apimecbrasil.com.br/certificacao/sobre-o-cnpi/', descricao: 'Estrutura oficial: CB + CG1 para CNPI; CB + CT1 para CNPI-T; os três para CNPI-P. Certificação e credenciamento são etapas distintas.' },
  { id: 'manual', titulo: 'Manual de Candidatura — FGV/APIMEC', url: 'https://certpessoas.fgv.br/apimec/manual-de-candidatura', descricao: 'Referência para programa detalhado e regras dos exames. Confira a versão vigente antes da inscrição.' },
  { id: 'top', titulo: 'Série Livros TOP', url: 'https://www.apimecbrasil.com.br/serie-livros-top/', descricao: 'O Livro TOP — Análise de Investimentos, 2ª edição (2025), integra fundamentos e temas ESG. Use como leitura transversal, com sínteses e exercícios por capítulo.' },
  { id: 'conduta', titulo: 'Código de Conduta da APIMEC', url: 'https://www.apimecbrasil.com.br/autorregulacao/codigo-de-conduta/', descricao: 'Fontes confiáveis, fundamentação, autoria, conflitos de interesse e alterações metodológicas.' },
  { id: 'trilha', titulo: 'Trilha do Conhecimento', url: 'https://www.apimecbrasil.com.br/trilha-do-conhecimento/', descricao: 'Plataforma paga de atualização: Resoluções CVM 20, 160, 175 e 193, CBPS 01 e 02 e códigos de Conduta e de Processos. Não substitui a preparação inicial completa.' },
  { id: 'cursos', titulo: 'Cursos e aprofundamentos', url: 'https://www.apimecbrasil.com.br/educacional/cursos-planejados/', descricao: 'Análise técnica, demonstrações, valuation, alocação, derivativos e IA. Escolha conforme suas lacunas; o catálogo também contém datas passadas e não confirma inscrições abertas.' },
  { id: 'eventos', titulo: 'Reuniões e eventos', url: 'https://www.apimecbrasil.com.br/eventos/reunioes-e-eventos-programados/', descricao: 'Selecione uma apresentação de resultados por mês. Prepare cinco perguntas e confronte as respostas com as demonstrações.' },
  { id: 'codim', titulo: 'CODIM — divulgação ao mercado', url: 'https://www.apimecbrasil.com.br/tecnica/comites/codim/', descricao: 'Ponto de partida para estudar a comunicação de informações aos investidores.' },
  { id: 'pec', titulo: 'Programa de Educação Continuada', url: 'https://www.apimecbrasil.com.br/certificacao/pec-cnpi/', descricao: 'O PEC prevê reciclagem ou créditos. Na modalidade de créditos, a página consultada informa 160 em cinco anos, com pelo menos 80 nos dois anos finais. Estudo pessoal não equivale automaticamente a crédito reconhecido.' },
  { id: 'acervo', titulo: 'Acervo bibliográfico', url: 'https://www.apimecbrasil.com.br/biblioteca/dev-livros/', descricao: 'Consulta presencial para associados, mediante agendamento. Não é uma biblioteca digital integralmente aberta.' },
  { id: 'ciia', titulo: 'Comunicado sobre o CIIA', url: 'https://www.apimecbrasil.com.br/certificacao/sobre-o-ciia/', descricao: 'A APIMEC comunica o encerramento da parceria com a ACIIA em 2024. Consulte a entidade responsável para uma futura certificação internacional.' },
  { id: 'cvm', titulo: 'CVM — educação sobre day trade', url: 'https://www.gov.br/cvm/pt-br/assuntos/noticias/2020/educacao-financeira-em-pauta--cvm-lanca-materiais-educativos-sobre-day-trade-e-funcionamento-da-bolsa-de-valores-5221f3b6650040a084fd7e3554ad9807', descricao: 'Funcionamento, custos, riscos, vieses e pesquisas sobre day trade. Leitura inicial da especialização intradiária.' },
];

export const niveis = [
  {
    id: 'iniciante', titulo: 'Iniciante absoluto', semanas: 4, foco: 'Entender o que está vendo',
    pergunta: 'O que representa cada número que aparece na tela?',
    topicos: [
      'Ação como participação em uma empresa; empresa, ação, cotação e valor de mercado.',
      'Investimento, especulação, negociação de curto prazo e formação de patrimônio.',
      'Renda fixa, renda variável, fundos e derivativos: finalidade e riscos básicos.',
      'Sistema Financeiro Nacional: CMN, Banco Central, CVM, B3, corretoras e instituições financeiras.',
      'Porcentagens, variação percentual, juros compostos, inflação e retorno real.',
      'Liquidez, volatilidade, diversificação e possibilidade de perda.',
      'Ticker, pregão, abertura, máxima, mínima, fechamento e volume (OHLCV).',
      'Diferença entre um dado observado e uma interpretação sobre ele.',
    ],
    pratica: 'Escolha um ativo e descreva dez velas diárias apenas com fatos: abriu a R$ 20, fechou a R$ 21 e atingiu mínima de R$ 19,50. Depois escreva uma interpretação, identificando-a como hipótese. Recuperação no pregão não prova alta no dia seguinte.',
    entrega: 'Glossário pessoal de 30 termos e uma página explicando empresa → ação → negociação → cotação → gráfico.',
    criterio: 'Explicar OHLCV sem consulta, calcular variações e demonstrar por que uma queda de 50% exige alta de 100% para recuperar o valor inicial.',
    rotas: ['glossario', 'candles'],
  },
  {
    id: 'essencial', titulo: 'Essencial', semanas: 6, foco: 'Ler a empresa, o gráfico e o risco',
    pergunta: 'Que informação esse dado oferece e o que ele não permite concluir?',
    topicos: [
      'Balanço Patrimonial: ativos, passivos e patrimônio líquido.',
      'DRE: receita, custos, despesas e lucro. DFC: geração e consumo de caixa.',
      'Diferenças entre lucro, caixa, receita e valor de mercado.',
      'LPA, VPA, P/L, P/VP, margens e endividamento.',
      'Selic, IPCA, IGP-M, PIB, câmbio e efeitos básicos sobre empresas.',
      'Corpo, sombras e amplitude das velas; escalas linear e logarítmica.',
      'Períodos diário, semanal e intradiário; alta, baixa e lateralização.',
      'Preços brutos e ajustados; dividendos, desdobramentos e grupamentos.',
      'Ordens a mercado, limitadas e stop; preço pretendido versus executado.',
    ],
    pratica: 'Compare duas empresas do mesmo setor e anote o período dos fundamentos. Procure divergências entre lucro e caixa. Compare preços brutos e ajustados, quando disponíveis, e investigue eventos antes de interpretar uma mudança abrupta.',
    entrega: 'Ficha de duas empresas com atividade, indicadores, fonte, data e três perguntas ainda sem resposta.',
    criterio: 'Explicar por que P/L baixo não comprova uma oportunidade, lucro não equivale a caixa e um stop pode executar em preço diferente do gatilho.',
    rotas: ['gestao', 'candles'],
  },
  {
    id: 'basico', titulo: 'Básico', semanas: 8, foco: 'Reconhecer padrões no contexto',
    pergunta: 'Esse desenho tem o mesmo significado em qualquer lugar do gráfico?',
    topicos: [
      'Análise horizontal e vertical; liquidez corrente, dívida líquida, cobertura de juros, ROE e ROIC.',
      'Comparação setorial e limites dos indicadores; exercício anual, trimestre e TTM.',
      'Juros simples e compostos, valor presente, VPL e TIR.',
      'Política monetária, política fiscal e balanço de pagamentos.',
      'Teoria de Dow, topos, fundos, suportes, resistências, LTA e LTB.',
      'Rompimentos, falsos rompimentos, retorno à região rompida, médias móveis e volume relativo.',
      'Doji, martelo, enforcado, estrela cadente, engolfos, harami e estrelas da manhã e da noite.',
      'Vela isolada, sequência de velas e figura gráfica: diferenças de definição.',
      'Risco por operação, exposição, concentração; ganho médio, perda média e acertos.',
      'Aversão à perda, confirmação, ancoragem, efeito manada e excesso de confiança.',
    ],
    pratica: 'Compare martelos após quedas com a mesma geometria após altas. Colete 30 ocorrências, incluindo falhas e casos ambíguos, sem selecionar apenas sucessos. Essa quantidade é um exercício de classificação, não prova estatística.',
    entrega: 'Catálogo comentado com imagem, contexto anterior, regra e resultado posterior.',
    criterio: 'Classificar antes de revelar as velas seguintes e admitir “indefinido” quando a regra não permitir uma classificação clara.',
    rotas: ['padroes', 'candles', 'formulas'],
  },
  {
    id: 'intermediario', titulo: 'Intermediário', semanas: 10, foco: 'Testar suas hipóteses',
    pergunta: 'Como verifico se minha interpretação acrescenta informação?',
    topicos: [
      'WACC, custo do capital próprio, custo da dívida e estrutura de capital.',
      'Fluxo de caixa descontado: projeções, valor terminal e sensibilidade.',
      'P/L e EV/EBITDA em empresas comparáveis; modelos de Graham e suas premissas.',
      'Lucros não recorrentes, empresas cíclicas e normalização de resultados.',
      'IFR, Estocástico, MACD e Bandas de Bollinger: cálculo, finalidade e limites.',
      'Pivôs, triângulos, bandeiras, topo/fundo duplo e OCO.',
      'Ondas de Elliott e a subjetividade da marcação.',
      'Probabilidade condicional, taxa-base, dispersão e tamanho de amostra.',
      'Retorno esperado, custos, perdas acumuladas e drawdown.',
    ],
    pratica: 'Teste se o retorno nos cinco pregões após um engolfo de alta difere de situações com tendência e volatilidade semelhantes. Defina antes ativos, período, regra, contexto, momento do sinal, entrada, saída, custos e tratamento de ausências.',
    entrega: 'Relatório de um experimento com hipótese, método, referência de comparação, resultados e limitações.',
    criterio: 'Reproduzir os cálculos e distinguir “subiu após o padrão” de “uma estratégia executável teria resultado positivo”. Acertar 60% não supera uma referência comparável de 65% nessa métrica.',
    rotas: ['candles', 'formulas', 'gestao'],
  },
  {
    id: 'avancado', titulo: 'Avançado', semanas: 12, foco: 'Avaliar robustez e carteiras',
    pergunta: 'O resultado permanece quando as condições mudam?',
    topicos: [
      'Integração de DRE, balanço e caixa nas projeções; FCFF, FCFE e reinvestimento.',
      'Crescimento, retorno sobre capital e sensibilidade a juros, margens e valor terminal.',
      'Particularidades de bancos, seguradoras, commodities e negócios regulados.',
      'Correlação, diversificação, alocação e risco agregado.',
      'Renda fixa: preço, taxa, duration e risco de crédito.',
      'Futuros, opções, margem, ajuste diário, proteção e alavancagem.',
      'Separação temporal de desenvolvimento, validação e teste; walk-forward.',
      'Sobrevivência, informação futura, excesso de testes e sobreajuste.',
      'Custos, spread, deslizamento, liquidez, intervalos de confiança e reamostragem.',
      'Dependência entre observações e sinais expostos ao mesmo movimento de mercado.',
    ],
    pratica: 'Congele três estratégias simples e compare períodos e ativos diferentes. Meça retorno líquido, drawdown, operações, exposição e estabilidade. Cem sinais simultâneos não são cem experimentos independentes.',
    entrega: 'Pesquisa reproduzível com parâmetros congelados e avaliação em dados não usados no desenvolvimento.',
    criterio: 'Explicar onde o método funciona e falha, incluindo quando a evidência é insuficiente para usá-lo.',
    rotas: ['candles', 'monitorados', 'formulas'],
  },
  {
    id: 'especializacao', titulo: 'Especialização', semanas: 16, foco: 'Produzir análise defensável',
    pergunta: 'Outra pessoa consegue auditar e contestar minha conclusão?',
    topicos: [
      'Fundamentalista: análise setorial, contabilidade e avaliação de empresas.',
      'Técnica quantitativa: regras, testes e avaliação de estratégias.',
      'Microestrutura e intradiário: execução, liquidez, book de ofertas, times & trades e volume por preço; requer dados adicionais.',
      'Carteiras e risco: alocação, cenários, concentração e proteção.',
      'Dados financeiros: qualidade, temporalidade e rastreabilidade.',
      'Relatórios com fontes, premissas e cenários; fatos, projeções e opiniões.',
      'Governança de modelos, mudanças metodológicas, resultados negativos e reprodução.',
      'Ética, conflitos de interesse, comunicação de incerteza e revisão após resultados.',
    ],
    pratica: 'Escolha uma área principal. Analise uma empresa e uma hipótese técnica sobre suas ações, combinando diagnóstico contábil, valuation por cenários, padrões e avaliação de risco.',
    entrega: 'Dossiê reproduzível, com condições que invalidariam cada conclusão e revisão por outra pessoa.',
    criterio: 'Permitir que outra pessoa reproduza o estudo e identifique as premissas das quais discorda. As 16 semanas iniciam a especialização; domínio exige prática contínua em diferentes mercados.',
    rotas: ['gestao', 'candles', 'monitorados'],
  },
];

export const apimec = [
  { id: 'apimec-diagnostico', titulo: 'Diagnóstico e candidatura', periodo: 'Semanas 1–2', descricao: 'Leia os documentos de candidatura, escolha CNPI (CB + CG1), CNPI-T (CB + CT1) ou CNPI-P (os três) e mapeie as lacunas. Para integrar fundamentos e gráficos, use o conteúdo pleno como referência curricular.', entrega: 'Matriz de assuntos, lacunas e calendário. Certificação e credenciamento são etapas distintas.', fontes: ['cnpi', 'manual'] },
  { id: 'apimec-cb', titulo: 'CB · Conteúdo Brasileiro', periodo: 'Semanas 3–8', descricao: 'SFN, economia, renda fixa, ações, derivativos, governança, relações com investidores e conduta. Compare os riscos de instrumentos e explique efeitos de mudanças de juros e os papéis das instituições.', entrega: 'Resumos, questões e casos conferidos com o programa detalhado vigente.', fontes: ['manual'] },
  { id: 'apimec-cg1', titulo: 'CG1 · Conteúdo Global 1', periodo: 'Semanas 9–16', descricao: 'Divida o tempo entre contabilidade/análise de relatórios e avaliação/finanças corporativas. Percorra demonstrações, indicadores, qualidade do lucro, projeções, custo de capital, avaliação e cenários. Calcule manualmente antes de automatizar.', entrega: 'Análise fundamentalista que reconcilie números contábeis, premissas e valor estimado.', fontes: ['manual', 'top'] },
  { id: 'apimec-ct1', titulo: 'CT1 · Conteúdo Técnico 1', periodo: 'Semanas 17–24', descricao: 'Tendências, Dow, figuras, Elliott, candles, indicadores, risco e sistemas de negociação. Para cada técnica, escreva como é definida e como seria testada.', entrega: 'Estudo técnico com regras, testes e limitações práticas.', fontes: ['cnpi', 'cursos'] },
  { id: 'apimec-conduta', titulo: 'Conduta, regulação e sustentabilidade', periodo: 'Semanas 25–28', descricao: 'Estude fontes, autoria, conflitos, governança e mudanças metodológicas. Revise um relatório marcando fatos, estimativas, opiniões e limitações. Na atualização normativa, use os temas da Trilha do Conhecimento para elaborar casos.', entrega: 'Relatório revisado, mapa de aplicação das normas e casos éticos resolvidos.', fontes: ['conduta', 'trilha', 'codim'] },
  { id: 'apimec-simulados', titulo: 'Integração e simulados', periodo: 'Semanas 29–32', descricao: 'Faça simulados inéditos cronometrados. Classifique erros em conceito, cálculo, interpretação ou tempo. Refaça dias depois e explique as alternativas incorretas.', entrega: 'Meta pedagógica: 80% em três simulados inéditos consecutivos, sem área persistentemente fraca. Não é a nota oficial de aprovação.', fontes: ['manual', 'pec'] },
];

export const conhecimentos = [
  { id: 'mercado', titulo: 'Mercado e economia', descricao: 'Entenda o ambiente em que os preços se formam.', itens: ['SFN e instituições; ações, renda fixa, fundos e derivativos.', 'Selic, inflação, PIB, câmbio, política fiscal e monetária e balanço de pagamentos.', 'Liquidez é a possibilidade de negociar; volatilidade descreve a variação dos preços. São conceitos distintos.'], nivel: 'iniciante' },
  { id: 'contabilidade', titulo: 'Da contabilidade ao valuation', descricao: 'Conecte resultados, caixa e valor.', itens: ['Balanço mostra posições; DRE mostra desempenho; DFC mostra fluxos de caixa.', 'Compare períodos e setores compatíveis. Exercício fechado, trimestre e TTM não são intercambiáveis.', 'LPA, VPA, P/L, P/VP, margens, dívida, ROE e ROIC exigem convenções explícitas.', 'Valuation usa premissas: WACC, FCFF/FCFE, crescimento e valor terminal. Graham e múltiplos são referências que precisam de contexto.'], nivel: 'essencial' },
  { id: 'velas', titulo: 'Linguagem das velas', descricao: 'Descreva primeiro; interprete depois.', itens: ['OHLCV: abertura, máxima, mínima, fechamento e volume. Corpo = |fechamento − abertura|; amplitude = máxima − mínima.', 'Martelo após queda e a mesma geometria após alta pedem interpretações distintas.', 'Uma vela não revela toda a sequência intradiária. Se alvo e stop estão dentro da amplitude, OHLC não informa qual ocorreu primeiro.', 'Preços brutos e ajustados não devem ser misturados. Eventos corporativos podem gerar descontinuidades.'], nivel: 'basico' },
  { id: 'tecnica', titulo: 'Contexto técnico e indicadores', descricao: 'O desenho só é parte da hipótese.', itens: ['Dow, topos, fundos, suportes, resistências, tendências e rompimentos.', 'Médias, IFR, Estocástico, MACD e Bollinger: aprenda a fórmula e o que cada medida deixa de mostrar.', 'Pivôs, triângulos, bandeiras, OCO e Elliott exigem definições e atenção à subjetividade.', 'Book de ofertas, times & trades e volume por preço exigem dados que uma vela diária não fornece.'], nivel: 'intermediario' },
  { id: 'evidencia', titulo: 'Evidência e comparação', descricao: 'Uma ocorrência não comprova uma vantagem.', itens: ['Compare o padrão com situações equivalentes em tendência e volatilidade.', '60% de acertos não supera uma taxa-base comparável de 65% nessa métrica.', 'Número de ocorrências, dispersão, custos e dependência importam. Trinta exemplos servem para aprender, não para comprovar vantagem.', 'Separe desenvolvimento e teste no tempo. Evite usar informação futura ou escolher apenas empresas sobreviventes.'], nivel: 'avancado' },
  { id: 'profissional', titulo: 'Pesquisa e comunicação', descricao: 'Uma conclusão deve poder ser revisada.', itens: ['Registre fonte, data, premissas, método e condições de invalidação.', 'Diferencie fatos, projeções e opiniões; preserve resultados negativos.', 'Documente mudanças do modelo e conflitos de interesse.', 'Escolha uma especialidade e busque revisão independente.'], nivel: 'especializacao' },
];

export const orientacoes = [
  { id: 'rotina', titulo: 'Construa uma rotina sustentável', texto: 'Na formação progressiva, distribua 8 horas semanais: 2 de teoria, 2 de cálculos, 3 de laboratório e 1 de revisão. A cada quatro semanas, produza uma entrega verificável. O percurso APIMEC sugere 10 horas semanais após a base essencial.' },
  { id: 'progressao', titulo: 'Avance por competência', texto: 'Descrever → classificar → comparar → testar → reproduzir. Os prazos são sugestões, não garantias de domínio ou rentabilidade. A conclusão de um nível é uma autoavaliação apoiada na entrega e no critério, não uma certificação.' },
  { id: 'risco', titulo: 'Dimensione o risco, não a confiança', texto: '“1% por operação” e “alvo duas vezes maior que o stop” são parâmetros didáticos, não regras universais. Considere capital disponível, exposição agregada, concentração, liquidez, gaps e execução desfavorável. Um stop não garante o limite de perda.' },
  { id: 'vieses', titulo: 'Registre decisões e comportamento', texto: 'Anote sono, ansiedade, respeito às regras e motivo das alterações. Observe confirmação, ancoragem, manada, aversão à perda e excesso de confiança. Disciplina ajuda a executar um método, mas não cria vantagem estatística.' },
  { id: 'ajustes', titulo: 'Congele regras antes de medir', texto: 'A calibragem é útil para estudar sensibilidade. Alterar critérios após ver resultados favorece sobreajuste. Preserve uma amostra futura ou separada para testar as regras congeladas e inclua falhas e ambiguidades no relatório.' },
  { id: 'daytrade', titulo: 'Trate o intradiário como especialização opcional', texto: 'Day trade exige dados e estudo próprios. Perdas também envolvem custos, competição, alavancagem e ausência de vantagem, não apenas disciplina. Comece por simulação e pelo material educativo da CVM.', fonte: 'cvm' },
  { id: 'materiais', titulo: 'Escolha materiais a partir das lacunas', texto: 'Dificuldade em ligar lucro a caixa pede contabilidade; dificuldade em projetar reinvestimento pede modelagem. Faça uma síntese e um exercício por capítulo do Livro TOP. Estude uma norma por semana e acompanhe mensalmente uma apresentação com cinco perguntas preparadas.', fonte: 'top' },
  { id: 'continuada', titulo: 'Mantenha a formação depois dos exames', texto: 'Guarde comprovantes de cursos e eventos, registre aprendizados e consulte as regras vigentes do PEC. Estudo pessoal não é automaticamente crédito reconhecido. O acervo da APIMEC é presencial; sua Trilha do Conhecimento é paga.', fonte: 'pec' },
];

export const exercicios = [
  { id: 'primeira-semana', titulo: 'Sua primeira semana', nivel: 'Iniciante', passos: ['Estude OHLCV e descreva dez velas sem prever o futuro.', 'Escolha uma empresa e registre as fontes e os períodos dos dados.', 'Escreva o que é fato e o que é hipótese.', 'Explique o que ainda não sabe e transforme isso em perguntas.'], entrega: 'Dez descrições e uma ficha de empresa.', rotas: ['candles', 'gestao', 'glossario'] },
  { id: 'comparar-padroes', titulo: 'Um padrão acrescenta informação?', nivel: 'Intermediário', passos: ['Defina ativo, período, regra e contexto antes de olhar o resultado.', 'Compare engolfos de alta com situações semelhantes sem o padrão.', 'Registre quando o sinal fica conhecido e uma entrada possível depois disso.', 'Meça o retorno em cinco pregões, os custos e a referência.', 'Reporte falhas, número de ocorrências e incerteza. Não confunda alta posterior com lucro executável.'], entrega: 'Relatório com hipótese, método, referência e limitações.', rotas: ['candles', 'padroes'] },
  { id: 'tamanho-posicao', titulo: 'Dimensionamento de uma posição', nivel: 'Básico', formula: 'Quantidade = piso(orçamento de risco ÷ (distância até o stop por ação + custos estimados por ação))', passos: ['Use apenas valores hipotéticos: orçamento de risco R$ 100, distância R$ 2 e custos R$ 0,10 por ação.', 'Calcule 100 ÷ 2,10: o resultado inteiro é 47 ações.', 'Confira o capital necessário e a exposição das outras posições.', 'Simule um gap que execute além do stop. A perda pode exceder o orçamento. Para derivativos, considere também multiplicadores e regras do contrato.'], entrega: 'Cálculo acompanhado de cenários de execução.', rotas: ['formulas'] },
  { id: 'expectativa', titulo: 'Acertos, ganhos, perdas e custos', nivel: 'Intermediário', formula: 'E = p × G − (1 − p) × L − C', passos: ['p é a probabilidade de ganho; G é o ganho médio; L é a perda média; C é o custo médio por operação.', 'Com p = 0,60, G = R$ 100, L = R$ 200 e C = R$ 5, E = −R$ 25.', 'A estratégia hipotética acerta 60% e ainda tem expectativa negativa.', 'Mantenha todos os valores na mesma unidade e teste a sensibilidade das estimativas.'], entrega: 'Três cenários explicados, incluindo um com muitos acertos e expectativa negativa.', rotas: ['formulas'] },
  { id: 'robustez', titulo: 'Teste de robustez', nivel: 'Avançado', passos: ['Congele três estratégias simples e reserve dados não usados na criação.', 'Compare períodos e ativos distintos com custos e liquidez.', 'Meça retorno líquido, drawdown, exposição e número de operações.', 'Analise dependência entre sinais e documente resultados negativos.'], entrega: 'Pesquisa reproduzível com avaliação fora da amostra.', rotas: ['candles', 'monitorados'] },
  { id: 'dossie', titulo: 'Dossiê final', nivel: 'Especialização', passos: ['Escolha uma empresa e uma hipótese técnica.', 'Reúna diagnóstico contábil e valuation por cenários.', 'Estude padrões, risco e condições que invalidam a conclusão.', 'Separe fatos, projeções e opiniões; cite fontes e conflitos.', 'Peça a outra pessoa que reproduza e critique o estudo.'], entrega: 'Relatório auditável e registro da revisão.', rotas: ['gestao', 'candles'] },
];

export const fichaLaboratorio = [
  ['Identificação', 'Ativo, fonte, período e intervalo das velas.'],
  ['Qualidade', 'Preço bruto ou ajustado, lacunas e eventos corporativos.'],
  ['Formação', 'Regra objetiva, proporção do corpo e das sombras.'],
  ['Contexto', 'Tendência anterior, volatilidade e liquidez.'],
  ['Comparação', 'Ocorrências semelhantes sem o padrão.'],
  ['Execução', 'Quando o sinal fica conhecido e quando seria possível entrar.'],
  ['Resultado', 'Retorno, perda, custos e horizonte.'],
  ['Evidência', 'Número de ocorrências e incerteza.'],
  ['Revisão', 'O que sustentaria ou refutaria a hipótese.'],
];

export const recursosSistema = [
  ['Velas e padrões', 'Geometria, contexto e comparação.', 'Frequência e acertos não demonstram rentabilidade.', 'candles'],
  ['Calibragem', 'Sensibilidade das definições.', 'Ajustes após ver resultados favorecem sobreajuste.', 'candles'],
  ['Fundamentos CVM', 'Contabilidade, indicadores e períodos.', 'Conferir convenções, cobertura e data.', 'gestao'],
  ['Cenários de Graham', 'Sensibilidade às hipóteses.', 'Estimativa dependente do modelo, não valor garantido.', 'formulas'],
  ['Ingestão de TTM', 'Comparação de exercício e 12 meses.', 'Implementação não comprova carga e validação dos dados.', 'gestao'],
  ['Ingestão COTAHIST', 'Histórico mais longo.', 'Série bruta exige tratamento de eventos corporativos; não presumir exposição no gráfico.', 'candles'],
  ['Glossário e metodologia', 'Revisão dos conceitos e cálculos.', 'Conferir a fórmula efetivamente usada.', 'glossario'],
];

export const rotulosRotas = { gestao: 'Gestão', candles: 'Velas', formulas: 'Fórmulas', glossario: 'Glossário', padroes: 'Padrões', monitorados: 'Monitorados' };
