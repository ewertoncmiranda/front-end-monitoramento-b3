// Unica responsabilidade: encontrar padroes de candle numa serie OHLCV.
// Modulo puro - sem DOM, sem fetch, sem estado. Recebe candles, devolve
// ocorrencias. E o que o torna testavel e o que permite rodar o mesmo
// detector sobre dados sinteticos para medir quanto ele dispara no ruido.
//
// Regra de projeto: so entra padrao com definicao PRECISA o bastante para um
// programa detectar sem julgamento humano. Padrao que precisa de "olho
// treinado" nao entra, porque nesse caso o detector viraria exatamente a
// apofenia descrita na aba Padroes: encontrar figura no ruido.
//
// Por isso ombro-cabeca-ombro, triangulo e bandeira NAO estao aqui - ver
// PADROES_NAO_DETECTAVEIS no fim do arquivo.

// Quantas vezes cada padrao aparece, em media, numa serie ALEATORIA de 63
// candles - o tamanho da maior janela deste painel. Medido rodando o proprio
// detector sobre 20 passeios aleatorios (ver teste_detector.mjs).
//
// E o numero mais desconfortavel do modulo: o harami aparece 16 vezes por
// janela no ruido puro, ou seja em 1 a cada 4 candles. Encontra-lo num
// grafico real nao e informacao. Cada padrao carrega esse valor em
// `ruidoPorJanela` para a interface poder mostrar a calibragem ao lado da
// contagem real.

const TENDENCIA_JANELA = 5;

// Comparacoes de preco nao podem virar na 16a casa decimal. Sem tolerancia,
// 11.0-10.95 (0.05000000000000071) deixa de ser <= 10.95-10.9
// (0.04999999999999893) e o detector perde um martelo perfeito.
const TOLERANCIA_RELATIVA = 1e-6;

function menorOuIgual(a, b, escala) {
  return a <= b + Math.abs(escala) * TOLERANCIA_RELATIVA;
}

function maiorOuIgual(a, b, escala) {
  return a >= b - Math.abs(escala) * TOLERANCIA_RELATIVA;
}

// --- geometria de uma vela -------------------------------------------------

function medidas(c) {
  const corpo = Math.abs(c.close - c.open);
  const amplitude = c.high - c.low;
  const topoCorpo = Math.max(c.open, c.close);
  const baseCorpo = Math.min(c.open, c.close);
  return {
    corpo,
    amplitude,
    sombraSuperior: c.high - topoCorpo,
    sombraInferior: baseCorpo - c.low,
    alta: c.close > c.open,
    baixa: c.close < c.open,
    meio: (c.open + c.close) / 2,
  };
}

/**
 * Tendencia das velas ANTERIORES a posicao i.
 *
 * Existe porque martelo e enforcado tem geometria identica: o que os separa
 * e o contexto. Sem isso o detector marcaria os dois no mesmo lugar.
 */
function tendenciaAnterior(candles, i, janela = TENDENCIA_JANELA) {
  const inicio = Math.max(0, i - janela);
  const anteriores = candles.slice(inicio, i);
  if (anteriores.length < 2) return 'indefinida';

  const primeiro = anteriores[0].close;
  const ultimo = anteriores[anteriores.length - 1].close;
  const variacao = (ultimo - primeiro) / primeiro;

  if (variacao <= -0.02) return 'baixa';
  if (variacao >= 0.02) return 'alta';
  return 'lateral';
}

// --- catalogo de padroes ---------------------------------------------------
// `velas` diz quantas velas o padrao consome; `detectar` recebe (candles, i)
// onde i e o indice da ULTIMA vela do padrao.

