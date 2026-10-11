// Tela "Operabilidade" (Plano OPR, OPR-PAI-1..6): API, estados, escape, grafico e status conservador.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const api = await import('../public/js/api/operacionalApi.js');
const opr = await import('../public/js/analise/operabilidade.js');
const graf = await import('../public/js/components/operacional/GraficoOperabilidade.js');
const cart = await import('../public/js/components/operacional/CarteiraSimulada.js');
const bloq = await import('../public/js/components/operacional/BloqueiosOperacionais.js');
const pag = await import('../public/js/pages/OperabilidadePage.js');
const nav = await import('../public/js/navegacao.js');

// --- fixtures no formato do contrato CTR-OPR-PAI (SPEC do painel) --------------------------------
const RESUMO = {
  versaoRegra: 'OPR-2026.10.10-1', statusSistema: 'EM_OBSERVACAO', ultimoPregao: '2026-10-09', dataInicio: '2026-10-05',
  pregoesAvaliados: 5, pregoesMinimos: 63, capitalInicial: 100000, patrimonio: 99093.66,
  retornoLiquidoAcumulado: -0.0091, cdiAcumulado: 0.0021, cdiLiquidoIrAcumulado: 0.0016, excessoSobreCdiLiquido: -0.0107,
  drawdown: -0.012, drawdownMaximo: -0.015, posicoesAbertas: 14, operacoesFechadas: 3, impostoEstimadoMes: 0,
  motivosStatus: [{ codigo: 'AMOSTRA_INSUFICIENTE', descricao: '5 de 63 pregões avaliados' }],
};
const DIARIO = { itens: [
  { dataPregao: '2026-10-07', patrimonio: 99800, retornoLiquidoDia: -0.002, retornoLiquidoAcumulado: -0.002, cdiLiquidoIrAcumulado: 0.0006, excessoSobreCdiLiquido: -0.0026, drawdown: -0.002, posicoesAbertas: 10, statusSistema: 'EM_OBSERVACAO' },
  { dataPregao: '2026-10-05', patrimonio: 100000, retornoLiquidoDia: 0, retornoLiquidoAcumulado: 0, cdiLiquidoIrAcumulado: 0.0003, excessoSobreCdiLiquido: -0.0003, drawdown: 0, posicoesAbertas: 0, statusSistema: 'NAO_OPERAVEL' },
  { dataPregao: '2026-10-08', patrimonio: null, retornoLiquidoDia: null, retornoLiquidoAcumulado: null, cdiLiquidoIrAcumulado: 0.0011, excessoSobreCdiLiquido: null, drawdown: null, posicoesAbertas: null, statusSistema: 'EM_OBSERVACAO' },
  { dataPregao: '2026-10-09', patrimonio: 99093.66, retornoLiquidoDia: -0.005, retornoLiquidoAcumulado: -0.0091, cdiLiquidoIrAcumulado: 0.0016, excessoSobreCdiLiquido: -0.0107, drawdown: -0.012, posicoesAbertas: 14, statusSistema: 'EM_OBSERVACAO' },
] };
const OPERACOES = { itens: [
  { id: 1, simbolo: 'PETR4', status: 'ABERTA', horizontePregoes: 21, dataEntrada: '2026-10-06', precoEntrada: 54.1, quantidade: 100, valorEntrada: 5410, stopInicial: 51.86, stopAtual: 52.3, custosEntrada: 5.41, faixaLiquidezEntrada: 'ALTA', motivoEntrada: { sinal: { opiniao: 'SINAL_POSITIVO', horizonte_pregoes: 21 } } },
  { id: 2, simbolo: 'WEGE3', status: 'PENDENTE', horizontePregoes: 63, dataDecisaoEntrada: '2026-10-09', quantidade: 200, motivoEntrada: {} },
  { id: 3, simbolo: 'VALE3', status: 'FECHADA', horizontePregoes: 21, dataEntrada: '2026-10-06', dataSaida: '2026-10-09', precoEntrada: 60, precoSaida: 57, quantidade: 100, custosEntrada: 6, custosSaida: 5.7, resultadoBruto: -300, resultadoPosCustos: -311.7, impostoEstimado: null, resultadoPosImpostoEstimado: null, motivoSaida: 'STOP', motivoSaidaDetalhe: { gatilhos: { STOP: [{ detalhe: 'fechamento abaixo do stop inicial' }] } } },
  { id: 4, simbolo: 'X<b>1', status: 'CANCELADA' },
] };
const BLOQUEIOS = { dataPregao: '2026-10-09', itens: [
  { simbolo: 'BPAC11', faixa: 'ALTA', motivos: [{ codigo: 'SEM_FUNDAMENTO_VIGENTE', detalhe: 'nenhum fundamento entregue', valor: null }] },
  { simbolo: 'ABCB4', faixa: 'INSUFICIENTE', motivos: [{ codigo: 'VOLUME_BAIXO', detalhe: 'volume <script>x</script>', valor: '1200000', limite: '5000000' }] },
  { simbolo: 'AZUL4', faixa: 'MEDIA', motivos: [{ codigo: 'FATO_RELEVANTE_RECENTE', detalhe: 'fato relevante' }, { codigo: 'VOLUME_BAIXO', detalhe: 'v' }] },
] };

