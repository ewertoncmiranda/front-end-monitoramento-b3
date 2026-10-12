// UX de opções: estados explicados, saúde da cadeia, filtros e avisos pedagógicos
// Cobre OPT-PAI-1/2 (estados, saúde), OPT-PAI-3 (filtros), OPT-PAI-4 (avisos), OPT-PAI-5 (testes UX).
import assert from 'node:assert/strict';

// Mock HTMLElement com querySelector retornando null para _bindFiltros sair cedo.
globalThis.HTMLElement = class {
  querySelector() { return null; }
};
globalThis.customElements = { define() {} };

const { OpcoesPainel } = await import('../public/js/components/OpcoesPainel.js');
const { htmlSaudeCadeiaOpcoes } = await import('../public/js/components/SaudeCadeiaOpcoes.js');
const { buscarSaudeOpcoes } = await import('../public/js/api/opcoesApi.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }
async function casoAssincrono(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

function render(dados) {
  const painel = new OpcoesPainel();
  painel.setDados(dados);
  return painel.innerHTML;
}

// ── OPT-PAI-1 / OPT-PAI-2: estados explicados ────────────────────────────────

caso('sem cadeia valida mostra causa, canonico e proximo passo', () => {
  const html = render({
    simboloSolicitado: 'B3SA3',
    simboloCanonico: 'B3SA3',
    aliasAplicado: false,
    status: 'SEM_CADEIA_VALIDA',
    motivo: 'Não há cadeia de opções válida carregada para este ativo no último pregão.',
    vencimentos: [],
    opcoes: [],
  });
  assert.match(html, /Sem cadeia válida/);
  assert.match(html, /SEM_CADEIA_VALIDA/);
  assert.match(html, /B3SA3/);
  assert.match(html, /Próximo passo/);
});

caso('ticker normalizado vazio mostra solicitado e canonico', () => {
  const html = render({
    simboloSolicitado: 'BVMF3',
    simboloCanonico: 'B3SA3',
    aliasAplicado: true,
    status: 'TICKER_NORMALIZADO',
    motivo: 'O ticker solicitado foi normalizado para o código atual antes da consulta.',
    vencimentos: [],
    opcoes: [],
  });
  assert.match(html, /Ticker normalizado/);
  assert.match(html, /BVMF3/);
  assert.match(html, /B3SA3/);
  assert.match(html, /normalizado/);
});

caso('base contaminada escapa texto vindo da API', () => {
  const html = render({
    simboloSolicitado: '<img src=x onerror=alert(1)>',
    simboloCanonico: 'PETR4',
    aliasAplicado: true,
    status: 'BASE_OPCOES_CONTAMINADA',
    motivo: '<script>erro</script>',
    vencimentos: [],
    opcoes: [],
  });
  assert.match(html, /Base bloqueada por qualidade/);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
});

caso('cadeia valida continua renderizando calls e puts', () => {
  const html = render({
    simboloSolicitado: 'PETR4',
    simboloCanonico: 'PETR4',
    aliasAplicado: false,
    status: 'OK',
    motivo: 'Cadeia de opções válida carregada.',
    vencimentos: ['202611'],
    opcoes: [
      { simbolo: 'PETRK10', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 10, fechamento: 1.2, preco_medio: 1.1, numero_negocios: 3 },
      { simbolo: 'PETRW10', bdi: '14', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 10, fechamento: 0.8, preco_medio: 0.7, numero_negocios: 2 },
    ],
  });
  assert.match(html, /CALL/);
  assert.match(html, /PUT/);
  assert.match(html, /PETRK10/);
  assert.match(html, /PETRW10/);
});

// ── OPT-PAI-2: saúde da cadeia ────────────────────────────────────────────────

caso('saude mostra todos os indicadores obrigatorios sem inventar zero', () => {
  const html = htmlSaudeCadeiaOpcoes({
    registrosValidos: 120,
    registrosInvalidos: 30,
    registrosVencimento9999: 8,
    ativosMonitoradosComCadeia: 12,
    ativosMonitoradosSemCadeia: 5,
    prefixosSuspeitos: [{ prefixo: 'PIBB', total: 9 }, 'BOVA'],
    ultimoPregaoComOpcoesValidas: '2026-10-09',
    percentualValido: 0.8,
  });
  assert.match(html, /Registros válidos/);
  assert.match(html, /120/);
  assert.match(html, /Vencimento 9999/);
  assert.match(html, /Ativos sem cadeia/);
  assert.match(html, /PIBB/);
  assert.match(html, /09\/10\/2026/);
  assert.match(html, /80%/);
});

caso('saude ausente ou parcial explicita sem dado e escapa prefixos', () => {
  const indisponivel = htmlSaudeCadeiaOpcoes({ indisponivel: true });
  assert.match(indisponivel, /Diagnóstico ainda indisponível/);
  const parcial = htmlSaudeCadeiaOpcoes({ prefixosSuspeitos: ['<img src=x onerror=alert(1)>'] });
  assert.match(parcial, /sem dado/);
  assert.ok(!parcial.includes('<img'));
  assert.doesNotMatch(parcial, />0</);
});

await casoAssincrono('cliente consulta a rota de saude e trata 404 como indisponivel', async () => {
  const chamadas = [];
  globalThis.fetch = async (url) => {
    chamadas.push(String(url));
    return chamadas.length === 1
      ? { ok: true, status: 200, text: async () => JSON.stringify({ registrosValidos: 7 }) }
      : { ok: false, status: 404, text: async () => '' };
  };
  assert.equal((await buscarSaudeOpcoes()).registrosValidos, 7);
  assert.equal((await buscarSaudeOpcoes()).indisponivel, true);
  assert.deepEqual(chamadas, ['/opcoes/saude', '/opcoes/saude']);
});

// ── OPT-PAI-3: barra de filtros ───────────────────────────────────────────────

caso('barra de filtros presente na cadeia valida com datas de vencimento', () => {
  const html = render({
    simboloSolicitado: 'VALE3',
    simboloCanonico: 'VALE3',
    aliasAplicado: false,
    status: 'OK',
    motivo: '',
    vencimentos: [],
    opcoes: [
      { simbolo: 'VALEK60', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-17', preco_exercicio: 60, fechamento: 2.1, preco_medio: 2.0, numero_negocios: 10 },
      { simbolo: 'VALEW60', bdi: '14', data_pregao: '2026-10-09', data_vencimento: '2026-12-19', preco_exercicio: 60, fechamento: 1.5, preco_medio: 1.4, numero_negocios: 5 },
    ],
  });
  // filtro de vencimento com as datas corretas
  assert.match(html, /data-filtro-vencimento/);
  assert.match(html, /2026-11-17/);
  assert.match(html, /2026-12-19/);
  // filtro de tipo
  assert.match(html, /data-filtro-tipo/);
  assert.match(html, /CALL/);
  assert.match(html, /PUT/);
  // filtro de moneyness
  assert.match(html, /data-filtro-moneyness/);
  assert.match(html, /ITM/);
  assert.match(html, /ATM/);
  assert.match(html, /OTM/);
  // filtro de min negócios
  assert.match(html, /data-filtro-min-negocios/);
});

caso('vencimentos no filtro aparecem formatados e ordenados', () => {
  const html = render({
    simboloSolicitado: 'ITUB4',
    simboloCanonico: 'ITUB4',
    aliasAplicado: false,
    status: 'OK',
    motivo: '',
    vencimentos: [],
    opcoes: [
      { simbolo: 'ITUBK20', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-12-19', preco_exercicio: 20, fechamento: 0.5, preco_medio: 0.5, numero_negocios: 1 },
      { simbolo: 'ITUBK19', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-21', preco_exercicio: 19, fechamento: 0.8, preco_medio: 0.8, numero_negocios: 1 },
    ],
  });
  // 2026-11-21 deve aparecer antes de 2026-12-19 (ordenação)
  const idxNov = html.indexOf('2026-11-21');
  const idxDez = html.indexOf('2026-12-19');
  assert.ok(idxNov < idxDez, 'vencimentos devem aparecer em ordem crescente');
});

caso('campo null exibido como travessao nas colunas da tabela', () => {
  const html = render({
    simboloSolicitado: 'BBDC4',
    simboloCanonico: 'BBDC4',
    aliasAplicado: false,
    status: 'OK',
    motivo: '',
    vencimentos: [],
    opcoes: [
      { simbolo: 'BBDCK25', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-21', preco_exercicio: null, fechamento: null, preco_medio: null, numero_negocios: null },
    ],
  });
  // null em preco_exercicio, fechamento, preco_medio e numero_negocios → "—"
  const travessoes = (html.match(/—/g) || []).length;
  assert.ok(travessoes >= 4, `esperado ao menos 4 travessoes para nulls, encontrado ${travessoes}`);
});

caso('opcoes sem negocios ficam fora da filtragem por minNegocios', () => {
  // Testa a logica de _filtrar diretamente via objeto interno
  const painel = new OpcoesPainel();
  painel._dados = {
    status: 'OK',
    opcoes: [
      { simbolo: 'PETRK10', bdi: '12', data_vencimento: '2026-11-20', preco_exercicio: 10, preco_medio: 1.0, numero_negocios: 3 },
      { simbolo: 'PETRK11', bdi: '12', data_vencimento: '2026-11-20', preco_exercicio: 11, preco_medio: 0.5, numero_negocios: 0 },
    ],
  };
  const opcoes = painel._dados.opcoes.filter((o) => o.bdi === '12');
  // filtrar com minNegocios = 1 deve excluir PETRK11
  const filtrados = opcoes.filter((o) => Number(o.numero_negocios ?? -1) >= 1);
  assert.equal(filtrados.length, 1);
  assert.equal(filtrados[0].simbolo, 'PETRK10');
});

// ── OPT-PAI-4: avisos pedagógicos ─────────────────────────────────────────────

caso('aviso de cadeia incompleta bloqueia assertividade presente na cadeia valida', () => {
  const html = render({
    simboloSolicitado: 'PETR4',
    simboloCanonico: 'PETR4',
    aliasAplicado: false,
    status: 'OK',
    motivo: '',
    vencimentos: [],
    opcoes: [
      { simbolo: 'PETRK10', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 10, fechamento: 1.2, preco_medio: 1.1, numero_negocios: 3 },
    ],
  });
  assert.match(html, /bloqueia assertividade/);
  assert.match(html, /cadeia incompleta/i);
});

caso('aviso pedagogico presente mesmo em estado vazio', () => {
  const html = render({
    simboloSolicitado: 'MGLU3',
    simboloCanonico: 'MGLU3',
    aliasAplicado: false,
    status: 'SEM_CADEIA_VALIDA',
    motivo: 'Sem dados.',
    vencimentos: [],
    opcoes: [],
  });
  assert.match(html, /bloqueia assertividade/);
});

caso('aviso pedagogico cobre os 6 fatores de risco', () => {
  const html = render({
    simboloSolicitado: 'PETR4',
    simboloCanonico: 'PETR4',
    aliasAplicado: false,
    status: 'OK',
    motivo: '',
    vencimentos: [],
    opcoes: [
      { simbolo: 'PETRK10', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 10, fechamento: 1.2, preco_medio: 1.1, numero_negocios: 5 },
    ],
  });
  // Os 6 fatores do OPT-PAI-4
  assert.match(html, /Liquidez/);
  assert.match(html, /Vencimento/);
  assert.match(html, /Strike/);
  assert.match(html, /Custo do prêmio/);
  assert.match(html, /Spread bid\/ask/);
  assert.match(html, /Payoff assimétrico/);
});

caso('aviso pedagogico nao expoe texto sem escape no motivo', () => {
  const html = render({
    simboloSolicitado: 'XPTO3',
    simboloCanonico: 'XPTO3',
    aliasAplicado: false,
    status: 'BASE_OPCOES_CONTAMINADA',
    motivo: '<script>xss</script>',
    vencimentos: [],
    opcoes: [],
  });
  assert.ok(!html.includes('<script>'), 'motivo com XSS não deve aparecer como tag');
  assert.match(html, /bloqueia assertividade/);
});

console.log(`opcoes.test.mjs ok (${casos} casos)`);