export const PADROES = [
  {
    id: 'doji',
    ruidoPorJanela: 3.8,
    nome: 'Doji',
    direcao: 'neutro',
    velas: 1,
    resumo: 'Abertura praticamente igual ao fechamento: sessao empatada.',
    regra: 'corpo <= 10% da amplitude',
    detectar(candles, i) {
      const m = medidas(candles[i]);
      return m.amplitude > 0 && menorOuIgual(m.corpo, 0.1 * m.amplitude, m.amplitude);
    },
  },
  {
    id: 'martelo',
    ruidoPorJanela: 0.2,
    nome: 'Martelo',
    direcao: 'alta',
    velas: 1,
    resumo: 'Derrubaram o preco e os compradores absorveram, depois de queda.',
    regra: 'sombra inferior >= 2x corpo, sombra superior <= corpo, apos tendencia de baixa',
    detectar(candles, i) {
      const m = medidas(candles[i]);
      return (
        m.corpo > 0 &&
        maiorOuIgual(m.sombraInferior, 2 * m.corpo, m.amplitude) &&
        menorOuIgual(m.sombraSuperior, m.corpo, m.amplitude) &&
        tendenciaAnterior(candles, i) === 'baixa'
      );
    },
  },
  {
    id: 'enforcado',
    ruidoPorJanela: 0.1,
    nome: 'Enforcado',
    direcao: 'baixa',
    velas: 1,
    resumo: 'Geometria igual a do martelo, mas aparecendo depois de alta.',
    regra: 'sombra inferior >= 2x corpo, sombra superior <= corpo, apos tendencia de alta',
    detectar(candles, i) {
      const m = medidas(candles[i]);
      return (
        m.corpo > 0 &&
        maiorOuIgual(m.sombraInferior, 2 * m.corpo, m.amplitude) &&
        menorOuIgual(m.sombraSuperior, m.corpo, m.amplitude) &&
        tendenciaAnterior(candles, i) === 'alta'
      );
    },
  },
  {
    id: 'estrela-cadente',
    ruidoPorJanela: 0.1,
    nome: 'Estrela cadente',
    direcao: 'baixa',
    velas: 1,
    resumo: 'Subiu muito na sessao e devolveu tudo, depois de alta.',
    regra: 'sombra superior >= 2x corpo, sombra inferior <= corpo, apos tendencia de alta',
    detectar(candles, i) {
      const m = medidas(candles[i]);
      return (
        m.corpo > 0 &&
        maiorOuIgual(m.sombraSuperior, 2 * m.corpo, m.amplitude) &&
        menorOuIgual(m.sombraInferior, m.corpo, m.amplitude) &&
        tendenciaAnterior(candles, i) === 'alta'
      );
    },
  },
  {
    id: 'marubozu-alta',
    ruidoPorJanela: 0.3,
    nome: 'Marubozu de alta',
    direcao: 'alta',
    velas: 1,
    resumo: 'Corpo cheio, quase sem sombra: comprador dominou do inicio ao fim.',
    regra: 'corpo >= 90% da amplitude, fechamento acima da abertura',
    detectar(candles, i) {
      const m = medidas(candles[i]);
      return m.amplitude > 0 && m.alta && maiorOuIgual(m.corpo, 0.9 * m.amplitude, m.amplitude);
    },
  },
  {
    id: 'marubozu-baixa',
    ruidoPorJanela: 0.3,
    nome: 'Marubozu de baixa',
    direcao: 'baixa',
    velas: 1,
    resumo: 'Corpo cheio de baixa: vendedor dominou a sessao inteira.',
    regra: 'corpo >= 90% da amplitude, fechamento abaixo da abertura',
    detectar(candles, i) {
      const m = medidas(candles[i]);
      return m.amplitude > 0 && m.baixa && maiorOuIgual(m.corpo, 0.9 * m.amplitude, m.amplitude);
    },
  },
  {
    id: 'engolfo-alta',
    ruidoPorJanela: 7.4,
    nome: 'Engolfo de alta',
    direcao: 'alta',
    velas: 2,
    resumo: 'Vela de alta engole inteiro o corpo da vela de baixa anterior.',
    regra: 'anterior de baixa, atual de alta, abertura <= fech. anterior e fech. >= abert. anterior',
    detectar(candles, i) {
      if (i < 1) return false;
      const a = candles[i - 1];
      const b = candles[i];
      return (
        a.close < a.open &&
        b.close > b.open &&
        b.open <= a.close &&
        b.close >= a.open
      );
    },
  },
  {
    id: 'engolfo-baixa',
    ruidoPorJanela: 8.8,
    nome: 'Engolfo de baixa',
    direcao: 'baixa',
    velas: 2,
    resumo: 'Vela de baixa engole inteiro o corpo da vela de alta anterior.',
    regra: 'anterior de alta, atual de baixa, abertura >= fech. anterior e fech. <= abert. anterior',
    detectar(candles, i) {
      if (i < 1) return false;
      const a = candles[i - 1];
      const b = candles[i];
      return (
        a.close > a.open &&
        b.close < b.open &&
        b.open >= a.close &&
        b.close <= a.open
      );
    },
  },
  {
    id: 'harami',
    ruidoPorJanela: 16.1,
    nome: 'Harami (vela dentro)',
    direcao: 'neutro',
    velas: 2,
    resumo: 'O corpo de hoje cabe inteiro dentro do corpo de ontem: perda de forca.',
    regra: 'corpo atual contido no corpo anterior',
    detectar(candles, i) {
      if (i < 1) return false;
      const a = candles[i - 1];
      const b = candles[i];
      const topoA = Math.max(a.open, a.close);
      const baseA = Math.min(a.open, a.close);
      const topoB = Math.max(b.open, b.close);
      const baseB = Math.min(b.open, b.close);
      return topoB <= topoA && baseB >= baseA && topoA - baseA > 0;
    },
  },
  {
    id: 'estrela-manha',
    ruidoPorJanela: 2.7,
    nome: 'Estrela da manha',
    direcao: 'alta',
    velas: 3,
    resumo: 'Baixa forte, indecisao, e retomada que recupera mais da metade.',
    regra: '1a de baixa com corpo grande, 2a de corpo pequeno, 3a de alta fechando acima do meio da 1a',
    detectar(candles, i) {
      if (i < 2) return false;
      const [a, b, c] = [candles[i - 2], candles[i - 1], candles[i]];
      const ma = medidas(a);
      const mb = medidas(b);
      return (
        ma.baixa &&
        ma.corpo > 0 &&
        mb.corpo < ma.corpo * 0.5 &&
        c.close > c.open &&
        c.close > ma.meio
      );
    },
  },
  {
    id: 'estrela-noite',
    ruidoPorJanela: 2.1,
    nome: 'Estrela da noite',
    direcao: 'baixa',
    velas: 3,
    resumo: 'Alta forte, indecisao, e queda que devolve mais da metade.',
    regra: '1a de alta com corpo grande, 2a de corpo pequeno, 3a de baixa fechando abaixo do meio da 1a',
    detectar(candles, i) {
      if (i < 2) return false;
      const [a, b, c] = [candles[i - 2], candles[i - 1], candles[i]];
      const ma = medidas(a);
      const mb = medidas(b);
      return (
        ma.alta &&
        ma.corpo > 0 &&
        mb.corpo < ma.corpo * 0.5 &&
        c.close < c.open &&
        c.close < ma.meio
      );
    },
  },
];

