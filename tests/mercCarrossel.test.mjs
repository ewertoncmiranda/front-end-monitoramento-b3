// MERC-PAI-1: <carrossel-mercado> - rotacao, pausa, retomada, teclado, swipe,
// reduced-motion, ARIA e isolamento de falha por card. Sem DOM real: stubs de
// HTMLElement/customElements e um relogio injetado no lugar de setInterval.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// --- stubs globais ------------------------------------------------------
class ElementoFalso {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.atributos = {};
    this.hidden = false;
    this.textContent = '';
    this.innerHTML = '';
  }
  setAttribute(nome, valor) { this.atributos[nome] = String(valor); }
  removeAttribute(nome) { delete this.atributos[nome]; }
  getAttribute(nome) { return this.atributos[nome] ?? null; }
  hasAttribute(nome) { return nome in this.atributos; }
}

globalThis.HTMLElement = class {
  constructor() {
    this._ouvintes = [];
    this.classList = { itens: new Set(), add(c) { this.itens.add(c); } };
    this.isConnected = true;
  }
  addEventListener(tipo, fn, opcoes = {}) {
    const registro = { tipo, fn };
    this._ouvintes.push(registro);
    opcoes.signal?.addEventListener('abort', () => { this._ouvintes = this._ouvintes.filter((r) => r !== registro); });
  }
  disparar(tipo, evento = {}) { for (const r of this._ouvintes.filter((o) => o.tipo === tipo)) r.fn(evento); }
  getAttribute() { return null; }
  contains() { return false; }
};
const definidos = new Map();
globalThis.customElements = {
  define(nome, classe) {
    if (definidos.has(nome)) throw new Error(`NotSupportedError: "${nome}" já foi definido`);
    definidos.set(nome, classe);
  },
  get(nome) { return definidos.get(nome); },
};

