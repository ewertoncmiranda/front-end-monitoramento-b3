import { BaseComponent } from './base/BaseComponent.js';
import { REGISTRO_OVERLAYS, overlaysPorHorizonte } from '../analise/overlays/registro.js';

// Padrões de análise técnica desenhados sobre o gráfico (curto, médio e longo prazo).
// Emite `tecnico-alterado` com { linhas, marcadores } a cada toggle.
// Linhas horizontais: { price, color, lineWidth, lineStyle, title }
// Linhas diagonais:   { type:'line', points:[{time,value}…], color, lineWidth, lineStyle, title }

const FIBO_NIVEIS = [
  { r: 0,     label: '0%',     color: '#6c757d' },
  { r: 0.236, label: '23.6%',  color: '#0d6efd' },
  { r: 0.382, label: '38.2%',  color: '#198754' },
  { r: 0.5,   label: '50%',    color: '#fd7e14' },
  { r: 0.618, label: '61.8%',  color: '#198754' },
  { r: 0.786, label: '78.6%',  color: '#0d6efd' },
  { r: 1,     label: '100%',   color: '#6c757d' },
];

const FIBO_EXT = [
  { r: 1.272, label: '127.2%', color: '#9c27b0' },
  { r: 1.618, label: '161.8%', color: '#9c27b0' },
  { r: 2.0,   label: '200%',   color: '#795548' },
  { r: 2.618, label: '261.8%', color: '#795548' },
];

const HORizontes = [
  { id: 'curto', label: 'Curto prazo', desc: '1–20 candles · pivôs recentes, canal, Fibonacci e contração de volatilidade' },
  { id: 'medio', label: 'Médio prazo', desc: 'Semanas a ~3 meses · padrões de reversão e continuação' },
  { id: 'longo', label: 'Longo prazo', desc: 'Meses a anos · tendências primárias e acumulação/distribuição' },
];

export class PainelTecnico extends BaseComponent {
  connectedCallback() {
    this._candles = [];
    this._ligados = new Set();
    this._abertos = new Set(['curto']); // seções abertas por padrão
    this.innerHTML = '<div id="painel-tecnico-root"></div>';
    this._renderizar();

    this.addEventListener('click', (e) => {
      const overlay = e.target.closest('[data-overlay]');
      if (overlay) {
        const id = overlay.dataset.overlay;
        this._ligados.has(id) ? this._ligados.delete(id) : this._ligados.add(id);
        this._renderizar();
        this._emitir();
        return;
      }
      const secao = e.target.closest('[data-secao-toggle]');
      if (secao) {
        const id = secao.dataset.secaoToggle;
        this._abertos.has(id) ? this._abertos.delete(id) : this._abertos.add(id);
        this._renderizar();
      }
    });
  }

  setCandles(candles) {
    this._candles = candles || [];
    this._renderizar();
    this._emitir();
  }

  _renderizar() {
    const root = this.querySelector('#painel-tecnico-root');
    if (!root) return;
    if (!this._candles.length) { root.innerHTML = ''; return; }

    const ativos = this._ligados.size;
    root.innerHTML = `
      <div class="padroes-cabecalho bg-body py-2 border-bottom mb-0">
        <h6 class="mb-1">Análise técnica</h6>
        <p class="small text-muted mb-0">${this._candles.length} candles · ${ativos} overlay(s) ativo(s)</p>
      </div>
      <div class="padroes-cartoes-scroll">
        ${HORizontes.map((h) => this._secao(h)).join('')}
      </div>`;
  }

  _secao(horizonte) {
    const aberta = this._abertos.has(horizonte.id);
    const overlays = overlaysPorHorizonte(horizonte.id);
    const ativos = overlays.filter((o) => this._ligados.has(o.id)).length;
    return `
      <div class="border-bottom">
        <button type="button" data-secao-toggle="${horizonte.id}"
                class="btn btn-link w-100 text-start text-decoration-none px-3 py-2 d-flex justify-content-between align-items-center">
          <span class="fw-semibold small">${aberta ? '▾' : '▸'} ${horizonte.label}
            ${ativos ? `<span class="badge text-bg-primary ms-1">${ativos}</span>` : ''}
          </span>
          <span class="text-muted" style="font-size:10px">${horizonte.desc}</span>
        </button>
        ${aberta ? `<div class="px-2 pb-2"><div class="row row-cols-1 g-2">${overlays.map((o) => this._cartao(o)).join('')}</div></div>` : ''}
      </div>`;
  }

