// Unica responsabilidade: preparar as carteiras guardadas no navegador
// (b3-carteiras) para POST /carteiras/importacoes (CARTDB-PAI-1).
//
// O gestor mantem os ids locais, grava tudo ou nada e reconhece reenvio
// identico; a idempotencia e dele. Aqui so se deixa o conteudo no formato que
// ele aceita, sempre do mesmo jeito (deterministico), para que repetir a
// importacao gere o mesmo payload e caia em "ja existentes".

export const ESTRATEGIA_PADRAO = 'Sem estratégia';
export const COR_PADRAO = '#0d6efd';

const COR_VALIDA = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

const arredondar = (valor) => Math.round(Number(valor) * 100) / 100;

/**
 * criadaEm local e um ISO em UTC com "Z" (new Date().toISOString()); o gestor
 * recebe LocalDateTime e roda em UTC. Vai o mesmo instante, sem fuso e sem
 * milissegundos; data invalida ou futura vira null (o gestor recusa futuro).
 */
export function criadaEmParaGestor(valor, agora = new Date()) {
  const data = new Date(valor);
  if (!valor || Number.isNaN(data.getTime()) || data > agora) return null;
  return data.toISOString().slice(0, 19);
}

/**
 * O store local aceitava o mesmo ticker duas vezes; o gestor guarda um por
 * carteira e recusa repetido. Junta sem perder capital: soma o capital e fica
 * com a data de entrada mais antiga. Ativo incompleto e deixado de fora, com aviso.
 */
export function consolidarAtivos(ativos = []) {
  const porTicker = new Map();
  const avisos = [];
  for (const ativo of ativos) {
    const simbolo = String(ativo?.simbolo ?? '').trim().toUpperCase();
    const capital = Number(ativo?.capital);
    if (!/^[A-Z0-9]{4,12}$/.test(simbolo) || !DATA_ISO.test(String(ativo?.dataEntrada ?? '')) || !(capital > 0)) {
      avisos.push(`ativo deixado de fora por dados incompletos: ${simbolo || '(sem símbolo)'}`);
      continue;
    }
    const anterior = porTicker.get(simbolo);
    if (!anterior) {
      porTicker.set(simbolo, { simbolo, dataEntrada: ativo.dataEntrada, capital });
      continue;
    }
    avisos.push(`${simbolo} aparecia mais de uma vez: capitais somados, data mais antiga mantida`);
    anterior.capital += capital;
    if (ativo.dataEntrada < anterior.dataEntrada) anterior.dataEntrada = ativo.dataEntrada;
  }
  const consolidados = [...porTicker.values()]
    .map((a) => ({ ...a, capital: arredondar(a.capital) }))
    .sort((a, b) => a.simbolo.localeCompare(b.simbolo));
  return { ativos: consolidados, avisos };
}

/** Uma carteira local no formato de CarteiraLegada do gestor. */
export function carteiraParaImportacao(carteira, agora = new Date()) {
  const nome = String(carteira?.nome ?? '').trim().slice(0, 120) || 'Carteira importada';
  const estrategia = String(carteira?.estrategia ?? '').trim().slice(0, 80) || ESTRATEGIA_PADRAO;
  const cor = COR_VALIDA.test(String(carteira?.cor ?? '')) ? carteira.cor : COR_PADRAO;
  const { ativos, avisos } = consolidarAtivos(carteira?.ativos);
  return {
    carteira: { id: String(carteira.id), nome, estrategia, cor, criadaEm: criadaEmParaGestor(carteira?.criadaEm, agora), ativos },
    avisos: avisos.map((a) => `${nome}: ${a}`),
  };
}

/** Payload de POST /carteiras/importacoes e os avisos do que precisou ser ajustado. */
export function prepararImportacao(locais = [], agora = new Date()) {
  const preparadas = locais.filter((c) => c?.id).map((c) => carteiraParaImportacao(c, agora));
  return {
    payload: { carteiras: preparadas.map((p) => p.carteira) },
    avisos: preparadas.flatMap((p) => p.avisos),
  };
}
