/**
 * F360-PAI-9: Linha do tempo única (comunicados CVM + notícias)
 * Junta e ordena eventos por data, com filtro por tipo.
 */

/**
 * Junta comunicados e notícias em uma linha do tempo unificada.
 * @param {object} dados - { comunicados, noticias }
 * @returns {Array} Eventos ordenados por data (mais recente primeiro)
 */
export function montarLinhaDoTempo(dados) {
  const { comunicados, noticias } = dados;
  const eventos = [];

  // Adicionar comunicados
  if (comunicados?.length) {
    comunicados.forEach((c) => {
      eventos.push({
        tipo: 'comunicado',
        data: c.data_entrega || c.data,
        dataIso: c.data_entrega || c.data,
        titulo: c.titulo || c.tipo,
        categoria: c.tipo || 'Comunicado',
        icone: iconeComunicado(c.tipo),
        conteudo: c,
      });
    });
  }

  // Adicionar notícias
  if (noticias?.length) {
    noticias.forEach((n) => {
      eventos.push({
        tipo: 'noticia',
        data: n.data_publicacao,
        dataIso: n.data_publicacao,
        titulo: n.titulo,
        categoria: 'Notícia',
        icone: '📰',
        conteudo: n,
      });
    });
  }

  // Ordenar por data decrescente
  eventos.sort((a, b) => new Date(b.data) - new Date(a.data));

  return eventos;
}

/**
 * Filtra eventos por tipo.
 */
export function filtrarPorTipo(eventos, tipo) {
  if (!tipo || tipo === 'todos') return eventos;
  return eventos.filter((e) => e.tipo === tipo);
}

/**
 * Retorna ícone baseado no tipo de comunicado.
 */
function iconeComunicado(tipo) {
  if (!tipo) return '📄';
  const t = tipo.toUpperCase();
  if (t.includes('FATO RELEVANTE')) return '⚠️';
  if (t.includes('DFP')) return '📊';
  if (t.includes('ITR')) return '📈';
  if (t.includes('ESTATUTO')) return '📜';
  if (t.includes('Assembleia')) return '🏛️';
  return '📄';
}