  _cartao(overlay) {
    const ligado = this._ligados.has(overlay.id);
    return `
      <div class="col">
        <div class="card h-100 ${ligado ? 'border-primary' : ''}">
          <div class="card-body py-2 px-2">
            <button type="button" data-overlay="${overlay.id}"
                    class="btn btn-sm ${ligado ? 'btn-primary' : 'btn-outline-secondary'} mb-1">
              ${ligado ? '✓ ' : ''}${overlay.rotulo}
            </button>
            <p class="small text-muted mb-1" style="font-size:11px">${overlay.rotulo}</p>
          </div>
        </div>
      </div>`;
  }

  _emitir() {
    const linhas = [], marcadores = [];
    const c = this._candles;
    if (!c.length) { this.dispatchEvent(new CustomEvent('tecnico-alterado', { detail: { linhas, marcadores }, bubbles: true })); return; }

    // Usar registro de overlays (F360-PAI-5)
    for (const overlay of REGISTRO_OVERLAYS) {
      if (this._ligados.has(overlay.id)) {
        const resultado = overlay.calcular(c);
        if (resultado.linhas) linhas.push(...resultado.linhas);
        if (resultado.marcadores) marcadores.push(...resultado.marcadores);
      }
    }

    this.dispatchEvent(new CustomEvent('tecnico-alterado', { detail: { linhas, marcadores }, bubbles: true }));
  }
}

// ═══════════════════════════════════════════════════════════════
// ALGORITMOS
// ═══════════════════════════════════════════════════════════════

function _pivos(candles, n = 2) {
  const suportes = [], resistencias = [];
  for (let i = n; i < candles.length - n; i++) {
    const c = candles[i];
    let ehTopo = true, ehFundo = true;
    for (let d = 1; d <= n; d++) {
      if (candles[i - d].high >= c.high || candles[i + d].high >= c.high) ehTopo  = false;
      if (candles[i - d].low  <= c.low  || candles[i + d].low  <= c.low)  ehFundo = false;
    }
    if (ehTopo)  resistencias.push({ price: c.high, dataIso: c.dataIso, idx: i });
    if (ehFundo) suportes.push(    { price: c.low,  dataIso: c.dataIso, idx: i });
  }
  return { suportes, resistencias };
}

function _nr7InsideBar(candles) {
  const nr7 = [], insideBars = [];
  for (let i = 6; i < candles.length; i++) {
    const amp = candles[i].high - candles[i].low;
    const minAmp = Math.min(...candles.slice(i - 6, i).map(c => c.high - c.low));
    if (amp < minAmp) nr7.push(i);
    const prev = candles[i - 1];
    if (candles[i].high <= prev.high && candles[i].low >= prev.low) insideBars.push(i);
  }
  return { nr7, insideBars };
}

function _linearReg(pontos) {
  const n = pontos.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  pontos.forEach(([x, y]) => { sx += x; sy += y; sxy += x * y; sxx += x * x; });
  const d = n * sxx - sx * sx;
  if (Math.abs(d) < 1e-10) return null;
  const slope = (n * sxy - sx * sy) / d;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept, at: (x) => slope * x + intercept };
}

function _oco(candles) {
  const { resistencias: topos } = _pivos(candles, 3);
  const resultados = [];
  for (let i = 0; i < topos.length - 2; i++) {
    const esq = topos[i], cab = topos[i + 1], dir = topos[i + 2];
    if (cab.price <= Math.max(esq.price, dir.price) * 1.02) continue;
    if (Math.abs(esq.price - dir.price) / cab.price > 0.08) continue;
    const low1 = Math.min(...candles.slice(esq.idx, cab.idx + 1).map(c => c.low));
    const low2 = Math.min(...candles.slice(cab.idx, dir.idx + 1).map(c => c.low));
    resultados.push({ esq, cab, dir, neckline: (low1 + low2) / 2, idxEsq: esq.idx, idxDir: dir.idx });
  }
  return resultados;
}

