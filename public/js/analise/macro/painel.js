// MACRO-PAI-1/3: logica pura do cabecalho de decisao e do bloco "Ativos acima
// da barreira". Recebe o JSON de GET /indices-macro/painel (camelCase).
const ehNumero = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

export function pct(v, casas = 2) {
  return ehNumero(v) ? `${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%` : '—';
}

// Cada ciclo tem texto + icone + tom: o significado nao depende so da cor.
const CICLOS = {
  ALTA: { rotulo: 'ALTA', icone: '▲', tom: 'danger' },
  QUEDA: { rotulo: 'QUEDA', icone: '▼', tom: 'success' },
  ESTAVEL: { rotulo: 'ESTÁVEL', icone: '■', tom: 'secondary' },
};
export function seloCiclo(ciclo) {
  return CICLOS[String(ciclo || '').toUpperCase()] || null;
}

function serieDe(painel, codigo) {
  return (painel?.series || []).find((x) => x?.codigo === codigo) || null;
}

// Valor do Focus pelo codigo, vindo de painel.series (null se ausente/sem valor).
export function valorSerie(painel, codigo) {
  const s = serieDe(painel, codigo);
  return s && ehNumero(s.valor) ? Number(s.valor) : null;
}

// Quatro indicadores do cabecalho. Bloco ausente vira valor null + motivo.
export function indicadoresDecisao(painel, ano) {
  const jr = painel?.juroReal;
  const ci = painel?.cicloSelic;
  const ba = painel?.barreira;
  const selic = valorSerie(painel, `FOCUS_SELIC_${ano}`);
  const ipca = valorSerie(painel, `FOCUS_IPCA_${ano}`);
  const fs = serieDe(painel, `FOCUS_SELIC_${ano}`);
  const fi = serieDe(painel, `FOCUS_IPCA_${ano}`);
  return [
    { id: 'juro-real', titulo: 'Juro real', valor: jr && ehNumero(jr.valor) ? pct(jr.valor) : null,
      detalhe: jr && ehNumero(jr.selicMeta) ? `Selic ${pct(jr.selicMeta)} vs IPCA esperado ${pct(jr.ipcaEsperado)}` : null,
      leitura: jr?.leitura || null, motivo: jr?.motivo || (jr ? null : 'Bloco indisponível') },
    { id: 'ciclo', titulo: 'Ciclo da Selic', valor: null, selo: seloCiclo(ci?.ciclo),
      detalhe: ci && ehNumero(ci.metaAtual) ? `Meta ${pct(ci.metaAtual)}${ehNumero(ci.meta90DiasAntes) ? ` (90 dias antes: ${pct(ci.meta90DiasAntes)})` : ''}` : null,
      leitura: ci?.leitura || null, motivo: ci?.motivo || (ci ? null : 'Bloco indisponível') },
    { id: 'focus', titulo: `Focus ${ano}`, valor: selic !== null || ipca !== null ? `Selic ${pct(selic)} · IPCA ${pct(ipca)}` : null,
      detalhe: null, leitura: fs?.leitura || fi?.leitura || null,
      motivo: fs?.motivo || fi?.motivo || 'Focus indisponível' },
    { id: 'barreira', titulo: 'Barreira de compra', valor: ba && ehNumero(ba.earningsYieldMinimo) ? pct(ba.earningsYieldMinimo) : null,
      detalhe: ba && ehNumero(ba.earningsYieldMediano) ? `Mediana da base ${pct(ba.earningsYieldMediano)}` : null,
      leitura: ba?.leitura || null, motivo: ba?.motivo || (ba ? null : 'Bloco indisponível') },
  ];
}

// O painel so vale um cabecalho se ao menos um indicador tem valor.
export function temDados(painel, ano = new Date().getFullYear()) {
  return indicadoresDecisao(painel, ano).some((i) => i.valor !== null || i.selo);
}

// MACRO-PAI-3: ativos acima da barreira com a distancia (p.p.) ate ela.
export function ativosAcima(barreira) {
  const min = ehNumero(barreira?.earningsYieldMinimo) ? Number(barreira.earningsYieldMinimo) : null;
  return (barreira?.ativosAcimaDaBarreira || [])
    .filter((a) => a?.simbolo && ehNumero(a.earningsYield))
    .map((a) => ({ simbolo: String(a.simbolo).toUpperCase(), earningsYield: Number(a.earningsYield),
      distancia: min === null ? null : Number(a.earningsYield) - min }));
}

export function distanciaTexto(d) {
  return d === null ? '' : `${d >= 0 ? '+' : '−'}${Math.abs(d).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} p.p. da barreira`;
}
