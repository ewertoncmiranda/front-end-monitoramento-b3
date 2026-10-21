// MICRO-PAI-1: marcadores de data ex. Modulo puro (sem DOM).

export const MARCAS_EX = {
  EB: { curto: 'Bonif.', nome: 'Bonificação' },
  ED: { curto: 'Div.', nome: 'Dividendo' },
  EG: { curto: 'Grup.', nome: 'Grupamento' },
  EJ: { curto: 'JCP', nome: 'JCP' }, // juros sobre capital proprio
  ER: { curto: 'Rest.', nome: 'Restituição de capital' },
  ES: { curto: 'Subscr.', nome: 'Subscrição' },
  EX: { curto: 'Outro', nome: 'Outro/desdobramento' },
};

/** "EJ" -> ['EJ']; "EJED", "EJ,ED", "EJ+ED" -> ['EJ','ED']. */
export function codigosDaMarca(marca) {
  if (typeof marca !== 'string') return [];
  const limpo = marca.toUpperCase().replace(/[^A-Z]/g, '');
  const codigos = [];
  for (let i = 0; i < limpo.length; i += 2) codigos.push(limpo.slice(i, i + 2));
  return codigos;
}

/** "Data ex: JCP (EJ)"; combinacoes juntam os nomes; desconhecida = "evento". */
export function descricaoDaMarca(marca) {
  const codigos = codigosDaMarca(marca);
  if (!codigos.length) return '';
  const nomes = codigos.map((c) => MARCAS_EX[c]?.nome || 'evento');
  return `Data ex: ${nomes.join(' + ')} (${codigos.join('+')})`;
}

/** Rotulo curto para o proprio marcador do grafico. */
export function rotuloCurtoDaMarca(marca) {
  const codigos = codigosDaMarca(marca);
  if (!codigos.length) return '';
  return `Ex ${codigos.map((c) => MARCAS_EX[c]?.curto || 'evento').join('+')}`;
}

/** Marcadores no formato de candle-chart.setMarcadoresTecnico. */
export function marcadoresDataEx(candles) {
  return (candles || [])
    .filter((c) => c?.marcaEx && codigosDaMarca(c.marcaEx).length)
    .map((c) => ({
      dataIso: c.dataIso,
      posicao: 'acima',
      cor: '#b45309',
      forma: 'square',
      texto: rotuloCurtoDaMarca(c.marcaEx),
    }));
}

/** Lista textual (tooltip e leitura por tecnologia assistiva) das datas ex. */
export function listaDataEx(candles) {
  return (candles || [])
    .filter((c) => c?.marcaEx && codigosDaMarca(c.marcaEx).length)
    .map((c) => ({ dataIso: c.dataIso, dataFormatada: c.dataFormatada || c.dataIso, descricao: descricaoDaMarca(c.marcaEx) }));
}
