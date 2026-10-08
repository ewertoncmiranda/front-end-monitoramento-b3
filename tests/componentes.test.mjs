// Renderizacao real dos componentes LAC e da avaliacao (REQ-15/ISS-07): sem navegador,
// com HTMLElement e customElements simulados.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { renderizar: fatores } = await import('../public/js/components/ficha/FatoresAtivo.js');
const { renderizar: proventos } = await import('../public/js/components/ficha/ProventosContabeis.js');
const { renderizar: ranking } = await import('../public/js/components/PlacarRanking.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

caso('fatores: vazio mostra "sem dado ainda"; com dado mostra percentis e data', () => {
  assert.match(fatores([]), /Sem dado ainda/);
  const html = fatores([{ codigo: 'mom', familia: 'PRECO', descricao: 'Momentum 12m', direcaoEsperada: 1, dataReferencia: '2026-09-30', valor: 0.12, percentilUniverso: 0.9, percentilSetor: 0.5, grupoSetor: 'ENERGIA' }]);
  assert.match(html, /Momentum 12m/);
  assert.match(html, /P90/);
  assert.match(html, /30-09-2026/);
  assert.match(html, /experimental/);
});

caso('fatores: texto vindo da API e escapado', () => {
  const html = fatores([{ codigo: 'x', familia: 'PRECO', descricao: '<img src=x onerror=alert(1)>', direcaoEsperada: 1 }]);
  assert.ok(!html.includes('<img'));
});

caso('proventos: ausente vira traco, nunca zero; origem aparece', () => {
  assert.match(proventos([]), /Sem dado ainda/);
  const html = proventos([{ tipoDoc: 'DFP', dtInicioExercicio: '2024-01-01', dtFimExercicio: '2024-12-31', dataEntrega: '2025-02-20', jcp: 1134258, dividendos: null, total: null, porAcao: null, origem: 'DVA_CVM' }]);
  assert.match(html, /R\$ 1,13 mi/);
  assert.match(html, /DVA \(CVM\)/);
  assert.ok(!/R\$ 0,00/.test(html));
});

caso('ranking: hipotese, veredito pelo IC e quintis', () => {
  assert.match(ranking({ execucao: null, janelas: [] }), /Nenhum backtest/);
  const html = ranking({
    execucao: { id: 3, finalizadoEm: '2026-10-01T10:00:00', hipotese: 'Valor ordena melhor', numeroTentativa: 1, esquemaValidacao: 'WALK_FORWARD' },
    janelas: [{ versaoRegra: 'v1', janela: 'TESTE', horizonte: 63, correlacaoRankingMedia: 0.02, icCorrelacao: { inferior: -0.05, superior: 0.09 }, meses: 24, ativosPorMes: 30,
      quintis: [{ quintil: 1, retornoMedio: 0.01, ativos: 6 }, { quintil: 5, retornoMedio: 0.03, ativos: 6 }], diferencaQuintil5Menos1: 0.02 }],
    aviso: 'Regra experimental',
  });
  assert.match(html, /Valor ordena melhor/);
  assert.match(html, /Inconclusivo/);
  assert.match(html, /Q5/);
});

caso('avaliacao: nao afirma mais que o IC esta pendente (ISS-07)', () => {
  const fonte = readFileSync(new URL('../public/js/pages/AvaliacaoPage.js', import.meta.url), 'utf8');
  assert.ok(!/ainda não tem intervalo de confiança/.test(fonte));
  assert.ok(!/TASK-50[^']{0,40}em andamento/.test(fonte));
});

const { svgProventos, pontosDoGrafico } = await import('../public/js/analise/graficoProventos.js');
const { barraDePercentil } = await import('../public/js/analise/lacunas.js');
const { formatarNumero, formatarPercentual, formatarMoeda, variacao } = await import('../public/js/utils/numero.js');
const { htmlSelo } = await import('../public/js/utils/selos.js');
const { htmlEstadoVazio } = await import('../public/js/components/EstadoVazio.js');

caso('grafico de proventos: ordena por periodo, descarta periodo sem valor e nao inventa zero', () => {
  const pontos = pontosDoGrafico([
    { tipoDoc: 'DFP', dtFimExercicio: '2024-12-31', jcp: 100, dividendos: 200 },
    { tipoDoc: 'DFP', dtFimExercicio: '2023-12-31', jcp: null, dividendos: null },
    { tipoDoc: 'DFP', dtFimExercicio: '2022-12-31', jcp: 50, dividendos: null },
  ]);
  assert.deepEqual(pontos.map((p) => p.rotulo), ['2022', '2024']);
  const svg = svgProventos([{ tipoDoc: 'DFP', dtFimExercicio: '2024-12-31', jcp: 1134258, dividendos: 2056668 }]);
  assert.match(svg, /<svg/);
  assert.match(svg, /role="list"/); // colunas focaveis (REQ-UX-11): "img" esconderia os filhos
  assert.match(svg, /2024/);
  assert.equal(svgProventos([]), '');
  assert.equal(svgProventos([{ dtFimExercicio: '2024-12-31', jcp: null, dividendos: null }]), '');
});

caso('barra de percentil: marca na posicao, cor por leitura e ausente vira traco', () => {
  assert.match(barraDePercentil(0.9, 'FAVORAVEL'), /favoravel/);
  assert.match(barraDePercentil(0.9, 'FAVORAVEL'), /width:90%/);
  assert.match(barraDePercentil(73, 'NEUTRO'), /left:73%/);
  assert.match(barraDePercentil(null, null), /—/);
});

caso('formatadores pt-BR: ausente nunca vira zero', () => {
  assert.equal(formatarNumero(1234.5), '1.234,50');
  assert.equal(formatarNumero(null), '-');
  assert.equal(formatarPercentual(0.0734), '7,34%');
  assert.equal(formatarPercentual(0.0734, 1, { sinal: true }), '+7,3%');
  assert.equal(formatarPercentual(undefined), '-');
  assert.equal(formatarMoeda(12.5), 'R$ 12,50');
  assert.equal(variacao(11, 10), 0.10000000000000009);
  assert.equal(variacao(11, 0), null);
  assert.equal(variacao(null, 10), null);
});

caso('selo e estado vazio: texto sempre junto da cor, entrada escapada', () => {
  assert.match(htmlSelo('ATRASADA'), /Atrasada/);
  assert.match(htmlSelo('NAO_EXISTE'), /Sem dado/);
  assert.ok(!htmlSelo('OK', '<b>x</b>').includes('<b>'));
  const vazio = htmlEstadoVazio({ titulo: 'Sem dado', causa: 'porque', acaoHref: '#/avaliacao', acaoRotulo: 'Ver' });
  assert.match(vazio, /porque/);
  assert.match(vazio, /href="#\/avaliacao"/);
});

const nav = await import('../public/js/navegacao.js');
const ini = await import('../public/js/analise/inicio.js');
const pg = await import('../public/js/pages/InicioPage.js');

caso('navegacao: 5 grupos, toda rota do roteador alcancavel e rotas antigas mapeadas', () => {
  assert.equal(nav.GRUPOS.length, 5);
  const roteador = readFileSync(new URL('../public/js/router.js', import.meta.url), 'utf8');
  const rotas = [...roteador.matchAll(/'(#\/[a-z-]+)':/g)].map((m) => m[1]);
  assert.ok(rotas.length >= 15);
  for (const r of rotas) assert.ok(nav.rotasDoMenu().includes(r) || nav.grupoDaRota(r), `rota sem lugar no menu: ${r}`);
  assert.equal(nav.grupoDaRota('#/gestao/PETR4'), 'ativos');
  assert.equal(nav.grupoDaRota('#/estudos?visao=biblioteca'), 'estudos');
  assert.equal(nav.grupoDaRota('#/glossario'), 'estudos');
  assert.equal(nav.grupoDaRota('#/monitorados'), 'ativos');
  assert.equal(nav.grupoDaRota('#/inexistente'), undefined);
});

caso('inicio: fontes piores primeiro, movimentos por modulo e resumo da semana', () => {
  const fontes = ini.fontesForaDoPrazo({ fontes: [{ nome: 'a', estado: 'OK' }, { nome: 'b', estado: 'ATRASADA', idadeHoras: 10 }, { nome: 'c', estado: 'ERRO', idadeHoras: 1 }] });
  assert.deepEqual(fontes.map((f) => f.nome), ['c', 'b']);
  const mov = ini.maioresMovimentos([{ simbolo: 'A', precoAtual: 11, precoAnterior: 10 }, { simbolo: 'B', precoAtual: 8, precoAnterior: 10 }, { simbolo: 'C', precoAtual: 5, precoAnterior: null }]);
  assert.deepEqual(mov.map((m) => m.simbolo), ['B', 'A', 'C']);
  assert.equal(mov[2].variacao, null);
  const r = ini.resumoDaSemana({ semana: '2026-W40', totalDocumentos: 3, empresas: [{ simbolo: 'PETR4', total: 2, porCategoria: { FATO_RELEVANTE: 1 } }, { simbolo: 'VALE3', total: 1, porCategoria: {} }] });
  assert.deepEqual(r.comFatoRelevante, ['PETR4']);
  assert.equal(r.totalEmpresas, 2);
});

caso('inicio: blocos renderizam dados, estados vazios e escapam entrada', () => {
  const saude = pg.htmlSaude({ estadoGeral: 'ATENCAO', cobertura: { comPrecoEFundamentos: 3, ativos: 5 }, fontes: [{ nome: '<b>Fonte</b>', estado: 'ATRASADA', idadeHoras: 100 }] });
  assert.match(saude, /Atenção/);
  assert.match(saude, /Atrasada/);
  assert.ok(!saude.includes('<b>Fonte'));
  assert.match(pg.htmlSaude({ estadoGeral: 'OK', cobertura: { comPrecoEFundamentos: 5, ativos: 5 }, fontes: [] }), /em dia/);
  assert.match(pg.htmlFavoritos([]), /Nenhum favorito/);
  assert.match(pg.htmlFavoritos([{ simbolo: 'PETR4', precoAtual: 11, precoAnterior: 10 }]), /\+10,00%/);
  assert.match(pg.htmlComunicados({ empresas: [] }), /Sem comunicados/);
  assert.match(pg.htmlComunicados({ semana: '2026-W40', totalDocumentos: 1, empresas: [{ simbolo: 'PETR4', total: 1, porCategoria: { FATO_RELEVANTE: 1 } }] }), /Fato relevante: <strong>PETR4/);
});

const { renderizar: opiniao, OPINIOES, RISCOS, justificativas: justificativasOpiniao } = await import('../public/js/components/ficha/OpiniaoHorizontes.js');
const AVISO_OPINIAO = 'Leitura automática dos números, regra experimental. Não é recomendação de investimento.';
const horizonteOpiniao = (extra = {}) => ({
  dataPregao: '2026-10-06', horizontePregoes: 21, opiniao: 'SINAL_POSITIVO', risco: 'RISCO_MEDIO',
  justificativa: [{ evidenciaId: 'sinal_momentum', leitura: 'Momentum de alta.' }],
  oQueInvalida: ['Fechamento abaixo da MM50'], dadosAusentes: ['fator BETA_12M'],
  evidencias: [{ id: 'sinal_momentum', rotulo: 'Sinal técnico de momentum', valor: 'COMPRA_TECNICA', direcao: 1 }],
  modelo: 'qwen2.5:7b', origem: 'MODELO', ...extra,
});

caso('opiniao: tres horizontes, cor sempre com texto, aviso e selo sempre', () => {
  const html = opiniao({ aviso: AVISO_OPINIAO, horizontes: [
    horizonteOpiniao(),
    horizonteOpiniao({ horizontePregoes: 63, opiniao: 'SINAL_NEGATIVO', risco: 'RISCO_ALTO', modelo: 'regra', origem: 'REGRA' }),
    horizonteOpiniao({ horizontePregoes: 126, opiniao: 'SINAL_NEUTRO', risco: 'RISCO_BAIXO' }),
  ] });
  assert.match(html, /Experimental/);
  assert.match(html, /Não é recomendação de investimento/);
  assert.match(html, /Curto prazo[\s\S]*Médio prazo[\s\S]*Longo prazo/);
  for (const [codigo, cor] of [['SINAL_POSITIVO', 'success'], ['SINAL_NEGATIVO', 'danger'], ['SINAL_NEUTRO', 'warning']]) {
    assert.ok(html.includes(`<span class="badge text-bg-${cor}">${OPINIOES[codigo].rotulo}</span>`), `${codigo} sem cor+texto`);
  }
  for (const [codigo, cor] of [['RISCO_BAIXO', 'success'], ['RISCO_MEDIO', 'warning'], ['RISCO_ALTO', 'danger']]) {
    assert.ok(html.includes(`<span class="badge text-bg-${cor}">${RISCOS[codigo].rotulo}</span>`), `${codigo} sem cor+texto`);
  }
  assert.match(html, /Momentum de alta\. \(Sinal técnico de momentum: COMPRA_TECNICA\)/, 'justificativa cita o dado');
  assert.match(html, /O que invalida[\s\S]*Fechamento abaixo da MM50/);
  assert.match(html, /1 dado ausente/);
  assert.match(html, /Pregão 06-10-2026 · Modelo local \(qwen2\.5:7b\)/);
  assert.match(html, /Regra \(sem modelo\)/);
});

caso('opiniao: justificativa nao repete o dado que ja cita; lista longa resume em "mais N"', () => {
  const jaCita = horizonteOpiniao({ justificativa: [{ evidenciaId: 'sinal_momentum', leitura: 'Momentum: COMPRA_TECNICA.' }] });
  assert.deepEqual(justificativasOpiniao(jaCita), ['Momentum: COMPRA_TECNICA.']);
  const longa = horizonteOpiniao({ justificativa: Array.from({ length: 7 }, (_, i) => ({ evidenciaId: `e${i}`, leitura: `Leitura ${i}` })) });
  const html = opiniao({ horizontes: [longa] });
  assert.match(html, /mais 3/);
  assert.match(html, /Leitura 6/, 'o resto continua acessivel');
});

caso('opiniao: item com trechoId e sem evidenciaId (servico de IA) mostra a fonte e nao quebra', () => {
  const h = horizonteOpiniao({ justificativa: [
    { trechoId: 'evidencia/momentum#2016-2026', leitura: 'Momentum bateu o mercado em 49% das semanas.' },
    { evidenciaId: 'inexistente', leitura: 'Evidência que não veio na lista.' },
    null,
    {},
  ] });
  assert.deepEqual(justificativasOpiniao(h), [
    'Momentum bateu o mercado em 49% das semanas. — fonte: evidencia/momentum#2016-2026',
    'Evidência que não veio na lista.',
  ]);
  const html = opiniao({ horizontes: [h] });
  assert.match(html, /fonte: evidencia\/momentum#2016-2026/);
  assert.ok(!html.includes('undefined'));
});

caso('opiniao: item de trecho mostra "fonte: <caminho>" e o trecho num expansivel, escapado', () => {
  const h = horizonteOpiniao({ justificativa: [
    { evidenciaId: null, trechoId: 'ativos/WEGE3#por-ano', leitura: 'Retorno anual acima do setor.',
      fonte: 'conhecimento/ativos/WEGE3.md#por-ano', trecho: '| 2024 | +12% | <b>x</b> |' },
    { evidenciaId: 'sinal_momentum', leitura: 'Momentum de alta.', fonte: null, trecho: null },
  ] });
  const html = opiniao({ horizontes: [h] });
  assert.match(html, /Retorno anual acima do setor\. — fonte: conhecimento\/ativos\/WEGE3\.md#por-ano/);
  assert.match(html, /<details class="mt-1"><summary class="text-muted">trecho citado<\/summary>/);
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;') && !html.includes('<b>x</b>'), 'trecho escapado');
  assert.equal((html.match(/trecho citado/g) || []).length, 1, 'item de evidencia nao ganha expansivel');
});

caso('opiniao: horizonte faltando vira "Sem base" cinza; sem nada explica quando a geracao roda', () => {
  const html = opiniao({ aviso: AVISO_OPINIAO, horizontes: [horizonteOpiniao()] });
  assert.ok(html.includes(`<span class="badge text-bg-secondary">Sem base</span>`));
  const vazio = opiniao({ aviso: AVISO_OPINIAO, horizontes: [] });
  assert.match(vazio, /depois dos insights diários/);
  assert.match(vazio, /Experimental/, 'aviso aparece mesmo sem dado');
  assert.match(opiniao(null), /Não é recomendação de investimento/);
});

caso('opiniao: texto vindo da API e escapado', () => {
  const html = opiniao({ aviso: '<script>x</script>', horizontes: [horizonteOpiniao({
    justificativa: [{ evidenciaId: 'e', leitura: '<img src=x onerror=alert(1)>' }],
    oQueInvalida: ['<b>x</b>'], modelo: '<i>m</i>', opiniao: '<svg onload=1>',
  })] });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<b>x'));
  assert.ok(!html.includes('<i>m'));
  assert.ok(!html.includes('<svg onload'));
});

console.log(`${casos} casos ok`);
