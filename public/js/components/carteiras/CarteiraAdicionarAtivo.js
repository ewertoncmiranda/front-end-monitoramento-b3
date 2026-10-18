import { BaseComponent } from '../base/BaseComponent.js';
import { mensagemDeErro, salvarAtivo } from '../../api/carteirasApi.js';
import '../busca/BuscaAtivos.js';

/**
 * CART-PAI-6 — Formulário para adicionar um ativo a uma carteira.
 * Uso: <carteira-adicionar-ativo></carteira-adicionar-ativo>
 * API pública: setCarteiraId(id, simbolosExistentes)
 * Evento emitido: ativo-adicionado { simbolo, dataEntrada, capital, ativo }
 * Grava no gestor (PUT /carteiras/{id}/ativos/{simbolo}); um registro por
 * ticker em cada carteira, então repetir um ticker substitui (com confirmação).
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
      <div id="form-adicionar-ativo">
        <div class="mb-3">
          <span class="form-label fw-semibold d-block">Ativo</span>
          <busca-ativos id="seletor-ativo" modo="unico"></busca-ativos>
        </div>
        <div class="mb-3">
          <label for="data-entrada" class="form-label fw-semibold">Data de entrada</label>
          <input type="date" id="data-entrada" class="form-control" max="${hoje}">
        </div>
        <div class="mb-3">
          <label for="capital" class="form-label fw-semibold">Capital (R$)</label>
          <input type="number" id="capital" class="form-control" min="0.01" step="0.01" placeholder="0,00">
        </div>
        <button type="button" id="btn-adicionar" class="btn btn-success w-100">Adicionar</button>
      </div>
    `;
  }

  afterRender() {
    this._simbolo = '';

    const busca = this.querySelector('#seletor-ativo');
    busca.addEventListener('busca-ativos:selecao', (e) => {
      this._simbolo = e.detail?.simbolos?.[0] ?? '';
    });

    // Sem <form>: a carteira fica dentro de outro formulario da pagina (form aninhado).
    this.querySelector('#btn-adicionar').addEventListener('click', () => this._submeter());
  }

  setCarteiraId(id, simbolosExistentes = []) {
    this._carteiraId = id;
    this._existentes = simbolosExistentes.map((s) => String(s).toUpperCase());
    // Uma busca por carteira: cada uma guarda seus filtros e seu ticker na sessao.
    const busca = this.querySelector('#seletor-ativo');
    if (busca) {
      busca.setAttribute('chave', `carteira-${id}`);
      this._simbolo = busca.simbolos?.[0] ?? '';
    }
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

  async _submeter() {
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
    if ((this._existentes || []).includes(String(simbolo).toUpperCase())
      && !window.confirm(`${simbolo} já está nesta carteira. Substituir a data de entrada e o capital?`)) {
      return;
    }

    const botao = this.querySelector('#btn-adicionar');
    if (botao) botao.disabled = true;
    try {
      const ativo = await salvarAtivo(this._carteiraId, {
        simbolo,
        dataEntrada,
        capital: Number(capital),
      });

      // Limpa antes de avisar: a pagina se redesenha no evento e a busca nova
      // restauraria da sessao o ticker que acabou de entrar.
      this._resetar();

      this.dispatchEvent(
        new CustomEvent('ativo-adicionado', {
          detail: { simbolo, dataEntrada, capital: Number(capital), ativo },
          bubbles: true,
        })
      );
    } catch (err) {
      this._exibirErro(mensagemDeErro(err));
    } finally {
      if (botao) botao.disabled = false;
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
    // Tira o ticker escolhido; filtros e resultados ficam para o proximo ativo.
    this.querySelector('#seletor-ativo')?.limpar?.();
  }
}

/** Retorna a data de hoje no formato AAAA-MM-DD */
function _hoje() {
  return new Date().toISOString().slice(0, 10);
}

customElements.define('carteira-adicionar-ativo', CarteiraAdicionarAtivo);
