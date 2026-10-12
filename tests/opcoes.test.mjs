// Estados explicados e saúde da cadeia de opções (OPT-PAI-1/2).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
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

console.log(`opcoes.test.mjs ok (${casos} casos)`);
