import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarSetores } from '../api/setoresApi.js';
import { buscarCotacaoRobusta } from '../api/ativosApi.js';
import { buscarAnalise, buscarFundamentos } from '../api/analisesApi.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';
import '../components/AtivoQuoteCard.js';
import '../components/AnaliseResultCard.js';
import '../components/FundamentosCard.js';

const COLUNAS = 3;

// Unica responsabilidade: orquestrar a visao "Mercado por setor" - busca o
// universo de referencia agrupado por setor (curado manualmente no backend,
// SetoresReferencia.java) e delega a renderizacao aos cartoes por setor.
//
// Cada linha e clicavel: expande abaixo dela cotacao, decisao e fundamentos
// do ativo - mesma mecanica de linha expansivel da tela de Monitorados
// (AtivosMonitoradosTable), so que sem o historico de candles: aqui e uma
// visao rapida de comparacao entre pares do setor, nao uma analise a fundo.
export class SetoresPage extends BaseComponent {
  connectedCallback() {
    this._expandidos = new Set();
    this._detalhesPorSimbolo = {};
    super.connectedCallback();
  }

  template() {
    return `
      <h4 class="mb-1">Mercado por setor</h4>
      <p class="text-muted small">
        Universo de referencia curado manualmente (nao vem de um indice oficial da B3) - os
        papeis mais liquidos de cada setor, pra dar contexto de comparacao que um unico ativo
        isolado nao tem. Cotacao atualizada a cada hora pelo backend.
      </p>
      <div id="setores-conteudo"><loading-spinner></loading-spinner></div>
    `;
  }

  afterRender() {
    this.addEventListener('click', (evento) => this.aoClicarLinha(evento));
    this.carregar();
  }

  async carregar() {
    const area = this.querySelector('#setores-conteudo');
    try {
      this._setores = await listarSetores();
      this.renderizar();
    } catch (erro) {
      area.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
    }
  }

  renderizar() {
    const area = this.querySelector('#setores-conteudo');
    area.innerHTML = `
      <div class="row row-cols-1 row-cols-lg-2 g-3">
        ${this._setores.map((setor) => this.renderSetor(setor)).join('')}
      </div>
    `;
    this.hidratarLinhasExpandidas();
  }

  aoClicarLinha(evento) {
    const linha = evento.target.closest('tr[data-simbolo]');
    if (!linha) {
      return;
    }
    this.alternarExpansao(linha.dataset.simbolo);
  }

  alternarExpansao(simbolo) {
    if (this._expandidos.has(simbolo)) {
      this._expandidos.delete(simbolo);
      this.renderizar();
      return;
    }

    this._expandidos.add(simbolo);
    this.renderizar();

    if (!this._detalhesPorSimbolo[simbolo]) {
      this.carregarDetalhes(simbolo);
    }
  }

  async carregarDetalhes(simbolo) {
    const [ativo, analise, fundamentos] = await Promise.all([
      buscarCotacaoRobusta(simbolo).catch(() => null),
      buscarAnalise(simbolo).catch(() => null),
      buscarFundamentos(simbolo).catch(() => null),
    ]);
    this._detalhesPorSimbolo[simbolo] = { ativo, analise, fundamentos };
    this.renderizar();
  }

  hidratarLinhasExpandidas() {
    this._expandidos.forEach((simbolo) => {
      const detalhes = this._detalhesPorSimbolo[simbolo];
      if (!detalhes) {
        return;
      }

      const linhaDetalhe = this.querySelector(`tr[data-detalhe="${simbolo}"]`);
      if (!linhaDetalhe) {
        return;
      }

      if (detalhes.ativo) {
        linhaDetalhe.querySelector('ativo-quote-card')?.setAtivo(detalhes.ativo);
      }
      if (detalhes.analise) {
        linhaDetalhe.querySelector('analise-result-card')?.setAnalise(detalhes.analise);
      }
      if (detalhes.fundamentos) {
        linhaDetalhe.querySelector('fundamentos-card')?.setFundamentos(detalhes.fundamentos);
      }
    });
  }

  renderSetor(setor) {
    const linhas = setor.ativos.map((ativo) => this.renderLinhaAtivo(ativo)).join('');
    return `
      <div class="col">
        <div class="card h-100 shadow-sm">
          <div class="card-header"><strong>${setor.nome}</strong></div>
          <div class="card-body p-0">
            <table class="table table-sm table-hover mb-0">
              <tbody>${linhas}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderLinhaAtivo(ativo) {
    const expandido = this._expandidos.has(ativo.simbolo);
    const variacao = ativo.variacaoPercent;
    const classe = variacao == null ? 'text-muted' : variacao >= 0 ? 'text-success' : 'text-danger';
    const variacaoTexto = variacao == null ? 'sem cotacao ainda' : `${variacao >= 0 ? '+' : ''}${Number(variacao).toFixed(2)}%`;
    const precoTexto = ativo.preco == null ? '-' : `R$ ${Number(ativo.preco).toFixed(2)}`;

    const linhaPrincipal = `
      <tr data-simbolo="${ativo.simbolo}" style="cursor: pointer;" class="${expandido ? 'table-active' : ''}">
        <td class="fw-semibold ps-3">${ativo.simbolo}</td>
        <td class="text-end">${precoTexto}</td>
        <td class="text-end pe-3 ${classe}">${variacaoTexto}</td>
      </tr>
    `;

    return expandido ? linhaPrincipal + this.renderLinhaDetalhe(ativo.simbolo) : linhaPrincipal;
  }

  renderLinhaDetalhe(simbolo) {
    const detalhes = this._detalhesPorSimbolo[simbolo];
    const conteudo = detalhes
      ? `
        <ativo-quote-card></ativo-quote-card>
        <analise-result-card></analise-result-card>
        <fundamentos-card></fundamentos-card>
      `
      : '<loading-spinner></loading-spinner>';

    return `
      <tr data-detalhe="${simbolo}">
        <td colspan="${COLUNAS}" class="bg-body-tertiary">${conteudo}</td>
      </tr>
    `;
  }
}

customElements.define('setores-page', SetoresPage);
