// Unica responsabilidade: filtros da Base de ativos (busca, setor, pagina) em
// link compartilhavel "#/base?q=petr&setor=Energia&pagina=2" (REQ-UX-8, parcial).
// Puro; entrada invalida do link e ignorada.

const ROTA = '#/base';

export function lerFiltrosBase(hash) {
  const [rota, consulta = ''] = String(hash || '').split('?');
  if (rota !== ROTA) return { q: '', setor: '', pagina: 0 };
  const p = new URLSearchParams(consulta);
  const pagina = Number.parseInt(p.get('pagina') ?? '0', 10);
  return {
    q: (p.get('q') || '').slice(0, 60),
    setor: (p.get('setor') || '').slice(0, 80),
    pagina: Number.isInteger(pagina) && pagina > 0 && pagina < 10000 ? pagina : 0,
  };
}

/** So o que foge do padrao entra no link. */
export function hashDaBase({ q, setor, pagina } = {}) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (setor) p.set('setor', setor);
  if (pagina > 0) p.set('pagina', String(pagina));
  const consulta = p.toString();
  return consulta ? `${ROTA}?${consulta}` : ROTA;
}
