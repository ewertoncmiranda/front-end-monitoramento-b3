// Unica responsabilidade: regras de leitura do backtest (/validacao/backtest,
// infra#CTR-14). Modulo puro, sem DOM.

/**
 * Nome curto de cada versao, pela posicao em `versoes`: oficial, sombra e a
 * v1 antiga (sem juros), mantida no backtest so para comparar antes e depois.
 */
export function nomeDaVersao(versao, versoes = []) {
  const nomes = ['v1 (oficial)', 'v2 (sombra)', 'v1 antiga (sem juros)'];
  return nomes[versoes.indexOf(versao)] || versao;
}

/**
 * Resumo das compras (COMPRA_*) de uma versao num periodo e horizonte:
 * medias ponderadas por quantidade de janelas. E a pergunta que importa:
 * quando a regra manda comprar, bate a carteira e o CDI?
 */
import { wilson } from './diarioDeSinais.js';

/**
 * Intervalo de 95% da media combinada de varias linhas, a partir de n, media
 * e do intervalo de cada uma (o desvio de cada linha sai da largura do
 * intervalo: sd = (sup - inf) / (2 x 1,96) x raiz(n)). Variancia combinada =
 * dispersao dentro das linhas + dispersao entre as medias.
 */
export function icCombinado(linhas, campoMedia, campoIc) {
  const z = 1.959964;
  const validas = linhas.filter((l) => l[campoMedia] !== null && l[campoMedia] !== undefined && l[campoIc]);
  const n = validas.reduce((s, l) => s + l.avaliados, 0);
  if (n < 2) return null;
  const media = validas.reduce((s, l) => s + Number(l[campoMedia]) * l.avaliados, 0) / n;
  let soma = 0;
  validas.forEach((l) => {
    const sd = ((Number(l[campoIc].superior) - Number(l[campoIc].inferior)) / (2 * z)) * Math.sqrt(l.avaliados);
    soma += (l.avaliados - 1) * sd * sd + l.avaliados * (Number(l[campoMedia]) - media) ** 2;
  });
  const erro = Math.sqrt(soma / (n - 1)) / Math.sqrt(n);
  return { inferior: media - z * erro, superior: media + z * erro };
}

export function resumoDasCompras(placar, versao, periodo, horizonte) {
  const linhas = placar.filter((l) => l.versaoRegra === versao && l.periodo === periodo
    && l.horizonte === horizonte && l.direcao === 1);
  const n = linhas.reduce((s, l) => s + l.avaliados, 0);
  if (!n) return null;
  const media = (campo) => {
    const validas = linhas.filter((l) => l[campo] !== null && l[campo] !== undefined);
    const peso = validas.reduce((s, l) => s + l.avaliados, 0);
    return peso ? validas.reduce((s, l) => s + Number(l[campo]) * l.avaliados, 0) / peso : null;
  };
  const acertos = linhas.reduce((s, l) => s + Math.round(Number(l.taxaAcerto || 0) * l.avaliados), 0);
  return {
    n,
    // Com intervalo por bootstrap nas linhas (infra#TASK-31), combina as
    // larguras delas - Wilson sobre a soma trataria as janelas como
    // independentes e sairia estreito demais.
    icAcerto: linhas.some((l) => l.metodoIntervalo === 'BOOTSTRAP_BLOCOS')
      ? icCombinado(linhas, 'taxaAcerto', 'icAcerto')
      : wilson(acertos, n),
    icExcessoCarteira: icCombinado(linhas, 'excessoMedioCarteira', 'icExcessoCarteira'),
    taxaAcerto: media('taxaAcerto'),
    taxaBase: media('taxaBase'),
    excessoCdi: media('excessoMedioCdi'),
    excessoCarteira: media('excessoMedioCarteira'),
  };
}

/** Linhas de um periodo/horizonte agrupadas por recomendacao, v1 e v2 lado a lado. */
export function linhasLadoALado(placar, periodo, horizonte) {
  const ordem = ['COMPRA_FORTE', 'COMPRA_MODERADA', 'MANTER', 'ALERTA_RISCO', 'VENDA_VALUATION'];
  const filtradas = placar.filter((l) => l.periodo === periodo && l.horizonte === horizonte);
  const recomendacoes = [...new Set(filtradas.map((l) => l.recomendacao))]
    .sort((a, b) => (ordem.indexOf(a) + 99) % 99 - (ordem.indexOf(b) + 99) % 99);
  return recomendacoes.map((recomendacao) => ({
    recomendacao,
    linhas: filtradas.filter((l) => l.recomendacao === recomendacao)
      .sort((a, b) => (a.versaoRegra < b.versaoRegra ? -1 : 1)),
  }));
}
