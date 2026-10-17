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
  const exata = velas.find((v) => v.dataIso === dataIso);
  if (exata) return { dataEfetiva: exata.dataIso, preco: exata.fechamento };

  // Data anterior mais recente (ultima vela com data <= dataIso)
  const anteriores = velas.filter((v) => v.dataIso <= dataIso);
  if (anteriores.length > 0) {
    const maisRecente = anteriores[anteriores.length - 1];
    return { dataEfetiva: maisRecente.dataIso, preco: maisRecente.fechamento };
  }

  // Nenhuma data anterior: usa a primeira disponivel
  const primeira = velas[0];
  return { dataEfetiva: primeira.dataIso, preco: primeira.fechamento };
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
