// Adiciona ordenação client-side a qualquer <table> cujos <th> tenham data-sort.
// Cada <td> pode ter data-sort-value="valor_bruto" para ordenação numérica precisa.
// Uso: aplicarOrdenacao(tabela) após innerHTML = html.
export function aplicarOrdenacao(tabela) {
  if (!tabela) return;
  const ths = tabela.querySelectorAll('th[data-sort]');
  if (!ths.length) return;
  let colAtual = null, direcao = 1;

  ths.forEach((th) => {
    th.style.cursor = 'pointer';
    th.setAttribute('role', 'button');
    th.setAttribute('tabindex', '0');

    const sortear = () => {
      const col = th.dataset.sort;
      direcao = colAtual === col ? -direcao : 1;
      colAtual = col;

      const tbody = tabela.querySelector('tbody');
      if (!tbody) return;
      const linhas = [...tbody.querySelectorAll('tr')];
      const idx = [...th.closest('tr').querySelectorAll('th')].indexOf(th);

      linhas.sort((a, b) => {
        const tdA = a.children[idx], tdB = b.children[idx];
        const va = tdA?.dataset.sortValue ?? tdA?.textContent?.trim() ?? '';
        const vb = tdB?.dataset.sortValue ?? tdB?.textContent?.trim() ?? '';
        // Valores vazios vão para o fim independente da direção
        if (va === '' && vb !== '') return 1;
        if (vb === '' && va !== '') return -1;
        const na = Number(va), nb = Number(vb);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return (na - nb) * direcao;
        return va.localeCompare(vb, 'pt-BR') * direcao;
      });

      linhas.forEach((l) => tbody.appendChild(l));

      ths.forEach((h) => {
        h.classList.remove('sort-asc', 'sort-desc');
        const ic = h.querySelector('.sort-icon');
        if (ic) ic.textContent = '⇅';
      });
      th.classList.add(direcao === 1 ? 'sort-asc' : 'sort-desc');
      const ic = th.querySelector('.sort-icon');
      if (ic) ic.textContent = direcao === 1 ? '↑' : '↓';
    };

    th.addEventListener('click', sortear);
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortear(); }
    });
  });
}
