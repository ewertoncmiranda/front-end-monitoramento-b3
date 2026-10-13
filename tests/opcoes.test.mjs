// UX de opções: estados explicados, saúde da cadeia, filtros, avisos pedagógicos
// e enriquecimento com contexto do ativo-objeto (moneyness real, distância, break-even, card).
// Cobre OPT-PAI-1/2/3/4/5 e os 3 cruzamentos de dados.
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

const OPCAO_CALL = { simbolo: 'PETRK10', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 42, fechamento: 1.2, preco_medio: 1.1, numero_negocios: 3 };
const OPCAO_PUT  = { simbolo: 'PETRW10', bdi: '14', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 35, fechamento: 0.8, preco_medio: 0.7, numero_negocios: 2 };
const CTX_BASE   = { precoAtual: 38.50, variacaoDia: 0.008, max63d: 41.0, min63d: 35.2, posicaoRange: 0.50, lpa: 4.32, vpa: 22.10, pl: 8.9, graham: 29.40, margem: -31.0, vol21d: 0.22, recomendacao: 'COMPRA_MODERADA' };

// ── OPT-PAI-1 / OPT-PAI-2: estados explicados ────────────────────────────────

caso('sem cadeia valida mostra causa, canonico e proximo passo', () => {
  const html = render({ simboloSolicitado: 'B3SA3', simboloCanonico: 'B3SA3', aliasAplicado: false, status: 'SEM_CADEIA_VALIDA', motivo: 'Não há cadeia de opções válida carregada para este ativo no último pregão.', vencimentos: [], opcoes: [] });
  assert.match(html, /Sem cadeia válida/);
  assert.match(html, /SEM_CADEIA_VALIDA/);
  assert.match(html, /B3SA3/);
  assert.match(html, /Próximo passo/);
});

caso('ticker normalizado vazio mostra solicitado e canonico', () => {
  const html = render({ simboloSolicitado: 'BVMF3', simboloCanonico: 'B3SA3', aliasAplicado: true, status: 'TICKER_NORMALIZADO', motivo: 'O ticker solicitado foi normalizado para o código atual antes da consulta.', vencimentos: [], opcoes: [] });
  assert.match(html, /Ticker normalizado/);
  assert.match(html, /BVMF3/);
  assert.match(html, /B3SA3/);
  assert.match(html, /normalizado/);
});

caso('base contaminada escapa texto vindo da API', () => {
  const html = render({ simboloSolicitado: '<img src=x onerror=alert(1)>', simboloCanonico: 'PETR4', aliasAplicado: true, status: 'BASE_OPCOES_CONTAMINADA', motivo: '<script>erro</script>', vencimentos: [], opcoes: [] });
  assert.match(html, /Base bloqueada por qualidade/);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
});

caso('cadeia valida continua renderizando calls e puts', () => {
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL, OPCAO_PUT] });
  assert.match(html, /CALL/);
  assert.match(html, /PUT/);
  assert.match(html, /PETRK10/);
  assert.match(html, /PETRW10/);
});

// ── OPT-PAI-2: saúde da cadeia ────────────────────────────────────────────────

