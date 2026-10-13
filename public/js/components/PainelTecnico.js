import { BaseComponent } from './base/BaseComponent.js';

// Padrões de análise técnica de curto prazo desenhados sobre o gráfico.
// Emite `tecnico-alterado` com { linhas, marcadores } cada vez que um
// overlay é ligado ou desligado. Não desenha nada diretamente: quem
// recebe o evento (CandlesPage) repassa ao CandleChart.

const FIBO_NIVEIS = [
  { r: 0,     label: '0%',     color: '#6c757d' },
  { r: 0.236, label: '23.6%',  color: '#0d6efd' },
  { r: 0.382, label: '38.2%',  color: '#198754' },
  { r: 0.5,   label: '50%',    color: '#fd7e14' },
  { r: 0.618, label: '61.8%',  color: '#198754' },
  { r: 0.786, label: '78.6%',  color: '#0d6efd' },
  { r: 1,     label: '100%',   color: '#6c757d' },
];

const OVERLAYS = [
  { id: 'pivos',    label: 'Pivôs (S/R)',     desc: 'Linhas horizontais nos topos e fundos de pivô recentes. Resistência = topo que travou a alta; suporte = fundo que sustentou a baixa.' },
  { id: 'canal',    label: 'Canal curto',     desc: 'Duas linhas paralelas nos topos e fundos dos últimos candles. Rompimento do canal acima/abaixo sinaliza força direcional.' },
  { id: 'fibonacci',label: 'Fibonacci',       desc: 'Níveis 0 % / 23.6 % / 38.2 % / 50 % / 61.8 % / 78.6 % / 100 % entre a mínima e máxima do período. Zonas de possível suporte/resistência de retração.' },
  { id: 'nr7',      label: 'NR7 / Inside Bar',desc: 'NR7: vela com menor amplitude dos últimos 7 pregões — contração de volatilidade. Inside Bar: range inteiramente dentro da vela anterior.' },
];

