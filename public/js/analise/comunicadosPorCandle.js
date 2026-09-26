// Unica responsabilidade: dizer quais comunicados da CVM pertencem a qual
// vela. Modulo puro - sem DOM, sem fetch - para a regra ser testada.
//
// A CVM informa so a DATA de entrega, nao a hora. E fato relevante costuma
// sair depois do fechamento: quem explica e a abertura do pregao SEGUINTE,
// nao a vela do mesmo dia. Como a fonte nao permite separar os dois casos,
// cada vela recebe duas listas e o painel nao afirma causa:
//
//   noDia           entregues na data da vela;
//   desdeAnterior   entregues do pregao anterior (inclusive) ate a vespera
//                   desta vela - fim de semana e feriado caem aqui. Podem ter
//                   saido depois do fechamento anterior e explicar a abertura.
//
// Um documento entregue num dia de pregao aparece nas duas velas: no dia dele
// (noDia) e na seguinte (desdeAnterior). E proposital.

export function agruparPorCandle(candles, comunicados) {
  const grupos = new Map();
  if (!Array.isArray(candles) || candles.length === 0) return grupos;

  const ordenados = [...(comunicados || [])].sort((a, b) =>
    a.dataEntrega < b.dataEntrega ? -1 : a.dataEntrega > b.dataEntrega ? 1 : 0,
  );

  candles.forEach((candle, i) => {
    const dia = candle.dataIso;
    const anterior = i > 0 ? candles[i - 1].dataIso : null;

    const noDia = ordenados.filter((c) => c.dataEntrega === dia);
    const desdeAnterior = anterior
      ? ordenados.filter((c) => c.dataEntrega >= anterior && c.dataEntrega < dia)
      : [];

    if (noDia.length || desdeAnterior.length) {
      grupos.set(dia, { dataIso: dia, anteriorIso: anterior, noDia, desdeAnterior });
    }
  });

  return grupos;
}

/**
 * Velas que ganham marcador: as que tem documento no proprio dia, e as que
 * herdam documento de dia SEM pregao (fim de semana, feriado) - senao um fato
 * relevante de sabado nao apareceria em lugar nenhum do grafico.
 *
 * O documento de dia de pregao que tambem aparece em desdeAnterior da vela
 * seguinte nao gera segundo marcador: seria o mesmo documento contado duas
 * vezes no grafico.
 */
export function marcadoresDeComunicados(candles, grupos, cores = CORES_PADRAO) {
  const diasDePregao = new Set((candles || []).map((c) => c.dataIso));
  const marcadores = [];

  for (const grupo of grupos.values()) {
    const semPregao = grupo.desdeAnterior.filter(
      (c) => !diasDePregao.has(c.dataEntrega),
    );
    const documentos = [...grupo.noDia, ...semPregao];
    if (documentos.length === 0) continue;

    const temFatoRelevante = documentos.some((c) => c.categoria === 'FATO_RELEVANTE');
    marcadores.push({
      dataIso: grupo.dataIso,
      posicao: 'acima',
      forma: 'circle',
      cor: temFatoRelevante ? cores.fatoRelevante : cores.outros,
      texto: documentos.length > 1 ? `${documentos.length}` : '',
    });
  }

  return marcadores.sort((a, b) => (a.dataIso < b.dataIso ? -1 : 1));
}

export const CORES_PADRAO = { fatoRelevante: '#dc3545', outros: '#0d6efd' };
