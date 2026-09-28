// Unica responsabilidade: o esqueleto de carregamento dos cartoes da ficha
// (placeholders do Bootstrap 5.3). Cada cartao mostra o proprio esqueleto ate
// a sua chamada responder, em vez de um spinner unico segurando a tela toda.
export function esqueleto(linhas = 3, altura = '') {
  const larguras = ['col-7', 'col-4', 'col-9', 'col-5', 'col-8'];
  const barras = Array.from({ length: linhas }, (_, i) =>
    `<span class="placeholder ${larguras[i % larguras.length]} ${altura} rounded"></span>`).join('');
  return `<div class="placeholder-glow d-flex flex-column gap-2" aria-hidden="true">${barras}</div>
          <span class="visually-hidden">Carregando…</span>`;
}

/** Cartao da ficha: moldura comum a todos (borda leve, cantos 12px). */
export function cartao(conteudo, extra = '') {
  return `<section class="ficha-cartao ${extra}">${conteudo}</section>`;
}
