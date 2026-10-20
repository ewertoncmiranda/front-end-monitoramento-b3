import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarPercentual } from '../../utils/numero.js';
import { htmlEstadoVazio } from '../EstadoVazio.js';

// Unica responsabilidade: desenhar um ranking de tickers em duas colunas
// ("Maiores" e "Menores", ate 10 linhas cada) para os cards do carrossel do
// mercado (Plano MERC). Nao ordena nem calcula: exibe na ordem recebida do
// gestor. No celular as colunas viram abas (CSS em .ranking-tickers).
//
// API (propriedades; qualquer atribuicao redesenha se o elemento estiver no DOM):
//   el.dados       = { maiores: [...], menores: [...] }  itens com { posicao, simbolo, nome, setor, ... }
//   el.valor       = (item) => number    numero da barra e do sinal (padrao: item.valor ?? item.variacao)
//   el.formatar    = (item) => string    texto do valor (padrao: percentual com sinal)
//   el.direcional  = true                true: seta + "alta"/"queda" + cor; false: valor neutro (ex.: volume)
//   el.escalaComum = false               true: as duas colunas usam a mesma escala de barra
//   el.rotulos     = { maiores: 'Maiores', menores: 'Menores' }
//   el.vazio       = { titulo, causa }   estado vazio quando as duas listas vem vazias
export const LIMITE_RANKING = 10;

const PADRAO = {
  valor: (item) => item?.valor ?? item?.variacao,
  formatar: (item) => formatarPercentual(item?.valor ?? item?.variacao, 2, { sinal: true }),
  direcional: true,
  escalaComum: false,
  rotulos: { maiores: 'Maiores', menores: 'Menores' },
  vazio: { titulo: 'Ranking sem dados', causa: 'O gestor não devolveu ativos para este período.' },
};

let sequencia = 0;

const numero = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

function maiorModulo(itens, valor) {
  return itens.reduce((max, item) => Math.max(max, Math.abs(numero(valor(item)) ?? 0)), 0);
}

function htmlDirecao(v) {
  if (v === null) return { classe: 'ranking-tickers__valor--neutro', marca: '' };
  if (v > 0) return { classe: 'ranking-tickers__valor--alta', marca: '<span aria-hidden="true">▲</span> <span class="visually-hidden">alta</span>' };
  if (v < 0) return { classe: 'ranking-tickers__valor--queda', marca: '<span aria-hidden="true">▼</span> <span class="visually-hidden">queda</span>' };
  return { classe: 'ranking-tickers__valor--neutro', marca: '<span aria-hidden="true">=</span> <span class="visually-hidden">estável</span>' };
}

function htmlLinha(item, indice, opcoes, escala) {
  const v = numero(opcoes.valor(item));
  const largura = escala > 0 && v !== null ? Math.max(2, Math.round((Math.abs(v) / escala) * 100)) : 0;
  const direcao = opcoes.direcional ? htmlDirecao(v) : { classe: 'ranking-tickers__valor--neutro', marca: '' };
  const simbolo = String(item?.simbolo ?? '');
  const posicao = item?.posicao ?? indice + 1;
  return `<li class="ranking-tickers__linha">
      <span class="ranking-tickers__posicao">${escaparHtml(posicao)}</span>
      <span class="ranking-tickers__ativo">
        <a class="ranking-tickers__ticker" href="#/ativo/${escaparHtml(encodeURIComponent(simbolo))}"${item?.nome ? ` title="${escaparHtml(item.nome)}"` : ''}>${escaparHtml(simbolo)}</a>
        ${item?.setor ? `<span class="ranking-tickers__setor">${escaparHtml(item.setor)}</span>` : ''}
      </span>
      <span class="ranking-tickers__valor ${direcao.classe}">${direcao.marca}${escaparHtml(opcoes.formatar(item))}</span>
      <span class="ranking-tickers__trilho" aria-hidden="true"><span class="ranking-tickers__barra ${direcao.classe}" style="width:${largura}%"></span></span>
    </li>`;
}

function htmlColuna(lado, itens, opcoes, escala, idBase, ativa) {
  const titulo = opcoes.rotulos[lado];
  const corpo = itens.length
    ? `<ol class="ranking-tickers__lista">${itens.map((item, i) => htmlLinha(item, i, opcoes, escala)).join('')}</ol>`
    : '<p class="small text-muted mb-0" role="status">Sem ativos nesta lista.</p>';
  return `<section class="ranking-tickers__coluna${ativa ? ' is-ativa' : ''}" id="${idBase}-${lado}" data-coluna="${lado}"
      role="tabpanel" aria-labelledby="${idBase}-titulo-${lado}">
      <h6 class="ranking-tickers__titulo" id="${idBase}-titulo-${lado}">${escaparHtml(titulo)}</h6>
      ${corpo}
    </section>`;
}

