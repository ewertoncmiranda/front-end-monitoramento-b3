import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import { formatarMoeda, formatarNumero } from '../../../utils/numero.js';
import { formatarData } from '../../../utils/dataHora.js';
import {
  seloDoSinal, estadoDados, janelasInsiders, barrasPorJanela, serieRecompras,
  AVISO_RECOMPRA, NOTA_LEITURA,
} from '../../../analise/ficha360/insiders.js';

const q = (v) => (v === null ? '—' : formatarNumero(v, 0));
const reais = (v) => (v === null || v === undefined ? '—' : formatarMoeda(Number(v)));

function linhaTabela(l, destaque) {
  const rot = destaque
    ? `<th scope="row">${escaparHtml(l.rotulo)}</th>`
    : `<td class="ps-3">${escaparHtml(l.rotulo)}</td>`;
  return `<tr>${rot}<td class="text-end">${q(l.compraLiquidaQuantidade)}</td><td class="text-end">${reais(l.compraLiquidaVolume)}</td><td class="text-end">${l.movimentacoes}</td></tr>`;
}

export function tabelaJanelas(janelas) {
  return janelas.map((j) => `<table class="table table-sm mb-2"><caption class="small">Últimos ${j.meses} meses</caption>
<thead><tr><th scope="col">Quem</th><th scope="col" class="text-end">Compra líquida (ações)</th><th scope="col" class="text-end">Compra líquida (R$)</th><th scope="col" class="text-end">Movimentações</th></tr></thead>
<tbody>${linhaTabela(j.total, true)}${j.cargos.map((c) => linhaTabela(c, false)).join('')}</tbody></table>`).join('');
}

export function graficoBarras(barras) {
  const alt = 22; const larg = 320; const meio = 160;
  const itens = barras.map((b, i) => {
    const w = Math.round(b.proporcao * (meio - 50));
    const x = b.sentido === 'venda' ? meio - w : meio;
    const cor = b.sentido === 'compra' ? 'var(--bs-success, #198754)' : b.sentido === 'venda' ? 'var(--bs-danger, #dc3545)' : 'var(--bs-secondary, #6c757d)';
    return `<text x="0" y="${i * alt + 15}" font-size="11" fill="currentColor">${b.meses} m</text><rect x="${x}" y="${i * alt + 4}" width="${Math.max(w, 1)}" height="14" fill="${cor}"/>`;
  }).join('');
  const resumo = barras.map((b) => `${b.meses} meses: ${b.valor === null ? 'sem dado' : `${formatarNumero(b.valor, 0)} ações`}`).join('; ');
  const h = barras.length * alt + 4;
  return `<svg viewBox="0 0 ${larg} ${h}" role="img" aria-label="Compra líquida de ações por janela. ${escaparHtml(resumo)}" class="w-100" style="max-width:480px"><line x1="${meio}" y1="0" x2="${meio}" y2="${h}" stroke="currentColor" opacity=".4"/>${itens}</svg>`;
}

export function blocoRecompras(dto) {
  const est = estadoDados(dto, 'Recompras indisponíveis no momento.');
  if (!est.ok) return `<h3 class="h6 mt-3">Recompras</h3><p class="small text-muted" data-vazio="recompras">${escaparHtml(est.motivo)}</p>`;
  const serie = serieRecompras(dto);
  const linhas = serie.map((p) => `<tr><th scope="row">${escaparHtml(formatarData(p.dataBase))}${p.tipoDoc ? ` <small class="text-muted">${escaparHtml(p.tipoDoc)}</small>` : ''}</th><td class="text-end">${reais(p.saldo)}</td><td class="text-end">${reais(p.recompraLiquida)}</td></tr>`).join('');
  const tabela = serie.length
    ? `<div class="table-responsive"><table class="table table-sm"><caption class="small">Ações em tesouraria por balanço (recompra positiva = a empresa comprou)</caption><thead><tr><th scope="col">Balanço</th><th scope="col" class="text-end">Saldo</th><th scope="col" class="text-end">Recompra líquida</th></tr></thead><tbody>${linhas}</tbody></table></div>`
    : '<p class="small text-muted">Sem balanços na série.</p>';
  return `<h3 class="h6 mt-3">Recompras</h3>
<p class="small mb-1">Recompra líquida em 12 meses: <strong>${reais(dto.recompraLiquida12m)}</strong></p>
${tabela}
<p class="small text-muted" data-aviso="recompra">${escaparHtml(AVISO_RECOMPRA)}</p>`;
}

export function htmlSecao(insiders, recompras) {
  const est = estadoDados(insiders, 'Movimentações de insiders indisponíveis no momento.');
  let corpo;
  if (!est.ok) {
    corpo = `<p class="small text-muted" data-vazio="insiders">${escaparHtml(est.motivo)}</p>`;
  } else {
    const selo = seloDoSinal(insiders.sinal);
    const janelas = janelasInsiders(insiders);
    corpo = `<p class="mb-1"><span class="fw-bold ${selo.classe}" data-sinal="${escaparHtml(insiders.sinal || 'NEUTRO')}"><span aria-hidden="true">${selo.icone}</span> ${escaparHtml(selo.texto)}</span>${insiders.leitura ? ` <span class="small">${escaparHtml(insiders.leitura)}</span>` : ''}</p>
<p class="small text-muted mb-2" data-aviso="point-in-time">Dado vale a partir da entrega: ${escaparHtml(formatarData(insiders.dataEntregaMaisRecente))}. Última movimentação: ${escaparHtml(formatarData(insiders.dataUltimaMovimentacao))}.</p>
${janelas.length ? `<div class="table-responsive">${tabelaJanelas(janelas)}</div>${graficoBarras(barrasPorJanela(janelas))}` : '<p class="small text-muted">Sem movimentações nas janelas.</p>'}`;
  }
  return `<section class="ficha-cartao"><h2 class="h6">Quem está dentro</h2>${corpo}${blocoRecompras(recompras)}<p class="small text-muted mt-2 mb-0" data-aviso="leitura">${escaparHtml(NOTA_LEITURA)}</p></section>`;
}

export class SecaoInsiders extends BaseComponent {
  set contexto(ctx) { this._contexto = ctx; this.carregar(); }
  template() { return '<section class="ficha-cartao"><h2 class="h6">Quem está dentro</h2><p class="small text-muted">Carregando…</p></section>'; }
  async connectedCallback() { super.connectedCallback(); if (this._contexto) await this.carregar(); }
  async carregar() {
    if (!this._contexto || !this.isConnected) return;
    const [insiders, recompras] = await Promise.all([this._contexto.obter('insiders'), this._contexto.obter('recompras')]);
    if (!this.isConnected) return;
    this.innerHTML = htmlSecao(insiders, recompras);
  }
}
if (!customElements.get('secao-insiders')) customElements.define('secao-insiders', SecaoInsiders);