// --- alertas: as armadilhas que SAO mensuraveis no OHLCV -------------------
// Nao sao padroes de operacao; sao avisos de que aquele candle pode nao
// significar o que parece. Cada um corresponde a uma armadilha da aba Padroes.

export const ALERTAS = [
  {
    id: 'gap',
    nome: 'Gap de abertura',
    resumo: 'Abriu longe do fechamento anterior. Pode ser provento, nao movimento.',
    armadilha: 'Preco nao ajustado por proventos',
    regra: 'abertura difere do fechamento anterior em mais de 2%',
    detectar(candles, i) {
      if (i < 1) return false;
      const anterior = candles[i - 1].close;
      if (!anterior) return false;
      return Math.abs(candles[i].open - anterior) / anterior > 0.02;
    },
  },
  {
    id: 'volume-anomalo',
    nome: 'Volume anomalo',
    resumo: 'Volume muito acima da media. Confira se nao e data mecanica.',
    armadilha: 'Volume alto lido fora de contexto',
    regra: 'volume > 2x a media dos 20 candles anteriores',
    detectar(candles, i) {
      const media = mediaVolume(candles, i, 20);
      return Boolean(media && candles[i].volume > 2 * media);
    },
  },
  {
    id: 'liquidez-baixa',
    nome: 'Liquidez baixa',
    resumo: 'Volume muito abaixo da media: o preco desse dia pode nao ser executavel.',
    armadilha: 'Liquidez: o preco que voce ve nao e o que voce paga',
    regra: 'volume < 30% da media dos 20 candles anteriores',
    detectar(candles, i) {
      const media = mediaVolume(candles, i, 20);
      return Boolean(media && candles[i].volume < 0.3 * media);
    },
  },
];

function mediaVolume(candles, i, janela) {
  const inicio = Math.max(0, i - janela);
  const anteriores = candles.slice(inicio, i).filter((c) => c.volume);
  if (anteriores.length < 5) return null;
  return anteriores.reduce((soma, c) => soma + c.volume, 0) / anteriores.length;
}

// Padroes citados na aba Padroes que NAO sao detectados aqui, e por que.
// Aparecem na interface como indisponiveis, com a razao - e mais honesto que
// entregar um detector que dispara em ruido.
export const PADROES_NAO_DETECTAVEIS = [
  {
    nome: 'Ombro-Cabeca-Ombro',
    razao:
      'Leva de 3 a 6 meses para se formar. O range maximo deste painel sao 3 meses (~63 pregoes), entao a figura nao cabe na janela.',
  },
  {
    nome: 'Topo duplo e fundo duplo',
    razao:
      'Depende de identificar pivos e de tolerancia arbitraria para "mesmo nivel". Qualquer limite que escolhessemos faria o detector disparar em ruido.',
  },
  {
    nome: 'Triangulos, bandeiras e canais',
    razao:
      'Exigem ajuste de retas a pontos escolhidos a mao. Automatizar sem criterio produz exatamente a apofenia descrita na aba Padroes.',
  },
];

/**
 * Roda um detector sobre a serie inteira.
 * @returns {number[]} indices das velas onde o padrao fecha
 */
export function detectar(candles, definicao) {
  if (!candles || candles.length === 0) return [];
  const indices = [];
  for (let i = 0; i < candles.length; i += 1) {
    if (definicao.detectar(candles, i)) indices.push(i);
  }
  return indices;
}

export function buscarPadrao(id) {
  return PADROES.find((p) => p.id === id) || ALERTAS.find((a) => a.id === id) || null;
}
