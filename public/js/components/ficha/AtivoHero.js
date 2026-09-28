import { BaseComponent } from '../base/BaseComponent.js';
import { buscarPregoes, velasDoBanco } from '../../api/pregoesApi.js';
import { dataBr, moeda, pontos, pontosDaLinha, precoDasVelas, rotuloDaFonte } from '../../analise/fichaDoAtivo.js';
import { escaparHtml } from '../../utils/html.js';
import { esqueleto } from './esqueleto.js';
import '../FavoritoToggle.js';

// Periodos do grafico do cabecalho: todos lidos do banco (/pregoes), sem BRAPI.
const PERIODOS = [
  { valor: '1m', rotulo: '1M', meses: 1, intervalo: 'dia' },
  { valor: '6m', rotulo: '6M', meses: 6, intervalo: 'dia' },
  { valor: '1a', rotulo: '1A', meses: 12, intervalo: 'dia' },
  { valor: '5a', rotulo: '5A', meses: 60, intervalo: 'semana' },
];
const LARGURA = 600;
const ALTURA = 90;

function inicio(meses, hoje = new Date()) {
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - meses, hoje.getUTCDate())).toISOString().slice(0, 10);
}

// Unica responsabilidade: o cabecalho da ficha - quem e o ativo, o ultimo
// preco com a fonte e a data, e um grafico de linha interativo por periodo.
// A estrela e o <favorito-toggle> (mesmos endpoints da tela Favoritos).
export class AtivoHero extends BaseComponent {
  /** Pode chegar duas vezes: so o simbolo e, depois, com setor e CNPJ - sem perder as velas. */
  setAtivo(ativo) {
    const mesmoAtivo = this._ativo?.simbolo === ativo.simbolo;
    if (!mesmoAtivo) {
      this._velas = null;
      this._preco = null;
      this._desenhadas = null;
      this._periodo = '1m';
    }
    this._ativo = { ...(mesmoAtivo ? this._ativo : {}), ...ativo };
    this.innerHTML = this.template();
    if (this._velas) this.ligarGrafico();
  }

  /** Velas diarias do ultimo mes (a pagina ja buscou): preco e grafico inicial. */
  setVelas(velas) {
    this._velas = velas || [];
    this._desenhadas = null;
    this._preco = precoDasVelas(this._velas);
    this.innerHTML = this.template();
    this.ligarGrafico();
  }

  template() {
    const a = this._ativo;
    if (!a) return '';
    const p = this._preco;
    const tomVar = p?.variacao === null || p?.variacao === undefined ? 'secondary' : p.variacao >= 0 ? 'success' : 'danger';
    return `
      <section class="ficha-cartao ficha-hero">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div class="min-w-0">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <h2 class="h3 mb-0 ficha-simbolo">${escaparHtml(a.simbolo)}</h2>
              <favorito-toggle simbolo="${escaparHtml(a.simbolo)}"></favorito-toggle>
            </div>
            <p class="text-body-secondary small mb-0 text-truncate">
              ${[a.setor, a.industria].filter(Boolean).map(escaparHtml).join(' · ') || '&nbsp;'}
            </p>
            ${a.cnpj ? `<p class="text-body-secondary small mb-0">CNPJ ${escaparHtml(a.cnpj)}</p>` : ''}
          </div>
          <div class="text-end">
            ${p ? `
              <div class="ficha-preco">${moeda(p.preco)}
                <span class="fs-6 text-${tomVar}">${pontos(p.variacao, 2, true)}</span>
              </div>
              <span class="badge rounded-pill ficha-selo ficha-selo-${p.fonte === 'BRAPI' ? 'info' : 'success'}"
                    title="Fonte do último fechamento">
                ${rotuloDaFonte(p.fonte)} · ${dataBr(p.data)}
              </span>`
            : this._velas ? '<span class="text-body-secondary small">Sem pregões no banco para este ativo.</span>'
            : `<div style="width:10rem">${esqueleto(2)}</div>`}
          </div>
        </div>
        <div class="mt-3">
          <div class="ficha-grafico" data-grafico>
            ${this._velas ? '' : esqueleto(1, 'placeholder-lg')}
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
            <div class="btn-group btn-group-sm" role="group" aria-label="Período do gráfico">
              ${PERIODOS.map((pe) => `
                <button type="button" class="btn ${pe.valor === this._periodo ? 'btn-secondary' : 'btn-outline-secondary'}"
                        data-periodo="${pe.valor}" aria-pressed="${pe.valor === this._periodo}">${pe.rotulo}</button>`).join('')}
            </div>
            <a class="small link-secondary" href="#/candles">Abrir candles e padrões →</a>
          </div>
        </div>
      </section>
    `;
  }

