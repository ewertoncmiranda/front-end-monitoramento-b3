// Unica responsabilidade: exibir uma linha de ativo com retorno calculado (CART-PAI-4).
import { BaseComponent } from '../base/BaseComponent.js';
import { calcularRetornoAtivo } from '../../api/carteirasPrecoApi.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';

function formatarData(dataIso) {
  if (!dataIso) return '—';
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export class CarteiraAtivoLinha extends BaseComponent {
  #ativo = null;
  #resultado = null;
  #carregando = false;

  render() {
    this.innerHTML = this.template();
  }

  template() {
    if (this.#carregando) {
      return `<tr><td colspan="5"><loading-spinner></loading-spinner></td></tr>`;
    }

    if (!this.#ativo) {
      return `<tr><td colspan="5"></td></tr>`;
    }

    const { simbolo, dataEntrada, capital } = this.#ativo;
    const retorno = this.#resultado?.retorno ?? null;

    const retornoTexto = retorno !== null
      ? formatarPercentual(retorno, 2, { sinal: true })
      : '—';

    const retornoClasse = retorno !== null && retorno > 0
      ? 'badge text-success'
      : retorno !== null
        ? 'badge text-danger'
        : '';

    const seta = retorno !== null && retorno > 0 ? '▲' : '▼';
    const setaHtml = retorno !== null
      ? `<span class="badge ${retorno > 0 ? 'text-success' : 'text-danger'}">${seta}</span>`
      : '';

    return `<tr>
  <td><strong>${simbolo}</strong></td>
  <td>${formatarData(dataEntrada)}</td>
  <td>${formatarMoeda(capital)}</td>
  <td>${retornoClasse ? `<span class="${retornoClasse}">${retornoTexto}</span>` : retornoTexto}</td>
  <td>${setaHtml}</td>
</tr>`;
  }

  setAtivo({ simbolo, dataEntrada, capital }) {
    this.#ativo = { simbolo, dataEntrada, capital };
    this.#resultado = null;
    this.#carregando = true;
    this.render();

    calcularRetornoAtivo(simbolo, dataEntrada)
      .then((resultado) => {
        this.#resultado = resultado;
        this.#carregando = false;
        this.render();
      })
      .catch(() => {
        this.#resultado = null;
        this.#carregando = false;
        this.render();
      });
  }
}

customElements.define('carteira-ativo-linha', CarteiraAtivoLinha);
