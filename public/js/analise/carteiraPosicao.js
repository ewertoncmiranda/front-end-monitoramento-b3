// CARTEIRAS-CARDS — Logica pura: posicao de cada ticker derivada das operacoes
// do gestor (COMPRA/VENDA/ESTORNO). Sem DOM, sem rede.
//
// Regras: quantidade = compras - vendas; preco medio = custo medio ponderado
// (compras incluem custos e impostos no custo); venda baixa o custo pelo preco
// medio vigente (resultado realizado = liquido da venda - custo baixado);
// data de entrada = primeira compra da posicao atual (zerou e recomprou =
// nova entrada); operacao estornada (e o proprio estorno) sai do calculo.

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const arred = (v, c = 8) => Math.round(v * 10 ** c) / 10 ** c;

export const CRITERIOS_ORDEM = [
  { valor: 'maior-alta', rotulo: 'Maior alta' },
  { valor: 'maior-queda', rotulo: 'Maior queda' },
  { valor: 'maior-posicao', rotulo: 'Maior posição' },
  { valor: 'ticker', rotulo: 'Ticker (A-Z)' },
  { valor: 'data-entrada', rotulo: 'Data de entrada' },
];

/** Operacoes validas: so COMPRA/VENDA, sem estornos e sem as operacoes que eles anularam. */
export function operacoesEfetivas(operacoes = []) {
  const estornadas = new Set(operacoes
    .filter((o) => o?.tipo === 'ESTORNO' && o.operacaoReferenciadaId)
    .map((o) => o.operacaoReferenciadaId));
  return operacoes.filter((o) => o && (o.tipo === 'COMPRA' || o.tipo === 'VENDA') && !estornadas.has(o.id) && o.simbolo);
}

/** Posicoes por simbolo (inclui as zeradas, com quantidade 0). Ordem cronologica. */
export function derivarPosicoes(operacoes = []) {
  const ordenadas = operacoesEfetivas(operacoes)
    .map((o, i) => ({ o, i }))
    .sort((a, b) => String(a.o.executadaEm).localeCompare(String(b.o.executadaEm)) || a.i - b.i)
    .map((x) => x.o);
  const mapa = new Map();
  for (const op of ordenadas) {
    const simbolo = String(op.simbolo).toUpperCase();
    const qtd = num(op.quantidade);
    const preco = num(op.precoUnitario);
    if (!qtd || qtd <= 0 || preco === null) continue;
    const p = mapa.get(simbolo) ?? { simbolo, quantidade: 0, custoTotal: 0, dataEntrada: null, resultadoRealizado: 0, operacoes: [] };
    const custos = (num(op.custos) ?? 0) + (num(op.impostos) ?? 0);
    if (op.tipo === 'COMPRA') {
      if (p.quantidade <= 0) p.dataEntrada = String(op.executadaEm).slice(0, 10);
      p.quantidade = arred(p.quantidade + qtd);
      p.custoTotal += qtd * preco + custos;
    } else {
      const baixa = Math.min(qtd, p.quantidade);
      const medio = p.quantidade > 0 ? p.custoTotal / p.quantidade : 0;
      p.resultadoRealizado += qtd * preco - custos - baixa * medio;
      p.custoTotal -= baixa * medio;
      p.quantidade = arred(p.quantidade - baixa);
      if (p.quantidade <= 0) { p.quantidade = 0; p.custoTotal = 0; p.dataEntrada = null; }
    }
    p.operacoes.push(op);
    mapa.set(simbolo, p);
  }
  return [...mapa.values()].map((p) => ({
    ...p,
    precoMedio: p.quantidade > 0 ? p.custoTotal / p.quantidade : null,
  }));
}

export const posicoesAbertas = (operacoes) => derivarPosicoes(operacoes).filter((p) => p.quantidade > 0);

/** Dias corridos entre duas datas AAAA-MM-DD (hoje por padrao). */
export function diasNaCarteira(dataEntrada, hoje = new Date().toISOString().slice(0, 10)) {
  if (!dataEntrada) return null;
  const d = (Date.parse(`${hoje}T00:00:00Z`) - Date.parse(`${String(dataEntrada).slice(0, 10)}T00:00:00Z`)) / 86400000;
  return Number.isFinite(d) ? Math.max(0, Math.round(d)) : null;
}

