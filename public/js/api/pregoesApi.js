// Unica responsabilidade: conhecer /ativos/{simbolo}/pregoes (infra#CTR-15) -
// velas de qualquer periodo desde 2016, lidas do banco (COTAHIST da B3 e,
// nos dias recentes, BRAPI) - e normalizar para o formato do grafico, o mesmo
// de historicoApi.extrairCandles. Nao gasta cota da BRAPI.
import { httpGet } from './httpClient.js';

// Periodos longos: a BRAPI gratuita so vai ate 3 meses, o banco vai a 2016.
// `intervalo` e o padrao ao escolher o periodo (legivel na tela); da para trocar.
export const RANGES_DO_BANCO = [
  { valor: '6m', rotulo: '6 meses', meses: 6, intervalo: 'dia' },
  { valor: '1a', rotulo: '1 ano', meses: 12, intervalo: 'dia' },
  { valor: '5a', rotulo: '5 anos', meses: 60, intervalo: 'semana' },
  { valor: 'max', rotulo: 'Desde 2016', meses: null, intervalo: 'mes' },
];

export const INTERVALOS = [
  { valor: 'dia', rotulo: 'Dia' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
];

export function rangeDoBanco(valor) {
  return RANGES_DO_BANCO.find((r) => r.valor === valor) || null;
}

/** Data inicial (AAAA-MM-DD) de um periodo do banco, contada a partir de `hoje`. */
export function inicioDoRange(valor, hoje = new Date()) {
  const range = rangeDoBanco(valor);
  if (!range || range.meses === null) return '2016-01-01';
  const inicio = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - range.meses, hoje.getUTCDate()));
  return inicio.toISOString().slice(0, 10);
}

export function buscarPregoes(simbolo, { de, ate, intervalo = 'dia' } = {}) {
  const params = new URLSearchParams({ intervalo });
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}/pregoes?${params.toString()}`);
}

/**
 * Velas no formato do grafico e dos detectores. Preco bruto: fator de
 * ajuste 1 (o banco nao tem proventos), e quem mostra avisa.
 */
export function velasDoBanco(resposta) {
  return (resposta?.velas || []).map((v) => {
    const [ano, mes, dia] = v.data.split('-');
    return {
      open: Number(v.abertura),
      high: Number(v.maxima),
      low: Number(v.minima),
      close: Number(v.fechamento),
      volume: v.volume,
      numeroNegocios: v.numeroNegocios ?? null,
      volumeFinanceiro: v.volumeFinanceiro ?? null, // o gestor ainda nao expoe (pedido a Sessao 01); sem ele o ticket e estimado
      dataIso: v.data,
      dataFim: v.dataFim,
      dataFormatada: `${dia}/${mes}/${ano}`,
      pregoes: v.pregoes,
      codigo: v.codigo,
      fonte: v.fonte,
      fatorAjuste: 1,
    };
  });
}
