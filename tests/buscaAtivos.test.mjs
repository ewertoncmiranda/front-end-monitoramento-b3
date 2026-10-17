// <busca-ativos>: busca reutilizavel (barra + filtros operacionais + cartoes
// flutuantes + tickers) e suas integracoes em Carteiras e no Simulador.
import assert from 'node:assert/strict';

const armazenado = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (armazenado.has(k) ? armazenado.get(k) : null),
  setItem: (k, v) => armazenado.set(k, v),
};
globalThis.HTMLElement = class {
  constructor() { this._attrs = new Map(); this.eventos = []; }
  getAttribute(n) { return this._attrs.has(n) ? this._attrs.get(n) : null; }
  hasAttribute(n) { return this._attrs.has(n); }
  setAttribute(n, v) { this._attrs.set(n, String(v)); }
  dispatchEvent(e) { this.eventos.push(e); return true; }
  querySelector() { return null; }
};
globalThis.customElements = { define() {}, get() { return undefined; } };
globalThis.CustomEvent = class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };

const logica = await import('../public/js/analise/buscaAtivos.js');
const { htmlFiltroAtivos } = await import('../public/js/components/busca/filtroAtivos.js');
const { htmlCartaoAtivo, htmlCartoesAtivos, htmlTickersSelecionados } = await import('../public/js/components/busca/cartoesAtivos.js');
const { BuscaAtivos } = await import('../public/js/components/busca/BuscaAtivos.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const item = (extra = {}) => ({
  simbolo: 'PETR4', nome: 'PETROBRAS', setor: 'Petróleo', ultimoFechamento: 38.42, variacaoPercentual: 1.52,
  serieFechamentos: [37, 37.5, 38.42], sinal: { recomendacao: 'COMPRA_FORTE' }, ...extra,
});

// --- logica pura ------------------------------------------------------------------------
await caso('estado normalizado: limites, UF maiuscula, pagina invalida vira 0', () => {
  const e = logica.normalizarEstado({ q: '  petr ', uf: 'sp', pagina: -3, liquidez: 'ALTA', lixo: 'x' });
  assert.equal(e.q, 'petr');
  assert.equal(e.uf, 'SP');
  assert.equal(e.pagina, 0);
  assert.equal(e.liquidez, 'ALTA');
  assert.equal(e.lixo, undefined);
  assert.equal(logica.normalizarEstado({ q: 'x'.repeat(200) }).q.length, 60);
});

await caso('so busca com algum criterio', () => {
  assert.equal(logica.temCriterio(logica.estadoVazio()), false);
  assert.equal(logica.temCriterio({ ...logica.estadoVazio(), uf: 'SP' }), true);
  assert.equal(logica.temCriterio({ ...logica.estadoVazio(), risco: 'ALTO' }), true);
});

await caso('juncao igual a da tela Ativos: base enriquecida; com filtro operacional, lista operacional', () => {
  const base = { content: [{ simbolo: 'PETR4', nome: 'P' }, { simbolo: 'VALE3' }], totalPages: 3, totalElements: 30 };
  const op = { itens: [{ simbolo: 'petr4', statusOperacional: 'BLOQUEADO' }], totalPages: 1, totalElements: 1 };
  const semFiltro = logica.combinarListagem(base, op, logica.estadoVazio());
  assert.equal(semFiltro.itens.length, 2);
  assert.equal(semFiltro.itens[0].operacional.statusOperacional, 'BLOQUEADO');
  assert.equal(semFiltro.totalPaginas, 3);
  const comFiltro = logica.combinarListagem(base, op, { ...logica.estadoVazio(), bloqueio: 'SIM' });
  assert.deepEqual(comFiltro.itens.map((i) => i.nome), ['P']);
  assert.equal(comFiltro.totalItens, 1);
  assert.equal(logica.combinarListagem(base, { indisponivel: true }, logica.estadoVazio()).itens.length, 2);
});