/** Avalia uma posicao com o preco de mercado. Preco ausente => valor, resultado e % ficam null (nunca 0). */
export function avaliarPosicao(posicao, mercado = {}) {
  const preco = num(mercado.preco);
  const valorAtual = preco === null ? null : arred(posicao.quantidade * preco, 2);
  const custo = arred(posicao.custoTotal, 2);
  const resultado = valorAtual === null ? null : arred(valorAtual - custo, 2);
  return {
    ...posicao,
    legado: false,
    custoTotal: custo,
    precoAtual: preco,
    dataPreco: mercado.dataPreco ?? null,
    valorAtual,
    resultado,
    resultadoPct: resultado === null || custo <= 0 ? null : resultado / custo,
    dias: diasNaCarteira(posicao.dataEntrada, mercado.hoje),
    serie: mercado.serie ?? [],
    setor: mercado.setor ?? null,
  };
}

/** Ativo legado (so capital, sem operacoes): sem quantidade; % so se houver preco de entrada. */
export function posicaoLegada(ativo, mercado = {}) {
  const capital = num(ativo.capital);
  const preco = num(mercado.preco);
  const precoEntrada = num(mercado.precoEntrada);
  const calcula = preco !== null && precoEntrada;
  return {
    simbolo: String(ativo.simbolo).toUpperCase(),
    legado: true,
    capital,
    dataEntrada: ativo.dataEntrada ?? null,
    quantidade: null,
    precoMedio: null,
    custoTotal: capital,
    precoAtual: preco,
    dataPreco: mercado.dataPreco ?? null,
    precoEntrada,
    valorAtual: calcula ? arred((capital ?? 0) * (preco / precoEntrada), 2) : null,
    resultado: calcula ? arred((capital ?? 0) * (preco / precoEntrada - 1), 2) : null,
    resultadoPct: calcula ? preco / precoEntrada - 1 : null,
    dias: diasNaCarteira(ativo.dataEntrada, mercado.hoje),
    serie: mercado.serie ?? [],
    setor: mercado.setor ?? null,
  };
}

/** Conversao legado -> quantidade: so com fechamento na data de entrada; inteiro para baixo, sobra informada. */
export function converterCapitalEmQuantidade(capital, precoEntrada) {
  const c = num(capital);
  const p = num(precoEntrada);
  if (c === null || p === null || p <= 0 || c <= 0) return null;
  const quantidade = Math.floor(c / p);
  if (quantidade < 1) return null;
  return { quantidade, precoUnitario: p, sobra: arred(c - quantidade * p, 2) };
}

/** Participacao (fracao) de cada posicao no valor atual total; sem preco = null. */
export function comParticipacao(posicoes) {
  const total = posicoes.reduce((s, p) => s + (p.valorAtual ?? 0), 0);
  return posicoes.map((p) => ({ ...p, participacao: p.valorAtual === null || total <= 0 ? null : p.valorAtual / total }));
}

/**
 * Totais, melhor e pior ativo (por %). Legados ficam fora do resultado (nao tem quantidade).
 * Proventos recebidos e estimados entram separados; o retorno total so soma os recebidos,
 * e `retornoTotalComEstimados` e um segundo numero, sempre rotulado a parte.
 */
