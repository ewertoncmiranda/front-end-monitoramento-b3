// MACRO-PAI-2: calculos puros sobre as series de indice_macro. O backend
// devolve [{data:'2026-10-01', valor: 13.75}, ...] do mais recente ao mais
// antigo; aqui nada busca rede nem toca DOM.

/** Pontos validos, do mais antigo ao mais recente. */
export function emOrdem(pontos = []) {
  return (pontos || [])
    .filter((p) => p && p.data && Number.isFinite(Number(p.valor)))
    .map((p) => ({ data: String(p.data).slice(0, 10), valor: Number(p.valor) }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** "AAAA-MM-DD" recuado n meses (dia preso ao fim do mes curto). */
export function mesesAntes(data, meses) {
  const [ano, mes, dia] = data.split('-').map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 - meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(dia, ultimoDia));
  return alvo.toISOString().slice(0, 10);
}

/** Ultimo ponto com data <= alvo; null se a serie nao chega tao longe. */
export function valorEm(ordenados, alvo) {
  let achado = null;
  for (const p of ordenados) {
    if (p.data > alvo) break;
    achado = p;
  }
  return achado;
}

/**
 * Variacao contra 1, 3 e 12 meses antes do ultimo ponto.
 * tipo 'pp': taxas (Selic, CDI, IPCA...) mudam em pontos percentuais.
 * tipo 'pct': precos e indices de nivel (dolar, euro, IBC-Br) mudam em %.
 */
export function variacoes(pontos, tipo = 'pp') {
  const ordenados = emOrdem(pontos);
  const atual = ordenados.at(-1) || null;
  const vazio = { atual, m1: null, m3: null, m12: null };
  if (!atual) return vazio;
  const contra = (meses) => {
    const antes = valorEm(ordenados, mesesAntes(atual.data, meses));
    if (!antes || antes.data === atual.data) return null;
    if (tipo === 'pct') return antes.valor === 0 ? null : (atual.valor / antes.valor - 1) * 100;
    return atual.valor - antes.valor;
  };
  return { atual, m1: contra(1), m3: contra(3), m12: contra(12) };
}

/**
 * Acumulado composto dos ultimos 12 pontos MENSAIS em % (IPCA 433, IGP-M 189).
 * Exige 12 meses consecutivos; buraco no meio devolve null em vez de inventar.
 */
export function acumulado12m(pontos) {
  const ordenados = emOrdem(pontos);
  if (ordenados.length < 12) return null;
  const ultimos = ordenados.slice(-12);
  for (let i = 1; i < ultimos.length; i++) {
    if (mesesAntes(ultimos[i].data, 1).slice(0, 7) !== ultimos[i - 1].data.slice(0, 7)) return null;
  }
  const fator = ultimos.reduce((acc, p) => acc * (1 + p.valor / 100), 1);
  return (fator - 1) * 100;
}

/** Pontos dos ultimos 12 meses (para o sparkline), do mais antigo ao mais recente. */
export function janela12m(pontos) {
  const ordenados = emOrdem(pontos);
  const atual = ordenados.at(-1);
  if (!atual) return [];
  const corte = mesesAntes(atual.data, 12);
  return ordenados.filter((p) => p.data >= corte);
}

/** "+0,25 p.p." / "-1,8%" / "—". */
export function formatarVariacao(valor, tipo = 'pp') {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
  // CDI diario varia na 4a casa: abaixo de meio centesimo vira 0,00 sem sinal.
  const sinal = valor >= 0.005 ? '+' : valor <= -0.005 ? '−' : '';
  const numero = Math.abs(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sinal}${numero}${tipo === 'pct' ? '%' : ' p.p.'}`;
}