  ligarGrafico() {
    this.querySelectorAll('[data-periodo]').forEach((botao) => {
      botao.addEventListener('click', () => this.trocarPeriodo(botao.dataset.periodo));
    });
    this.desenhar(this._desenhadas || this._velas);
  }

  async trocarPeriodo(valor) {
    const periodo = PERIODOS.find((p) => p.valor === valor);
    if (!periodo || valor === this._periodo) return;
    this._periodo = valor;
    this.querySelectorAll('[data-periodo]').forEach((b) => {
      const ativo = b.dataset.periodo === valor;
      b.classList.toggle('btn-secondary', ativo);
      b.classList.toggle('btn-outline-secondary', !ativo);
      b.setAttribute('aria-pressed', String(ativo));
    });
    const area = this.querySelector('[data-grafico]');
    area.innerHTML = esqueleto(1, 'placeholder-lg');
    try {
      const resposta = await buscarPregoes(this._ativo.simbolo, { de: inicio(periodo.meses), intervalo: periodo.intervalo });
      if (this._periodo === valor) this.desenhar(velasDoBanco(resposta));
    } catch {
      area.innerHTML = '<p class="small text-body-secondary mb-0">Não foi possível carregar este período.</p>';
    }
  }

  desenhar(velas) {
    const area = this.querySelector('[data-grafico]');
    if (!area) return;
    if (!velas || velas.length < 2) {
      area.innerHTML = '<p class="small text-body-secondary mb-0">Histórico insuficiente para o gráfico.</p>';
      return;
    }
    this._desenhadas = velas;
    const fechamentos = velas.map((v) => v.close);
    const pts = pontosDaLinha(fechamentos, LARGURA, ALTURA, 4);
    const subiu = fechamentos[fechamentos.length - 1] >= fechamentos[0];
    const linha = pts.map((p) => p.join(',')).join(' ');
    const area_ = `0,${ALTURA} ${linha} ${LARGURA},${ALTURA}`;
    const variacao = ((fechamentos[fechamentos.length - 1] - fechamentos[0]) / fechamentos[0]) * 100;
    area.innerHTML = `
      <div class="ficha-grafico-leitura small" data-leitura>
        <span class="text-body-secondary">No período</span>
        <strong class="text-${subiu ? 'success' : 'danger'}">${pontos(variacao, 1, true)}</strong>
        <span class="text-body-secondary">· mín ${moeda(Math.min(...fechamentos))} · máx ${moeda(Math.max(...fechamentos))}</span>
      </div>
      <svg viewBox="0 0 ${LARGURA} ${ALTURA}" preserveAspectRatio="none" class="ficha-linha ${subiu ? 'sobe' : 'desce'}"
           role="img" aria-label="Fechamentos no período: ${pontos(variacao, 1, true)}" tabindex="0">
        <polygon class="ficha-linha-area" points="${area_}"></polygon>
        <polyline class="ficha-linha-traco" points="${linha}" vector-effect="non-scaling-stroke"></polyline>
        <line class="ficha-linha-cursor" x1="0" x2="0" y1="0" y2="${ALTURA}" vector-effect="non-scaling-stroke" visibility="hidden"></line>
      </svg>
    `;
    this.ligarCursor(velas, pts);
  }

  /** Passar o mouse (ou as setas do teclado) mostra data e fechamento do ponto. */
  ligarCursor(velas, pts) {
    const svg = this.querySelector('.ficha-linha');
    const cursor = svg.querySelector('.ficha-linha-cursor');
    const leitura = this.querySelector('[data-leitura]');
    const padrao = leitura.innerHTML;
    let indice = velas.length - 1;
    const mostrar = (i) => {
      indice = Math.max(0, Math.min(velas.length - 1, i));
      const v = velas[indice];
      cursor.setAttribute('x1', pts[indice][0]);
      cursor.setAttribute('x2', pts[indice][0]);
      cursor.setAttribute('visibility', 'visible');
      const periodo = v.dataFim && v.dataFim !== v.dataIso ? `${dataBr(v.dataIso)} a ${dataBr(v.dataFim)}` : dataBr(v.dataIso);
      leitura.innerHTML = `<span class="text-body-secondary">${periodo}</span> <strong>${moeda(v.close)}</strong>
        <span class="text-body-secondary">· ${rotuloDaFonte(v.fonte)}</span>`;
    };
    const esconder = () => {
      cursor.setAttribute('visibility', 'hidden');
      leitura.innerHTML = padrao;
    };
    svg.addEventListener('pointermove', (e) => {
      const caixa = svg.getBoundingClientRect();
      mostrar(Math.round(((e.clientX - caixa.left) / caixa.width) * (velas.length - 1)));
    });
    svg.addEventListener('pointerleave', esconder);
    svg.addEventListener('blur', esconder);
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { mostrar(indice - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { mostrar(indice + 1); e.preventDefault(); }
    });
  }
}

customElements.define('ativo-hero', AtivoHero);