const { CarrosselMercado, htmlMolduraCarrossel, montarCard, INTERVALO_PADRAO_MS } = await import('../public/js/components/inicio/CarrosselMercado.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos += 1; }

function relogioFalso() {
  const timers = new Map();
  let proximo = 1;
  return {
    timers,
    setInterval(fn, ms) { const id = proximo++; timers.set(id, { fn, ms }); return id; },
    clearInterval(id) { timers.delete(id); },
    tique() { for (const t of [...timers.values()]) t.fn(); },
  };
}

/** Carrossel com DOM falso: cards, bolinhas, hosts e regiao viva. */
function montar(cards, { reduzirMovimento = false } = {}) {
  const c = new CarrosselMercado();
  const slides = cards.map((_, i) => new ElementoFalso({ card: String(i) }));
  const bolinhas = cards.map((_, i) => new ElementoFalso({ ir: String(i) }));
  const hosts = cards.map(() => new ElementoFalso());
  const regiao = new ElementoFalso();
  const botaoPausa = new ElementoFalso();
  c.querySelectorAll = (sel) => (sel === '[data-card]' ? slides : sel === '[data-ir]' ? bolinhas : []);
  c.querySelector = (sel) => {
    const host = /^\[data-card-host="(\d+)"\]$/.exec(sel);
    if (host) return hosts[Number(host[1])];
    if (sel === '[data-anuncio]') return regiao;
    if (sel === '[data-alternar]') return botaoPausa;
    return null;
  };
  c.relogio = relogioFalso();
  c.reduzirMovimento = reduzirMovimento;
  c._cards = cards;
  c.connectedCallback();
  return { c, slides, bolinhas, hosts, regiao, botaoPausa };
}

const cardsBase = () => [
  { id: 'a', titulo: 'Altas e quedas', render(host) { host.innerHTML = 'A pronto'; } },
  { id: 'b', titulo: 'Liquidez', render(host) { host.innerHTML = 'B pronto'; } },
  { id: 'c', titulo: 'Negociação', render(host) { host.innerHTML = 'C pronto'; } },
];
const visivel = (slides) => slides.findIndex((s) => !s.hidden);
const alvo = (attr, dataset = {}) => ({ closest: (sel) => (sel.includes(`[${attr}]`) ? Object.assign(new ElementoFalso(dataset), { atributos: { [attr]: '' } }) : null) });

await caso('stub de customElements lança em nome duplicado, como o navegador', () => {
  assert.ok(customElements.get('carrossel-mercado'));
  assert.throws(() => customElements.define('carrossel-mercado', class {}), /já foi definido/);
});

await caso('nenhum outro arquivo define carrossel-mercado ou ranking-tickers', () => {
  const raiz = new URL('../public/js/', import.meta.url);
  const fontes = readdirSync(raiz, { recursive: true }).filter((f) => String(f).endsWith('.js'));
  for (const nome of ['carrossel-mercado', 'ranking-tickers']) {
    const donos = fontes.filter((f) => readFileSync(new URL(String(f).replaceAll('\\', '/'), raiz), 'utf8').includes(`define('${nome}'`));
    assert.equal(donos.length, 1, `${nome}: ${donos.join(', ')}`);
  }
});

await caso('moldura: ARIA de carrossel, aria-label por card e anúncio "card N de M"', () => {
  const html = htmlMolduraCarrossel(cardsBase(), { indice: 0 });
  assert.match(html, /role="region"/);
  assert.match(html, /aria-roledescription="carrossel"/);
  assert.match(html, /aria-label="Altas e quedas \(card 1 de 3\)"/);
  assert.match(html, /aria-label="Liquidez \(card 2 de 3\)"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Card 1 de 3: Altas e quedas/);
  assert.equal((html.match(/ hidden>/g) || []).length, 2);
  assert.match(html, /data-anterior/);
  assert.match(html, /data-proximo/);
  assert.equal((html.match(/data-ir="/g) || []).length, 3);
  const escapado = htmlMolduraCarrossel([{ titulo: '<img onerror=x>', render() {} }]);
  assert.doesNotMatch(escapado, /<img/);
  assert.doesNotMatch(escapado, /data-proximo/, 'um card só: sem setas');
  assert.equal(htmlMolduraCarrossel([]), '');
});

await caso('rotação: avança a cada intervalo e volta ao primeiro no fim', () => {
  const { c, slides, bolinhas, regiao } = montar(cardsBase());
  const [timer] = c.relogio.timers.values();
  assert.equal(timer.ms, INTERVALO_PADRAO_MS);
  assert.equal(INTERVALO_PADRAO_MS, 10000);
  assert.equal(visivel(slides), 0);
  c.relogio.tique();
  assert.equal(c.indice, 1);
  assert.equal(visivel(slides), 1);
  assert.equal(bolinhas[1].getAttribute('aria-current'), 'true');
  assert.equal(bolinhas[0].getAttribute('aria-current'), null);
  assert.equal(regiao.textContent, 'Card 2 de 3: Liquidez');
  assert.equal(regiao.getAttribute('aria-live'), 'off', 'rodando sozinho não interrompe o leitor');
  c.relogio.tique(); c.relogio.tique();
  assert.equal(c.indice, 0);
});

await caso('pausa com mouse e foco; retoma só quando ambos saem', () => {
  const { c, regiao } = montar(cardsBase());
  c.disparar('mouseenter');
  assert.equal(c.relogio.timers.size, 0);
  assert.equal(regiao.getAttribute('aria-live'), 'polite');
  c.disparar('focusin');
  c.disparar('mouseleave');
  assert.equal(c.relogio.timers.size, 0, 'foco ainda dentro');
  c.disparar('focusout', { relatedTarget: null });
  assert.equal(c.relogio.timers.size, 1);
  c.relogio.tique();
  assert.equal(c.indice, 1);
});

await caso('botão Pausar/Retomar', () => {
  const { c, botaoPausa } = montar(cardsBase());
  c.disparar('click', { target: alvo('data-alternar') });
  assert.equal(c.relogio.timers.size, 0);
  assert.equal(botaoPausa.textContent, 'Retomar');
  assert.equal(botaoPausa.getAttribute('aria-pressed'), 'true');
  c.disparar('mouseenter'); c.disparar('mouseleave');
  assert.equal(c.relogio.timers.size, 0, 'pausa do usuário vence mouse');
  c.disparar('click', { target: alvo('data-alternar') });
  assert.equal(c.relogio.timers.size, 1);
  assert.equal(botaoPausa.textContent, 'Pausar');
});

await caso('teclado ←/→, setas e bolinhas navegam e anunciam', () => {
  const { c, slides, regiao } = montar(cardsBase());
  let prevenido = 0;
  c.disparar('keydown', { key: 'ArrowRight', target: {}, preventDefault() { prevenido += 1; } });
  assert.equal(c.indice, 1);
  c.disparar('keydown', { key: 'ArrowLeft', target: {}, preventDefault() { prevenido += 1; } });
  c.disparar('keydown', { key: 'ArrowLeft', target: {}, preventDefault() { prevenido += 1; } });
  assert.equal(c.indice, 2, 'volta do primeiro para o último');
  assert.equal(prevenido, 3);
  assert.equal(regiao.textContent, 'Card 3 de 3: Negociação');
  c.disparar('keydown', { key: 'Enter', target: {} });
  assert.equal(c.indice, 2);
  c.disparar('keydown', { key: 'ArrowRight', target: { closest: (sel) => (sel.includes('input') ? {} : null) } });
  assert.equal(c.indice, 2, 'setas dentro de campo não trocam card');
  c.disparar('keydown', { key: 'ArrowRight', target: {}, defaultPrevented: true });
  assert.equal(c.indice, 2, 'tecla já tratada por filho (abas do ranking) é ignorada');
  c.disparar('click', { target: alvo('data-proximo') });
  assert.equal(c.indice, 0);
  c.disparar('click', { target: alvo('data-anterior') });
  assert.equal(c.indice, 2);
  c.disparar('click', { target: alvo('data-ir', { ir: '1' }) });
  assert.equal(c.indice, 1);
  assert.equal(visivel(slides), 1);
  assert.equal(c.relogio.timers.size, 1, 'navegação manual reinicia a contagem');
});

await caso('swipe por pointer events (toque); mouse e arrasto curto não trocam', () => {
  const { c } = montar(cardsBase());
  c.disparar('pointerdown', { clientX: 200, pointerType: 'touch' });
  c.disparar('pointerup', { clientX: 100, pointerType: 'touch' });
  assert.equal(c.indice, 1, 'swipe para a esquerda avança');
  c.disparar('pointerdown', { clientX: 100, pointerType: 'touch' });
  c.disparar('pointerup', { clientX: 220, pointerType: 'touch' });
  assert.equal(c.indice, 0, 'swipe para a direita volta');
  c.disparar('pointerdown', { clientX: 100, pointerType: 'touch' });
  c.disparar('pointerup', { clientX: 80, pointerType: 'touch' });
  assert.equal(c.indice, 0);
  c.disparar('pointerdown', { clientX: 300, pointerType: 'mouse' });
  c.disparar('pointerup', { clientX: 0, pointerType: 'mouse' });
  assert.equal(c.indice, 0);
  c.disparar('pointerdown', { clientX: 300, pointerType: 'touch' });
  c.disparar('pointercancel');
  c.disparar('pointerup', { clientX: 0, pointerType: 'touch' });
  assert.equal(c.indice, 0);
});

await caso('prefers-reduced-motion: não roda sozinho, mas navega', () => {
  const { c, regiao } = montar(cardsBase(), { reduzirMovimento: true });
  assert.equal(c.relogio.timers.size, 0);
  c.disparar('mouseleave');
  c.disparar('focusout', {});
  assert.equal(c.relogio.timers.size, 0);
  c.avancar();
  assert.equal(c.indice, 1);
  assert.equal(c.relogio.timers.size, 0);
  assert.equal(regiao.getAttribute('aria-live'), 'polite');

  const media = globalThis.matchMedia;
  globalThis.matchMedia = (q) => ({ matches: q === '(prefers-reduced-motion: reduce)' });
  try {
    const { c: c2 } = montar(cardsBase(), { reduzirMovimento: null });
    assert.equal(c2.relogio.timers.size, 0, 'lê a media query quando não sobreposto');
  } finally { globalThis.matchMedia = media; }
});

await caso('um card só não roda', () => {
  const { c } = montar(cardsBase().slice(0, 1));
  assert.equal(c.relogio.timers.size, 0);
});

await caso('card que falha mostra erro só nele; os outros carregam', async () => {
  const cards = cardsBase();
  cards[0] = { id: 'x', titulo: 'Setores', render() { throw new Error('quebrou sincrono'); } };
  cards[1] = { id: 'y', titulo: 'Liquidez', tituloErro: 'Panorama indisponível', async render() { throw new Error('HTTP 404'); } };
  const { hosts } = montar(cards);
  await new Promise((r) => setTimeout(r, 0));
  assert.match(hosts[0].innerHTML, /Setores indisponível/);
  assert.match(hosts[0].innerHTML, /quebrou sincrono/);
  assert.match(hosts[1].innerHTML, /Panorama indisponível/);
  assert.match(hosts[1].innerHTML, /HTTP 404/);
  assert.equal(hosts[2].innerHTML, 'C pronto');

  const host = new ElementoFalso();
  await montarCard({ titulo: 'Sem render' }, host);
  assert.match(host.innerHTML, /Sem render indisponível/);
  await montarCard({ titulo: 'x', render() {} }, null); // host ausente não lança
  const lento = new ElementoFalso();
  let concluir;
  const pendente = montarCard({ titulo: 'Lento', render: () => new Promise((r) => { concluir = r; }) }, lento);
  assert.match(lento.innerHTML, /loading-spinner/);
  concluir(); await pendente;
});

await caso('disconnectedCallback limpa timer e listeners', () => {
  const { c } = montar(cardsBase());
  assert.equal(c.relogio.timers.size, 1);
  assert.ok(c._ouvintes.length >= 9);
  c.disconnectedCallback();
  assert.equal(c.relogio.timers.size, 0);
  assert.equal(c._ouvintes.length, 0);
  c.disparar('keydown', { key: 'ArrowRight', target: {} });
  assert.equal(c.indice, 0);
  c.connectedCallback();
  assert.equal(c.relogio.timers.size, 1, 'reconectar volta a rodar');
  c.connectedCallback();
  assert.equal(c.relogio.timers.size, 1, 'rerender não duplica timer');
  assert.equal(c._ouvintes.filter((o) => o.tipo === 'keydown').length, 1, 'nem listeners');
});

await caso('Início: carrossel entre o aviso de defasagem e os alertas, com os quatro cards reais', () => {
  const fonte = readFileSync(new URL('../public/js/pages/InicioPage.js', import.meta.url), 'utf8');
  const aviso = fonte.indexOf('<aviso-defasagem-cargas>');
  const carrossel = fonte.indexOf('<carrossel-mercado');
  const alertas = fonte.indexOf('data-alertas-operacionais');
  assert.ok(aviso >= 0 && aviso < carrossel && carrossel < alertas);
  assert.match(fonte, /cardAltasQuedas\(\)/);
  assert.match(fonte, /cardLiquidez\(\)/);
  assert.match(fonte, /cardNegociacao\(\)/);
  assert.match(fonte, /cardAmplitude\(\)/);
});

console.log(`mercCarrossel.test.mjs ok (${casos} casos)`);
