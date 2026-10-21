// Unica responsabilidade: resolver o preco de fechamento de um ativo em uma data
// (ou na data disponivel mais proxima), usando buscarPregoes como fonte de dados.
import { buscarPregoes } from './pregoesApi.js';

/**
 * Retorna { dataEfetiva, preco } ou null se nenhum dado estiver disponivel.
 * Busca primeiro a data exata; se nao encontrada, usa a data anterior mais
 * proxima disponivel. Se nao houver data anterior, usa a primeira data disponivel.
 */
export async function buscarPrecoNaData(simbolo, dataIso) {
  const resposta = await buscarPregoes(simbolo, { de: dataIso, intervalo: 'dia' });
  const velas = resposta?.velas;
  if (!velas || velas.length === 0) return null;

  // Correspondencia exata
  const exata = velas.find((v) => dataDaVela(v) === dataIso);
  if (exata) return { dataEfetiva: dataDaVela(exata), preco: Number(exata.fechamento) };

  // Data anterior mais recente (ultima vela com data <= dataIso)
  const anteriores = velas.filter((v) => dataDaVela(v) <= dataIso);
  if (anteriores.length > 0) {
    const maisRecente = anteriores[anteriores.length - 1];
    return { dataEfetiva: dataDaVela(maisRecente), preco: Number(maisRecente.fechamento) };
  }

  // Nenhuma data anterior: usa a primeira disponivel
  const primeira = velas[0];
  return { dataEfetiva: dataDaVela(primeira), preco: Number(primeira.fechamento) };
}

/**
 * Retorna { precoEntrada, precoAtual, retorno } ou null se qualquer preco
 * estiver indisponivel. Nunca converte null em 0.
 * retorno = (precoAtual - precoEntrada) / precoEntrada
 */
export async function calcularRetornoAtivo(simbolo, dataEntradaIso) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [entrada, atual] = await Promise.all([
    buscarPrecoNaData(simbolo, dataEntradaIso),
    buscarPrecoNaData(simbolo, hoje),
  ]);
  if (!entrada || !atual) return null;
  const retorno = (atual.preco - entrada.preco) / entrada.preco;
  return { precoEntrada: entrada.preco, precoAtual: atual.preco, retorno };
}

const dataDaVela = (v) => v.dataIso ?? v.data;

/** Dias (AAAA-MM-DD) antes de hoje. */
function diasAtras(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

/** Ultimo fechamento do ativo: { preco, dataIso } ou null se nao houver cotacao. */
export async function buscarUltimoFechamento(simbolo) {
  const resposta = await buscarPregoes(simbolo, { de: diasAtras(15), intervalo: 'dia' });
  const velas = (resposta?.velas || []).filter((v) => Number(v.fechamento) > 0);
  if (!velas.length) return null;
  const ultima = velas[velas.length - 1];
  return { preco: Number(ultima.fechamento), dataIso: dataDaVela(ultima) };
}

/**
 * Fechamentos desde `de`: { preco, dataIso, serie: [{dataIso, preco}] } ou null.
 * Uma chamada serve preco atual e sparkline.
 */
export async function buscarSerieDesde(simbolo, de) {
  const resposta = await buscarPregoes(simbolo, { de, intervalo: 'dia' });
  const serie = (resposta?.velas || [])
    .filter((v) => Number(v.fechamento) > 0)
    .map((v) => ({ dataIso: dataDaVela(v), preco: Number(v.fechamento) }));
  if (!serie.length) return null;
  const ultima = serie[serie.length - 1];
  return { preco: ultima.preco, dataIso: ultima.dataIso, serie };
}
