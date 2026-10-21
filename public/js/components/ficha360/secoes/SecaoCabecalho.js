import { BaseComponent } from '../../base/BaseComponent.js';
import { velasDoBanco } from '../../../api/pregoesApi.js';
import { dataBr, moeda, numero, pontos, precoDasVelas, rotuloDaFonte } from '../../../analise/fichaDoAtivo.js';
import { htmlAlertaStatusCvm, htmlSeloStatusCvm } from '../../../analise/statusCvm.js';
import { htmlFaixaConfiabilidade } from '../../../analise/ficha360/confiabilidade.js';
import { escaparHtml } from '../../../utils/html.js';
import { esqueleto } from '../../ficha/esqueleto.js';
import '../../FavoritoToggle.js';

const valor = (v) => (v === undefined || v === '' ? null : v);

/**
 * Preco do cabecalho: ultimo pregao do banco, ou a cotacao intradiaria do
 * gestor (favoritos) quando ela e mais nova que o pregao.
 */
export function precoDoCabecalho(ativo, velas) {
  const doBanco = precoDasVelas(velas);
  const intradiario = ativo?.regularMarketPrice != null ? {
    preco: Number(ativo.regularMarketPrice),
    variacao: ativo.regularMarketChangePercent != null ? Number(ativo.regularMarketChangePercent) : null,
    data: ativo.regularMarketTime ? String(ativo.regularMarketTime).slice(0, 10) : null,
    fonte: 'BRAPI',
  } : null;
  if (!doBanco) return intradiario;
  if (intradiario?.data && intradiario.data > String(doBanco.data)) return intradiario;
  return doBanco;
}

/** Junta as fontes do cabecalho; o primeiro valor nao nulo vence, null fica null. */
export function dadosDoCabecalho(simbolo, { ativo = null, identidade = null, base = null, pregoes = null } = {}) {
  return {
    simbolo,
    nome: valor(identidade?.razao_social) ?? valor(base?.nome) ?? valor(ativo?.longName) ?? valor(ativo?.shortName) ?? null,
    setor: valor(base?.setor) ?? null,
    cnae: valor(identidade?.cnae) ?? null,
    uf: valor(identidade?.uf_municipio) ?? valor(base?.ufMunicipio) ?? null,
    cnpj: valor(identidade?.cnpj) ?? null,
    isin: valor(identidade?.isin) ?? null,
    situacao: valor(identidade?.situacao_registro) ?? valor(base?.situacaoRegistro) ?? null,
    freeFloat: identidade?.free_float != null ? Number(identidade.free_float) : null,
    preco: precoDoCabecalho(ativo, velasDoBanco(pregoes)),
  };
}

const SELO_DA_ACAO = {
  COMPRAR: { simbolo: '▲', cor: (f) => (f >= 2 ? 'var(--f360-compra-forte, #15803d)' : 'var(--f360-compra, #16a34a)') },
  VENDER: { simbolo: '▼', cor: () => 'var(--f360-venda, #be123c)' },
  MANTER: { simbolo: '■', cor: () => 'var(--f360-manter, #b45309)' },
};

/** Selo da acao vindo do evento f360:plano; sem plano, sem selo. */
export function htmlSeloDaAcao(plano) {
  const selo = plano && SELO_DA_ACAO[plano.acao];
  if (!selo) return '';
  const forca = plano.acao === 'MANTER' ? '' : ` ${'●'.repeat(Math.max(0, Math.min(2, Number(plano.forca) || 0)))}`;
  return `<a href="#" class="badge rounded-pill f360-cab-selo text-decoration-none" data-ir-decisao
    style="background:${selo.cor(plano.forca)}" title="Ver plano de operação">
    ${selo.simbolo} ${escaparHtml(plano.acao)}${forca}</a>`;
}

function htmlPreco(p) {
  if (!p) return '<span class="text-body-secondary small">Sem preço no banco</span>';
  const v = p.variacao;
  const sobe = v != null && v >= 0;
  const cor = v == null ? 'var(--f360-texto-mudo, #64748b)' : sobe ? 'var(--f360-compra, #16a34a)' : 'var(--f360-venda, #be123c)';
  const seta = v == null ? '' : sobe ? '▲' : '▼';
  return `
    <div class="f360-cab-preco">${moeda(p.preco)}
      <span class="f360-cab-var" style="color:${cor}">${seta} ${pontos(v, 2, true)}</span>
    </div>
    <div class="f360-cab-mudo">${escaparHtml(rotuloDaFonte(p.fonte))} · ${dataBr(p.data)}</div>`;
}

