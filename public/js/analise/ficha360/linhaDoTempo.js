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

  // Contrato do gestor (/empresas/{s}/comunicados): camelCase, data em dataEntrega.
  if (comunicados?.length) {
    comunicados.forEach((c) => {
      const data = diaIso(c.dataEntrega ?? c.dataReferencia);
      if (!data) return;
      const categoria = c.categoriaRotulo || c.categoriaOriginal || 'Comunicado';
      eventos.push({
        tipo: 'comunicado',
        data,
        dataIso: data,
        titulo: c.assunto || c.especie || categoria,
        categoria,
        icone: iconeComunicado(c.categoria),
        conteudo: c,
      });
    });
  }

  // Proxy de noticias do painel (/noticias/{s}): { titulo, link, fonte, publicadoEm }.
  if (noticias?.length) {
    noticias.forEach((n) => {
      const data = diaIso(n.publicadoEm);
      if (!data || !n.titulo) return;
      eventos.push({
        tipo: 'noticia',
        data,
        dataIso: data,
        titulo: n.titulo,
        categoria: n.fonte || 'Notícia',
        icone: '📰',
        conteudo: n,
      });
    });
  }

  // ISO ordena como texto; mais recente primeiro.
  eventos.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));

  return eventos;
}

/** 'AAAA-MM-DD' do inicio de uma data ISO; null se nao for data. */
function diaIso(valor) {
  const dia = String(valor ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null;
}

/**
 * Filtra eventos por tipo.
 */
export function filtrarPorTipo(eventos, tipo) {
  if (!tipo || tipo === 'todos') return eventos;
  return eventos.filter((e) => e.tipo === tipo);
}

/** Icone pela categoria do gestor (FATO_RELEVANTE, PROVENTOS...). */
function iconeComunicado(categoria) {
  const c = String(categoria || '').toUpperCase();
  if (c.includes('FATO_RELEVANTE')) return '⚠️';
  if (c.includes('PROVENTO')) return '💰';
  if (c.includes('RESULTADO') || c.includes('DFP') || c.includes('ITR')) return '📊';
  if (c.includes('ASSEMBLEIA')) return '🏛️';
  return '📄';
}
