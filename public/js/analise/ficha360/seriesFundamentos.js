const num = (v) => v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v);

export const METRICAS_FUNDAMENTOS = Object.freeze([
  { grupo: 'Rentabilidade', itens: [['roe', 'ROE', 'pct'], ['roic', 'ROIC', 'pct'], ['margem_liquida', 'Margem líquida', 'pct']] },
  { grupo: 'Endividamento', itens: [['divida_liquida_ebitda', 'Dívida líquida / EBITDA', 'numero'], ['cobertura_juros', 'Cobertura de juros', 'numero']] },
  { grupo: 'Liquidez', itens: [['liquidez_corrente', 'Liquidez corrente', 'numero'], ['liquidez_seca', 'Liquidez seca', 'numero'], ['dso', 'DSO (dias)', 'numero']] },
  { grupo: 'Resultado', itens: [['receita_liquida', 'Receita líquida', 'moeda'], ['ebitda', 'EBITDA', 'moeda'], ['lucro_liquido', 'Lucro líquido', 'moeda']] },
]);

export function serieDaMetrica(pontos = [], metrica) {
  return pontos.map((p) => {
    const value = metrica === 'divida_liquida_ebitda'
      ? (num(p?.divida_liquida) !== null && num(p?.ebitda) !== null && num(p.ebitda) !== 0 ? num(p.divida_liquida) / num(p.ebitda) : null)
      : num(p?.[metrica]);
    return { periodo: p.periodo, valor: value };
  }).filter((p) => p.valor !== null);
}

export function direcaoDaSerie(serie = []) {
  if (serie.length < 2) return { simbolo: '—', direcao: 'indisponível' };
  const inicial = serie[0].valor; const final = serie.at(-1).valor;
  if (inicial === final) return { simbolo: '→', direcao: 'estável' };
  return final > inicial ? { simbolo: '↑', direcao: 'em alta' } : { simbolo: '↓', direcao: 'em queda' };
}

export function itemAtual(fundamentos = {}, historico = [], metrica) {
  const valor = metrica === 'divida_liquida_ebitda'
    ? (num(fundamentos.divida_liquida) !== null && num(fundamentos.ebitda) !== null && num(fundamentos.ebitda) !== 0 ? num(fundamentos.divida_liquida) / num(fundamentos.ebitda) : null)
    : num(fundamentos[metrica]);
  const serie = serieDaMetrica(historico, metrica);
  if (valor !== null && (!serie.length || serie.at(-1).valor !== valor)) serie.push({ periodo: fundamentos.periodo || null, valor });
  return { valor, serie, direcao: direcaoDaSerie(serie) };
}
