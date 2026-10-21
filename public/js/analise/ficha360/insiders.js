// Unica responsabilidade: logica pura da secao "Quem esta dentro" (insiders e
// recompras). Sem DOM; recebe os DTOs do gestor (FONTES-GES-3) e devolve
// estruturas prontas para exibir.

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

export const SINAIS = Object.freeze({
  COMPRA_LIQUIDA: { texto: 'Compra líquida', icone: '▲', classe: 'text-success' },
  VENDA_LIQUIDA: { texto: 'Venda líquida', icone: '▼', classe: 'text-danger' },
  NEUTRO: { texto: 'Neutro', icone: '●', classe: 'text-secondary' },
});

export const CARGOS = Object.freeze(['Diretor', 'Conselho de Administração', 'Controlador', 'Conselho Fiscal', 'Órgão Estatutário']);

export function seloDoSinal(sinal) {
  return SINAIS[sinal] || SINAIS.NEUTRO;
}

/** ok=false quando ausente (503/404), ou disponivel=false; motivo sempre texto. */
export function estadoDados(dto, rotuloAusente = 'Dados indisponíveis no momento.') {
  if (!dto || typeof dto !== 'object') return { ok: false, motivo: rotuloAusente };
  if (dto.disponivel === false) return { ok: false, motivo: dto.motivo || rotuloAusente };
  return { ok: true, motivo: null };
}

function linhaAgregado(rotulo, ag) {
  return {
    rotulo,
    compraLiquidaQuantidade: num(ag?.compraLiquidaQuantidade),
    compraLiquidaVolume: num(ag?.compraLiquidaVolume),
    compras: num(ag?.quantidadeCompras),
    vendas: num(ag?.quantidadeVendas),
    movimentacoes: num(ag?.movimentacoes) ?? 0,
  };
}

/** Janelas ordenadas (3, 6, 12) com total e abertura por cargo na ordem canonica. */
export function janelasInsiders(dto) {
  const janelas = Array.isArray(dto?.janelas) ? dto.janelas : [];
  return [...janelas]
    .filter((j) => num(j?.meses) !== null)
    .sort((a, b) => a.meses - b.meses)
    .map((j) => {
      const porCargo = j.porCargo && typeof j.porCargo === 'object' ? j.porCargo : {};
      const extras = Object.keys(porCargo).filter((c) => !CARGOS.includes(c));
      const cargos = [...CARGOS.filter((c) => porCargo[c]), ...extras].map((c) => linhaAgregado(c, porCargo[c]));
      return { meses: j.meses, total: linhaAgregado('Total', j.total), cargos };
    });
}

/** Barras: proporcao do maior valor absoluto; zero e ausente ficam sem barra. */
export function barrasPorJanela(janelas) {
  const valores = janelas.map((j) => j.total.compraLiquidaQuantidade ?? 0);
  const max = Math.max(0, ...valores.map(Math.abs));
  return janelas.map((j, i) => ({
    meses: j.meses,
    valor: j.total.compraLiquidaQuantidade,
    proporcao: max > 0 ? Math.abs(valores[i]) / max : 0,
    sentido: valores[i] > 0 ? 'compra' : valores[i] < 0 ? 'venda' : 'neutro',
  }));
}

/** Serie de recompras em ordem cronologica; recompraLiquida positiva = recompra. */
export function serieRecompras(dto) {
  const serie = Array.isArray(dto?.serie) ? dto.serie : [];
  return [...serie]
    .filter((p) => p?.dataBase)
    .sort((a, b) => String(a.dataBase).localeCompare(String(b.dataBase)))
    .map((p) => ({
      dataBase: p.dataBase,
      tipoDoc: p.tipoDoc || null,
      saldo: num(p.saldo),
      variacao: num(p.variacao),
      recompraLiquida: num(p.recompraLiquida),
    }));
}

export const AVISO_RECOMPRA = 'Variação positiva do saldo de ações em tesouraria pode incluir cancelamento de ações ou entrega a plano de remuneração; o dado não distingue.';
export const NOTA_LEITURA = 'Este é um sinal de confirmação, não um gatilho: o dado chega com atraso, pois vale a partir da entrega à CVM.';
