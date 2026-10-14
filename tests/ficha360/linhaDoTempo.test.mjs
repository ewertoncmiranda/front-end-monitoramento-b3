// F360-PAI-9: linha do tempo com o formato REAL das fontes:
// comunicados do gestor (camelCase, dataEntrega) e noticias do proxy (publicadoEm).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { montarLinhaDoTempo, filtrarPorTipo } = await import('../../public/js/analise/ficha360/linhaDoTempo.js');
const { SecaoEventos } = await import('../../public/js/components/ficha360/secoes/SecaoEventos.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const comunicado = (extra) => ({
  assunto: null, categoria: 'FATO_RELEVANTE', categoriaOriginal: 'Fato Relevante', categoriaRotulo: 'Fato relevante',
  dataEntrega: '2026-10-08', dataReferencia: '2026-10-08', especie: null,
  link: 'https://www.rad.cvm.gov.br/ENET/x', protocolo: '1575304', tipo: null, versao: 1, ...extra,
});
const noticia = (extra) => ({ titulo: 'Petrobras anuncia dividendos', link: 'https://exemplo.test/a', fonte: 'Valor', publicadoEm: '2026-10-09T13:20:00.000Z', ...extra });

const eventos = montarLinhaDoTempo({
  comunicados: [
    comunicado(),
    comunicado({ categoria: 'PROVENTOS', categoriaRotulo: 'Proventos', dataEntrega: '2026-10-01', assunto: 'Aviso aos acionistas' }),
    comunicado({ categoria: 'RESULTADO', categoriaRotulo: 'Resultado', dataEntrega: '2026-08-07' }),
  ],
  noticias: [noticia(), noticia({ titulo: 'Notícia antiga', publicadoEm: '2026-09-02T10:00:00Z' })],
});

await caso('formato real: datas lidas, nenhuma invalida, ordem decrescente', () => {
  assert.equal(eventos.length, 5);
  assert.deepEqual(eventos.map((e) => e.dataIso), ['2026-10-09', '2026-10-08', '2026-10-01', '2026-09-02', '2026-08-07']);
});

await caso('titulo e categoria do comunicado: assunto, senao rotulo da categoria', () => {
  const fato = eventos.find((e) => e.dataIso === '2026-10-08');
  assert.equal(fato.titulo, 'Fato relevante');
  assert.equal(fato.categoria, 'Fato relevante');
  assert.equal(eventos.find((e) => e.dataIso === '2026-10-01').titulo, 'Aviso aos acionistas');
});

await caso('icones pela categoria do gestor', () => {
  assert.equal(eventos.find((e) => e.dataIso === '2026-10-08').icone, '⚠️');
  assert.equal(eventos.find((e) => e.dataIso === '2026-10-01').icone, '💰');
  assert.equal(eventos.find((e) => e.dataIso === '2026-08-07').icone, '📊');
});

await caso('noticia: fonte como categoria', () => {
  assert.equal(eventos[0].categoria, 'Valor');
  assert.equal(eventos[0].tipo, 'noticia');
});

await caso('filtro por tipo', () => {
  assert.equal(filtrarPorTipo(eventos, 'comunicado').length, 3);
  assert.equal(filtrarPorTipo(eventos, 'noticia').length, 2);
  assert.equal(filtrarPorTipo(eventos, 'todos').length, 5);
});

await caso('vazio, null e item sem data ficam de fora sem quebrar', () => {
  assert.deepEqual(montarLinhaDoTempo({ comunicados: [], noticias: [] }), []);
  assert.deepEqual(montarLinhaDoTempo({ comunicados: null, noticias: null }), []);
  assert.equal(montarLinhaDoTempo({ comunicados: [comunicado({ dataEntrega: null, dataReferencia: null })], noticias: [noticia({ publicadoEm: 'ontem' })] }).length, 0);
});

await caso('render: data no dia certo (sem recuo de fuso), sem Invalid Date', () => {
  const html = new SecaoEventos().renderEvento(eventos.find((e) => e.dataIso === '2026-10-08'));
  assert.match(html, /08-10-2026/);
  assert.doesNotMatch(html, /Invalid Date|07-10-2026/);
  assert.match(html, /Ver documento oficial/);
});

await caso('render: noticia com link http(s); javascript: descartado; texto escapado', () => {
  const [ok] = montarLinhaDoTempo({ noticias: [noticia({ titulo: '<b>X</b>' })] });
  const htmlOk = new SecaoEventos().renderEvento(ok);
  assert.match(htmlOk, /Abrir notícia/);
  assert.match(htmlOk, /&lt;b&gt;X&lt;\/b&gt;/);
  const [ruim] = montarLinhaDoTempo({ noticias: [noticia({ link: 'javascript:alert(1)' })] });
  assert.doesNotMatch(new SecaoEventos().renderEvento(ruim), /javascript:/);
});

console.log(`linhaDoTempo: ${casos} casos`);
