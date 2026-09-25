// Unica responsabilidade: prover o ciclo de vida comum de um Custom Element
// (renderizar + hook de pos-renderizacao).
//
// Deliberadamente SEM Shadow DOM: assim o Bootstrap carregado globalmente em
// index.html continua valendo dentro de qualquer componente, sem precisar
// importar CSS em cada um deles.
export class BaseComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = this.template();
    this.afterRender();
  }

  template() {
    return '';
  }

  afterRender() {
    // Hook opcional para os componentes que precisam ligar eventos ou buscar dados.
  }
}
