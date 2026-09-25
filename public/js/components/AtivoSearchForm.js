import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: capturar um simbolo digitado e avisar quem estiver
// escutando via evento customizado. Nao sabe o que vai ser feito com o simbolo
// (nao chama API, nao sabe se e consulta ou cadastro).
export class AtivoSearchForm extends BaseComponent {
  template() {
    const rotulo = this.getAttribute('rotulo-botao') || 'Buscar';
    const placeholder = this.getAttribute('placeholder') || 'Ex.: PETR4';
    return `
      <form class="row g-2 align-items-center">
        <div class="col-8 col-sm-9">
          <label class="visually-hidden" for="simbolo-input">Simbolo do ativo</label>
          <input
            id="simbolo-input"
            type="text"
            class="form-control text-uppercase"
            placeholder="${placeholder}"
            required
            maxlength="10"
          />
        </div>
        <div class="col-4 col-sm-3">
          <button type="submit" class="btn btn-primary w-100">${rotulo}</button>
        </div>
      </form>
    `;
  }

  afterRender() {
    const form = this.querySelector('form');
    const input = this.querySelector('#simbolo-input');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const simbolo = input.value.trim().toUpperCase();
      if (!simbolo) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent('ativo-buscado', {
          detail: { simbolo },
          bubbles: true,
        })
      );
    });
  }
}

customElements.define('ativo-search-form', AtivoSearchForm);
