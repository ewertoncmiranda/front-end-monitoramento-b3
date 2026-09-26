// Unica responsabilidade: conhecer os endpoints de comunicados oficiais da CVM
// (base IPE) expostos pelo gestor-ativos-brutos - contrato infra#CTR-10.
import { httpGet } from './httpClient.js';

export const CATEGORIAS_COMUNICADO = [
  { valor: 'FATO_RELEVANTE', rotulo: 'Fato relevante', classe: 'text-bg-danger', padrao: true },
  { valor: 'PROVENTOS', rotulo: 'Proventos', classe: 'text-bg-success', padrao: true },
  { valor: 'RESULTADOS', rotulo: 'Resultados', classe: 'text-bg-primary', padrao: true },
  { valor: 'COMUNICADO_MERCADO', rotulo: 'Comunicado ao mercado', classe: 'text-bg-info', padrao: true },
  { valor: 'AVISO_ACIONISTAS', rotulo: 'Aviso aos acionistas', classe: 'text-bg-warning', padrao: true },
  { valor: 'CALENDARIO_EVENTOS', rotulo: 'Calendário de eventos', classe: 'text-bg-secondary', padrao: true },
  { valor: 'ASSEMBLEIA', rotulo: 'Assembleia', classe: 'text-bg-light border', padrao: false },
];

export function categoriaComunicado(valor) {
  return (
    CATEGORIAS_COMUNICADO.find((c) => c.valor === valor) || {
      valor,
      rotulo: valor,
      classe: 'text-bg-light border',
    }
  );
}

/** Edição da newsletter. Sem semana, o backend usa a do documento mais recente. */
export function buscarNewsletter({ semana, categorias } = {}) {
  return httpGet(`/comunicados/newsletter${consulta({ semana, categorias })}`);
}

/** Linha do tempo de um ticker, paginada, mais recente primeiro. */
export function buscarComunicadosDoAtivo(
  simbolo,
  { categorias, desde, ate, pagina, tamanho } = {},
) {
  const alvo = encodeURIComponent(String(simbolo).trim().toUpperCase());
  return httpGet(
    `/empresas/${alvo}/comunicados${consulta({ categorias, desde, ate, pagina, tamanho })}`,
  );
}

/**
 * Todos os comunicados de um periodo, juntando as paginas. Serve ao grafico
 * de velas: o range maximo e de 3 meses, que costuma caber em uma pagina de
 * 100; o limite de paginas so protege contra periodo enorme por engano.
 */
export async function buscarComunicadosDoPeriodo(
  simbolo,
  { desde, ate, categorias = categoriasPadrao() } = {},
  limitePaginas = 5,
) {
  const documentos = [];
  let resposta = null;
  for (let pagina = 0; pagina < limitePaginas; pagina++) {
    resposta = await buscarComunicadosDoAtivo(simbolo, {
      categorias,
      desde,
      ate,
      pagina,
      tamanho: 100,
    });
    documentos.push(...(resposta.comunicados || []));
    if (pagina + 1 >= resposta.totalPaginas) break;
  }
  return {
    comunicados: documentos,
    dadosAte: resposta ? resposta.dadosAte : null,
    fonte: resposta ? resposta.fonte : null,
    aviso: resposta ? resposta.aviso : null,
  };
}

export function categoriasPadrao() {
  return CATEGORIAS_COMUNICADO.filter((c) => c.padrao).map((c) => c.valor);
}

function consulta(parametros) {
  const busca = new URLSearchParams();
  Object.entries(parametros).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null || valor === '') return;
    busca.set(chave, Array.isArray(valor) ? valor.join(',') : String(valor));
  });
  const texto = busca.toString();
  return texto ? `?${texto}` : '';
}
