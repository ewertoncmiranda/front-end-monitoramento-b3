import { BaseComponent } from './base/BaseComponent.js';

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

const SECOES = [
  {
    id: 'curto',
    label: 'Curto prazo',
    desc: '1–20 candles · pivôs recentes, canal, Fibonacci e contração de volatilidade',
    overlays: [
      { id: 'pivos',     label: 'Pivôs S/R',      desc: 'Linhas horizontais nos topos e fundos de pivô recentes (lookback=2). Verde=suporte, Vermelho=resistência.' },
      { id: 'canal',     label: 'Canal',           desc: 'Duas linhas paralelas nos extremos máx/mín do período carregado.' },
      { id: 'fibonacci', label: 'Fibonacci',       desc: 'Níveis 0–100 % entre mínima e máxima do gráfico. Zonas de possível S/R de retração.' },
      { id: 'nr7',       label: 'NR7 / Inside Bar',desc: 'NR7 (laranja): menor amplitude dos 7 candles anteriores. Inside Bar (roxo): range interno ao candle anterior.' },
    ],
  },
  {
    id: 'medio',
    label: 'Médio prazo',
    desc: 'Semanas a ~3 meses · padrões de reversão e continuação',
    overlays: [
      { id: 'oco',         label: 'OCO / Cabeça-Ombros', desc: 'Três topos consecutivos com o central maior. Linha de pescoço horizontal na média dos dois fundos entre os topos.' },
      { id: 'duplo',       label: 'Topo / Fundo Duplo',  desc: 'Dois topos (ou fundos) dentro de 4 % um do outro com reversão entre eles. Linha de confirmação no fundo (ou topo) intermediário.' },
      { id: 'triangulo',   label: 'Triângulo',           desc: 'Regressão linear sobre os topos e fundos de pivô: linhas convergentes indicam compressão antes de rompimento.' },
      { id: 'bandeira',    label: 'Bandeira',             desc: 'Maior impulso direcional do período (mastro) seguido de canal de consolidação contra-tendência.' },
      { id: 'fibExtensao', label: 'Fibonacci + Extensão', desc: 'Retração 0–100 % + extensões 127 %, 161.8 %, 200 %, 261.8 % entre mín e máx do período.' },
    ],
  },
  {
    id: 'longo',
    label: 'Longo prazo',
    desc: 'Meses a anos · tendências primárias e acumulação/distribuição',
    overlays: [
      { id: 'tendencia',  label: 'Linha de Tendência', desc: 'Reta de regressão linear pelos topos (tendência de baixa) e pelos fundos (tendência de alta) usando lookback largo (n=5).' },
      { id: 'canalLongo', label: 'Canal de Tendência', desc: 'Linha de tendência primária + linha paralela projetada pelo extremo oposto.' },
      { id: 'wyckoff',    label: 'Acumulação / Distribuição (Wyckoff)', desc: 'Detecta o maior trecho de consolidação (baixa volatilidade relativa). Retângulo de suporte/resistência da zona.' },
      { id: 'copa',       label: 'Copa com Alça',      desc: 'Padrão em U: queda significativa, recuperação ao nível inicial e pequeno recuo (alça). Linha de resistência no topo da copa.' },
      { id: 'elliott',    label: 'Ondas de Elliott',   desc: 'Zigzag simplificado: 5 ondas de impulso (1-2-3-4-5) e 3 ondas corretivas (A-B-C) sobre os pivôs mais significativos.' },
    ],
  },
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
        ${SECOES.map((s) => this._secao(s)).join('')}
      </div>`;
  }

  _secao(secao) {
    const aberta = this._abertos.has(secao.id);
    const ativos = secao.overlays.filter((o) => this._ligados.has(o.id)).length;
    return `
      <div class="border-bottom">
        <button type="button" data-secao-toggle="${secao.id}"
                class="btn btn-link w-100 text-start text-decoration-none px-3 py-2 d-flex justify-content-between align-items-center">
          <span class="fw-semibold small">${aberta ? '▾' : '▸'} ${secao.label}
            ${ativos ? `<span class="badge text-bg-primary ms-1">${ativos}</span>` : ''}
          </span>
          <span class="text-muted" style="font-size:10px">${secao.desc}</span>
        </button>
        ${aberta ? `<div class="px-2 pb-2"><div class="row row-cols-1 g-2">${secao.overlays.map((o) => this._cartao(o)).join('')}</div></div>` : ''}
      </div>`;
  }

  _cartao(overlay) {
    const ligado = this._ligados.has(overlay.id);
    const resumo = this._resumo(overlay.id);
    return `
      <div class="col">
        <div class="card h-100 ${ligado ? 'border-primary' : ''}">
          <div class="card-body py-2 px-2">
            <button type="button" data-overlay="${overlay.id}"
                    class="btn btn-sm ${ligado ? 'btn-primary' : 'btn-outline-secondary'} mb-1">
              ${ligado ? '✓ ' : ''}${overlay.label}
            </button>
            <p class="small text-muted mb-1" style="font-size:11px">${overlay.desc}</p>
            ${resumo ? `<p class="small mb-0" style="font-size:11px">${resumo}</p>` : ''}
          </div>
        </div>
      </div>`;
  }

  _resumo(id) {
    const c = this._candles;
    if (!c.length) return '';
    if (id === 'pivos')       { const { suportes: s, resistencias: r } = _pivos(c, 2); return `<span class="text-success">${s.length} suporte(s)</span> · <span class="text-danger">${r.length} resistência(s)</span>`; }
    if (id === 'nr7')         { const { nr7, insideBars } = _nr7InsideBar(c); return `<strong>${nr7.length}</strong> NR7 · <strong>${insideBars.length}</strong> Inside Bar`; }
    if (id === 'fibonacci' || id === 'fibExtensao') { const alto = Math.max(...c.map(x => x.high)); const baixo = Math.min(...c.map(x => x.low)); return `Máx R$${alto.toFixed(2)} · Mín R$${baixo.toFixed(2)}`; }
    if (id === 'oco')         { const r = _oco(c); return r.length ? `<span class="text-warning">${r.length} padrão(ões) detectado(s)</span>` : 'Não detectado neste período'; }
    if (id === 'duplo')       { const r = _duplo(c); return `<span class="text-warning">${r.topos.length} topo(s) duplo · ${r.fundos.length} fundo(s) duplo</span>`; }
    if (id === 'triangulo')   { const r = _triangulo(c); return r ? `Topos: ${r.slopeAlto >= 0 ? '↗' : '↘'} · Fundos: ${r.slopeBaixo >= 0 ? '↗' : '↘'} · ${r.tipo}` : 'Pivôs insuficientes'; }
    if (id === 'bandeira')    { const r = _bandeira(c); return r ? `Mastro: ${r.mastroAltura >= 0 ? '↑' : '↓'} ${Math.abs(r.mastroAltura * 100).toFixed(1)} %` : 'Não detectada'; }
    if (id === 'tendencia')   { const r = _tendencia(c); return r ? `Alta: ${r.alta ? '✓' : '—'} · Baixa: ${r.baixa ? '✓' : '—'}` : 'Pivôs insuficientes'; }
    if (id === 'canalLongo')  { const r = _tendencia(c); return r ? 'Canal sobre linha primária' : 'Tendência primária não detectada'; }
    if (id === 'wyckoff')     { const r = _wyckoff(c); return r ? `Zona R$${r.baixo.toFixed(2)}–R$${r.alto.toFixed(2)} · ${r.duracao} candles` : 'Consolidação não detectada'; }
    if (id === 'copa')        { const r = _copa(c); return r ? `Fundo R$${r.fundo.toFixed(2)} em ${r.dataFundo}` : 'Padrão não detectado'; }
    if (id === 'elliott')     { const r = _elliott(c); return r ? `${r.ondas.length} ondas detectadas` : 'Período insuficiente'; }
    return '';
  }

  _emitir() {
    const linhas = [], marcadores = [];
    const c = this._candles;
    if (!c.length) { this.dispatchEvent(new CustomEvent('tecnico-alterado', { detail: { linhas, marcadores }, bubbles: true })); return; }

    // ── CURTO PRAZO ──
    if (this._ligados.has('pivos')) {
      const { suportes, resistencias } = _pivos(c, 2);
      suportes.forEach(p     => linhas.push({ price: p.price, color: '#198754', lineWidth: 1, lineStyle: 2, title: `S ${p.price.toFixed(2)}` }));
      resistencias.forEach(p => linhas.push({ price: p.price, color: '#dc3545', lineWidth: 1, lineStyle: 2, title: `R ${p.price.toFixed(2)}` }));
    }
    if (this._ligados.has('canal')) {
      const alto = Math.max(...c.map(x => x.high)), baixo = Math.min(...c.map(x => x.low));
      linhas.push({ price: alto,  color: '#0d6efd', lineWidth: 2, lineStyle: 0, title: `Canal ↑ ${alto.toFixed(2)}` });
      linhas.push({ price: baixo, color: '#0d6efd', lineWidth: 2, lineStyle: 0, title: `Canal ↓ ${baixo.toFixed(2)}` });
    }
    if (this._ligados.has('fibonacci')) {
      const alto = Math.max(...c.map(x => x.high)), baixo = Math.min(...c.map(x => x.low)), amp = alto - baixo;
      FIBO_NIVEIS.forEach(n => linhas.push({ price: baixo + amp * (1 - n.r), color: n.color, lineWidth: 1, lineStyle: 1, title: `Fib ${n.label} ${(baixo + amp * (1 - n.r)).toFixed(2)}` }));
    }
    if (this._ligados.has('nr7')) {
      const { nr7, insideBars } = _nr7InsideBar(c);
      nr7.forEach(i       => marcadores.push({ dataIso: c[i].dataIso, posicao: 'acima', cor: '#fd7e14', texto: 'NR7',  forma: 'square' }));
      insideBars.forEach(i => marcadores.push({ dataIso: c[i].dataIso, posicao: 'acima', cor: '#6f42c1', texto: 'IB',   forma: 'square' }));
    }

    // ── MÉDIO PRAZO ──
    if (this._ligados.has('oco')) {
      _oco(c).forEach(({ esq, cab, dir, neckline, idxEsq, idxDir }) => {
        linhas.push({ price: neckline, color: '#ff9800', lineWidth: 2, lineStyle: 2, title: `Neckline ${neckline.toFixed(2)}` });
        marcadores.push({ dataIso: esq.dataIso, posicao: 'acima', cor: '#ff9800', texto: 'Ombro E' });
        marcadores.push({ dataIso: cab.dataIso, posicao: 'acima', cor: '#ff9800', texto: 'Cabeça' });
        marcadores.push({ dataIso: dir.dataIso, posicao: 'acima', cor: '#ff9800', texto: 'Ombro D' });
      });
    }
    if (this._ligados.has('duplo')) {
      const { topos, fundos } = _duplo(c);
      topos.forEach(({ a, b, neck }) => {
        linhas.push({ price: neck, color: '#e91e63', lineWidth: 1, lineStyle: 2, title: `Neck ${neck.toFixed(2)}` });
        marcadores.push({ dataIso: a.dataIso, posicao: 'acima', cor: '#e91e63', texto: 'Topo 1' });
        marcadores.push({ dataIso: b.dataIso, posicao: 'acima', cor: '#e91e63', texto: 'Topo 2' });
      });
      fundos.forEach(({ a, b, neck }) => {
        linhas.push({ price: neck, color: '#4caf50', lineWidth: 1, lineStyle: 2, title: `Neck ${neck.toFixed(2)}` });
        marcadores.push({ dataIso: a.dataIso, posicao: 'abaixo', cor: '#4caf50', texto: 'Fundo 1' });
        marcadores.push({ dataIso: b.dataIso, posicao: 'abaixo', cor: '#4caf50', texto: 'Fundo 2' });
      });
    }
    if (this._ligados.has('triangulo')) {
      const t = _triangulo(c);
      if (t) {
        linhas.push({ type: 'line', points: t.highLine, color: '#dc3545', lineWidth: 1, lineStyle: 2, title: `Triângulo ↑` });
        linhas.push({ type: 'line', points: t.lowLine,  color: '#198754', lineWidth: 1, lineStyle: 2, title: `Triângulo ↓` });
      }
    }
    if (this._ligados.has('bandeira')) {
      const b = _bandeira(c);
      if (b) {
        linhas.push({ type: 'line', points: b.topoCanal,  color: '#9c27b0', lineWidth: 1, lineStyle: 2, title: 'Bandeira ↑' });
        linhas.push({ type: 'line', points: b.fundoCanal, color: '#9c27b0', lineWidth: 1, lineStyle: 2, title: 'Bandeira ↓' });
        marcadores.push({ dataIso: b.inicioMastro, posicao: b.mastroAltura >= 0 ? 'abaixo' : 'acima', cor: '#9c27b0', texto: 'Mastro' });
      }
    }
    if (this._ligados.has('fibExtensao')) {
      const alto = Math.max(...c.map(x => x.high)), baixo = Math.min(...c.map(x => x.low)), amp = alto - baixo;
      [...FIBO_NIVEIS, ...FIBO_EXT].forEach(n => linhas.push({ price: baixo + amp * (1 - n.r), color: n.color, lineWidth: 1, lineStyle: 1, title: `Fib ${n.label}` }));
    }

    // ── LONGO PRAZO ──
    if (this._ligados.has('tendencia')) {
      const t = _tendencia(c);
      if (t?.alta)  linhas.push({ type: 'line', points: t.alta,  color: '#198754', lineWidth: 2, lineStyle: 0, title: 'Tendência Alta' });
      if (t?.baixa) linhas.push({ type: 'line', points: t.baixa, color: '#dc3545', lineWidth: 2, lineStyle: 0, title: 'Tendência Baixa' });
    }
    if (this._ligados.has('canalLongo')) {
      const t = _tendencia(c);
      if (t?.alta)  { const p = _paralela(c, t.alta,  'max'); if (p) linhas.push({ type: 'line', points: p, color: '#198754', lineWidth: 1, lineStyle: 2, title: 'Canal Alta' }); }
      if (t?.baixa) { const p = _paralela(c, t.baixa, 'min'); if (p) linhas.push({ type: 'line', points: p, color: '#dc3545', lineWidth: 1, lineStyle: 2, title: 'Canal Baixa' }); }
    }
    if (this._ligados.has('wyckoff')) {
      const w = _wyckoff(c);
      if (w) {
        linhas.push({ price: w.alto,  color: '#607d8b', lineWidth: 2, lineStyle: 0, title: `Wyckoff R ${w.alto.toFixed(2)}` });
        linhas.push({ price: w.baixo, color: '#607d8b', lineWidth: 2, lineStyle: 0, title: `Wyckoff S ${w.baixo.toFixed(2)}` });
        marcadores.push({ dataIso: c[w.inicio].dataIso, posicao: 'abaixo', cor: '#607d8b', texto: 'Acum.' });
      }
    }
    if (this._ligados.has('copa')) {
      const cp = _copa(c);
      if (cp) {
        linhas.push({ price: cp.resistencia, color: '#2196f3', lineWidth: 2, lineStyle: 0, title: `Copa ${cp.resistencia.toFixed(2)}` });
        marcadores.push({ dataIso: cp.dataFundo, posicao: 'abaixo', cor: '#2196f3', texto: 'Fundo Copa' });
        if (cp.dataAlca) marcadores.push({ dataIso: cp.dataAlca, posicao: 'acima', cor: '#2196f3', texto: 'Alça' });
      }
    }
    if (this._ligados.has('elliott')) {
      const el = _elliott(c);
      if (el) el.ondas.forEach(({ dataIso, label, direcao }) =>
        marcadores.push({ dataIso, posicao: direcao === 'alta' ? 'abaixo' : 'acima', cor: '#ff5722', texto: label }));
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