export class PainelTecnico extends BaseComponent {
  connectedCallback() {
    this._candles = [];
    this._ligados = new Set();
    this.innerHTML = '<div id="painel-tecnico"></div>';
    this._renderizar();
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-overlay]');
      if (!btn) return;
      const id = btn.dataset.overlay;
      this._ligados.has(id) ? this._ligados.delete(id) : this._ligados.add(id);
      this._renderizar();
      this._emitir();
    });
  }

  setCandles(candles) {
    this._candles = candles || [];
    this._renderizar();
    this._emitir();
  }

  _renderizar() {
    const area = this.querySelector('#painel-tecnico');
    if (!area) return;
    if (!this._candles.length) { area.innerHTML = ''; return; }

    area.innerHTML = `
      <div class="padroes-cabecalho bg-body py-2 border-bottom mb-3">
        <h6 class="mb-1">Análise técnica — curto prazo</h6>
        <p class="small text-muted mb-0">
          Ative os overlays para sobrepor linhas e marcadores ao gráfico.
          Baseados nos ${this._candles.length} candles carregados.
        </p>
      </div>
      <div class="padroes-cartoes-scroll">
        <div class="row row-cols-1 g-3">
          ${OVERLAYS.map((o) => this._cartao(o)).join('')}
        </div>
      </div>
    `;
  }

  _cartao(overlay) {
    const ligado = this._ligados.has(overlay.id);
    const resumo = this._resumo(overlay.id);
    return `
      <div class="col">
        <div class="card h-100 ${ligado ? 'border-primary' : ''}">
          <div class="card-body py-2">
            <button type="button" data-overlay="${overlay.id}"
                    class="btn btn-sm ${ligado ? 'btn-primary' : 'btn-outline-secondary'} mb-2">
              ${ligado ? '✓ ' : ''}${overlay.label}
            </button>
            <p class="small text-muted mb-1">${overlay.desc}</p>
            ${resumo ? `<p class="small mb-0">${resumo}</p>` : ''}
          </div>
        </div>
      </div>`;
  }

  _resumo(id) {
    const c = this._candles;
    if (!c.length) return '';
    if (id === 'pivos') {
      const { suportes, resistencias } = _pivos(c);
      return `<span class="text-success">${suportes.length} suporte(s)</span> · <span class="text-danger">${resistencias.length} resistência(s)</span>`;
    }
    if (id === 'fibonacci') {
      const alto = Math.max(...c.map((x) => x.high));
      const baixo = Math.min(...c.map((x) => x.low));
      return `Máx <strong>R$${alto.toFixed(2)}</strong> · Mín <strong>R$${baixo.toFixed(2)}</strong>`;
    }
    if (id === 'nr7') {
      const { nr7, insideBars } = _nr7InsideBar(c);
      return `<strong>${nr7.length}</strong> NR7 · <strong>${insideBars.length}</strong> Inside Bar`;
    }
    if (id === 'canal') {
      return `${c.length} velas · linhas nos topos e fundos do período`;
    }
    return '';
  }

  _emitir() {
    const linhas = [];
    const marcadores = [];
    const c = this._candles;
    if (!c.length) {
      this.dispatchEvent(new CustomEvent('tecnico-alterado', { detail: { linhas, marcadores }, bubbles: true }));
      return;
    }

    if (this._ligados.has('pivos')) {
      const { suportes, resistencias } = _pivos(c);
      suportes.forEach((p) => linhas.push({ price: p.price, color: '#198754', lineWidth: 1, lineStyle: 2, title: `S ${p.price.toFixed(2)}` }));
      resistencias.forEach((p) => linhas.push({ price: p.price, color: '#dc3545', lineWidth: 1, lineStyle: 2, title: `R ${p.price.toFixed(2)}` }));
    }

    if (this._ligados.has('canal')) {
      const altos = c.map((x) => x.high);
      const baixos = c.map((x) => x.low);
      const topoCanal  = Math.max(...altos);
      const fundoCanal = Math.min(...baixos);
      linhas.push({ price: topoCanal,  color: '#0d6efd', lineWidth: 2, lineStyle: 0, title: `Canal ↑ ${topoCanal.toFixed(2)}` });
      linhas.push({ price: fundoCanal, color: '#0d6efd', lineWidth: 2, lineStyle: 0, title: `Canal ↓ ${fundoCanal.toFixed(2)}` });
    }

    if (this._ligados.has('fibonacci')) {
      const alto = Math.max(...c.map((x) => x.high));
      const baixo = Math.min(...c.map((x) => x.low));
      const amp = alto - baixo;
      FIBO_NIVEIS.forEach((n) => {
        const price = baixo + amp * (1 - n.r);
        linhas.push({ price, color: n.color, lineWidth: 1, lineStyle: 1, title: `Fib ${n.label} ${price.toFixed(2)}` });
      });
    }

    if (this._ligados.has('nr7')) {
      const { nr7, insideBars } = _nr7InsideBar(c);
      nr7.forEach((i) => marcadores.push({ dataIso: c[i].dataIso, posicao: 'acima', cor: '#fd7e14', texto: 'NR7', forma: 'square' }));
      insideBars.forEach((i) => marcadores.push({ dataIso: c[i].dataIso, posicao: 'acima', cor: '#6f42c1', texto: 'IB', forma: 'square' }));
    }

    this.dispatchEvent(new CustomEvent('tecnico-alterado', { detail: { linhas, marcadores }, bubbles: true }));
  }
}

// --- algoritmos ---

function _pivos(candles, n = 2) {
  const suportes = [], resistencias = [];
  for (let i = n; i < candles.length - n; i++) {
    const c = candles[i];
    let ehTopo = true, ehFundo = true;
    for (let d = 1; d <= n; d++) {
      if (candles[i - d].high >= c.high || candles[i + d].high >= c.high) ehTopo = false;
      if (candles[i - d].low  <= c.low  || candles[i + d].low  <= c.low)  ehFundo = false;
    }
    if (ehTopo)  resistencias.push({ price: c.high, dataIso: c.dataIso });
    if (ehFundo) suportes.push({ price: c.low,  dataIso: c.dataIso });
  }
  return { suportes, resistencias };
}

function _nr7InsideBar(candles) {
  const nr7 = [], insideBars = [];
  for (let i = 6; i < candles.length; i++) {
    const amp = candles[i].high - candles[i].low;
    const minAmp = Math.min(...candles.slice(i - 6, i).map((c) => c.high - c.low));
    if (amp < minAmp) nr7.push(i);
    const prev = candles[i - 1];
    if (candles[i].high <= prev.high && candles[i].low >= prev.low) insideBars.push(i);
  }
  return { nr7, insideBars };
}

customElements.define('painel-tecnico', PainelTecnico);