function _duplo(candles) {
  const { resistencias: topos, suportes: fundos } = _pivos(candles, 2);
  const toposDuplos = [], fundosDuplos = [];
  const tolerancia = 0.04;
  for (let i = 0; i < topos.length - 1; i++) {
    const a = topos[i], b = topos[i + 1];
    if (Math.abs(a.price - b.price) / a.price > tolerancia) continue;
    const neck = Math.min(...candles.slice(a.idx, b.idx + 1).map(c => c.low));
    toposDuplos.push({ a, b, neck });
  }
  for (let i = 0; i < fundos.length - 1; i++) {
    const a = fundos[i], b = fundos[i + 1];
    if (Math.abs(a.price - b.price) / a.price > tolerancia) continue;
    const neck = Math.max(...candles.slice(a.idx, b.idx + 1).map(c => c.high));
    fundosDuplos.push({ a, b, neck });
  }
  return { topos: toposDuplos, fundos: fundosDuplos };
}

function _triangulo(candles) {
  const { resistencias: topos, suportes: fundos } = _pivos(candles, 2);
  if (topos.length < 2 || fundos.length < 2) return null;
  const regH = _linearReg(topos.map(p => [p.idx, p.price]));
  const regL = _linearReg(fundos.map(p => [p.idx, p.price]));
  if (!regH || !regL) return null;
  const i0 = 0, iN = candles.length - 1;
  const slopeAlto = regH.slope, slopeBaixo = regL.slope;
  let tipo = 'Simétrico';
  if (slopeAlto > -0.01 && slopeBaixo > 0.01) tipo = 'Ascendente';
  else if (slopeAlto < -0.01 && slopeBaixo < 0.01) tipo = 'Descendente';
  return {
    highLine: [{ time: candles[i0].dataIso, value: regH.at(i0) }, { time: candles[iN].dataIso, value: regH.at(iN) }],
    lowLine:  [{ time: candles[i0].dataIso, value: regL.at(i0) }, { time: candles[iN].dataIso, value: regL.at(iN) }],
    slopeAlto, slopeBaixo, tipo,
  };
}

function _bandeira(candles) {
  if (candles.length < 15) return null;
  let melhorIdx = 5, melhorAltura = 0;
  for (let i = 5; i < candles.length - 5; i++) {
    const iniClose = candles[i - 5].close, fimClose = candles[i].close;
    const altura = Math.abs((fimClose - iniClose) / iniClose);
    if (altura > Math.abs(melhorAltura)) { melhorIdx = i; melhorAltura = (fimClose - iniClose) / iniClose; }
  }
  const resto = candles.slice(melhorIdx);
  if (resto.length < 5) return null;
  const regT = _linearReg(resto.map((c, i) => [i, c.high]));
  const regB = _linearReg(resto.map((c, i) => [i, c.low]));
  if (!regT || !regB) return null;
  const iN = resto.length - 1;
  return {
    inicioMastro: candles[melhorIdx - 5].dataIso,
    mastroAltura: melhorAltura,
    topoCanal:  [{ time: resto[0].dataIso, value: regT.at(0) }, { time: resto[iN].dataIso, value: regT.at(iN) }],
    fundoCanal: [{ time: resto[0].dataIso, value: regB.at(0) }, { time: resto[iN].dataIso, value: regB.at(iN) }],
  };
}

