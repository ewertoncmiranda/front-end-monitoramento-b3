// Unica responsabilidade: definicao UNICA da navegacao em grupos (REQ-UX-6),
// usada pelo menu superior e pela barra inferior. Modulo puro, sem DOM.
// Toda rota antiga continua valida; aqui so se decide onde ela aparece.

export const GRUPOS = [
  { id: 'inicio', rotulo: 'Início', icone: '🏠', rota: '#/inicio' },
  {
    id: 'ativos', rotulo: 'Ativos', icone: '🗂️',
    itens: [
      { rotulo: 'Ficha do ativo', rota: '#/gestao' },
      // Tabela unica (REQ-UX-8): substitui as listas Base, Favoritos, Monitorados e Setores.
      { rotulo: 'Tabela de ativos', rota: '#/ativos' },
    ],
  },
  {
    id: 'mercado', rotulo: 'Mercado', icone: '📈',
    itens: [
      { rotulo: 'Velas', rota: '#/candles' },
      { rotulo: 'Opções', rota: '#/opcoes' },
      { rotulo: 'Comunicados', rota: '#/comunicados' },
      { rotulo: 'Notícias', rota: '#/noticias' },
      { rotulo: 'Índices', rota: '#/indices' },
    ],
  },
  { id: 'avaliacao', rotulo: 'Avaliação', icone: '🩺', rota: '#/avaliacao' },
  { id: 'estudos', rotulo: 'Estudos', icone: '🎓', rota: '#/estudos' },
];

// Rotas que existem mas nao tem item proprio: pertencem a um grupo.
const EXTRAS = {
  // Rotas antigas das listas: abrem a tabela unica na visao correspondente.
  '#/base': 'ativos',
  '#/favoritos': 'ativos',
  '#/monitorados': 'ativos',
  '#/setores': 'ativos',
  '#/opcoes': 'mercado',
  '#/formulas': 'estudos',
  '#/glossario': 'estudos',
  '#/padroes': 'estudos',
  '#/arquitetura': 'estudos',
  '#/design-codigo': 'estudos',
};

/** Rotas alcancaveis pelo menu (itens e grupos sem filhos). */
export function rotasDoMenu() {
  return GRUPOS.flatMap((g) => (g.itens ? g.itens.map((i) => i.rota) : [g.rota]));
}

function raizDoHash(hash) {
  const caminho = String(hash || '').split('?')[0];
  const [, raiz = ''] = /^(#\/[^/]*)/.exec(caminho) || [];
  return raiz;
}

/** Grupo que contem a rota (para destacar no menu); undefined se desconhecida. */
export function grupoDaRota(hash) {
  const raiz = raizDoHash(hash);
  if (EXTRAS[raiz]) return EXTRAS[raiz];
  const grupo = GRUPOS.find((g) => (g.itens ? g.itens.some((i) => i.rota === raiz) : g.rota === raiz));
  return grupo ? grupo.id : undefined;
}

/** Item/rota exata destacada dentro do grupo. */
export function rotaAtiva(hash) {
  return raizDoHash(hash);
}
