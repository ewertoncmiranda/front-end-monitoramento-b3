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
  return {
    n,
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
