// CART-PAI-3 — modal para criar / editar carteira.
// Sem Shadow DOM: Bootstrap global continua valendo.
import { BaseComponent } from '../base/BaseComponent.js';
import { atualizarCarteira, criarCarteira, mensagemDeErro } from '../../api/carteirasApi.js';

const ESTRATEGIAS = [
  'Fundamentalista',
  'Dividendos',
  'Momentum',
  'Reversão',
  'Crescimento',
  'Graham',
  'Qualidade',
];

export class CarteiraModal extends BaseComponent {
  constructor() {
    super();
    /** @type {'nova'|'edicao'} */
    this._modo = 'nova';
    /** @type {string|null} */
    this._id = null;
    this._modal = null;
  }

  template() {
    const options = ESTRATEGIAS.map(
      (e) => `<option value="${e}">${e}</option>`,
    ).join('');

    return `
<div class="modal fade" tabindex="-1" aria-labelledby="carteiraModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="carteiraModalLabel">Carteira</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body">
        <div data-erro-carteira class="alert alert-danger py-2 small d-none" role="alert"></div>
        <div class="mb-3">
          <label for="carteira-nome" class="form-label">Nome</label>
          <input
            type="text"
            id="carteira-nome"
            class="form-control"
            required
            minlength="2"
            placeholder="Nome da carteira"
          />
        </div>
        <div class="mb-3">
          <label for="carteira-estrategia" class="form-label">Estratégia</label>
          <select id="carteira-estrategia" class="form-select">
            ${options}
          </select>
        </div>
        <div class="mb-3">
          <label for="carteira-cor" class="form-label">Cor</label>
          <input
            type="color"
            id="carteira-cor"
            class="form-control form-control-color"
            value="#0d6efd"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="btn-cancelar-carteira">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btn-confirmar-carteira">Confirmar</button>
      </div>
    </div>
  </div>
</div>
`;
  }

  afterRender() {
    this.querySelector('#btn-cancelar-carteira').addEventListener('click', () => this.fechar());
    this.querySelector('#btn-confirmar-carteira').addEventListener('click', () => this._confirmar());
  }

  /** Abre o modal para criar uma nova carteira. */
  abrirNova() {
    this._mostrarErro('');
    this._modo = 'nova';
    this._id = null;
    this._campoNome().value = '';
    this._campoEstrategia().value = ESTRATEGIAS[0];
    this._campoCor().value = '#0d6efd';
    this._mostrar();
  }

  /**
   * Abre o modal para editar uma carteira existente.
   * @param {{ id: string, nome: string, estrategia: string, cor: string }} carteira
   */
  abrirEdicao(carteira) {
    this._mostrarErro('');
    this._modo = 'edicao';
    this._id = carteira.id;
    this._campoNome().value = carteira.nome;
    this._campoEstrategia().value = carteira.estrategia;
    this._campoCor().value = carteira.cor;
    this._mostrar();
  }

  /** Fecha o modal sem emitir nenhum evento. */
  fechar() {
    if (this._modal) {
      this._modal.hide();
    }
  }

  // ── privados ────────────────────────────────────────────────────────────────

  _mostrar() {
    if (!this._modal) {
      this._modal = new window.bootstrap.Modal(this.querySelector('.modal'));
    }
    this._modal.show();
  }

  _campoNome() {
    return this.querySelector('#carteira-nome');
  }

  _campoEstrategia() {
    return this.querySelector('#carteira-estrategia');
  }

  _campoCor() {
    return this.querySelector('#carteira-cor');
  }

  async _confirmar() {
    const nome = this._campoNome().value.trim();
    if (nome.length < 2) return;

    const estrategia = this._campoEstrategia().value;
    const cor = this._campoCor().value;
    const botao = this.querySelector('#btn-confirmar-carteira');
    this._mostrarErro('');
    if (botao) botao.disabled = true;

    try {
      const carteira = this._modo === 'nova'
        ? await criarCarteira({ nome, estrategia, cor })
        : await atualizarCarteira(this._id, { nome, estrategia, cor });
      this.dispatchEvent(new CustomEvent('carteira-salva', { detail: { carteira } }));
      this.fechar();
    } catch (erro) {
      // O modal fica aberto com o que foi digitado: nada se perde.
      this._mostrarErro(mensagemDeErro(erro));
    } finally {
      if (botao) botao.disabled = false;
    }
  }

  _mostrarErro(mensagem) {
    const alvo = this.querySelector('[data-erro-carteira]');
    if (!alvo) return;
    alvo.textContent = mensagem;
    alvo.classList?.toggle('d-none', !mensagem);
  }
}

customElements.define('carteira-modal', CarteiraModal);
