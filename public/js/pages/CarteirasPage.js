// CART-PAI-7 — Pagina de carteiras: lista, cria, edita e remove carteiras.
import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarCarteiras, removerCarteira } from '../utils/carteirasStore.js';
import { escaparHtml } from '../utils/html.js';
import '../components/carteiras/CarteiraModal.js';
import '../components/carteiras/CarteiraCabecalho.js';
import '../components/carteiras/CarteiraAtivoLinha.js';
import '../components/carteiras/CarteiraAdicionarAtivo.js';

export class CarteirasPage extends BaseComponent {
  template() {
    return `
<div class="container py-3">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="h4 mb-0">Carteiras</h1>
    <button class="btn btn-primary" data-acao="nova-carteira">Nova carteira</button>
  </div>
  <carteira-modal id="modal-carteira"></carteira-modal>
  <div id="lista-carteiras">
    <p class="text-muted">Carregando carteiras…</p>
  </div>
</div>
`;
  }

  afterRender() {
    this._renderizarCarteiras();

    const btnNova = this.querySelector('[data-acao="nova-carteira"]');
    if (btnNova) {
      btnNova.addEventListener('click', () => {
        const modal = this.querySelector('#modal-carteira');
        if (modal) modal.abrirNova();
      });
    }

    const modal = this.querySelector('#modal-carteira');
    if (modal) {
      modal.addEventListener('carteira-salva', () => this._renderizarCarteiras());
    }

    this.addEventListener('editar-carteira', (e) => {
      const carteira = e.detail?.carteira;
      if (!carteira) return;
      const m = this.querySelector('#modal-carteira');
      if (m) m.abrirEdicao(carteira);
    });

    this.addEventListener('remover-carteira', (e) => {
      const carteira = e.detail?.carteira;
      if (!carteira) return;
      const confirmado = window.confirm(
        `Remover a carteira "${escaparHtml(carteira.nome)}"? Esta ação não pode ser desfeita.`,
      );
      if (!confirmado) return;
      removerCarteira(carteira.id);
      this._renderizarCarteiras();
    });

    this.addEventListener('ativo-adicionado', () => this._renderizarCarteiras());
  }

  _renderizarCarteiras() {
    const lista = this.querySelector('#lista-carteiras');
    if (!lista) return;

    const carteiras = listarCarteiras();

    if (carteiras.length === 0) {
      lista.innerHTML = `
<div class="text-center py-5">
  <p class="text-muted mb-3">Nenhuma carteira criada ainda.</p>
  <button class="btn btn-primary" data-acao="nova-carteira">Criar primeira carteira</button>
</div>
`;
      const btnCriar = lista.querySelector('[data-acao="nova-carteira"]');
      if (btnCriar) {
        btnCriar.addEventListener('click', () => {
          const modal = this.querySelector('#modal-carteira');
          if (modal) modal.abrirNova();
        });
      }
      return;
    }

    lista.innerHTML = carteiras
      .map((c) => {
        const ativos = c.ativos ?? [];
        const linhas = ativos
          .map((a) => `<carteira-ativo-linha data-simbolo="${escaparHtml(a.simbolo)}"></carteira-ativo-linha>`)
          .join('');
        return `
<div class="mb-4" data-carteira-id="${escaparHtml(c.id)}">
  <carteira-cabecalho></carteira-cabecalho>
  ${
    ativos.length > 0
      ? `<div class="table-responsive mb-2">
    <table class="table table-sm align-middle">
      <thead>
        <tr>
          <th>Ativo</th>
          <th>Entrada</th>
          <th>Capital</th>
          <th>Retorno</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  </div>`
      : ''
  }
  <carteira-adicionar-ativo></carteira-adicionar-ativo>
</div>
`;
      })
      .join('');

    // Inicializar cada card com seus dados
    carteiras.forEach((c) => {
      const card = lista.querySelector(`[data-carteira-id="${c.id}"]`);
      if (!card) return;

      const cabecalho = card.querySelector('carteira-cabecalho');
      if (cabecalho) cabecalho.setCarteira(c);

      const ativos = c.ativos ?? [];
      const linhas = card.querySelectorAll('carteira-ativo-linha');
      linhas.forEach((linha, i) => {
        if (ativos[i]) linha.setAtivo(ativos[i]);
      });

      const adicionarAtivoEl = card.querySelector('carteira-adicionar-ativo');
      if (adicionarAtivoEl) adicionarAtivoEl.setCarteiraId(c.id);
    });
  }
}

customElements.define('carteiras-page', CarteirasPage);
