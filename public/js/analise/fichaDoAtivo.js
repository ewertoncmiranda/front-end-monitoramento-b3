// Unica responsabilidade: regras de leitura da ficha do ativo (aba Gestao) -
// transformar os contratos de /analises/{s}/fundamentos, /fundamentos-cvm,
// /pregoes e /validacao/backtest no que cada cartao da ficha mostra. Modulo
// puro, sem DOM: os componentes de components/ficha so desenham o resultado.

/** Rotulo legivel e tom (verde/cinza/vermelho/amarelo) de cada recomendacao. */
const RECOMENDACOES = {
  COMPRA_FORTE: { rotulo: 'Compra forte', tom: 'success' },
  COMPRA_MODERADA: { rotulo: 'Compra moderada', tom: 'success' },
  MANTER: { rotulo: 'Manter', tom: 'secondary' },
  SEM_MARGEM: { rotulo: 'Sem margem', tom: 'secondary' },
  VENDA_VALUATION: { rotulo: 'Venda por valuation', tom: 'danger' },
  ALERTA_RISCO: { rotulo: 'Alerta de risco', tom: 'warning' },
  SEM_DADOS: { rotulo: 'Sem dados', tom: 'secondary' },
};

export function leituraDaRecomendacao(recomendacao) {
  return RECOMENDACOES[recomendacao] || { rotulo: recomendacao || 'Sem dados', tom: 'secondary' };
}

// ---------------------------------------------------------------- numeros

export function numero(valor, casas = 2) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function moeda(valor) {
  const texto = numero(valor, 2);
  return texto === '—' ? texto : `R$ ${texto}`;
}

/** Percentual ja em pontos (18.2 -> "18,2%"), com sinal opcional. */
export function pontos(valor, casas = 1, comSinal = false) {
  const texto = numero(valor, casas);
  if (texto === '—') return texto;
  return `${comSinal && Number(valor) > 0 ? '+' : ''}${texto}%`;
}

