import { BaseComponent } from './base/BaseComponent.js';
import { listarAtivosMonitorados } from '../api/ativosMonitoradosApi.js';
import './AtivoSearchForm.js';
import './StatusAlert.js';

// Unica responsabilidade: deixar escolher um ativo, por busca OU por clique
// na carteira ja cadastrada. Nao sabe o que sera feito com o simbolo.
//
// Envolve o AtivoSearchForm existente em vez de reimplementar o campo, e
// reemite o mesmo evento `ativo-buscado`. Por isso qualquer pagina que hoje
// usa <ativo-search-form> passa a listar os cadastrados trocando so a tag,
// sem mexer no resto da logica.
//
// Atributos: rotulo-botao, placeholder (repassados ao form) e
// auto-selecionar (seleciona o primeiro ativo assim que a lista chega).
export class SeletorDeAtivos extends BaseComponent {
  template() {
    const rotulo = this.getAttribute('rotulo-botao') || 'Buscar';
    const placeholder = this.getAttribute('placeholder') || 'Ex.: PETR4';

    return `
      <ativo-search-form rotulo-botao="${rotulo}" placeholder="${placeholder}"></ativo-search-form>
      <div id="seletor-carteira" class="mt-2"></div>
    `;
  }

  afterRender() {
    this._selecionado = null;

    // O form interno ja emite `ativo-buscado` e o evento borbulha; aqui so
    // marcamos qual ficou ativo para dar retorno visual.
    this.addEventListener('ativo-buscado', (evento) => {
      this._selecionado = evento.detail.simbolo;
      this.marcarSelecionado();
    });

    this.carregarCarteira();
  }

  async carregarCarteira() {
    const area = this.querySelector('#seletor-carteira');
    area.innerHTML = '<span class="text-muted small">Carregando carteira...</span>';

    let ativos;
    try {
      ativos = await listarAtivosMonitorados();
    } catch {
      // A carteira e conveniencia: se o backend nao responder, o campo de
      // busca continua funcionando e a tela nao vira um erro.
      area.innerHTML =
        '<span class="text-muted small">Carteira indisponivel no momento; use a busca acima.</span>';
      return;
    }

    this._ativos = ativos || [];

    if (this._ativos.length === 0) {
      area.innerHTML = `
        <div class="small text-muted">
          Nenhum ativo cadastrado ainda. Registre um na aba
          <a href="#/gestao">Gestão &rsaquo; Cadastro</a> e ele aparece aqui.
        </div>
      `;
      return;
    }

    area.innerHTML = this.templateCarteira();
    area.querySelectorAll('[data-simbolo]').forEach((botao) => {
      botao.addEventListener('click', () => this.selecionar(botao.dataset.simbolo));
    });

    if (this.hasAttribute('auto-selecionar')) {
      this.selecionar(this._ativos[0].simbolo);
    }
  }

  templateCarteira() {
    const chips = this._ativos
      .map(
        (a) => `
        <button type="button"
                class="btn btn-outline-secondary btn-sm"
                data-simbolo="${a.simbolo}">${a.simbolo}</button>`,
      )
      .join('');

    return `
      <div class="d-flex align-items-center flex-wrap gap-2">
        <span class="text-muted small">Cadastrados:</span>
        ${chips}
      </div>
    `;
  }

  selecionar(simbolo) {
    this._selecionado = simbolo;
    this.marcarSelecionado();

    // Mesmo evento do form: quem escuta nao precisa saber a origem.
    this.dispatchEvent(
      new CustomEvent('ativo-buscado', {
        detail: { simbolo },
        bubbles: true,
      }),
    );
  }

  marcarSelecionado() {
    this.querySelectorAll('[data-simbolo]').forEach((botao) => {
      const ativo = botao.dataset.simbolo === this._selecionado;
      botao.classList.toggle('btn-primary', ativo);
      botao.classList.toggle('btn-outline-secondary', !ativo);
    });
  }
}

customElements.define('seletor-de-ativos', SeletorDeAtivos);
