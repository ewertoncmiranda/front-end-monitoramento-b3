// UX do simulador (SIM-PAI-2..7).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { htmlTabelaEstrategias, limparCacheIaLivre, obterIaLivre, payloadIaLivre } = await import('../public/js/components/simulador/TabelaEstrategias.js');
const { htmlControlesCenario, htmlResultadoCenario, validarCenario } = await import('../public/js/components/simulador/CenarioSimulador.js');
const { htmlResultadoRetroativo } = await import('../public/js/components/simulador/Retroativo.js');
const { htmlOperacoesManuais } = await import('../public/js/components/simulador/OperacoesManuais.js');
const { htmlOperabilidadeParalela } = await import('../public/js/components/simulador/OperabilidadeParalela.js');
const { validarSimboloAtivo } = await import('../public/js/components/simulador/utils.js');
const abasArmazenadas = new Map([['simulador-aba', 'operacoes']]);
globalThis.sessionStorage = {
  getItem: (chave) => abasArmazenadas.get(chave) ?? null,
  setItem: (chave, valor) => abasArmazenadas.set(chave, String(valor)),
};
const { SimuladorPage } = await import('../public/js/pages/SimuladorPage.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }
async function casoAsync(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

caso('ativo invalido rejeitado antes de chamar API', () => {
  assert.equal(validarSimboloAtivo('PETR4'), null);
  assert.match(validarSimboloAtivo('PETR'), /Ativo inválido/);
  assert.match(validarSimboloAtivo('<script>'), /Ativo inválido/);
});

await casoAsync('IA_LIVRE reutiliza cache e envia sete resultados', async () => {
  limparCacheIaLivre();
  let chamadas = 0;
  const dados = { resultados: [
    { estrategia: 'MOMENTO_PURO', quintil: 5, retorno: 0.12 },
    { estrategia: 'BAIXO_SPREAD', quintil: 2, retorno: -0.03 },
  ] };
  const primeira = await obterIaLivre('PETR4', dados, async (_simbolo, payload) => {
    chamadas++;
    assert.equal(payload.resultados.length, 7);
    return { texto: '<b>ok</b>', salvoEm: '2026-10-12T12:00:00Z' };
  });
  const segunda = await obterIaLivre('PETR4', dados, async () => { throw new Error('nao deve chamar'); });
  assert.equal(chamadas, 1);
  assert.deepEqual(segunda, primeira);
  assert.equal(payloadIaLivre('PETR4', dados).resultados.length, 7);
});

caso('data futura bloqueada e janela acima de 63 recusada', () => {
  assert.match(validarCenario({ simbolo: 'PETR4', dataEntrada: '2026-10-13', janela: 21, capital: 1000 }, '2026-10-12'), /Data futura bloqueada/);
  assert.match(validarCenario({ simbolo: 'PETR4', dataEntrada: '2026-10-11', janela: 126, capital: 1000 }, '2026-10-12'), /1 e 63/);
});

caso('controles de cenário aceitam ativo, data e capital iniciais', () => {
  const html = htmlControlesCenario([{ simbolo: 'PETR4' }], { simbolo: 'PETR4', dataEntrada: '2026-10-09', capital: '25000' });
  assert.match(html, /id="cenario-ativo"[^>]*value="PETR4"/);
  assert.match(html, /<input type="date"[^>]*value="2026-10-09"[^>]*id="cenario-data"/);
  assert.match(html, /<input type="number"[^>]*value="25000"[^>]*id="cenario-capital"/);
});

caso('valor null aparece como sem dado e nunca vira zero', () => {
  const html = htmlResultadoCenario({ resultados: [{ estrategia: 'QUALIDADE', ganhoPerdido: null, retorno: null }] });
  assert.match(html, /sem dado/);
  assert.doesNotMatch(html, /R\$ 0,00/);
  assert.match(htmlControlesCenario([{ simbolo: 'PETR4' }]), /max="/);
});

caso('texto IA e dados de estrategia escapam XSS', () => {
  const html = htmlTabelaEstrategias([{ simbolo: 'PETR4' }], {}, { PETR4: { texto: '<img src=x onerror=alert(1)>', salvoEm: '2026-10-12T12:00:00Z' } });
  assert.match(html, /IA_LIVRE/);
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;img/);
});

caso('retroativo mostra aviso de vazio explicado sem dados', () => {
  const html = htmlResultadoRetroativo({ itens: [] });
  assert.match(html, /Sem dados no período/);
});

caso('operacoes manuais diferenciam PENDENTE ABERTA FECHADA', () => {
  const html = htmlOperacoesManuais({ itens: [
    { id: 1, simbolo: 'PETR4', status: 'PENDENTE', dataAberturaEstimada: '2026-10-12' },
    { id: 2, simbolo: 'VALE3', status: 'ABERTA', historico: [{ dataPregao: '2026-10-10', pnlDia: 15, pnlAcumulado: 15 }] },
    { id: 3, simbolo: 'B3SA3', status: 'FECHADA', retornoVsCdi: 0.02 },
  ] });
  assert.match(html, /Abertura estimada/);
  assert.match(html, /Histórico pregão a pregão/);
  assert.match(html, /Retorno vs CDI/);
});

caso('card de operação oferece simulação com os dados de entrada escapados', () => {
  const html = htmlOperacoesManuais({ itens: [
    { id: 7, simbolo: 'PETR4', dataEntrada: '2026-10-09', capital: 25000, status: 'ABERTA' },
  ] });
  assert.match(html, /→ Simular no Cenário/);
  assert.match(html, /data-simbolo="PETR4"/);
  assert.match(html, /data-data-entrada="2026-10-09"/);
  assert.match(html, /data-capital="25000"/);
});

caso('aba ativa é restaurada e persistida ao trocar de aba', () => {
  const pagina = new SimuladorPage();
  assert.equal(pagina.abaAtiva, 'operacoes');
  pagina.render = () => {};
  pagina.trocarAba('cenario');
  assert.equal(pagina.abaAtiva, 'cenario');
  assert.equal(abasArmazenadas.get('simulador-aba'), 'cenario');
  pagina.trocarAba('aba-invalida');
  assert.equal(pagina.abaAtiva, 'cenario');
});

caso('operabilidade paralela renderiza resumo sem chamada extra', () => {
  const html = htmlOperabilidadeParalela({ statusSistema: 'EM_TESTE', excessoSobreCdiLiquido: null, pregoesAvaliados: 42 });
  assert.match(html, /Paper trading real/);
  assert.match(html, /EM_TESTE/);
  assert.match(html, /sem dado/);
});

console.log(`simulador.test.mjs ok (${casos} casos)`);