caso('saude mostra todos os indicadores obrigatorios sem inventar zero', () => {
  const html = htmlSaudeCadeiaOpcoes({ registrosValidos: 120, registrosInvalidos: 30, registrosVencimento9999: 8, ativosMonitoradosComCadeia: 12, ativosMonitoradosSemCadeia: 5, prefixosSuspeitos: [{ prefixo: 'PIBB', total: 9 }, 'BOVA'], ultimoPregaoComOpcoesValidas: '2026-10-09', percentualValido: 0.8 });
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
  const html = render({ simboloSolicitado: 'VALE3', simboloCanonico: 'VALE3', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [
    { simbolo: 'VALEK60', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-17', preco_exercicio: 60, fechamento: 2.1, preco_medio: 2.0, numero_negocios: 10 },
    { simbolo: 'VALEW60', bdi: '14', data_pregao: '2026-10-09', data_vencimento: '2026-12-19', preco_exercicio: 60, fechamento: 1.5, preco_medio: 1.4, numero_negocios: 5 },
  ]});
  assert.match(html, /data-filtro-vencimento/);
  assert.match(html, /2026-11-17/);
  assert.match(html, /2026-12-19/);
  assert.match(html, /data-filtro-tipo/);
  assert.match(html, /OTM/);
  assert.match(html, /data-filtro-min-negocios/);
  assert.match(html, /data-filtro-min-volume/);
  assert.match(html, /data-filtro-min-liquidez/);
  assert.match(html, /data-filtro-max-distancia/);
});

caso('vencimentos no filtro aparecem formatados e ordenados', () => {
  const html = render({ simboloSolicitado: 'ITUB4', simboloCanonico: 'ITUB4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [
    { simbolo: 'ITUBK20', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-12-19', preco_exercicio: 20, fechamento: 0.5, preco_medio: 0.5, numero_negocios: 1 },
    { simbolo: 'ITUBK19', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-21', preco_exercicio: 19, fechamento: 0.8, preco_medio: 0.8, numero_negocios: 1 },
  ]});
  const idxNov = html.indexOf('2026-11-21');
  const idxDez = html.indexOf('2026-12-19');
  assert.ok(idxNov < idxDez, 'vencimentos devem aparecer em ordem crescente');
});

caso('campo null exibido como travessao nas colunas da tabela', () => {
  const html = render({ simboloSolicitado: 'BBDC4', simboloCanonico: 'BBDC4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [
    { simbolo: 'BBDCK25', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-21', preco_exercicio: null, fechamento: null, preco_medio: null, numero_negocios: null },
  ]});
  const travessoes = (html.match(/—/g) || []).length;
  assert.ok(travessoes >= 4, `esperado ao menos 4 travessoes para nulls, encontrado ${travessoes}`);
});

caso('opcoes sem negocios ficam fora da filtragem por minNegocios', () => {
  const painel = new OpcoesPainel();
  const opcoes = [
    { simbolo: 'PETRK10', bdi: '12', data_vencimento: '2026-11-20', preco_exercicio: 10, preco_medio: 1.0, numero_negocios: 3 },
    { simbolo: 'PETRK11', bdi: '12', data_vencimento: '2026-11-20', preco_exercicio: 11, preco_medio: 0.5, numero_negocios: 0 },
  ];
  const filtrados = opcoes.filter((o) => Number(o.numero_negocios ?? -1) >= 1);
  assert.equal(filtrados.length, 1);
  assert.equal(filtrados[0].simbolo, 'PETRK10');
});

// ── OPT-PAI-4: avisos pedagógicos ─────────────────────────────────────────────

caso('aviso de cadeia incompleta bloqueia assertividade presente na cadeia valida', () => {
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL] });
  assert.match(html, /bloqueia assertividade/);
  assert.match(html, /cadeia incompleta/i);
});

caso('aviso pedagogico presente mesmo em estado vazio', () => {
  const html = render({ simboloSolicitado: 'MGLU3', simboloCanonico: 'MGLU3', aliasAplicado: false, status: 'SEM_CADEIA_VALIDA', motivo: 'Sem dados.', vencimentos: [], opcoes: [] });
  assert.match(html, /bloqueia assertividade/);
});

caso('aviso pedagogico cobre os 6 fatores de risco', () => {
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL] });
  assert.match(html, /Liquidez/);
  assert.match(html, /Vencimento/);
  assert.match(html, /Strike/);
  assert.match(html, /Custo do prêmio/);
  assert.match(html, /Spread bid\/ask/);
  assert.match(html, /Payoff assimétrico/);
});

caso('aviso pedagogico nao expoe texto sem escape no motivo', () => {
  const html = render({ simboloSolicitado: 'XPTO3', simboloCanonico: 'XPTO3', aliasAplicado: false, status: 'BASE_OPCOES_CONTAMINADA', motivo: '<script>xss</script>', vencimentos: [], opcoes: [] });
  assert.ok(!html.includes('<script>'), 'motivo com XSS não deve aparecer como tag');
  assert.match(html, /bloqueia assertividade/);
});

// ── Cruzamento 2: card contexto do ativo-objeto ───────────────────────────────

