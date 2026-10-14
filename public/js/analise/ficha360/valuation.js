import { formatarMoeda, formatarNumero } from '../../utils/numero.js';

const n = (v) => v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v);
export function faixaMultiplo(valor, tipo) {
  const v = n(valor);
  if (v === null) return { classe: 'text-body-secondary', rotulo: 'sem dado' };
  if (v <= 0) return { classe: 'text-danger', rotulo: 'não significativo' };
  const limites = tipo === 'pl' ? [15, 25] : tipo === 'ev_ebitda' ? [8, 12] : [1.5, 3];
  return v <= limites[0] ? { classe: 'text-success', rotulo: 'baixo' }
    : v <= limites[1] ? { classe: 'text-warning', rotulo: 'intermediário' }
      : { classe: 'text-danger', rotulo: 'alto' };
}

export function modeloValuation(fundamentos = {}) {
  const lpa = n(fundamentos.lpa); const preco = n(fundamentos.preco_referencia);
  const setorial = n(fundamentos.pl_setorial_mediana);
  const defasagem = n(fundamentos.defasagem_dias);
  return {
    graham: n(fundamentos.graham_number),
    pl: n(fundamentos.pl ?? fundamentos.preco_lucro),
    plSetorial: setorial,
    precoImplicitoSetorial: lpa !== null && setorial !== null ? lpa * setorial : null,
    evEbitda: n(fundamentos.ev_ebitda),
    pvp: n(fundamentos.preco_valor_patrimonial),
    preco,
    fonte: fundamentos.fonte || null,
    periodo: fundamentos.periodo || null,
    defasagemDias: defasagem,
  };
}

export function formatarValor(valor, casas = 2) {
  return valor === null || valor === undefined ? '—' : formatarNumero(valor, casas);
}
export function formatarValorMonetario(valor) { return valor === null || valor === undefined ? '—' : formatarMoeda(valor); }
