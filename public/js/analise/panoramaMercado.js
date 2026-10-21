// Unica responsabilidade: funcoes puras (sem DOM) para o card de setores x
// empresas do carrossel de mercado (MERC-PAI-2). Testavel diretamente com node.

/** Texto legivel do selo de coesao do setor (JUNTO | MISTO | DISPERSO). */
export function textoSelo(selo) {
  if (selo === 'JUNTO') return 'andou junto';
  if (selo === 'DISPERSO') return 'disperso';
  return 'misto';
}

/**
 * Valor maximo absoluto entre os itens para normalizar a barra; retorna 1 se
 * a lista for vazia ou todos os valores forem zero (evita divisao por zero).
 */
export function escalaBarras(itens, fnValor) {
  if (!itens || !itens.length) return 1;
  const max = itens.reduce((m, item) => Math.max(m, Math.abs(fnValor(item) ?? 0)), 0);
  return max || 1;
}

/** true se nomeBloco esta em indisponivel (array). */
export function estadoVazioBloco(indisponivel, nomeBloco) {
  return Array.isArray(indisponivel) && indisponivel.includes(nomeBloco);
}

/**
 * Ordena setores por variacaoMediana decrescente.
 * "Outros" sempre por ultimo, independente do valor.
 * Nao reordena dentro de melhores/piores (essas listas chegam prontas do gestor).
 */
export function setoresOrdenados(setores) {
  if (!Array.isArray(setores) || !setores.length) return [];
  const outros = setores.filter((s) => s.nome === 'Outros');
  const resto = setores.filter((s) => s.nome !== 'Outros');
  resto.sort((a, b) => (b.variacaoMediana ?? 0) - (a.variacaoMediana ?? 0));
  return [...resto, ...outros];
}

/**
 * Formata desvio (racio, ex.: 0.0123) como '+1,23 pp' ou '-0,45 pp'.
 * O sufixo "pp" indica pontos percentuais.
 */
export function formatarDesvio(desvio) {
  if (desvio === null || desvio === undefined) return '+0,00 pp';
  const v = Number(desvio) * 100;
  const sinal = v >= 0 ? '+' : '';
  return `${sinal}${v.toFixed(2).replace('.', ',')} pp`;
}

/**
 * Formata variacaoMediana (racio) como percentual com sinal: '+2,30%'.
 */
export function formatarVariacaoSetor(v) {
  if (v === null || v === undefined) return '+0,00%';
  const num = Number(v) * 100;
  const sinal = num >= 0 ? '+' : '';
  return `${sinal}${num.toFixed(2).replace('.', ',')}%`;
}
