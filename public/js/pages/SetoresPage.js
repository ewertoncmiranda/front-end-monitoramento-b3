import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarSetoresBase, listarAtivosBase } from '../api/baseAtivosApi.js';
import { buscarCotacaoRobusta } from '../api/ativosApi.js';
import { buscarAnalise, buscarFundamentos } from '../api/analisesApi.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';
import '../components/AtivoQuoteCard.js';
import '../components/AnaliseResultCard.js';
import '../components/FundamentosCard.js';

const COLUNAS = 3;
// So os primeiros N ativos de cada setor - a lista completa e assunto da
// aba Base (#/base?setor=), que ja pagina. Aqui e amostra de comparacao.
const LIMITE_POR_SETOR = 5;

// Unica responsabilidade: orquestrar a visao "Mercado por setor" - busca o
// universo REAL de setores da CVM (cvm_empresa.setor, via /base, TASK-59),
// nao mais os 10 setores/30 tickers hardcoded em SetoresReferencia.java -
// e delega a renderizacao aos cartoes por setor.
//
// Cada linha e clicavel: expande abaixo dela cotacao intradiaria, decisao e
// fundamentos do ativo - mesma mecanica de linha expansivel da tela de
// Monitorados (AtivosMonitoradosTable). Cotacao/decisao so existem pra quem
// ja e favorito (BRAPI); o card fica vazio pros demais - o preco de
// fechamento oficial ja aparece na propria linha, sem precisar expandir.
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
        Setores reais da CVM, com o universo amplo do COTAHIST (1.785 codigos) - nao mais uma
        lista curada de poucos papeis. Preco e o fechamento oficial mais recente; cotacao
        intradiaria e decisao so aparecem pra quem ja e favorito. Veja a lista completa de um
        setor na aba <a href="#/base">Base</a>.
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
      const nomes = await listarSetoresBase();
      this._setores = await Promise.all(
        nomes.map(async (nome) => {
          const pagina = await listarAtivosBase({ setor: nome, tamanho: LIMITE_POR_SETOR });
          return { nome, ativos: pagina.content || [] };
        }),
      );
      this._setores = this._setores.filter((setor) => setor.ativos.length > 0);
      this.renderizar();
    } catch (erro) {
      area.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
    }
  }

  renderizar() {
    const area = this.querySelector('#setores-conteudo');
    // align-items-start: sem isso, o flexbox do Bootstrap (row com
    // align-items:stretch por padrao) estica o card vizinho na mesma linha
    // pra acompanhar a altura do card que acabou de expandir - parece um
    // segundo card "abrindo" sozinho, mas e so o grid esticando o espaco
    // vazio. Cada card cresce so com o proprio conteudo agora.
    area.innerHTML = `
      <div class="row row-cols-1 row-cols-lg-2 g-3 align-items-start">
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
    const precoTexto = ativo.ultimoFechamento == null ? '-' : `R$ ${Number(ativo.ultimoFechamento).toFixed(2)}`;
    const dataTexto = ativo.dataUltimoFechamento || 'sem cotacao ainda';

    const linhaPrincipal = `
      <tr data-simbolo="${ativo.simbolo}" style="cursor: pointer;" class="${expandido ? 'table-active' : ''}">
        <td class="fw-semibold ps-3">${ativo.simbolo}${ativo.favorito ? ' <span class=\"badge bg-primary\">★</span>' : ''}</td>
        <td class="text-end">${precoTexto}</td>
        <td class="text-end pe-3 text-muted small">${dataTexto}</td>
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
