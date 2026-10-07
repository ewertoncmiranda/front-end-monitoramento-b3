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
  assert.match(svg, /role="img"/);
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

console.log(`${casos} casos ok`);
