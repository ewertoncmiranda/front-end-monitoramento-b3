import { BaseComponent } from '../base/BaseComponent.js';
import { adicionarAtivo } from '../../utils/carteirasStore.js';

/**
 * CART-PAI-6 — Formulário para adicionar um ativo a uma carteira.
 * Uso: <carteira-adicionar-ativo></carteira-adicionar-ativo>
 * API pública: setCarteiraId(id)
 * Evento emitido: ativo-adicionado { simbolo, dataEntrada, capital, ativo }
 */
export class CarteiraAdicionarAtivo extends BaseComponent {
  constructor() {
    super();
    this._carteiraId = null;
    this._simbolo = '';
  }

  template() {
    const hoje = _hoje();
    return `
      <form id="form-adicionar-ativo" novalidate>
        <div class="mb-3">
          <label class="form-label fw-semibold">Ativo</label>
          <seletor-de-ativos id="seletor-ativo"></seletor-de-ativos>
        </div>
        <div class="mb-3">
          <label for="data-entrada" class="form-label fw-semibold">Data de entrada</label>
          <input type="date" id="data-entrada" class="form-control" max="${hoje}" required>
        </div>
        <div class="mb-3">
          <label for="capital" class="form-label fw-semibold">Capital (R$)</label>
          <input type="number" id="capital" class="form-control" min="0.01" step="0.01" placeholder="0,00" required>
        </div>
        <button type="submit" id="btn-adicionar" class="btn btn-success w-100">Adicionar</button>
      </form>
    `;
  }

  afterRender() {
    this._simbolo = '';

    const seletor = this.querySelector('#seletor-ativo');
    seletor.addEventListener('ativo-buscado', (e) => {
      this._simbolo = e.detail?.simbolo ?? '';
    });

    const form = this.querySelector('#form-adicionar-ativo');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submeter();
    });
  }

  setCarteiraId(id) {
    this._carteiraId = id;
  }

  /**
   * Valida os campos do formulário de forma pura.
   * @param {string} simbolo
   * @param {string} dataEntrada  (AAAA-MM-DD)
   * @param {string|number} capital
   * @returns {string|null} mensagem de erro ou null se válido
   */
  _validarCampos(simbolo, dataEntrada, capital) {
    if (!simbolo) {
      return 'Selecione ou digite um ativo antes de adicionar.';
    }
    if (!dataEntrada) {
      return 'Informe a data de entrada.';
    }
    const hoje = _hoje();
    if (dataEntrada > hoje) {
      return 'A data de entrada não pode ser uma data futura.';
    }
    const capitalNum = Number(capital);
    if (!capital || isNaN(capitalNum) || capitalNum <= 0) {
      return 'O capital deve ser maior que zero.';
    }
    return null;
  }

  _submeter() {
    // Remove erro anterior
    const erroAnterior = this.querySelector('.alert-danger');
    if (erroAnterior) erroAnterior.remove();

    const dataEntrada = this.querySelector('#data-entrada')?.value ?? '';
    const capital = this.querySelector('#capital')?.value ?? '';
    const simbolo = this._simbolo;

    const erro = this._validarCampos(simbolo, dataEntrada, capital);
    if (erro) {
      this._exibirErro(erro);
      return;
    }

    try {
      const ativo = adicionarAtivo(this._carteiraId, {
        simbolo,
        dataEntrada,
        capital: Number(capital),
      });

      this.dispatchEvent(
        new CustomEvent('ativo-adicionado', {
          detail: { simbolo, dataEntrada, capital: Number(capital), ativo },
          bubbles: true,
        })
      );

      this._resetar();
    } catch (err) {
      this._exibirErro(err.message || 'Erro ao adicionar ativo.');
    }
  }

  _exibirErro(mensagem) {
    const div = document.createElement('div');
    div.className = 'alert alert-danger mt-2';
    div.textContent = mensagem;
    const form = this.querySelector('#form-adicionar-ativo');
    if (form) form.prepend(div);
  }

  _resetar() {
    this._simbolo = '';
    const dataInput = this.querySelector('#data-entrada');
    const capitalInput = this.querySelector('#capital');
    if (dataInput) dataInput.value = '';
    if (capitalInput) capitalInput.value = '';
    // Re-render do seletor para limpar o campo de texto
    const seletor = this.querySelector('#seletor-ativo');
    if (seletor && typeof seletor.render === 'function') seletor.render();
  }
}

/** Retorna a data de hoje no formato AAAA-MM-DD */
function _hoje() {
  return new Date().toISOString().slice(0, 10);
}

customElements.define('carteira-adicionar-ativo', CarteiraAdicionarAtivo);
