// CARTEIRAS-CARDS — Card de um ativo da carteira: ticker, quantidade, preco
// medio, entrada, preco atual, valor, valorizacao/perda, sparkline, participacao.
// `htmlCardAtivo` e `htmlLinhaAtivo` sao puras (testaveis sem DOM).
import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarNumero, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { htmlSparkline } from '../ficha360/Sparkline.js';

/** Resultado com cor, seta e sinal textual (nao depende so de cor). */
export function infoResultado(resultado, pct) {
  if (resultado === null || resultado === undefined) {
    return { classe: 'text-body-secondary', seta: '', rotulo: 'sem cotação', sinal: '', texto: '—', textoPct: '—' };
  }
  const sobe = resultado > 0;
  const cai = resultado < 0;
  const sinal = sobe ? '+' : cai ? '−' : '';
  return {
    classe: sobe ? 'text-success' : cai ? 'text-danger' : 'text-body-secondary',
    seta: sobe ? '▲' : cai ? '▼' : '■',
    rotulo: sobe ? 'Valorização' : cai ? 'Perda' : 'Sem variação',
    sinal,
    texto: `${sinal}${formatarMoeda(Math.abs(resultado))}`,
    textoPct: pct === null || pct === undefined ? '—' : `${sinal}${formatarPercentual(Math.abs(pct), 2)}`,
  };
}

const rotuloProvento = (prov) => {
  if (!prov || prov.total === null || prov.total === undefined) return '';
  const tipo = prov.tipo === 'recebido' ? 'recebidos' : 'estimados';
  const yoc = prov.yieldOnCost === null || prov.yieldOnCost === undefined ? '' : ` · yield on cost ${formatarPercentual(prov.yieldOnCost, 2)}`;
  return `<div class="small" data-prov="${escaparHtml(prov.tipo)}">Proventos ${tipo}${prov.tipo === 'estimado' ? ' <span class="badge text-bg-warning">estimado</span>' : ''}: <strong>${formatarMoeda(prov.total)}</strong>${yoc}</div>`;
};

