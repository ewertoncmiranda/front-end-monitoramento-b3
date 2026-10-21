// Montagem das posicoes, secoes e preferencias da carteira (CARTEIRAS-CARDS).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class { innerHTML = ''; querySelector = () => null; addEventListener() {} };
globalThis.customElements = { define() {}, get() { return undefined; } };

const { construirPosicoes } = await import('../public/js/components/carteiras/CarteiraPosicoes.js');
const sec = await import('../public/js/components/carteiras/carteiraSecoes.js');
const { instanteDaOperacao, registrarOperacao } = await import('../public/js/api/carteirasOperacoesApi.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }
const op = (id, tipo, simbolo, dia, quantidade, precoUnitario) => ({ id, tipo, simbolo, executadaEm: `${dia}T10:00:00`, quantidade, precoUnitario });

await caso('construirPosicoes: operacao vira posicao avaliada; legado marcado; resumo e proventos', () => {
  const carteira = { id: 'c1', ativos: [{ simbolo: 'BBAS3', dataEntrada: '2026-01-05', capital: 500 }, { simbolo: 'PETR4', dataEntrada: '2026-01-05', capital: 100 }] };
  const dados = {
    operacoes: [op('1', 'COMPRA', 'PETR4', '2026-01-05', 100, 30)],
    series: { PETR4: { preco: 33, dataIso: '2026-10-20', serie: [{ dataIso: '2026-01-05', preco: 30 }, { dataIso: '2026-10-20', preco: 33 }] }, BBAS3: { preco: 20, dataIso: '2026-10-20', serie: [{ dataIso: '2026-01-06', preco: 10 }] } },
    setores: { PETR4: 'Petróleo e Gás' },
    recebidos: [],
    proventosAtivo: { PETR4: [{ tipo: 'DIVIDENDO', valorPorAcao: 1, ultimaDataComDireito: '2026-05-01', dataPagamento: '2026-06-01' }] },
  };
  const { posicoes, resumo } = construirPosicoes(carteira, dados, '2026-10-21');
  assert.equal(posicoes.length, 2, 'PETR4 legado nao duplica o ticker que tem operacao');
  const petr = posicoes.find((p) => p.simbolo === 'PETR4');
  assert.equal(petr.valorAtual, 3300);
  assert.equal(petr.setor, 'Petróleo e Gás');
  assert.equal(petr.proventos.tipo, 'estimado');
  assert.equal(petr.proventos.total, 100);
  const bbas = posicoes.find((p) => p.simbolo === 'BBAS3');
  assert.equal(bbas.legado, true);
  assert.equal(bbas.podeConverter, true);
  assert.equal(resumo.numeroAtivos, 2);
  assert.equal(resumo.legados, 1);
  assert.equal(resumo.proventosRecebidos, null);
  assert.equal(resumo.proventosEstimados, 100);
});

await caso('construirPosicoes: ticker sem cotacao fica sem valor e contado em semPreco', () => {
  const { resumo, posicoes } = construirPosicoes({ id: 'c', ativos: [] }, { operacoes: [op('1', 'COMPRA', 'XXXX3', '2026-01-05', 10, 5)], series: { XXXX3: null } }, '2026-10-21');
  assert.equal(posicoes[0].valorAtual, null);
  assert.equal(resumo.semPreco, 1);
  assert.equal(resumo.valorAtual, null);
});

await caso('carteira so com legados: sem operacoes, sem quebrar', () => {
  const { posicoes, resumo } = construirPosicoes({ id: 'c', ativos: [{ simbolo: 'VALE3', dataEntrada: '2026-01-05', capital: 100 }] }, { operacoes: [], series: {} }, '2026-10-21');
  assert.equal(posicoes[0].legado, true);
  assert.equal(resumo.investido, 0);
});

await caso('preferencias: padrao, leitura valida, valor corrompido e storage que lanca', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.deepEqual(sec.lerPrefs(storage), { visao: 'cards', ordem: 'maior-posicao', alocacao: 'ativo', periodo: 'entrada' });
  sec.salvarPrefs({ visao: 'tabela', ordem: 'ticker', alocacao: 'setor', periodo: '6m' }, storage);
  assert.equal(sec.lerPrefs(storage).visao, 'tabela');
  assert.equal(sec.lerPrefs(storage).ordem, 'ticker');
  mem.set(sec.CHAVE_PREFS, '{lixo');
  assert.equal(sec.lerPrefs(storage).visao, 'cards');
  mem.set(sec.CHAVE_PREFS, JSON.stringify({ visao: 'x', ordem: 'y' }));
  assert.equal(sec.lerPrefs(storage).ordem, 'maior-posicao');
  const quebrado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  assert.equal(sec.lerPrefs(quebrado).visao, 'cards');
  sec.salvarPrefs({}, quebrado);
});