export function htmlCabecalho(d, plano = null, confiabilidade = null) {
  const linha = [d.setor, d.cnae ? `CNAE ${d.cnae}` : null, d.uf ? `sede em ${d.uf}` : null].filter(Boolean);
  const ids = [
    ['CNPJ', d.cnpj],
    ['ISIN', d.isin],
    ['Free float', d.freeFloat != null ? `${numero(d.freeFloat, 1)}%` : null],
  ];
  return `
    ${htmlAlertaStatusCvm(d.situacao)}
    <div class="f360-cab">
      <div class="f360-cab-quem">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h1 class="f360-cab-simbolo mb-0">${escaparHtml(d.simbolo)}</h1>
          <favorito-toggle simbolo="${escaparHtml(d.simbolo)}"></favorito-toggle>
          ${htmlSeloStatusCvm(d.situacao)}
          <span data-selo-acao>${htmlSeloDaAcao(plano)}</span>
        </div>
        <div class="f360-cab-nome text-truncate">${escaparHtml(d.nome ?? '—')}</div>
        <div class="f360-cab-mudo text-truncate">${linha.length ? linha.map(escaparHtml).join(' · ') : '—'}</div>
        <div class="f360-cab-mudo f360-cab-ids">${ids.map(([r, v]) => `<span>${r} ${escaparHtml(v ?? '—')}</span>`).join('')}</div>
      </div>
      <div class="f360-cab-cotacao text-end">${htmlPreco(d.preco)}</div>
    </div>
    ${htmlFaixaConfiabilidade(confiabilidade)}`;
}

const ESTILO = `
  <style>
    .f360-cab { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .f360-cab-quem { min-width: 0; }
    .f360-cab-simbolo { font-size: 1.6rem; font-weight: 700; letter-spacing: .02em; }
    .f360-cab-nome { font-weight: 500; }
    .f360-cab-mudo { font-size: .8rem; color: var(--f360-texto-mudo, var(--bs-secondary-color)); }
    .f360-cab-ids { display: flex; flex-wrap: wrap; column-gap: .9rem; }
    .f360-cab-preco { font-size: 1.6rem; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .f360-cab-var { font-size: 1rem; font-weight: 600; }
    .f360-conf { display: flex; flex-wrap: wrap; align-items: flex-start; gap: .35rem; margin-top: .5rem; font-size: .75rem; }
    .f360-conf-selo { display: inline-block; padding: .1rem .5rem; border-radius: 999px; border: 1px solid var(--bs-border-color, #cbd5e1); color: var(--f360-texto-mudo, var(--bs-secondary-color)); }
    .f360-conf-ok { color: var(--bs-body-color); }
    .f360-conf-alerta { background: #fef3c7; border-color: #b45309; color: #78350f; font-weight: 600; }
    .f360-conf-critico { background: #fee2e2; border-color: #be123c; color: #7f1d1d; font-weight: 700; }
    .f360-conf-sem, .f360-conf-sem-dado summary { color: #64748b; background: transparent; }
    .f360-conf-sem-dado summary { cursor: pointer; display: inline-block; }
    .f360-conf-resumo { font-weight: 700; }
    .f360-cab-selo { color: #fff; font-size: .8rem; }
    @media (max-width: 575.98px) {
      .f360-cab-simbolo, .f360-cab-preco { font-size: 1.25rem; }
      .f360-cab-ids, .f360-cab-nome { display: none; }
    }
  </style>`;

// Unica responsabilidade: o cabecalho fixo da ficha - quem e o ativo, o preco
// com fonte e data, a estrela de favorito e o selo da acao do plano (evento
// f360:plano, contrato C3). Busca so pelo contexto (C2).
export class SecaoCabecalho extends BaseComponent {
  set contexto(ctx) {
    this._contexto = ctx;
    this.carregar();
  }

  get contexto() {
    return this._contexto;
  }

  connectedCallback() {
    super.connectedCallback();
    this._aoPlano ??= (e) => {
      if (!this._contexto || e.detail?.simbolo !== this._contexto.simbolo) return;
      this._plano = e.detail;
      const alvo = this.querySelector('[data-selo-acao]');
      if (alvo) alvo.innerHTML = htmlSeloDaAcao(this._plano);
    };
    document.addEventListener('f360:plano', this._aoPlano);
    this.addEventListener('click', this._aoClicar ??= (e) => {
      if (!e.target.closest('[data-ir-decisao]')) return;
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('f360:ir-para', { detail: { simbolo: this._contexto?.simbolo, secao: 'decisao' } }));
    });
  }

  disconnectedCallback() {
    document.removeEventListener('f360:plano', this._aoPlano);
  }

  template() {
    return this._dados ? ESTILO + htmlCabecalho(this._dados, this._plano, this._confiabilidade) : esqueleto(2);
  }

  async carregar() {
    const ctx = this._contexto;
    if (!ctx) return;
    const [ativo, identidade, base, pregoes, confiabilidade] = await Promise.all(
      ['ativo', 'identidade', 'base', 'pregoes', 'confiabilidade'].map((k) => ctx.obter(k)));
    if (ctx !== this._contexto) return;
    this._confiabilidade = confiabilidade;
    this._dados = dadosDoCabecalho(ctx.simbolo, { ativo, identidade, base, pregoes });
    this.innerHTML = this.template();
  }
}

customElements.define('secao-cabecalho', SecaoCabecalho);