export function resumirCarteira(posicoes, { proventosRecebidos = null, proventosEstimados = null } = {}) {
  const reais = posicoes.filter((p) => !p.legado);
  const avaliadas = reais.filter((p) => p.valorAtual !== null);
  const investido = arred(reais.reduce((s, p) => s + p.custoTotal, 0), 2);
  const valorAtual = arred(avaliadas.reduce((s, p) => s + p.valorAtual, 0), 2);
  const custoAvaliado = avaliadas.reduce((s, p) => s + p.custoTotal, 0);
  const resultado = avaliadas.length ? arred(valorAtual - custoAvaliado, 2) : null;
  const ordenado = avaliadas.filter((p) => p.resultadoPct !== null).sort((a, b) => b.resultadoPct - a.resultadoPct);
  const datas = posicoes.map((p) => p.dataPreco).filter(Boolean).sort();
  const rec = num(proventosRecebidos);
  const est = num(proventosEstimados);
  const pct = (prov) => (resultado !== null && custoAvaliado > 0 ? (resultado + prov) / custoAvaliado : null);
  return {
    numeroAtivos: posicoes.length,
    legados: posicoes.length - reais.length,
    semPreco: reais.length - avaliadas.length,
    investido,
    valorAtual: avaliadas.length ? valorAtual : null,
    resultado,
    resultadoPct: resultado === null || custoAvaliado <= 0 ? null : resultado / custoAvaliado,
    melhor: ordenado[0] ?? null,
    pior: ordenado.length > 1 ? ordenado[ordenado.length - 1] : null,
    dataUltimoPreco: datas.length ? datas[datas.length - 1] : null,
    proventosRecebidos: rec,
    proventosEstimados: est,
    yieldOnCostRecebido: rec !== null && investido > 0 ? rec / investido : null,
    retornoTotal: rec !== null ? pct(rec) : null,
    retornoTotalComEstimados: rec !== null || est !== null ? pct((rec ?? 0) + (est ?? 0)) : null,
  };
}

/** Limite de concentracao: acima dele o ativo (ou setor) ganha aviso. */
export const LIMITE_CONCENTRACAO = 0.3;

/** Alocacao por ativo ou por setor (sem setor = "Sem setor"), maior primeiro, com destaque de concentracao. */
export function alocacao(posicoes, por = 'ativo', limite = LIMITE_CONCENTRACAO) {
  const grupos = new Map();
  for (const p of posicoes) {
    if (p.valorAtual === null || p.valorAtual === undefined) continue;
    const rotulo = por === 'setor' ? (p.setor || 'Sem setor') : p.simbolo;
    grupos.set(rotulo, (grupos.get(rotulo) ?? 0) + p.valorAtual);
  }
  const total = [...grupos.values()].reduce((s, v) => s + v, 0);
  return [...grupos.entries()]
    .map(([rotulo, valor]) => ({ rotulo, valor: arred(valor, 2), fracao: total > 0 ? valor / total : 0, concentrado: total > 0 && valor / total > limite }))
    .sort((a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo));
}

const CHAVES = {
  'maior-alta': [(p) => p.resultadoPct, -1],
  'maior-queda': [(p) => p.resultadoPct, 1],
  'maior-posicao': [(p) => p.valorAtual, -1],
  'data-entrada': [(p) => p.dataEntrada ?? null, 1],
  ticker: [(p) => p.simbolo, 1],
};

/** Ordena sem mudar a lista original; ausentes (null) sempre por ultimo. */
export function ordenarPosicoes(posicoes, criterio = 'maior-posicao') {
  const [f, dir] = CHAVES[criterio] ?? CHAVES['maior-posicao'];
  return [...posicoes].sort((a, b) => {
    const va = f(a);
    const vb = f(b);
    if (va === null && vb === null) return a.simbolo.localeCompare(b.simbolo);
    if (va === null) return 1;
    if (vb === null) return -1;
    const c = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return (c * dir) || a.simbolo.localeCompare(b.simbolo);
  });
}

/** Filtro por texto no ticker ou setor (sem acento, sem caixa). */
export function filtrarPosicoes(posicoes, texto = '') {
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(texto).trim();
  return q ? posicoes.filter((p) => norm(p.simbolo).includes(q) || norm(p.setor).includes(q)) : posicoes;
}

/** Total estimado de uma ordem (quantidade x preco + custos), 2 casas; null se invalido. */
export function totalEstimado(quantidade, preco, custos = 0) {
  const q = num(quantidade);
  const p = num(preco);
  if (q === null || p === null || q <= 0 || p <= 0) return null;
  return arred(q * p + (num(custos) ?? 0), 2);
}