caso('card contexto aparece quando contexto tem precoAtual', () => {
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL, OPCAO_PUT], contexto: CTX_BASE });
  assert.match(html, /R\$ 38\.50/);                  // precoAtual
  assert.match(html, /COMPRA MODERADA/);             // recomendação
  assert.match(html, /LPA R\$4\.32/);               // LPA
  assert.match(html, /VPA R\$22\.10/);              // VPA
  assert.match(html, /Graham R\$29\.40/);           // Graham
  assert.match(html, /Vol\.21d 22\.0%/);            // volatilidade
  assert.match(html, /50%/);                        // posicaoRange
});

caso('card contexto ausente quando precoAtual e null', () => {
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL], contexto: { precoAtual: null } });
  assert.doesNotMatch(html, /range\s*63d/i);
});

caso('card contexto mostra variacao negativa com classe correta', () => {
  const ctx = { ...CTX_BASE, variacaoDia: -0.015 };
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL], contexto: ctx });
  assert.match(html, /text-danger/);
  assert.match(html, /-1\.50%/);
});

// ── Cruzamento 1: moneyness real ───────────────────────────────────────────────

caso('moneyness CALL real: strike abaixo do preco e ITM, acima e OTM', () => {
  // preco 38.50, strike CALL 42 → OTM; strike CALL 35 → ITM
  const htmlOtm = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [
    { simbolo: 'PETRK42', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 42, fechamento: 1.0, preco_medio: 1.0, numero_negocios: 5 },
  ], contexto: CTX_BASE });
  assert.match(htmlOtm, /OTM/);

  const htmlItm = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [
    { simbolo: 'PETRK35', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 35, fechamento: 4.0, preco_medio: 4.0, numero_negocios: 5 },
  ], contexto: CTX_BASE });
  assert.match(htmlItm, /ITM/);
});

caso('moneyness PUT real: strike acima do preco e ITM, abaixo e OTM', () => {
  // preco 38.50, strike PUT 42 → ITM; strike PUT 35 → OTM
  const htmlItm = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [
    { simbolo: 'PETRW42', bdi: '14', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 42, fechamento: 3.5, preco_medio: 3.5, numero_negocios: 5 },
  ], contexto: CTX_BASE });
  assert.match(htmlItm, /ITM/);

  const htmlOtm = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [
    { simbolo: 'PETRW35', bdi: '14', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 35, fechamento: 0.5, preco_medio: 0.5, numero_negocios: 5 },
  ], contexto: CTX_BASE });
  assert.match(htmlOtm, /OTM/);
});

caso('moneyness ATM quando strike dentro de 2% do preco', () => {
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [
    { simbolo: 'PETRK38', bdi: '12', data_pregao: '2026-10-09', data_vencimento: '2026-11-20', preco_exercicio: 38.80, fechamento: 0.9, preco_medio: 0.9, numero_negocios: 5 },
  ], contexto: CTX_BASE });
  assert.match(html, /ATM/);
});

// ── Cruzamento 3: colunas Distância e Break-even ──────────────────────────────

caso('coluna distancia mostra percentual do strike em relacao ao preco atual', () => {
  // strike 42, preco 38.50 → distância +9.1%
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL], contexto: CTX_BASE });
  assert.match(html, /Distância/);
  assert.match(html, /\+9\./);  // ≈ +9.1%
});

caso('coluna break-even calculada: CALL strike+premio, PUT strike-premio', () => {
  // CALL: strike 42 + premio 1.1 = 43.10
  // PUT: strike 35 - premio 0.7 = 34.30
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL, OPCAO_PUT], contexto: CTX_BASE });
  assert.match(html, /Break-even/);
  assert.match(html, /43\.10/);  // CALL break-even
  assert.match(html, /34\.30/);  // PUT break-even
});

caso('colunas distancia e break-even ausentes quando sem contexto', () => {
  // sem contexto, coluna Distância ainda existe (cabeçalho) mas valor é —
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL] });
  assert.match(html, /Distância/);
  // sem precoAtual, distancia deve ser — (travessão)
  assert.match(html, /—/);
});