function _tendencia(candles) {
  const { resistencias: topos, suportes: fundos } = _pivos(candles, 5);
  if (topos.length < 2 && fundos.length < 2) return null;
  const i0 = 0, iN = candles.length - 1;
  let alta = null, baixa = null;
  if (fundos.length >= 2) {
    const reg = _linearReg(fundos.map(p => [p.idx, p.price]));
    if (reg && reg.slope > 0) alta = [{ time: candles[i0].dataIso, value: reg.at(i0) }, { time: candles[iN].dataIso, value: reg.at(iN) }];
  }
  if (topos.length >= 2) {
    const reg = _linearReg(topos.map(p => [p.idx, p.price]));
    if (reg && reg.slope < 0) baixa = [{ time: candles[i0].dataIso, value: reg.at(i0) }, { time: candles[iN].dataIso, value: reg.at(iN) }];
  }
  return (alta || baixa) ? { alta, baixa } : null;
}

function _paralela(candles, linha, lado) {
  if (!linha) return null;
  const v0 = linha[0].value, v1 = linha[1].value;
  const slope = (v1 - v0) / (candles.length - 1);
  const deslocamentos = candles.map((c, i) => (lado === 'max' ? c.high : c.low) - (v0 + slope * i));
  const delta = lado === 'max' ? Math.max(...deslocamentos) : Math.min(...deslocamentos);
  return [{ time: linha[0].time, value: v0 + delta }, { time: linha[1].time, value: v1 + delta }];
}

function _wyckoff(candles) {
  if (candles.length < 20) return null;
  const janela = Math.min(30, Math.floor(candles.length / 2));
  let melhorInicio = 0, melhorVol = Infinity;
  for (let i = 0; i <= candles.length - janela; i++) {
    const trecho = candles.slice(i, i + janela);
    const returns = trecho.slice(1).map((c, j) => (c.close - trecho[j].close) / trecho[j].close);
    const media = returns.reduce((s, r) => s + r, 0) / returns.length;
    const vol = Math.sqrt(returns.reduce((s, r) => s + (r - media) ** 2, 0) / returns.length);
    if (vol < melhorVol) { melhorVol = vol; melhorInicio = i; }
  }
  const trecho = candles.slice(melhorInicio, melhorInicio + janela);
  const alto = Math.max(...trecho.map(c => c.high));
  const baixo = Math.min(...trecho.map(c => c.low));
  return { inicio: melhorInicio, duracao: janela, alto, baixo };
}

function _copa(candles) {
  if (candles.length < 20) return null;
  const resistencia = Math.max(candles[0].high, candles[candles.length - 1].high);
  const idxFundo = candles.reduce((best, c, i) => c.low < candles[best].low ? i : best, 0);
  const fundo = candles[idxFundo].low;
  if ((resistencia - fundo) / resistencia < 0.10) return null; // queda < 10 %
  // Procura alça: pequeno recuo após a recuperação (últimos 20 % dos candles)
  const fimCopa = Math.floor(candles.length * 0.8);
  const alcaCandles = candles.slice(fimCopa);
  const idxAlca = alcaCandles.findIndex((c, i) => i > 0 && c.low < alcaCandles[i - 1].low);
  return {
    fundo, resistencia,
    dataFundo: candles[idxFundo].dataIso,
    dataAlca: idxAlca >= 0 ? alcaCandles[idxAlca].dataIso : null,
  };
}

function _elliott(candles) {
  if (candles.length < 20) return null;
  const n = candles.length;
  const idxs = [0, Math.floor(n * 0.15), Math.floor(n * 0.35), Math.floor(n * 0.55), Math.floor(n * 0.75), n - 1];
  const labels5 = ['1', '2', '3', '4', '5'];
  const ondas = idxs.slice(0, 5).map((idx, i) => ({
    dataIso: candles[idx].dataIso,
    label: labels5[i],
    direcao: i % 2 === 0 ? 'alta' : 'baixa',
  }));
  // Ondas A-B-C sobre os últimos 25 %
  const abc = [Math.floor(n * 0.75), Math.floor(n * 0.83), Math.floor(n * 0.92)];
  abc.forEach((idx, i) => ondas.push({ dataIso: candles[idx].dataIso, label: ['A', 'B', 'C'][i], direcao: i % 2 === 0 ? 'baixa' : 'alta' }));
  return { ondas };
}

customElements.define('painel-tecnico', PainelTecnico);
