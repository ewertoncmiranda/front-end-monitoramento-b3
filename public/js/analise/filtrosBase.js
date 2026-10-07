// Unica responsabilidade: filtros da tabela unica de ativos (REQ-UX-8) em link
// compartilhavel "#/ativos?visao=favoritos&q=petr&setor=Energia&pagina=2".
// As rotas antigas continuam abrindo a mesma tabela: #/base e #/setores na
// visao "todos" (com os mesmos q/setor/pagina de antes), #/favoritos e
// #/monitorados na visao de mesmo nome. Puro; entrada invalida do link e ignorada.

const ROTA = '#/ativos';

export const VISOES = ['todos', 'favoritos', 'monitorados'];

// Rota antiga -> visao que ela representa (null: a visao vem do link).
const VISAO_DA_ROTA = {
  '#/ativos': null,
  '#/base': 'todos',
  '#/setores': 'todos',
  '#/favoritos': 'favoritos',
  '#/monitorados': 'monitorados',
};

const VAZIO = Object.freeze({ visao: 'todos', q: '', setor: '', pagina: 0 });

export function lerFiltrosBase(hash) {
  const [rota, consulta = ''] = String(hash || '').split('?');
  if (!(rota in VISAO_DA_ROTA)) return { ...VAZIO };
  const p = new URLSearchParams(consulta);
  const pagina = Number.parseInt(p.get('pagina') ?? '0', 10);
  const visaoDoLink = p.get('visao');
  return {
    visao: VISAO_DA_ROTA[rota] || (VISOES.includes(visaoDoLink) ? visaoDoLink : 'todos'),
    q: (p.get('q') || '').slice(0, 60),
    setor: (p.get('setor') || '').slice(0, 80),
    pagina: Number.isInteger(pagina) && pagina > 0 && pagina < 10000 ? pagina : 0,
  };
}

/** So o que foge do padrao entra no link; o link gerado e sempre o canonico #/ativos. */
export function hashDaBase({ visao, q, setor, pagina } = {}) {
  const p = new URLSearchParams();
  if (visao && visao !== 'todos' && VISOES.includes(visao)) p.set('visao', visao);
  if (q) p.set('q', q);
  if (setor) p.set('setor', setor);
  if (pagina > 0) p.set('pagina', String(pagina));
  const consulta = p.toString();
  return consulta ? `${ROTA}?${consulta}` : ROTA;
}