export function htmlCardAtivo(p, { carregando = false } = {}) {
  if (carregando) {
    return `<article class="card carteira-card h-100" aria-busy="true"><div class="card-body placeholder-glow">
      <span class="placeholder col-4 mb-2"></span><span class="placeholder col-12 mb-2"></span><span class="placeholder col-8"></span></div></article>`;
  }
  const s = escaparHtml(p.simbolo);
  const r = infoResultado(p.resultado, p.resultadoPct);
  const dias = p.dias === null || p.dias === undefined ? '' : ` (${p.dias} ${p.dias === 1 ? 'dia' : 'dias'})`;
  const part = p.participacao === null || p.participacao === undefined ? null : p.participacao;
  const pctPart = part === null ? '—' : formatarPercentual(part, 1);
  const legado = p.legado
    ? `<div class="alert alert-secondary small py-1 px-2 mb-2" role="note">Legado (capital): sem quantidade registrada. Capital ${formatarMoeda(p.capital)} é alocação simulada.</div>`
    : '';
  const acoes = p.legado
    ? `${p.podeConverter ? `<li><button type="button" class="dropdown-item" data-acao="converter" data-simbolo="${s}">Converter em quantidade</button></li>` : ''}
       <li><button type="button" class="dropdown-item" data-acao="remover-legado" data-simbolo="${s}">Remover da carteira</button></li>`
    : `<li><button type="button" class="dropdown-item" data-acao="comprar" data-simbolo="${s}">Comprar mais</button></li>
       <li><button type="button" class="dropdown-item" data-acao="vender" data-simbolo="${s}">Vender</button></li>
       <li><button type="button" class="dropdown-item" data-acao="estornar" data-simbolo="${s}">Estornar última operação</button></li>`;
  return `<article class="card carteira-card h-100" data-simbolo="${s}" aria-label="${s}">
  <div class="card-body d-flex flex-column gap-2">
    <div class="d-flex justify-content-between align-items-start gap-2">
      <div>
        <a class="h5 mb-0 fw-bold text-decoration-none" href="#/ativo/${encodeURIComponent(p.simbolo)}">${s}</a>
        ${p.setor ? `<div class="small text-body-secondary">${escaparHtml(p.setor)}</div>` : ''}
      </div>
      <details class="carteira-menu"><summary class="btn btn-sm btn-outline-secondary" aria-label="Ações de ${s}">Ações ▾</summary>
        <ul class="list-unstyled carteira-menu-lista shadow-sm border rounded">${acoes}</ul></details>
    </div>
    ${legado}
    <div class="carteira-resultado ${r.classe}" aria-label="${r.rotulo} no período: ${r.texto} (${r.textoPct})">
      <span aria-hidden="true">${r.seta}</span> <strong>${r.texto}</strong> <span>(${r.textoPct})</span>
      <span class="small">${r.rotulo}${p.legado ? ' (estimada pelo preço)' : ' desde a entrada'}</span>
    </div>
    <dl class="row small mb-0 g-1">
      <dt class="col-6 fw-normal text-body-secondary">Quantidade</dt><dd class="col-6 mb-0 text-end" data-campo="quantidade">${p.legado ? '—' : formatarNumero(p.quantidade, 0)}</dd>
      <dt class="col-6 fw-normal text-body-secondary">Preço médio</dt><dd class="col-6 mb-0 text-end" data-campo="preco-medio">${p.legado ? '—' : formatarMoeda(p.precoMedio)}</dd>
      <dt class="col-6 fw-normal text-body-secondary">Entrada</dt><dd class="col-6 mb-0 text-end" data-campo="entrada">${formatarData(p.dataEntrada)}${dias}</dd>
      <dt class="col-6 fw-normal text-body-secondary">Preço atual</dt><dd class="col-6 mb-0 text-end" data-campo="preco-atual">${formatarMoeda(p.precoAtual)}${p.dataPreco ? ` <span class="text-body-secondary">(${formatarData(p.dataPreco)})</span>` : ''}</dd>
      <dt class="col-6 fw-normal text-body-secondary">Valor atual</dt><dd class="col-6 mb-0 text-end fw-semibold" data-campo="valor-atual">${formatarMoeda(p.valorAtual)}</dd>
    </dl>
    ${rotuloProvento(p.proventos)}
    ${p.serie && p.serie.length > 1 ? `<div class="carteira-spark">${htmlSparkline(p.serie.map((x) => x.preco), p.serie.map((x) => formatarData(x.dataIso)), `preço de ${p.simbolo}`)}</div>` : ''}
    <div class="mt-auto">
      <div class="d-flex justify-content-between small"><span>Participação</span><span data-campo="participacao">${pctPart}</span></div>
      <div class="progress" role="progressbar" aria-label="Participação de ${s} na carteira" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${part === null ? 0 : Math.round(part * 100)}" style="height:6px"><div class="progress-bar" style="width:${part === null ? 0 : Math.min(100, part * 100).toFixed(1)}%"></div></div>
      ${p.concentrado ? `<div class="small text-warning-emphasis mt-1" role="note">Concentração alta: acima de ${formatarPercentual(p.limiteConcentracao, 0)} da carteira.</div>` : ''}
    </div>
  </div>
</article>`;
}

/** Linha da tabela compacta (mesmos dados do card). */
export function htmlLinhaAtivo(p) {
  const r = infoResultado(p.resultado, p.resultadoPct);
  return `<tr data-simbolo="${escaparHtml(p.simbolo)}">
  <td><a href="#/ativo/${encodeURIComponent(p.simbolo)}"><strong>${escaparHtml(p.simbolo)}</strong></a>${p.legado ? ' <span class="badge text-bg-secondary">legado (capital)</span>' : ''}</td>
  <td class="text-end">${p.legado ? '—' : formatarNumero(p.quantidade, 0)}</td>
  <td class="text-end">${p.legado ? '—' : formatarMoeda(p.precoMedio)}</td>
  <td>${formatarData(p.dataEntrada)}</td>
  <td class="text-end">${formatarMoeda(p.precoAtual)}</td>
  <td class="text-end">${formatarMoeda(p.valorAtual)}</td>
  <td class="text-end ${r.classe}"><span aria-hidden="true">${r.seta}</span> ${r.texto} (${r.textoPct})</td>
  <td class="text-end">${p.participacao === null || p.participacao === undefined ? '—' : formatarPercentual(p.participacao, 1)}</td>
</tr>`;
}

/** <carteira-card-ativo>: setDados(posicaoAvaliada) renderiza o card. */
export class CarteiraCardAtivo extends BaseComponent {
  setDados(p) {
    this._dados = p;
    this.render();
  }

  template() {
    return htmlCardAtivo(this._dados ?? {}, { carregando: !this._dados });
  }
}

if (!customElements.get('carteira-card-ativo')) customElements.define('carteira-card-ativo', CarteiraCardAtivo);
