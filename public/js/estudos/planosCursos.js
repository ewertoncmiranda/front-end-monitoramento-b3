// Curadoria que liga os cursos documentais às competências de cada etapa.
// A mesma obra pode aparecer em mais de uma trilha quando cumpre papéis diferentes.
export const cursosPorEtapa = {
  iniciante: [
    'historia-mercado-capitais', 'mercados-financeiros-ufba', 'atualidades-mercado-financeiro',
    'pessoa-fisica-b3', 'estrategias-investimento-iniciantes',
  ],
  essencial: [
    'economia-financas-cpa10', 'fundamentos-analise-fundamentalista', 'analise-empresas-vidal',
    'juros-acoes-brasil', 'inovacoes-financeiras-juros',
  ],
  basico: [
    'fundamentalista-neoenergia', 'value-investing-ibrx100', 'derivativos-conceitos-contabilizacao',
    'cambio-derivativos-cambiais', 'leitura-curvas-expectativas',
  ],
  intermediario: [
    'metodos-quantitativos-financas', 'derivativos-valor-empresas', 'evidenciacao-derivativos',
    'politica-fiscal-divida-liquidez', 'mercado-futuro-taxas-juros',
  ],
  avancado: [
    'sustentabilidade-divida-publica', 'regras-fiscais-divida-brasil', 'regimes-inflacionarios-ciclos',
    'testes-regressao-multipla', 'politica-metodologia-risco',
  ],
  especializacao: [
    'microestrutura-informacao-privada', 'manual-curvas-b3', 'previsao-curva-juros',
    'opcoes-capital-ficticio', 'metodos-quantitativos-financas',
  ],
};

export const cursosPorEtapaApimec = {
  'apimec-diagnostico': [
    'mercados-financeiros-ufba', 'economia-financas-cpa10', 'pessoa-fisica-b3',
  ],
  'apimec-cb': [
    'economia-financas-cpa10', 'historia-mercado-capitais', 'mercados-financeiros-ufba',
    'juros-acoes-brasil', 'cambio-derivativos-cambiais', 'derivativos-conceitos-contabilizacao',
  ],
  'apimec-cg1': [
    'fundamentos-analise-fundamentalista', 'analise-empresas-vidal', 'fundamentalista-neoenergia',
    'value-investing-ibrx100', 'derivativos-valor-empresas', 'evidenciacao-derivativos',
  ],
  'apimec-ct1': [
    'metodos-quantitativos-financas', 'testes-regressao-multipla', 'politica-metodologia-risco',
    'microestrutura-informacao-privada', 'mercado-futuro-taxas-juros',
  ],
  'apimec-conduta': [
    'evidenciacao-derivativos', 'politica-metodologia-risco', 'inovacoes-financeiras-juros',
    'opcoes-capital-ficticio',
  ],
  'apimec-simulados': [
    'manual-curvas-b3', 'previsao-curva-juros', 'sustentabilidade-divida-publica',
    'regimes-inflacionarios-ciclos', 'politica-fiscal-divida-liquidez',
  ],
};