function fetchFalso(rotas) {
  const chamadas = [];
  globalThis.fetch = async (url) => {
    chamadas.push(url);
    const caminho = String(url).split('?')[0];
    const r = rotas[caminho];
    if (typeof r === 'number') return { ok: false, status: r, text: async () => '' };
    return { ok: true, status: 200, text: async () => (r === undefined ? '' : JSON.stringify(r)) };
  };
  return chamadas;
}

// --- OPR-PAI-1: cliente da API -------------------------------------------------------------------
await caso('api: sucesso, filtros na query (datas e simbolo em maiusculas)', async () => {
  const chamadas = fetchFalso({ '/operacional/resumo': RESUMO, '/operacional/diario': DIARIO, '/operacional/operacoes': OPERACOES });
  assert.equal((await api.buscarResumo()).statusSistema, 'EM_OBSERVACAO');
  assert.equal((await api.buscarDiario({ inicio: '2026-10-01', fim: '2026-10-09' })).itens.length, 4);
  await api.buscarOperacoes({ status: 'FECHADA', simbolo: 'petr4' });
  assert.ok(chamadas.includes('/operacional/diario?inicio=2026-10-01&fim=2026-10-09'));
  assert.ok(chamadas.includes('/operacional/operacoes?status=FECHADA&simbolo=PETR4'));
});

await caso('api: corpo vazio vira lista vazia, nunca erro', async () => {
  fetchFalso({ '/operacional/diario': undefined, '/operacional/bloqueios': { dataPregao: null } });
  assert.deepEqual((await api.buscarDiario()).itens, []);
  assert.deepEqual((await api.buscarBloqueios()).itens, []);
});

await caso('api: 404 = gestor sem a rota (indisponivel); 503 sobe como erro', async () => {
  fetchFalso({ '/operacional/resumo': 404, '/operacional/saude': 503 });
  assert.deepEqual(await api.buscarResumo(), { indisponivel: true });
  await assert.rejects(() => api.buscarSaude(), (e) => e.status === 503);
});

// --- OPR-PAI-2: status e resumo ------------------------------------------------------------------
await caso('status: 4 rotulos, desconhecido cai em Nao operavel, nada de recomendacao', () => {
  assert.deepEqual(Object.keys(opr.STATUS).sort(), ['BLOQUEADO', 'EM_OBSERVACAO', 'NAO_OPERAVEL', 'PAPER_TRADING_ELEGIVEL']);
  assert.equal(opr.statusDe('OPERAVEL'), 'NAO_OPERAVEL');
  const textos = JSON.stringify(opr.STATUS) + opr.AVISO_SIMULACAO;
  assert.doesNotMatch(textos, /\b(compre|comprar|venda agora|vender|recomendamos|garantid)/i);
  assert.match(opr.STATUS.PAPER_TRADING_ELEGIVEL.descricao, /Não autoriza capital real/);
});

await caso('resumo: progresso, comparacao com o CDI e motivos do status', () => {
  const html = pag.htmlResumo(RESUMO, { dadosDoDiaCompletos: true, violacoes: [] });
  assert.match(html, /Em observação/);
  assert.match(html, /5 de 63 pregões/);
  assert.match(html, /-0,91%/);
  assert.match(html, /abaixo do CDI líquido/);
  assert.match(html, /5 de 63 pregões avaliados/);
  assert.equal(opr.venceuCdi({ excessoSobreCdiLiquido: null }), null);
  assert.deepEqual(opr.progresso(80), { fracao: 1, texto: '80 de 63 pregões' });
});

await caso('resumo vazio: diario nao iniciado, sem zero falso', () => {
  const html = pag.htmlResumo({ statusSistema: 'NAO_OPERAVEL', pregoesAvaliados: 0, ultimoPregao: null }, null);
  assert.ok(html.includes(pag.MENSAGEM_NAO_INICIADO));
  assert.match(html, /Não operável/);
  assert.doesNotMatch(html, /0,00%/);
  assert.match(html, /sem dado/);
});

await caso('pagina: aviso de simulacao sempre visivel', () => {
  assert.match(pag.htmlPagina(''), /nenhuma ordem real é enviada/);
});

