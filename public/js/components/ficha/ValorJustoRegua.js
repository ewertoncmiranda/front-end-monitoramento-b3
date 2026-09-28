import { BaseComponent } from '../base/BaseComponent.js';
import { moeda, numero, pontos, reguaDeValor, rotuloDaFonteLpa } from '../../analise/fichaDoAtivo.js';
import { escaparHtml } from '../../utils/html.js';
import { esqueleto } from './esqueleto.js';

const NOMES = { conservador: 'Conservador', base: 'Base', otimista: 'Otimista' };

// Unica responsabilidade: a regua do valor justo (Graham ajustado por juros) -
// os tres cenarios e o preco atual na mesma escala, com a margem de seguranca
// do cenario base e a origem de cada premissa (LPA, taxa, crescimento).
export class ValorJustoRegua extends BaseComponent {
  /** fundamentos: /analises/{s}/fundamentos; preco: ultimo fechamento do banco (opcional). */
  setDados({ fundamentos, preco }) {
    this._fundamentos = fundamentos;
    this._preco = preco;
    this._carregado = true;
    this.innerHTML = this.template();
  }

  template() {
    if (!this._carregado) return `<section class="ficha-cartao h-100">${esqueleto(5)}</section>`;
    const v = this._fundamentos?.detalhes?.valuation;
    const preco = this._preco ?? this._fundamentos?.detalhes?.snapshot_mercado?.preco;
    const regua = reguaDeValor(v, preco);
    if (!regua) {
      return `<section class="ficha-cartao h-100">
        <p class="ficha-rotulo">Valor justo (Graham)</p>
        <p class="mb-0 text-body-secondary">Sem valor justo: precisa de lucro por ação positivo.</p>
      </section>`;
    }
    const margem = Number(regua.margemBase);
    const tom = margem >= 20 ? 'success' : margem >= 0 ? 'secondary' : 'danger';
    const cenarioBase = v.cenarios_graham.base || {};

    return `
      <section class="ficha-cartao h-100 d-flex flex-column">
        <p class="ficha-rotulo">Valor justo (Graham ajustado pela Selic de ${pontos(v.taxa_livre_risco_percent, 2)})</p>
        <div class="d-flex align-items-baseline gap-2 flex-wrap mb-2">
          <span class="ficha-numero">${moeda(cenarioBase.preco_justo)}</span>
          <span class="small text-body-secondary">cenário base ·</span>
          <span class="small text-${tom}">margem ${pontos(margem, 1, true)}</span>
        </div>

        <div class="ficha-regua" role="img"
             aria-label="Preço ${moeda(regua.preco.valor)} contra valor justo de ${regua.marcas.map((m) => `${NOMES[m.cenario]} ${moeda(m.valor)}`).join(', ')}">
          <div class="ficha-regua-trilho"></div>
          <div class="ficha-regua-faixa" style="left:${regua.marcas[0].posicao}%;width:${regua.marcas[regua.marcas.length - 1].posicao - regua.marcas[0].posicao}%"></div>
          ${regua.marcas.map((m) => `
            <div class="ficha-regua-marca ${m.cenario === 'base' ? 'base' : ''}" style="left:${m.posicao}%"
                 title="${NOMES[m.cenario]}: ${moeda(m.valor)} (margem ${pontos(m.margem, 1, true)})"></div>`).join('')}
          <div class="ficha-regua-preco" style="left:${regua.preco.posicao}%" title="Preço atual ${moeda(regua.preco.valor)}">
            <span>preço ${numero(regua.preco.valor, 2)}</span>
          </div>
        </div>
        <p class="small text-body-secondary mb-3">
          ${regua.marcas.map((m) => `<span class="text-nowrap"><span class="ficha-regua-legenda ${m.cenario === 'base' ? 'base' : ''}"></span>${NOMES[m.cenario]} ${moeda(m.valor)}</span>`).join(' · ')}
        </p>

        <dl class="row small mb-0 mt-auto g-1">
          <dt class="col-7 fw-normal text-body-secondary">${rotuloDaFonteLpa(v.fonte_lpa)}</dt>
          <dd class="col-5 text-end mb-0">${moeda(v.lpa_usado)}</dd>
          <dt class="col-7 fw-normal text-body-secondary">Crescimento no cenário base</dt>
          <dd class="col-5 text-end mb-0">${pontos(cenarioBase.crescimento_percent)} a.a.</dd>
          <dt class="col-7 fw-normal text-body-secondary">Graham Number (√22,5·LPA·VPA)</dt>
          <dd class="col-5 text-end mb-0">${moeda(v.graham_number)}
            ${v.preco_ate_graham_number === undefined ? '' : `<span class="text-${v.preco_ate_graham_number ? 'success' : 'warning'}" title="${v.preco_ate_graham_number ? 'Preço abaixo do Graham Number' : 'Preço acima do Graham Number'}">${v.preco_ate_graham_number ? '✓' : '!'}</span>`}</dd>
        </dl>
        <a class="small link-secondary mt-2" href="#/formulas">Como o valor justo é calculado →</a>
      </section>
    `;
  }
}

customElements.define('valor-justo-regua', ValorJustoRegua);