// ── ATR14, volume relativo, saltos e proventos ────────────────────────────────

caso('card contexto mostra ATR14 e volume relativo quando presentes no contexto', () => {
  const ctx = { ...CTX_BASE, atr14: 1.45, volRelativo: 2.3 };
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL], contexto: ctx });
  assert.match(html, /ATR14 R\$1\.45/);
  assert.match(html, /Vol\.rel\. 2\.30×/);
});

caso('aviso de saltos aparece quando contexto tem saltos detectados', () => {
  const ctx = { ...CTX_BASE, saltos: [{ data: '2026-08-15', variacao: -0.45 }] };
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL], contexto: ctx });
  assert.match(html, /salto\(s\)/);
  assert.match(html, /15\/08\/2026/);
  assert.match(html, /-45\.0%/);
});

caso('aviso de saltos ausente quando saltos e array vazio', () => {
  const ctx = { ...CTX_BASE, saltos: [] };
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL], contexto: ctx });
  assert.doesNotMatch(html, /salto\(s\)/);
});

caso('aviso de ex-dividendo aparece quando exDividendos tem datas', () => {
  const ctx = { ...CTX_BASE, exDividendos: [{ data: '2026-11-05', tipo: 'DIVIDENDO', valor: 1.5 }] };
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL], contexto: ctx });
  assert.match(html, /Ex-dividendo/);
  assert.match(html, /05\/11\/2026/);
  assert.match(html, /DIVIDENDO/);
  assert.match(html, /prêmio das CALLs/);
});

caso('aviso de ex-dividendo ausente quando exDividendos e array vazio', () => {
  const ctx = { ...CTX_BASE, exDividendos: [] };
  const html = render({ simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL], contexto: ctx });
  assert.doesNotMatch(html, /Ex-dividendo/);
});

// ── Métricas intraday e acumuladas ───────────────────────────────────────────

const dados_base = { simboloSolicitado: 'PETR4', simboloCanonico: 'PETR4', aliasAplicado: false, status: 'OK', motivo: '', vencimentos: [], opcoes: [OPCAO_CALL] };

caso('card contexto mostra ticket medio R$', () => {
  const ctx = { ...CTX_BASE, ticketMedio: 250.50 };
  const html = render({ ...dados_base, contexto: ctx });
  assert.match(html, /Ticket R\$250\.50/);
});

caso('card contexto mostra amplitude intraday como percentual', () => {
  const ctx = { ...CTX_BASE, amplitudeDia: 0.023 };
  const html = render({ ...dados_base, contexto: ctx });
  assert.match(html, /Amp\. 2\.3%/);
});

caso('card contexto mostra retorno intraday com sinal positivo e negativo', () => {
  const htmlPos = render({ ...dados_base, contexto: { ...CTX_BASE, retornoIntraday: 0.012 } });
  assert.match(htmlPos, /Intraday \+1\.2%/);
  const htmlNeg = render({ ...dados_base, contexto: { ...CTX_BASE, retornoIntraday: -0.008 } });
  assert.match(htmlNeg, /Intraday -0\.8%/);
});

caso('card contexto mostra gap de abertura com sinal', () => {
  const html = render({ ...dados_base, contexto: { ...CTX_BASE, gapAbertura: 0.005 } });
  assert.match(html, /Gap \+0\.5%/);
});

caso('card contexto mostra posicao no range do dia como percentual', () => {
  const html = render({ ...dados_base, contexto: { ...CTX_BASE, posicaoRangeDia: 0.75 } });
  assert.match(html, /Pos\.dia 75%/);
});

caso('card contexto mostra volume de contratos 21d no formato compacto M', () => {
  const html = render({ ...dados_base, contexto: { ...CTX_BASE, volumeContratos21d: 2_500_000 } });
  assert.match(html, /Contr\.21d 2\.5M/);
});

caso('card contexto mostra negocios acumulados 21d no formato compacto K', () => {
  const html = render({ ...dados_base, contexto: { ...CTX_BASE, negocios21d: 15_000 } });
  assert.match(html, /Neg\.21d 15K/);
});

console.log(`opcoes.test.mjs ok (${casos} casos)`);