/** HTML puro do ranking; `ativa` e a aba visivel no celular ('maiores' | 'menores'). */
export function htmlRankingTickers(dados, opcoesInformadas = {}, { idBase = 'ranking', ativa = 'maiores' } = {}) {
  const opcoes = { ...PADRAO, ...opcoesInformadas, rotulos: { ...PADRAO.rotulos, ...opcoesInformadas.rotulos } };
  const maiores = Array.isArray(dados?.maiores) ? dados.maiores.slice(0, LIMITE_RANKING) : [];
  const menores = Array.isArray(dados?.menores) ? dados.menores.slice(0, LIMITE_RANKING) : [];
  if (!maiores.length && !menores.length) {
    const vazio = { ...PADRAO.vazio, ...opcoesInformadas.vazio };
    return htmlEstadoVazio({ titulo: vazio.titulo, causa: vazio.causa });
  }
  const comum = Math.max(maiorModulo(maiores, opcoes.valor), maiorModulo(menores, opcoes.valor));
  const escala = (lista) => (opcoes.escalaComum ? comum : maiorModulo(lista, opcoes.valor));
  const aba = (lado) => `<button type="button" class="ranking-tickers__aba" role="tab" data-aba="${lado}"
      id="${idBase}-aba-${lado}" aria-controls="${idBase}-${lado}" aria-selected="${ativa === lado}"
      tabindex="${ativa === lado ? 0 : -1}">${escaparHtml(opcoes.rotulos[lado])}</button>`;
  return `<div class="ranking-tickers__abas" role="tablist" aria-label="Lista do ranking">${aba('maiores')}${aba('menores')}</div>
    <div class="ranking-tickers__colunas">
      ${htmlColuna('maiores', maiores, opcoes, escala(maiores), idBase, ativa === 'maiores')}
      ${htmlColuna('menores', menores, opcoes, escala(menores), idBase, ativa === 'menores')}
    </div>`;
}

export class RankingTickers extends BaseComponent {
  constructor() {
    super();
    this._dados = null;
    this._opcoes = {};
    this._ativa = 'maiores';
    this._idBase = `ranking-${++sequencia}`;
  }

  get dados() { return this._dados; }
  set dados(valor) { this._dados = valor; this._redesenhar(); }

  _opcao(nome, valor) { this._opcoes = { ...this._opcoes, [nome]: valor }; this._redesenhar(); }
  set valor(fn) { this._opcao('valor', fn); }
  set formatar(fn) { this._opcao('formatar', fn); }
  set direcional(b) { this._opcao('direcional', Boolean(b)); }
  set escalaComum(b) { this._opcao('escalaComum', Boolean(b)); }
  set rotulos(r) { this._opcao('rotulos', r || {}); }
  set vazio(v) { this._opcao('vazio', v || {}); }

  _redesenhar() { if (this.isConnected) this.render(); }

  template() {
    return htmlRankingTickers(this._dados, this._opcoes, { idBase: this._idBase, ativa: this._ativa });
  }

  afterRender() {
    this.classList?.add('ranking-tickers');
    if (this._ligado) return;
    this._ligado = true;
    // Listeners no proprio elemento: sobrevivem aos redesenhos do innerHTML.
    this.addEventListener('click', (e) => {
      const aba = e.target?.closest?.('[data-aba]');
      if (aba) this.selecionarAba(aba.dataset.aba);
    });
    this.addEventListener('keydown', (e) => {
      if (!e.target?.closest?.('[data-aba]')) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Evita que o carrossel em volta tambem troque de card.
        e.preventDefault();
        e.stopPropagation();
        this.selecionarAba(this._ativa === 'maiores' ? 'menores' : 'maiores', { focar: true });
      }
    });
  }

  selecionarAba(lado, { focar = false } = {}) {
    if (lado !== 'maiores' && lado !== 'menores') return;
    this._ativa = lado;
    for (const aba of this.querySelectorAll?.('[data-aba]') || []) {
      const ativa = aba.dataset.aba === lado;
      aba.setAttribute('aria-selected', String(ativa));
      aba.tabIndex = ativa ? 0 : -1;
      if (ativa && focar) aba.focus?.();
    }
    for (const coluna of this.querySelectorAll?.('[data-coluna]') || []) {
      coluna.classList.toggle('is-ativa', coluna.dataset.coluna === lado);
    }
  }
}

if (!customElements.get?.('ranking-tickers')) customElements.define('ranking-tickers', RankingTickers);