/** "2026-09-25" -> "25/09/2026". */
export function dataBr(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export function diasEntre(isoAntes, hoje = new Date()) {
  if (!isoAntes) return null;
  const antes = new Date(`${String(isoAntes).slice(0, 10)}T12:00:00`);
  return Math.floor((hoje - antes) / 86400000);
}

// ---------------------------------------------------------------- preco

/**
 * Preco do cabecalho a partir das velas do banco (COTAHIST e, nos favoritos,
 * BRAPI dos dias recentes): ultimo fechamento, variacao contra o anterior e a
 * fonte do dia. Ler do banco evita a BRAPI em ativos da Base - a cota e dos
 * favoritos (infra V13).
 */
export function precoDasVelas(velas) {
  if (!velas || velas.length === 0) return null;
  const ultima = velas[velas.length - 1];
  const anterior = velas.length > 1 ? velas[velas.length - 2] : null;
  const variacao = anterior && anterior.close ? ((ultima.close - anterior.close) / anterior.close) * 100 : null;
  return { preco: ultima.close, variacao, data: ultima.dataIso, fonte: ultima.fonte };
}

export function rotuloDaFonte(fonte) {
  if (fonte === 'B3_COTAHIST') return 'B3 oficial';
  if (fonte === 'BRAPI') return 'BRAPI (intradiário)';
  return fonte || 'fonte desconhecida';
}

/** Pontos (x, y) de um grafico de linha num retangulo largura x altura. */
export function pontosDaLinha(valores, largura, altura, margem = 2) {
  if (!valores || valores.length < 2) return [];
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const faixa = max - min || 1;
  const passo = largura / (valores.length - 1);
  return valores.map((v, i) => [
    Math.round(i * passo * 10) / 10,
    Math.round((margem + (1 - (v - min) / faixa) * (altura - 2 * margem)) * 10) / 10,
  ]);
}

// ---------------------------------------------------------------- valor justo

const CENARIOS = ['conservador', 'base', 'otimista'];

/**
 * Regua do valor justo: cada cenario Graham e o preco atual como posicao
 * (0-100%) numa escala comum, com folga nas pontas para o marcador nao
 * encostar na borda.
 */
export function reguaDeValor(valuation, preco) {
  const cenarios = valuation?.cenarios_graham;
  if (!cenarios || !preco) return null;
  const marcas = CENARIOS.filter((c) => cenarios[c]?.preco_justo)
    .map((c) => ({ cenario: c, valor: Number(cenarios[c].preco_justo), margem: cenarios[c].margem_seguranca_percent }));
  if (marcas.length === 0) return null;
  const valores = [...marcas.map((m) => m.valor), Number(preco)];
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const folga = (max - min) * 0.12 || Number(preco) * 0.1;
  const inicio = min - folga;
  const fim = max + folga;
  const posicao = (v) => Math.round(((v - inicio) / (fim - inicio)) * 1000) / 10;
  const base = marcas.find((m) => m.cenario === 'base') || marcas[0];
  return {
    marcas: marcas.map((m) => ({ ...m, posicao: posicao(m.valor) })),
    preco: { valor: Number(preco), posicao: posicao(Number(preco)) },
    margemBase: base.margem,
    abaixoDoConservador: marcas[0] && Number(preco) < marcas[0].valor,
  };
}

/**
 * valuation.py grava "MEDIA_5_ANOS", "LPA_ATUAL (abaixo da media de 5 anos)"
 * ou "LPA_ATUAL (historico da CVM insuficiente)": o valor justo usa o menor
 * entre o LPA atual e a media anual.
 */
export function rotuloDaFonteLpa(fonte) {
  const texto = String(fonte || '');
  const media = texto.match(/^MEDIA_(\d+)_ANOS/);
  if (media) return `LPA normalizado (média de ${media[1]} anos)`;
  const abaixo = texto.match(/abaixo da media de (\d+) anos/);
  if (abaixo) return `LPA atual (abaixo da média de ${abaixo[1]} anos)`;
  if (texto.includes('insuficiente')) return 'LPA atual (sem histórico na CVM)';
  return 'LPA dos últimos 12 meses';
}

// ---------------------------------------------------------------- historico do sinal

/**
 * O que o backtest diz deste sinal (mesma versao de regra e recomendacao) no
 * periodo de TESTE - o de calibracao foi visto ao ajustar as regras e nao
 * vale como prova. O veredito olha o intervalo de 95% do excesso sobre a
 * carteira: so ha vantagem (ou desvantagem) quando ele nao cruza o zero.
 *
 * O excesso do placar e bruto (ativo menos carteira). Na venda (direcao -1)
 * acertar e o ativo ficar ABAIXO da carteira, entao o intervalo e lido
 * invertido; sinal neutro (direcao 0) nao aposta em direcao nenhuma.
 */
export function historicoDoSinal(placar, versaoRegra, recomendacao, horizonte = 63) {
  if (!placar || !versaoRegra || !recomendacao) return null;
  const linha = placar.find((l) => l.versaoRegra === versaoRegra && l.periodo === 'TESTE'
    && l.recomendacao === recomendacao && l.horizonte === horizonte);
  if (!linha) return null;
  const ic = linha.icExcessoCarteira;
  const direcao = Number(linha.direcao);
  let veredito = 'INCONCLUSIVO';
  if (direcao === 0) veredito = 'NEUTRO';
  else if (!linha.amostraSuficiente) veredito = 'AMOSTRA_PEQUENA';
  else if (ic) {
    const inferior = direcao > 0 ? Number(ic.inferior) : -Number(ic.superior);
    const superior = direcao > 0 ? Number(ic.superior) : -Number(ic.inferior);
    if (inferior > 0) veredito = 'VANTAGEM';
    else if (superior < 0) veredito = 'DESVANTAGEM';
  }
  return { ...linha, veredito };
}

export const VEREDITOS = {
  VANTAGEM: { rotulo: 'Acertou mais que a carteira no teste', tom: 'success', icone: '✓' },
  DESVANTAGEM: { rotulo: 'Errou mais que a carteira no teste', tom: 'danger', icone: '✕' },
  INCONCLUSIVO: { rotulo: 'Sem vantagem comprovada', tom: 'warning', icone: '≈' },
  AMOSTRA_PEQUENA: { rotulo: 'Amostra pequena demais', tom: 'secondary', icone: '?' },
  NEUTRO: { rotulo: 'Sinal neutro, sem aposta de direção', tom: 'secondary', icone: '–' },
};

// ---------------------------------------------------------------- qualidade dos dados

/**
 * Selos de procedencia: de onde veio cada numero e quao fresco ele esta.
 * tom: success (em dia), warning (vale olhar), info (so contexto).
 */
export function selosDeQualidade({ fundamentos, cvm, ultimaVela }, hoje = new Date()) {
  const selos = [];
  const d = fundamentos?.detalhes;

  if (ultimaVela) {
    const idade = diasEntre(ultimaVela.data, hoje);
    selos.push({
      tom: idade !== null && idade <= 5 ? 'success' : 'warning',
      texto: `Preço ${rotuloDaFonte(ultimaVela.fonte)} de ${dataBr(ultimaVela.data)}`,
      ajuda: 'Fechamento mais recente gravado no banco. B3 oficial é o arquivo COTAHIST; favoritos recebem também a cotação intradiária da BRAPI.',
    });
  }

  if (cvm) {
    const velho = cvm.defasagem_dias !== null && cvm.defasagem_dias > 400;
    selos.push({
      tom: velho ? 'warning' : 'success',
      texto: `Balanço ${cvm.tipo_doc || 'CVM'} de ${dataBr(cvm.periodo)}`,
      ajuda: `Demonstração ${cvm.tipo_periodo === 'ANUAL' ? 'anual' : 'trimestral'} entregue à CVM, período encerrado há ${cvm.defasagem_dias ?? '—'} dias.`,
    });
    const faltando = Object.entries(cvm.cobertura || {}).filter(([, c]) => c.estrategia === 'nao-extraivel').map(([conta]) => conta);
    if (faltando.length) {
      selos.push({
        tom: 'info',
        texto: `${faltando.length} conta${faltando.length > 1 ? 's' : ''} sem padrão na CVM`,
        ajuda: `Não extraídas: ${faltando.join(', ').replaceAll('_', ' ')}. Os indicadores que dependem delas ficam de fora.`,
      });
    }
    if (cvm.cnpj) selos.push({ tom: 'success', texto: 'CNPJ conferido', ajuda: `Balanços casados pelo CNPJ ${cvm.cnpj}.` });
  } else {
    selos.push({ tom: 'warning', texto: 'Sem balanço da CVM', ajuda: 'Nenhum balanço carregado para este ativo; o valuation usa só o LPA do snapshot.' });
  }

  if (d?.valuation?.fonte_lpa) {
    selos.push({
      tom: 'info',
      texto: rotuloDaFonteLpa(d.valuation.fonte_lpa),
      ajuda: 'O valor justo usa o menor entre o LPA atual e a média dos últimos anos, para não premiar o pico de um ciclo.',
    });
  }

  const amostras = d?.contexto_tecnico_serie?.amostras;
  if (amostras !== undefined) {
    selos.push({
      tom: amostras >= 20 ? 'success' : 'warning',
      texto: `Série técnica com ${amostras} pregões`,
      ajuda: 'Média móvel e z-score precisam de ao menos 20 pregões para serem estáveis.',
    });
  } else if (d) {
    selos.push({ tom: 'warning', texto: 'Sem série técnica', ajuda: 'Histórico insuficiente para média móvel e z-score neste ciclo.' });
  }

  if (fundamentos?.dataAnalise) {
    const idade = diasEntre(fundamentos.dataAnalise, hoje);
    selos.push({
      tom: idade !== null && idade <= 5 ? 'success' : 'warning',
      texto: `Análise de ${dataBr(fundamentos.dataAnalise)}`,
      ajuda: `Calculada pela regra ${d?.versao_regra || '—'} sobre o pregão de ${dataBr(d?.data_pregao_referencia)}.`,
    });
  }
  return selos;
}

// ---------------------------------------------------------------- indicadores

function tile(chave, rotulo, valor, leitura, tom, explicacao) {
  return { chave, rotulo, valor, leitura, tom, explicacao };
}

/**
 * Indicadores da ficha: valor, leitura curta, tom e a explicacao do popover.
 * Faixas iguais as do gerar-insights (valuation.py) quando existem la; as de
 * ROE, margem e divida sao referencias de leitura, nao entram na regra.
 */
export function indicadores(fundamentos, cvm) {
  const d = fundamentos?.detalhes || {};
  const s = d.snapshot_mercado || {};
  const v = d.valuation || {};
  const t = d.contexto_tecnico || {};
  const serie = d.contexto_tecnico_serie || {};
  const lista = [];

  const pl = s.preco_lucro ?? cvm?.preco_lucro;
  if (pl !== undefined && pl !== null) {
    const tom = pl <= 0 ? 'danger' : pl < 8 ? 'success' : pl <= 15 ? 'secondary' : 'warning';
    lista.push(tile('pl', 'P/L', numero(pl, 1), (v.classificacao_pl || '').replaceAll('_', ' ').toLowerCase() || '—', tom,
      'Preço dividido pelo lucro por ação: quantos anos de lucro atual pagam a ação. Abaixo de 8 é barato para o padrão Brasil; P/L muito baixo pode ser desconto ou lucro que não vai se repetir.'));
  }

  if (v.earnings_yield_percent !== undefined) {
    const premio = v.taxa_livre_risco_percent !== undefined ? v.earnings_yield_percent - v.taxa_livre_risco_percent : null;
    lista.push(tile('ey', 'Earnings yield', pontos(v.earnings_yield_percent), premio === null ? '—' : `${pontos(premio, 1, true)} vs Selic`,
      premio === null ? 'secondary' : premio >= 0 ? 'success' : 'danger',
      'Lucro por ação dividido pelo preço - o inverso do P/L, comparável com juros. Acima da Selic, o lucro da empresa rende mais que a renda fixa sem risco.'));
  }

  if (cvm?.roe !== undefined && cvm?.roe !== null) {
    lista.push(tile('roe', 'ROE', pontos(cvm.roe), cvm.roe >= 15 ? 'alto' : cvm.roe >= 8 ? 'médio' : 'baixo',
      cvm.roe >= 15 ? 'success' : cvm.roe >= 8 ? 'secondary' : 'warning',
      'Retorno sobre o patrimônio: lucro líquido dividido pelo patrimônio líquido, do último balanço da CVM. Mede quanto a empresa gera com o capital dos sócios.'));
  }

  if (cvm?.margem_liquida !== undefined && cvm?.margem_liquida !== null) {
    lista.push(tile('ml', 'Margem líquida', pontos(cvm.margem_liquida), cvm.margem_liquida >= 15 ? 'alta' : cvm.margem_liquida >= 5 ? 'média' : 'baixa',
      cvm.margem_liquida >= 5 ? 'secondary' : 'warning',
      'Lucro líquido dividido pela receita líquida: quanto de cada real vendido vira lucro.'));
  }

  if (cvm?.divida_liquida !== undefined && cvm?.ebit) {
    const alavancagem = Number(cvm.divida_liquida) / Number(cvm.ebit);
    lista.push(tile('div', 'Dív. líq. / EBIT', `${numero(alavancagem, 1)}x`, alavancagem <= 2 ? 'confortável' : alavancagem <= 3.5 ? 'atenção' : 'alta',
      alavancagem <= 2 ? 'success' : alavancagem <= 3.5 ? 'warning' : 'danger',
      'Dívida líquida (dívida bruta menos caixa) dividida pelo lucro operacional: quantos anos de EBIT pagariam a dívida. Não vale para bancos.'));
  }

  if (cvm?.preco_valor_patrimonial !== undefined && cvm?.preco_valor_patrimonial !== null) {
    lista.push(tile('pvp', 'P/VP', numero(cvm.preco_valor_patrimonial, 2), cvm.preco_valor_patrimonial < 1 ? 'abaixo do patrimônio' : 'acima do patrimônio',
      'secondary',
      'Preço dividido pelo valor patrimonial por ação. Abaixo de 1, o mercado paga menos que o patrimônio contábil.'));
  }

  if (t.posicao_range_52w_percent !== undefined) {
    const zona = t.zona_52w || '';
    lista.push(tile('range', 'Range 52 semanas', pontos(t.posicao_range_52w_percent, 0),
      zona.replaceAll('_', ' ').toLowerCase() || '—',
      zona === 'PROXIMO_DA_MAXIMA' ? 'warning' : zona === 'PROXIMO_DA_MINIMA' ? 'success' : 'secondary',
      'Onde o preço está entre a mínima (0%) e a máxima (100%) das últimas 52 semanas. Acima de 85% a entrada é tardia; abaixo de 25%, perto do fundo do ano.'));
  }

  if (serie.z_score_fechamento !== undefined) {
    const z = Number(serie.z_score_fechamento);
    lista.push(tile('z', 'Z-score (MM20)', `${z > 0 ? '+' : ''}${numero(z, 2)}σ`,
      Math.abs(z) < 1 ? 'perto da média' : z > 0 ? 'esticado para cima' : 'esticado para baixo',
      Math.abs(z) < 2 ? 'secondary' : 'warning',
      `Distância do fechamento para a média móvel de 20 pregões (${moeda(serie.media_movel)}), em desvios-padrão. Além de ±2σ o preço está fora do comum.`));
  }
  return lista;
}