// --- OPR-PAI-3: carteira -------------------------------------------------------------------------
await caso('carteira: abertas com pendente, fechadas com bruto/custos/liquido/motivo e "sem dado"', () => {
  const { abertas, fechadas } = opr.separarCarteira(OPERACOES.itens);
  assert.deepEqual(abertas.map((o) => o.simbolo).sort(), ['PETR4', 'WEGE3']);
  assert.deepEqual(fechadas.map((o) => o.simbolo), ['VALE3']);
  const html = cart.htmlCarteira(OPERACOES.itens);
  assert.match(html, /entra na próxima abertura/);
  assert.match(html, /R\$ -300,00/);
  assert.match(html, /R\$ 11,70/);       // custos entrada + saida
  assert.match(html, /R\$ -311,70/);
  assert.match(html, />Stop</);
  assert.match(html, /fechamento abaixo do stop inicial/);
  assert.match(html, /sem dado/);         // IR ainda nao apurado
  assert.doesNotMatch(html, /X<b>1/);     // cancelada nao aparece (e seria escapada)
});

// --- OPR-PAI-4: grafico e tabela -----------------------------------------------------------------
await caso('grafico: ordena por data, ponto null quebra a linha (nunca zero falso)', () => {
  const pontos = graf.pontosDoDiario(DIARIO.itens);
  assert.deepEqual(pontos.map((p) => p.data), ['2026-10-05', '2026-10-07', '2026-10-08', '2026-10-09']);
  const d = graf.caminho(pontos, 'carteira', (i) => i * 10, (v) => v * 1000);
  assert.equal((d.match(/M/g) || []).length, 2);  // dois trechos: antes e depois do dia sem dado
  const svg = graf.svgOperabilidade(DIARIO.itens);
  assert.match(svg, /class="linha-carteira"/);
  assert.match(svg, /class="linha-cdi"/);
  assert.match(svg, /class="drawdown"/);
  assert.equal(graf.svgOperabilidade([]), '');
});

await caso('tabela do diario: mais recente primeiro, sem dado escrito, vazio explicado', () => {
  const html = graf.htmlTabelaDiario(DIARIO.itens);
  assert.ok(html.indexOf('09-10-2026') < html.indexOf('05-10-2026'));
  assert.match(html, /sem dado/);
  assert.match(graf.htmlTabelaDiario([]), /Diário ainda não iniciado/);
});

// --- OPR-PAI-5: bloqueios ------------------------------------------------------------------------
await caso('bloqueios: grupos, filtros por motivo e simbolo, texto escapado', () => {
  assert.equal(opr.grupoDoMotivo('SEM_FUNDAMENTO_VIGENTE'), 'FUNDAMENTO');
  assert.equal(opr.grupoDoMotivo('NOVO_CODIGO'), 'OUTRO');
  assert.deepEqual(opr.contarPorGrupo(BLOQUEIOS.itens), { FUNDAMENTO: 1, LIQUIDEZ: 2, EVENTO: 1 });
  assert.deepEqual(opr.filtrarBloqueios(BLOQUEIOS.itens, { grupo: 'LIQUIDEZ' }).map((b) => b.simbolo), ['ABCB4', 'AZUL4']);
  assert.deepEqual(opr.filtrarBloqueios(BLOQUEIOS.itens, { simbolo: 'az' }).map((b) => b.simbolo), ['AZUL4']);
  const html = bloq.htmlBloqueios(BLOQUEIOS);
  assert.match(html, /volume &lt;script&gt;x&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Liquidez \(2\)/);
  assert.match(bloq.htmlListaBloqueios(BLOQUEIOS.itens, { simbolo: 'ZZZ' }), /Nenhum bloqueio com esse filtro/);
  assert.match(bloq.htmlBloqueios({ itens: [] }), /Nenhum bloqueio registrado/);
});

// --- montagem, rota, menu e proxy ----------------------------------------------------------------
await caso('pagina completa monta as quatro secoes', () => {
  const html = pag.htmlOperabilidade({ resumo: RESUMO, saude: null, diario: DIARIO, operacoes: OPERACOES, bloqueios: BLOQUEIOS });
  for (const trecho of ['Em observação', 'grafico-operabilidade', 'Posições abertas (2)', 'Operações encerradas (1)', 'Sinais que não viraram operação']) {
    assert.ok(html.includes(trecho), trecho);
  }
});

await caso('rota no roteador, item no grupo Avaliacao e /operacional no proxy do gestor', () => {
  const roteador = readFileSync(new URL('../public/js/router.js', import.meta.url), 'utf8');
  assert.match(roteador, /'#\/operabilidade': 'operabilidade-page'/);
  assert.equal(nav.grupoDaRota('#/operabilidade'), 'avaliacao');
  assert.equal(nav.grupoDaRota('#/avaliacao'), 'avaliacao');
  assert.ok(nav.rotasDoMenu().includes('#/operabilidade'));
  const proxy = readFileSync(new URL('../proxy/apiProxy.js', import.meta.url), 'utf8');
  assert.match(proxy, /'\/operacional'/);
});

console.log(`operabilidade: ${casos} casos ok`);