await caso('selecao: unico troca, multiplo acumula, repetir desmarca', () => {
  assert.deepEqual(logica.alternarSelecao(['PETR4'], 'vale3', 'unico'), ['VALE3']);
  assert.deepEqual(logica.alternarSelecao(['PETR4'], 'VALE3', 'multiplo'), ['PETR4', 'VALE3']);
  assert.deepEqual(logica.alternarSelecao(['PETR4', 'VALE3'], 'petr4', 'multiplo'), ['VALE3']);
  assert.deepEqual(logica.removerSelecao(['PETR4', 'VALE3'], 'VALE3'), ['PETR4']);
  assert.deepEqual(logica.lerSimbolos(' petr4, ,VALE3,petr4,<x>'), ['PETR4', 'VALE3']);
});

// --- HTML -------------------------------------------------------------------------------
await caso('barra igual a da tela Ativos: Buscar, Setor, UF, Filtrar e filtros operacionais logo abaixo', () => {
  const html = htmlFiltroAtivos({ q: 'petr', uf: 'RJ', setor: 'Energia' }, { setores: ['Energia', 'Bancos'], prefixo: 'x1' });
  assert.match(html, />Buscar<[\s\S]*>Setor<[\s\S]*>UF<[\s\S]*data-ba-filtrar>Filtrar<[\s\S]*Filtros operacionais avançados/);
  assert.match(html, /id="x1-busca"[^>]*value="petr"/);
  assert.match(html, /<option value="Energia" selected>/);
  assert.match(html, /id="x1-uf"[^>]*value="RJ"/);
  assert.doesNotMatch(html, /id="opr-f-/, 'ids operacionais ganham prefixo');
  assert.match(html, /id="x1-opr-liquidez"/);
});

await caso('cartao flutuante: simbolo, nome, setor, preco, variacao com seta, sparkline, sinal e ficha', () => {
  const html = htmlCartaoAtivo(item());
  assert.match(html, /class="ba-cartao" data-ba-cartao="PETR4"/);
  assert.match(html, /PETROBRAS[\s\S]*Petróleo[\s\S]*R\$ 38,42/);
  assert.match(html, /▲ \+1,52%/);
  assert.match(html, /<svg class="ativo-sparkline/);
  assert.match(html, /badge text-bg-success">Compra forte/);
  assert.match(html, /href="#\/ativo\/PETR4">Ficha/);
  assert.doesNotMatch(html, /recomendação de investimento/);
});

await caso('cartao: botao muda com modo e selecao; acoes extras; nulos viram traco', () => {
  assert.match(htmlCartaoAtivo(item(), { modo: 'unico' }), />Selecionar</);
  assert.match(htmlCartaoAtivo(item(), { modo: 'unico', selecionados: ['PETR4'] }), /ba-escolhido[\s\S]*✓ Selecionado/);
  assert.match(htmlCartaoAtivo(item(), { modo: 'multiplo' }), />\+ Adicionar</);
  assert.match(htmlCartaoAtivo(item(), { acoes: ['consultar', 'inexistente'] }), /data-ba-acao="consultar"[^>]*>Consultar/);
  const nulo = htmlCartaoAtivo({ simbolo: 'XPTO3' });
  assert.match(nulo, /ba-mudo">—/);
  assert.doesNotMatch(nulo, /R\$ 0,00|NaN|undefined/);
  assert.match(htmlCartaoAtivo(item({ nome: '<img onerror=x>' })), /&lt;img onerror=x&gt;/);
});

await caso('tickers escolhidos com × e vazio explicado', () => {
  assert.match(htmlTickersSelecionados([], {}), /Nenhum ativo selecionado/);
  const html = htmlTickersSelecionados(['PETR4', 'VALE3'], { modo: 'multiplo' });
  assert.match(html, /data-ba-remover="PETR4"[\s\S]*data-ba-remover="VALE3"/);
  assert.equal(htmlCartoesAtivos([]), '');
});

// --- elemento ---------------------------------------------------------------------------
await caso('elemento: escolher emite evento, guarda na sessao e restaura pela chave', () => {
  const busca = new BuscaAtivos();
  busca.setAttribute('chave', 'teste');
  busca.setAttribute('modo', 'multiplo');
  busca.restaurar();
  busca.escolher('petr4');
  busca.escolher('VALE3');
  busca.escolher('PETR4', { remover: true });
  assert.deepEqual(busca.simbolos, ['VALE3']);
  const ultimo = busca.eventos.at(-1);
  assert.equal(ultimo.type, 'busca-ativos:selecao');
  assert.deepEqual(ultimo.detail, { simbolos: ['VALE3'], simbolo: 'PETR4', selecionado: false });

  const outra = new BuscaAtivos();
  outra.setAttribute('chave', 'teste');
  outra.restaurar();
  assert.deepEqual(outra.simbolos, ['VALE3']);
  outra.setAttribute('valor', 'ITUB4');
  outra.restaurar();
  assert.deepEqual(outra.simbolos, ['ITUB4'], 'valor da pagina vence o guardado');
});

await caso('elemento: modo unico preenche o input do formulario', () => {
  const input = { value: '', eventos: 0, dispatchEvent() { this.eventos++; } };
  globalThis.document = { getElementById: (id) => (id === 'cenario-ativo' ? input : null) };
  globalThis.Event = class { constructor(t) { this.type = t; } };
  const busca = new BuscaAtivos();
  busca.setAttribute('campo', 'cenario-ativo');
  busca.escolher('WEGE3');
  assert.equal(input.value, 'WEGE3');
  busca.limpar();
  assert.equal(input.value, '');
});

// --- integracoes ------------------------------------------------------------------------
const { htmlControlesCenario } = await import('../public/js/components/simulador/CenarioSimulador.js');
const { htmlControlesRetroativo } = await import('../public/js/components/simulador/Retroativo.js');
const { htmlOperacoesManuais } = await import('../public/js/components/simulador/OperacoesManuais.js');
const { CarteiraAdicionarAtivo } = await import('../public/js/components/carteiras/CarteiraAdicionarAtivo.js');

await caso('simulador Cenario, Retroativo e Operacoes: input oculto + busca em modo unico, sem datalist', () => {
  const formularios = {
    cenario: htmlControlesCenario([], { simbolo: 'PETR4' }),
    retroativo: htmlControlesRetroativo([], { simbolo: 'VALE3' }),
    operacao: htmlOperacoesManuais({ itens: [] }, []),
  };
  assert.match(formularios.cenario, /<input type="hidden" id="cenario-ativo" value="PETR4">\s*<busca-ativos modo="unico" chave="simulador-cenario" campo="cenario-ativo" valor="PETR4">/);
  assert.match(formularios.retroativo, /id="retroativo-ativo" value="VALE3">\s*<busca-ativos modo="unico" chave="simulador-retroativo" campo="retroativo-ativo" valor="VALE3">/);
  assert.match(formularios.operacao, /id="operacao-ativo" value="">\s*<busca-ativos modo="unico" chave="simulador-operacao" campo="operacao-ativo">/);
  for (const html of Object.values(formularios)) assert.doesNotMatch(html, /<datalist/);
});

await caso('cenario: capital padrao (10.000) e valido para min/step do campo', () => {
  const html = htmlControlesCenario([], {});
  const [, min, step, valor] = /min="(\d+)" step="(\d+)" value="(\d+)"[^>]*id="cenario-capital"/.exec(html);
  assert.equal((Number(valor) - Number(min)) % Number(step), 0, `${valor} fora da grade min=${min} step=${step}`);
});

await caso('sem ativo da pagina, a busca nao recebe valor (nao apaga a escolha guardada)', () => {
  assert.doesNotMatch(htmlControlesCenario([], {}), /valor=/);
  assert.doesNotMatch(htmlControlesRetroativo([]), /valor=/);
});

await caso('carteira: formulario usa a busca em modo unico no lugar do seletor', () => {
  const html = new CarteiraAdicionarAtivo().template();
  assert.match(html, /<busca-ativos id="seletor-ativo" modo="unico">/);
  assert.doesNotMatch(html, /seletor-de-ativos/);
});

console.log(`buscaAtivos: ${casos} casos`);
