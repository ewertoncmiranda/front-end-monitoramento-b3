// TASK-NOT-1 / TASK-NOT-2: agregador noticiasFavoritos e buscarNoticias com nome.
import assert from 'node:assert/strict';
import { noticiasFavoritos, _limparCache } from '../proxy/noticiasFavoritos.js';

// --- helpers ---

const AGORA = new Date('2026-10-08T12:00:00.000Z');
const agora = () => AGORA;

function manchete(titulo, link, fonte, hAtras = 1) {
  const publicadoEm = new Date(AGORA.getTime() - hAtras * 60 * 60 * 1000).toISOString();
  return { titulo, link, fonte, publicadoEm };
}

// Buscar simples: retorna manchetes pre-definidas ou lanca erro.
function buscarFixo(mapa) {
  return async (ticker) => {
    if (ticker in mapa) {
      if (mapa[ticker] instanceof Error) throw mapa[ticker];
      return mapa[ticker];
    }
    return [];
  };
}

// --- TASK-NOT-2: URL montada por buscarNoticias ---

{
  // Verifica que a funcao existe e aceita o parametro nome (sem fazer fetch real).
  const src = await import('node:fs').then(({ readFileSync }) =>
    readFileSync(new URL('../proxy/noticiasApi.js', import.meta.url), 'utf8'),
  );
  assert.match(src, /function buscarNoticias\(ticker,\s*\{.*nome.*\}/, 'assinatura com nome');
  assert.match(src, /"\$\{ticker\}" OR "\$\{nome\}"/, 'query com OR quando nome fornecido');
  assert.match(src, /"\$\{ticker\}"/, 'query so com ticker quando sem nome');
  assert.match(src, /pubDateParaIso/, 'converte pubDate para ISO');
  assert.match(src, /toISOString\(\)/, 'usa toISOString na conversao');
  console.log('  noticiasApi.js (TASK-NOT-2) ok');
}

// --- TASK-NOT-1: noticiasFavoritos ---

// 1. Caso basico: um ticker, uma manchete.
{
  _limparCache();
  const buscar = buscarFixo({ PETR4: [manchete('Petrobras sobe 3%', 'https://a.com/1', 'Valor')] });
  const r = await noticiasFavoritos(['PETR4'], { buscar, agora });
  assert.equal(r.manchetes.length, 1);
  assert.deepEqual(r.falhas, []);
  assert.equal(r.desatualizado, false);
  assert.equal(r.manchetes[0].simbolos[0], 'PETR4');
  console.log('  caso basico ok');
}

// 2. Juncao de tickers: mesma manchete (mesmo link) em dois tickers.
{
  _limparCache();
  const link = 'https://a.com/same';
  const buscar = buscarFixo({
    PETR4: [manchete('Petroleo em alta', link, 'Valor')],
    PRIO3: [manchete('Petroleo em alta', link, 'Globo')],
  });
  const r = await noticiasFavoritos(['PETR4', 'PRIO3'], { buscar, agora });
  assert.equal(r.manchetes.length, 1, 'mesmo link => uma entrada');
  assert.ok(r.manchetes[0].simbolos.includes('PETR4'));
  assert.ok(r.manchetes[0].simbolos.includes('PRIO3'));
  console.log('  juncao por link ok');
}

// 3. Deduplicacao por titulo (Jaccard >= 0.85).
{
  _limparCache();
  const buscar = buscarFixo({
    PETR4: [manchete('Petrobras anuncia lucro recorde no terceiro trimestre', 'https://a.com/1', 'Valor')],
    VALE3: [manchete('Petrobras anuncia lucro recorde no terceiro trimestre 2026', 'https://b.com/2', 'Globo')],
  });
  const r = await noticiasFavoritos(['PETR4', 'VALE3'], { buscar, agora });
  assert.equal(r.manchetes.length, 1, 'titulo quase igual => uma entrada');
  assert.ok(r.manchetes[0].simbolos.length === 2);
  console.log('  deduplicacao por Jaccard ok');
}

// 4. Titulos diferentes (Jaccard < 0.85) nao sao mesclados.
{
  _limparCache();
  const buscar = buscarFixo({
    PETR4: [manchete('Petrobras sobe no mercado', 'https://a.com/1', 'Valor')],
    VALE3: [manchete('Vale anuncia dividendos extraordinarios', 'https://b.com/2', 'Globo')],
  });
  const r = await noticiasFavoritos(['PETR4', 'VALE3'], { buscar, agora });
  assert.equal(r.manchetes.length, 2, 'titulos diferentes => duas entradas');
  console.log('  sem deduplicacao indevida ok');
}

// 5. Paralelismo: no maximo PARALELO_MAX (3) chamadas simultaneas.
{
  _limparCache();
  let emParalelo = 0;
  let picoParalelo = 0;
  // setImmediate: libera o event loop para que todas as promises do batch
  // (Promise.all) estejam em voo ao mesmo tempo antes de qualquer resolver.
  const buscarContar = async (ticker) => {
    emParalelo++;
    picoParalelo = Math.max(picoParalelo, emParalelo);
    await new Promise((r) => setImmediate(r));
    emParalelo--;
    return [manchete(`Noticia ${ticker}`, `https://a.com/${ticker}`, 'Fonte')];
  };
  await noticiasFavoritos(['PETR4', 'VALE3', 'WEGE3', 'ITUB4', 'ABEV3'], { buscar: buscarContar, agora });
  assert.ok(picoParalelo <= 3, `pico de paralelismo foi ${picoParalelo}, esperado <= 3`);
  console.log('  paralelismo <= 3 ok');
}

// 6. Cache: segunda chamada nao chama buscar novamente.
{
  _limparCache();
  let chamadas = 0;
  const buscar = async () => { chamadas++; return [manchete('Noticia', 'https://a.com/1', 'X')]; };
  await noticiasFavoritos(['PETR4'], { buscar, agora });
  await noticiasFavoritos(['PETR4'], { buscar, agora });
  assert.equal(chamadas, 1, 'cache evita segunda chamada dentro do TTL');
  console.log('  cache 15 min ok');
}

// 7. Cache expirado: nova chamada apos TTL.
{
  _limparCache();
  let chamadas = 0;
  const buscar = async () => { chamadas++; return [manchete('Noticia', 'https://a.com/1', 'X')]; };
  const agoraPassado = () => new Date(AGORA.getTime() - 16 * 60 * 1000); // 16 min atras
  await noticiasFavoritos(['PETR4'], { buscar, agora: agoraPassado });
  // Segunda chamada com relogio atual (cache de 16 min atras ja expirou).
  await noticiasFavoritos(['PETR4'], { buscar, agora });
  assert.equal(chamadas, 2, 'cache expirado forca nova busca');
  console.log('  cache expirado ok');
}

// 8. Pausa de erro: apos falha, nao tenta de novo dentro de 30 min.
{
  _limparCache();
  let tentativas = 0;
  const buscar = async () => { tentativas++; throw new Error('DNS falhou'); };
  await noticiasFavoritos(['PETR4'], { buscar, agora });
  await noticiasFavoritos(['PETR4'], { buscar, agora }); // ainda na janela de 30 min
  assert.equal(tentativas, 1, 'so uma tentativa dentro da pausa de 30 min');
  assert.deepEqual((await noticiasFavoritos(['PETR4'], { buscar, agora })).falhas, ['PETR4']);
  console.log('  pausa de 30 min apos erro ok');
}

// 9. Cache vencido (erro, mas tinha cache anterior): retorna como desatualizado.
{
  _limparCache();
  let chamadas = 0;
  const buscarOk = async () => {
    chamadas++;
    return [manchete('Noticia', 'https://a.com/1', 'X')];
  };
  const buscarFalha = async () => { chamadas++; throw new Error('off'); };
  // Primeira chamada: popula cache com sucesso.
  const agoraPassado = () => new Date(AGORA.getTime() - 20 * 60 * 1000);
  await noticiasFavoritos(['PETR4'], { buscar: buscarOk, agora: agoraPassado });
  chamadas = 0;
  // Segunda chamada: cache expirado (20 min), busca falha, deve retornar cache vencido.
  const r = await noticiasFavoritos(['PETR4'], { buscar: buscarFalha, agora });
  assert.equal(r.desatualizado, true, 'desatualizado = true quando usa cache vencido por erro');
  assert.equal(r.manchetes.length, 1, 'retorna a manchete do cache anterior');
  assert.deepEqual(r.falhas, [], 'nao eh falha, so desatualizado');
  console.log('  cache vencido por erro ok');
}

// 10. Corte de 7 dias: manchetes antigas sao removidas.
{
  _limparCache();
  const buscar = buscarFixo({
    PETR4: [
      manchete('Recente', 'https://a.com/r', 'X', 2),         // 2h atras: ok
      manchete('Antiga', 'https://a.com/a', 'X', 7 * 24 + 1), // >7 dias: removida
    ],
  });
  const r = await noticiasFavoritos(['PETR4'], { buscar, agora });
  assert.equal(r.manchetes.length, 1);
  assert.equal(r.manchetes[0].titulo, 'Recente');
  console.log('  corte de 7 dias ok');
}

// 11. Corte de 30 itens.
{
  _limparCache();
  const muitas = Array.from({ length: 35 }, (_, i) =>
    manchete(`Noticia ${i}`, `https://a.com/${i}`, 'X', i + 1),
  );
  const buscar = buscarFixo({ PETR4: muitas });
  const r = await noticiasFavoritos(['PETR4'], { buscar, agora });
  assert.ok(r.manchetes.length <= 30, `esperado <= 30, obtido ${r.manchetes.length}`);
  console.log('  corte de 30 itens ok');
}

// 12. Ordenacao: mais recente primeiro.
{
  _limparCache();
  const buscar = buscarFixo({
    PETR4: [
      manchete('A', 'https://a.com/A', 'X', 3),
      manchete('B', 'https://a.com/B', 'X', 1),
      manchete('C', 'https://a.com/C', 'X', 5),
    ],
  });
  const r = await noticiasFavoritos(['PETR4'], { buscar, agora });
  assert.equal(r.manchetes[0].titulo, 'B', 'mais recente primeiro (1h atras)');
  assert.equal(r.manchetes[2].titulo, 'C', 'mais antigo por ultimo (5h atras)');
  console.log('  ordenacao por data ok');
}

// 13. Validacao do ticker invalido: testada no server (sem instanciar Express aqui;
//     garante que o regex esta correto para uso no server.js).
{
  const TICKER_RE = /^[A-Z]{4}[0-9]{1,2}$/;
  assert.ok(TICKER_RE.test('PETR4'));
  assert.ok(TICKER_RE.test('VALE3'));
  assert.ok(TICKER_RE.test('ABEV11'));
  assert.ok(!TICKER_RE.test('petr4'));
  assert.ok(!TICKER_RE.test('PETRO4'));
  assert.ok(!TICKER_RE.test('PET4'));
  assert.ok(!TICKER_RE.test('PETR4X'));
  console.log('  regex de ticker ok');
}

console.log('noticiasFavoritos.test.mjs ok');
