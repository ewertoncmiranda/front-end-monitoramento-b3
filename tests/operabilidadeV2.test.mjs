// OPRV2-PAI-1..10: contrato GET-only, cards, ficha, consenso, tese, timeline,
// filtros, alertas, cockpit, estados vazios e XSS.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const api = await import('../public/js/api/operacionalV2Api.js');
const lista = await import('../public/js/analise/listagemAtivos.js');
const abas = await import('../public/js/analise/abasFicha.js');
const filtrosBase = await import('../public/js/analise/filtrosBase.js');
const filtros = await import('../public/js/components/ativos/FiltrosOperacionais.js');
const consenso = await import('../public/js/components/operacional/ConsensoSinais.js');
const tese = await import('../public/js/components/operacional/TeseExplicada.js');
const timeline = await import('../public/js/components/operacional/TimelineAtivo.js');
const alertas = await import('../public/js/components/inicio/AlertasOperacionais.js');
const ficha = await import('../public/js/components/ficha/OperabilidadeAtivo.js');
const cockpit = await import('../public/js/pages/OperabilidadePage.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

function fetchFalso(rotas) {
  const chamadas = [];
  globalThis.fetch = async (url) => {
    chamadas.push(String(url));
    const caminho = String(url).split('?')[0];
    const resposta = rotas[caminho];
    if (resposta instanceof Error) throw resposta;
    if (typeof resposta === 'number') return { ok: false, status: resposta, text: async () => '' };
    return { ok: true, status: 200, text: async () => (resposta === undefined ? '' : JSON.stringify(resposta)) };
  };
  return chamadas;
}

await caso('api V2 cobre cards, snapshot, consenso, tese, timeline, filtros e alertas', async () => {
  const chamadas = fetchFalso({
    '/operacional/tickers': { content: [{ simbolo: 'PETR4' }] },
    '/operacional/tickers/PETR4': { simbolo: 'PETR4' },
    '/operacional/tickers/PETR4/consenso': { itens: [] },
    '/operacional/tickers/PETR4/tese': { positivos: [] },
    '/operacional/tickers/PETR4/timeline': { itens: [] },
    '/operacional/filtros': { liquidez: ['ALTA'] },
    '/operacional/alertas': { itens: [] },
  });
  assert.equal((await api.buscarTickers({ liquidez: 'ALTA' })).itens[0].simbolo, 'PETR4');
  assert.equal((await api.buscarSnapshot('petr4')).simbolo, 'PETR4');
  await api.buscarConsenso('petr4'); await api.buscarTese('petr4');
  await api.buscarTimeline('petr4', { tipo: 'EVENTO_CVM' });
  await api.buscarFiltrosOperacionais(); await api.buscarAlertasOperacionais({ limite: 5 });
  assert.ok(chamadas.includes('/operacional/tickers?liquidez=ALTA'));
  assert.ok(chamadas.includes('/operacional/tickers/PETR4/timeline?tipo=EVENTO_CVM'));
  assert.ok(chamadas.includes('/operacional/alertas?limite=5'));
});

await caso('api V2 normaliza vazio, 404 e erro de rede', async () => {
  fetchFalso({ '/operacional/tickers': undefined, '/operacional/filtros': 404, '/operacional/alertas': new Error('rede') });
  assert.deepEqual((await api.buscarTickers()).itens, []);
  assert.deepEqual(await api.buscarFiltrosOperacionais(), { indisponivel: true });
  await assert.rejects(() => api.buscarAlertasOperacionais(), (e) => e.status === 0);
});

const SNAPSHOT = {
  simbolo: 'PETR4', dataPregao: '2026-10-09', statusSistema: 'BLOQUEADO', faixaLiquidez: 'ALTA',
  confianca: 0.72, confiancaCalibrada: false, sinalPrincipal: 'POSITIVO', sinalTecnico: 'NEUTRO', sinalIa: 'POSITIVO',
  motivoBloqueio: 'evento recente', ultimoEvento: { descricao: 'Fato relevante publicado' },
  tamanhoTeorico: null, stop: 48.2, custosEstimados: 12.5, riscoEstimado: 0.02,
  regraSaida: 'stop ou fim do horizonte', bloqueios: [{ descricao: 'Fato <script>recente</script>' }],
};

await caso('card mostra sinal bom mas bloqueado e confiança não calibrada', () => {
  const html = lista.htmlOperacionalTicker(SNAPSHOT);
  assert.match(html, /Bloqueado/);
  assert.match(html, /não calibrada/);
  assert.match(html, /principal POSITIVO/);
  assert.match(html, /Sinal presente, mas bloqueado: evento recente/);
  assert.doesNotMatch(html, /R\$ 0,00/);
});

await caso('aba do ticker traz snapshot conservador e operações simuladas', () => {
  const html = ficha.htmlOperabilidadeAtivo({ simbolo: 'PETR4', snapshot: SNAPSHOT, consenso: { itens: [] }, tese: {}, timeline: { itens: [] }, operacoes: { itens: [] } });
  assert.match(html, /Elegibilidade operacional/);
  assert.match(html, /Não elegível para nova posição simulada/);
  assert.match(html, /Tamanho teórico[\s\S]*sem dado/);
  assert.match(html, /nenhuma ordem real é enviada/i);
  assert.doesNotMatch(html, /<script>/);
  assert.ok(abas.ABAS.some((a) => a.id === 'operabilidade'));
});

await caso('consenso destaca divergências e não inventa confiança', () => {
  const html = consenso.htmlConsenso({
    itens: [{ fonte: 'principal', sinal: 'POSITIVO', confianca: null }, { fonte: 'ia', sinal: '<b>NEUTRO</b>', confianca: 0.6, calibrada: false }],
    divergencias: [{ descricao: 'Técnico diverge da regra principal' }],
  });
  assert.match(html, /sem dado/);
  assert.match(html, /não calibrada/);
  assert.match(html, /Divergências/);
  assert.doesNotMatch(html, /<b>NEUTRO<\/b>/);
});

await caso('tese escapa positivos, riscos, ausências e invalidadores', () => {
  const html = tese.htmlTese({
    positivos: [{ codigo: 'VALOR', descricao: 'Margem positiva' }], negativos: [],
    riscos: [{ severidade: 'ALTO', descricao: '<img src=x>' }], dadosAusentes: ['ROE ausente'], invalidadores: ['perder o stop'],
  });
  for (const trecho of ['Fatores positivos', 'Riscos', 'Dados ausentes', 'O que invalida']) assert.match(html, new RegExp(trecho));
  assert.doesNotMatch(html, /<img/);
});

await caso('timeline ordena, filtra e só cria link http(s)', () => {
  const itens = [
    { tipoEvento: 'PROVENTO', severidade: 'INFO', ocorridoEm: '2026-10-08T10:00:00', descricao: 'JCP', link: 'javascript:alert(1)' },
    { tipoEvento: 'BLOQUEIO', severidade: 'CRITICO', ocorridoEm: '2026-10-09T10:00:00', descricao: '<script>x</script>', link: 'https://exemplo.test/doc' },
  ];
  assert.equal(timeline.filtrarTimeline(itens)[0].tipoEvento, 'BLOQUEIO');
  assert.deepEqual(timeline.filtrarTimeline(itens, { tipo: 'PROVENTO' }).map((i) => i.tipoEvento), ['PROVENTO']);
  const html = timeline.htmlTimeline({ itens });
  assert.equal((html.match(/Abrir documento/g) || []).length, 1);
  assert.doesNotMatch(html, /javascript:/);
  assert.doesNotMatch(html, /<script>/);
});

await caso('filtros operacionais preservam URL e podem ser limpos', () => {
  const estado = { statusOperacional: 'BLOQUEADO', liquidez: 'ALTA', risco: '', bloqueio: 'SIM' };
  assert.equal(filtros.temFiltroOperacional(estado), true);
  assert.deepEqual(filtros.filtrosAtivos(estado), { statusOperacional: 'BLOQUEADO', liquidez: 'ALTA', bloqueio: 'SIM' });
  const hash = filtrosBase.hashDaBase({ visao: 'todos', q: 'petr', ...estado });
  const lido = filtrosBase.lerFiltrosBase(hash);
  assert.equal(lido.statusOperacional, 'BLOQUEADO');
  assert.equal(lido.liquidez, 'ALTA');
  assert.match(filtros.htmlFiltrosOperacionais({}, estado), /Filtros operacionais avançados/);
});

await caso('alertas priorizam crítico, têm CTA e escapam conteúdo', () => {
  const html = alertas.htmlAlertasOperacionais({ itens: [
    { severidade: 'INFO', categoria: 'SINAL', descricao: 'mudou' },
    { severidade: 'CRITICO', categoria: 'RISCO', simbolo: 'PETR4', descricao: '<b>drawdown</b>', createdAt: '2026-10-10T12:00:00' },
  ] });
  assert.ok(html.indexOf('CRITICO') < html.indexOf('INFO'));
  assert.match(html, /#\/gestao\/PETR4\?aba=operabilidade/);
  assert.doesNotMatch(html, /<b>drawdown<\/b>/);
});

await caso('cockpit mostra maturidade de 63 e 126 pregões', () => {
  const html = cockpit.htmlMaturidade(80);
  assert.match(html, /80 de 63 pregões/);
  assert.match(html, /80 de 126 pregões/);
  const pagina = readFileSync(new URL('../public/js/pages/OperabilidadePage.js', import.meta.url), 'utf8');
  assert.match(pagina, /Alertas e eventos recentes/);
});

await caso('integrações da home, listagem e ficha estão ligadas ao start normal', () => {
  const inicio = readFileSync(new URL('../public/js/pages/InicioPage.js', import.meta.url), 'utf8');
  const ativos = readFileSync(new URL('../public/js/pages/AtivosPage.js', import.meta.url), 'utf8');
  const consulta = readFileSync(new URL('../public/js/pages/ConsultaPage.js', import.meta.url), 'utf8');
  assert.match(inicio, /buscarAlertasOperacionais/);
  assert.match(ativos, /buscarTickers/);
  assert.match(consulta, /operabilidade-ativo/);
});

console.log(`operabilidadeV2: ${casos} casos ok`);
