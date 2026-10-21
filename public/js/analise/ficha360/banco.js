// FONTES-PAI-2 (DEC-FONTES-1): logica pura da ficha de banco. Bancos sao
// avaliados por P/VP x ROE e Basileia, nao por Graham/EBITDA/divida.
const num = (v) => v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v);

export const INDICADORES_BANCO = Object.freeze([
  { campo: 'basileia', rotulo: 'Índice de Basileia' },
  { campo: 'capitalPrincipal', rotulo: 'Capital principal' },
  { campo: 'inadimplencia', rotulo: 'Inadimplência' },
  { campo: 'roe', rotulo: 'ROE' },
]);


export const SELOS = Object.freeze({
  OK: { texto: 'Em dia', icone: '✔', classe: 'text-success' },
  ACIMA: { texto: 'Acima', icone: '▲', classe: 'text-success' },
  ALERTA: { texto: 'Atenção', icone: '⚠', classe: 'text-warning' },
  ABAIXO: { texto: 'Abaixo', icone: '▼', classe: 'text-danger' },
  SEM_DADO: { texto: 'Sem dado', icone: '—', classe: 'text-body-secondary' },
});
const NOME_SELO = { BASILEIA: 'Basileia', INADIMPLENCIA: 'Inadimplência', ROE: 'ROE' };

export function seloVisual(status) { return SELOS[status] || SELOS.SEM_DADO; }
export function nomeDoSelo(tipo) { return NOME_SELO[tipo] || String(tipo || ''); }

/** "2026-06-30" -> "2T/26"; invalido -> "—". */
export function rotuloTrimestre(dataBase) {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(String(dataBase || ''));
  if (!m) return '—';
  return `${Math.ceil(Number(m[2]) / 3)}T/${m[1].slice(2)}`;
}

export function serieDoCampo(serie = [], campo) {
  return (Array.isArray(serie) ? serie : [])
    .map((t) => ({ periodo: rotuloTrimestre(t?.dataBase), valor: num(t?.[campo]) }))
    .filter((p) => p.valor !== null);
}

/**
 * Estado da secao a partir da resposta do gestor:
 * 'nao-banco' (ou falha/null) -> secao inalterada; 'sem-dados' -> aviso com motivo;
 * 'banco' -> painel completo.
 */
export function modeloBanco(dto) {
  if (!dto || dto.ehBanco !== true) return { estado: 'nao-banco' };
  const ultimo = dto.ultimoTrimestre || null;
  const serie = Array.isArray(dto.serie) ? dto.serie : [];
  if (!ultimo && !serie.length) return { estado: 'sem-dados', motivo: dto.motivo || 'Sem dados do IF.data para este banco.', pvp: num(dto.pvp), pvpMotivo: dto.pvpMotivo || null };
  return {
    estado: 'banco',
    trimestre: rotuloTrimestre(ultimo?.dataBase),
    indicadores: INDICADORES_BANCO.map((i) => ({ ...i, valor: num(ultimo?.[i.campo]), serie: serieDoCampo(serie, i.campo) })),
    pvp: num(dto.pvp), pvpMotivo: dto.pvpMotivo || null,
    roeSobrePvp: num(dto.roeSobrePvp),
    selos: (Array.isArray(dto.selos) ? dto.selos : []).map((s) => ({ ...s, nome: nomeDoSelo(s.tipo), visual: seloVisual(s.status) })),
    leitura: dto.leitura || null,
    motivo: dto.motivo || null,
  };
}