await caso('barra de ferramentas: ordenacao, visao e filtro; vazio convida a adicionar', () => {
  const h = sec.htmlBarraFerramentas({ visao: 'tabela', ordem: 'ticker' }, 'pe<tr');
  assert.match(h, /<option value="maior-alta">/);
  assert.match(h, /<option value="ticker" selected>/);
  assert.match(h, /data-visao="tabela"[^>]*aria-pressed="true"/);
  assert.doesNotMatch(h, /pe<tr/);
  assert.match(sec.htmlVazio(), /ainda não tem ações[\s\S]*foco-adicionar/);
});

await caso('alocacao: percentual em texto, aviso de concentracao, alternancia', () => {
  const h = sec.htmlAlocacao([{ rotulo: 'PETR4', valor: 700, fracao: 0.7, concentrado: true }, { rotulo: 'VALE3', valor: 300, fracao: 0.3, concentrado: false }], 'ativo');
  assert.match(h, /70,0%/);
  assert.match(h, /concentração alta/);
  assert.match(h, /passa\(m\) de 30%/);
  assert.match(h, /data-alocacao="setor"/);
  assert.equal(sec.htmlAlocacao([], 'ativo'), '');
});

await caso('evolucao: estados carregando, erro, sem dados e grafico com alternativa em texto', () => {
  assert.match(sec.htmlEvolucao({ carregando: true, periodo: 'entrada' }), /Carregando evolução/);
  assert.match(sec.htmlEvolucao({ erro: 'falhou', periodo: 'entrada' }), /falhou/);
  assert.match(sec.htmlEvolucao({ evolucao: { suficiente: false }, periodo: '3m' }), /Sem dados suficientes/);
  const carteira = [{ dataIso: '2026-01-02', valor: 100 }, { dataIso: '2026-01-05', valor: 110 }];
  const h = sec.htmlEvolucao({
    periodo: 'entrada', avisos: ['BOVA11 sem cotações no gestor: linha omitida'],
    evolucao: { suficiente: true, carteira, cdi: [{ dataIso: '2026-01-02', valor: 100 }, { dataIso: '2026-01-05', valor: 101 }], ibov: [], retornos: { carteira: 0.1, cdi: 0.01, ibov: null }, diferencaCdiPp: 9 },
  });
  assert.match(h, /role="img" aria-label="Evolução base 100/);
  assert.match(h, /Carteira \+10,00%/);
  assert.match(h, /CDI \+1,00%/);
  assert.match(h, /\+9,00 p\.p\./);
  assert.match(h, /Ver dados em tabela/);
  assert.match(h, /sem ajuste de proventos[^<]*não é recomendação/);
  assert.match(h, /BOVA11 sem cotações/);
  assert.doesNotMatch(h, /proxy do Ibovespa\)<\/th>/, 'linha omitida nao aparece');
  const comIbov = sec.htmlEvolucao({ periodo: 'entrada', evolucao: { suficiente: true, carteira, cdi: [], ibov: carteira, retornos: { carteira: 0.1, cdi: null, ibov: 0.1 }, diferencaCdiPp: null } });
  assert.match(comIbov, /BOVA11 \(proxy do Ibovespa\)/);
});

await caso('painel de venda mostra posicao e o limite', () => {
  const h = sec.htmlPainelVenda({ simbolo: 'PETR4', posicao: 100, preco: 33, dataPreco: '2026-10-20' });
  assert.match(h, /posição: 100/);
  assert.match(h, /max="100"/);
  assert.match(h, /fechamento de 20-10-2026/);
  assert.equal(sec.htmlPainelVenda(null), '');
});

await caso('operacao: hoje vira agora-1min (gestor recusa futuro); outro dia vira 12:00; corpo e chave', async () => {
  assert.equal(instanteDaOperacao('2026-03-10'), '2026-03-10T12:00:00');
  const agora = new Date(2026, 9, 21, 15, 30, 0);
  assert.equal(instanteDaOperacao('2026-10-21', agora), '2026-10-21T15:29:00');
  let enviado;
  globalThis.fetch = async (url, init) => { enviado = { url, init, corpo: JSON.parse(init.body) }; return { ok: true, status: 201, text: async () => '{}' }; };
  await registrarOperacao('c 1', { tipo: 'VENDA', simbolo: 'petr4', data: '2026-03-10', quantidade: 10, precoUnitario: 33, chave: 'k1' });
  assert.match(enviado.url, /\/carteiras\/c%201\/operacoes$/);
  assert.equal(enviado.init.method, 'POST');
  assert.deepEqual(
    [enviado.corpo.tipo, enviado.corpo.simbolo, enviado.corpo.quantidade, enviado.corpo.precoUnitario, enviado.corpo.chaveIdempotencia, enviado.corpo.moeda],
    ['VENDA', 'PETR4', 10, 33, 'k1', 'BRL'],
  );
});

console.log(`carteirasPosicoes.test.mjs ok (${casos} casos)`);
