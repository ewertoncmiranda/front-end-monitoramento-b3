// Unica responsabilidade: logica pura do bloco "Rendimento contra renda fixa"
// (FONTES-PAI-1) a partir do DTO de GET /ativos/{simbolo}/premio-risco.
// Nao altera a regra oficial de recomendacao: so organiza a exibicao.

const n = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

const SELOS = {
  ACIMA_DA_RENDA_FIXA: { texto: 'Acima da renda fixa', icone: '▲', classe: 'text-success' },
  ABAIXO_DA_RENDA_FIXA: { texto: 'Abaixo da renda fixa', icone: '▼', classe: 'text-danger' },
  IGUAL_A_RENDA_FIXA: { texto: 'Igual à renda fixa', icone: '=', classe: 'text-body-secondary' },
};

export function seloDoVeredito(veredito, premio) {
  if (SELOS[veredito]) return SELOS[veredito];
  const p = n(premio);
  if (p === null) return null;
  return SELOS[p > 0 ? 'ACIMA_DA_RENDA_FIXA' : p < 0 ? 'ABAIXO_DA_RENDA_FIXA' : 'IGUAL_A_RENDA_FIXA'];
}

/** Nunca lanca: DTO nulo (503/404) ou com campos nulos vira { disponivel:false, motivo }. */
export function modeloPremioRisco(dto) {
  if (!dto || typeof dto !== 'object') {
    return { disponivel: false, motivo: 'Comparação com a renda fixa indisponível no momento.', selicMeta: null };
  }
  const earningsYield = n(dto.earningsYield);
  const juroReal = n(dto.juroReal);
  const selicMeta = n(dto.selicMeta);
  if (earningsYield === null || juroReal === null) {
    return { disponivel: false, selicMeta, motivo: dto.motivo || 'Sem dados para comparar com a NTN-B.' };
  }
  const premio = n(dto.premioRisco) ?? (earningsYield - juroReal);
  const premioSobreSelic = n(dto.premioSobreSelic) ?? (selicMeta !== null ? earningsYield - selicMeta : null);
  return {
    disponivel: true, motivo: dto.motivo || null,
    earningsYield, juroReal, selicMeta, premio, premioSobreSelic,
    vencimento: dto.vencimentoReferencia || null, dataBase: dto.dataBase || null,
    selo: seloDoVeredito(dto.veredito, premio),
    seloSelic: premioSobreSelic === null ? null : seloDoVeredito(null, premioSobreSelic),
    leitura: dto.leitura || null,
  };
}

/**
 * Graham ajustado pelo juro: V x 4,4 / Y. V e o valor justo atual (Graham
 * Number); Y e o juro nominal de referencia em % a.a. - aqui a Selic meta, que
 * substitui o rendimento AAA da formula original. Y <= 0 ou ausente = null.
 */
export function grahamAjustadoPeloJuro(valorGraham, jurosNominalPct) {
  const v = n(valorGraham); const y = n(jurosNominalPct);
  if (v === null || y === null || y <= 0) return null;
  return v * 4.4 / y;
}

export function formatarPontos(valor, casas = 2) {
  const v = n(valor);
  if (v === null) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(casas).replace('.', ',')} p.p.`;
}
export function formatarPercentual(valor, casas = 2) {
  const v = n(valor);
  return v === null ? '—' : `${v.toFixed(casas).replace('.', ',')}%`;
}
export function formatarData(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
}
