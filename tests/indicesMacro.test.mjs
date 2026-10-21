// MACRO-PAI-2: calculos puros das series macro e cartoes da tela #/indices.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };

const { emOrdem, mesesAntes, valorEm, variacoes, acumulado12m, janela12m, formatarVariacao } =
  await import('../public/js/analise/macro/series.js');
const { GRUPOS, renderIndice, renderGrupos } = await import('../public/js/pages/IndicesMacroPage.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

// Selic mensal de 10/2025 a 10/2026, como o backend devolve: do mais recente ao mais antigo.
const selic = [
  ['2026-10-01', 13.75], ['2026-09-01', 14.25], ['2026-07-01', 14.75], ['2026-04-01', 15.0],
  ['2025-10-01', 15.0], ['2025-09-01', 15.0],
].map(([data, valor]) => ({ data, valor }));

// IPCA mensal, 13 meses (o mais antigo fica fora da janela de 12).
const ipcaMensal = [0.5, 0.4, 0.3, 0.2, 0.1, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.4, 0.9]
  .map((valor, i) => ({ data: mesesAntes('2026-09-01', i), valor }));

await caso('emOrdem: ordena do mais antigo ao mais recente e descarta ponto invalido', () => {
  const ordenados = emOrdem([...selic, { data: null, valor: 1 }, { data: '2026-01-01', valor: 'x' }]);
  assert.equal(ordenados.length, 6);
  assert.equal(ordenados[0].data, '2025-09-01');
  assert.equal(ordenados.at(-1).valor, 13.75);
});

await caso('mesesAntes: prende o dia no fim do mes curto', () => {
  assert.equal(mesesAntes('2026-03-31', 1), '2026-02-28');
  assert.equal(mesesAntes('2026-10-20', 12), '2025-10-20');
  assert.equal(mesesAntes('2026-01-15', 3), '2025-10-15');
});

await caso('valorEm: ultimo ponto ate a data, null antes do inicio', () => {
  const ordenados = emOrdem(selic);
  assert.equal(valorEm(ordenados, '2026-08-15').valor, 14.75);
  assert.equal(valorEm(ordenados, '2020-01-01'), null);
});

await caso('variacoes em p.p. para taxa: 1, 3 e 12 meses', () => {
  const { atual, m1, m3, m12 } = variacoes(selic, 'pp');
  assert.equal(atual.data, '2026-10-01');
  assert.equal(m1, 13.75 - 14.25);
  assert.equal(m3, 13.75 - 14.75);
  assert.equal(m12, 13.75 - 15.0);
});

await caso('variacoes em % para preco e null sem historico suficiente', () => {
  const dolar = [{ data: '2026-10-20', valor: 5.5 }, { data: '2026-09-18', valor: 5.0 }];
  const { m1, m12 } = variacoes(dolar, 'pct');
  assert.ok(Math.abs(m1 - 10) < 1e-9);
  assert.equal(m12, null);
  assert.deepEqual(variacoes([], 'pp'), { atual: null, m1: null, m3: null, m12: null });
});

await caso('acumulado12m compoe os 12 meses mais recentes; buraco ou falta devolvem null', () => {
  const esperado = ([0.5, 0.4, 0.3, 0.2, 0.1, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.4]
    .reduce((f, v) => f * (1 + v / 100), 1) - 1) * 100;
  assert.ok(Math.abs(acumulado12m(ipcaMensal) - esperado) < 1e-9);
  assert.equal(acumulado12m(ipcaMensal.slice(0, 11)), null);
  const comBuraco = ipcaMensal.filter((_, i) => i !== 5);
  assert.equal(acumulado12m(comBuraco), null);
});

await caso('janela12m corta o que passou de 12 meses', () => {
  const janela = janela12m(selic);
  assert.equal(janela[0].data, '2025-10-01');
  assert.equal(janela.length, 5);
});

await caso('formatarVariacao: sinal, virgula e unidade', () => {
  assert.equal(formatarVariacao(-0.5, 'pp'), '−0,50 p.p.');
  assert.equal(formatarVariacao(1.234, 'pct'), '+1,23%');
  assert.equal(formatarVariacao(null), '—');
  assert.equal(formatarVariacao(-0.0001, 'pp'), '0,00 p.p.');
});

await caso('GRUPOS: quatro temas, Focus e novas series presentes', () => {
  assert.deepEqual(GRUPOS.map((g) => g.titulo), ['Juros', 'Inflação', 'Câmbio', 'Atividade']);
  const codigos = GRUPOS.flatMap((g) => g.indices.map((i) => i.codigo));
  for (const c of ['SELIC', 'IPCA_12M', 'EURO', 'IGPM', 'DESEMPREGO']) assert.ok(codigos.includes(c), c);
  assert.ok(codigos.some((c) => /^FOCUS_SELIC_\d{4}$/.test(c)));
  assert.ok(codigos.some((c) => /^FOCUS_IPCA_\d{4}$/.test(c)));
});

await caso('cartao com dados: valor, sparkline, chips e tabela recolhida', () => {
  const html = renderIndice({ codigo: 'SELIC', nome: 'Selic (meta)', unidade: '% a.a.', variacao: 'pp', fonte: 'x' }, selic);
  assert.match(html, /13,75/);
  assert.match(html, /class="f360-sparkline"/);
  assert.match(html, /1m −0,50 p\.p\./);
  assert.match(html, /12m −1,25 p\.p\./);
  assert.match(html, /<details><summary class="small">Últimos pontos<\/summary>/);
});

await caso('cartao mensal com acumulado de 12 meses; cartao vazio avisa', () => {
  const html = renderIndice({ codigo: 'IGPM', nome: 'IGP-M', unidade: '%', variacao: 'pp', acumula12m: true, fonte: 'x' }, ipcaMensal);
  assert.match(html, /Acumulado 12 meses: <strong>[\d,]+%<\/strong>/);
  const vazio = renderIndice({ codigo: 'EURO', nome: 'Euro', unidade: 'R$', variacao: 'pct', fonte: 'x' }, []);
  assert.match(vazio, /Sem dado ainda/);
  assert.doesNotMatch(vazio, /f360-sparkline/);
});

await caso('renderGrupos monta uma secao por tema', () => {
  const html = renderGrupos(GRUPOS, { SELIC: selic });
  assert.equal((html.match(/<section/g) || []).length, 4);
  assert.match(html, /<h5 class="mb-0">Câmbio<\/h5>/);
});

console.log(`indicesMacro: ${casos} casos`);

// ---- MACRO-PAI-1/3: painel de decisao
{
  const { indicadoresDecisao, temDados, ativosAcima, seloCiclo, distanciaTexto } = await import('../public/js/analise/macro/painel.js');
  const { renderPainel, renderAtivosAcima } = await import('../public/js/pages/IndicesMacroPage.js');
  const ano = 2026;
  const painel = {
    series: [{ codigo: 'FOCUS_SELIC_2026', valor: 12.5 }, { codigo: 'FOCUS_IPCA_2026', valor: 4.2 }],
    juroReal: { valor: 9.2, selicMeta: 13.75, ipcaEsperado: 4.2, leitura: 'Juro real de 9,20%' },
    cicloSelic: { ciclo: 'QUEDA', metaAtual: 13.75, meta90DiasAntes: 14.75, leitura: 'Selic em queda' },
    barreira: { earningsYieldMinimo: 13.75, earningsYieldMediano: 9.1, leitura: 'Barreira...',
      ativosAcimaDaBarreira: [{ simbolo: 'taee11', earningsYield: 16.5 }] },
  };
  await caso('painel: indicadores, selo com icone+texto e link do ativo', () => {
    const ind = indicadoresDecisao(painel, ano);
    assert.equal(ind.length, 4);
    assert.match(ind[2].valor, /12,50%.*4,20%/);
    assert.deepEqual(seloCiclo('QUEDA'), { rotulo: 'QUEDA', icone: '▼', tom: 'success' });
    const html = renderPainel(painel, ano);
    assert.match(html, /▼<\/span> QUEDA/);
    assert.match(html, /href="#\/ativo\/TAEE11"/);
    assert.match(html, /\+2,75 p\.p\. da barreira/);
    assert.equal(distanciaTexto(null), '');
  });
  await caso('painel: blocos nulos mostram o motivo; sem nada, temDados e falso', () => {
    const vazio = { series: [], juroReal: { motivo: 'Selic meta ausente no cache' }, cicloSelic: null, barreira: null };
    assert.equal(temDados(vazio, ano), false);
    assert.equal(temDados(null, ano), false);
    assert.match(renderPainel(vazio, ano), /Selic meta ausente no cache/);
    assert.equal(renderAtivosAcima(null), '');
  });
  await caso('painel: estado vazio dos ativos acima traz a mediana', () => {
    const b = { earningsYieldMinimo: 13.75, earningsYieldMediano: 9.1, ativosAcimaDaBarreira: [] };
    assert.deepEqual(ativosAcima(b), []);
    assert.match(renderAtivosAcima(b), /Nenhum ativo acima da barreira; mediana da base em 9,10%/);
  });
}

// FONTES-PAI-5: curva de juro real (NTN-B).
{
  const cr = await import('../public/js/analise/macro/curvaReal.js');
  const { renderCurvaReal, renderPainel: rp } = await import('../public/js/pages/IndicesMacroPage.js');
  const mk = (v, c) => ({ tipo: 'NTN-B', vencimento: v, taxaCompra: c, taxaVenda: c - 0.04 });
  const normal = { dataBase: '2026-10-20', referencia: mk('2031-08-15', 7.4),
    vencimentos: [mk('2035-05-15', 7.8), mk('2028-08-15', 7.1), mk('2031-08-15', 7.4)], motivo: null };
  const invertida = { ...normal, vencimentos: [mk('2028-08-15', 8.0), mk('2035-05-15', 7.2)] };
  await caso('curva: ordena por vencimento e classifica normal/invertida/plana', () => {
    const p = cr.pontosCurva(normal);
    assert.deepEqual(p.map((x) => x.vencimento.slice(0, 4)), ['2028', '2031', '2035']);
    assert.equal(cr.formaCurva(p).forma, 'NORMAL');
    assert.equal(cr.formaCurva(cr.pontosCurva(invertida)).forma, 'INVERTIDA');
    assert.equal(cr.formaCurva([{ taxa: 7, vencimento: '2028-01-01' }, { taxa: 7.001, vencimento: '2035-01-01' }]).forma, 'PLANA');
    assert.equal(cr.formaCurva([p[0]]), null);
  });
  await caso('curva: linha de referencia, disponibilidade e dados invalidos', () => {
    assert.equal(cr.linhaReferencia(normal), 'NTN-B de referência: 7,40% (vencimento 15/08/2031)');
    assert.equal(cr.linhaReferencia({ ...normal, motivo: 'sem dados' }), '');
    assert.equal(cr.linhaReferencia(null), '');
    assert.equal(cr.curvaDisponivel({ motivo: 'x', vencimentos: [] }), false);
    assert.equal(cr.curvaDisponivel(null), false);
    assert.equal(cr.pontosCurva({ vencimentos: [{ vencimento: 'x', taxaCompra: 1 }, { vencimento: '2030-01-01', taxaCompra: null }] }).length, 0);
  });
  await caso('curva: cartao com referencia, selo, svg acessivel e tabela recolhida', () => {
    const html = renderCurvaReal(normal);
    assert.match(html, /Juro real: NTN-B \(Tesouro IPCA\+\)/);
    assert.match(html, /7,40%/);
    assert.match(html, /vencimento mais próximo de 5 anos \(15\/08\/2031\)/);
    assert.match(html, /20\/10\/2026/);
    assert.match(html, /▲<\/span> Curva normal/);
    assert.match(html, /<svg[^>]*role="img"[^>]*aria-label="Curva de juro real/);
    assert.match(html, /<details[^>]*>\s*<summary[^>]*>Pontos da curva \(3\)/);
    assert.match(renderCurvaReal(invertida), /▼<\/span> Curva invertida/);
  });
  await caso('curva: motivo ou 503 vira aviso discreto sem cartao', () => {
    const aviso = renderCurvaReal({ dataBase: null, referencia: null, vencimentos: [], motivo: 'Sem dados do Tesouro (V45)' });
    assert.match(aviso, /data-curva-aviso/);
    assert.match(aviso, /Sem dados do Tesouro \(V45\)/);
    assert.doesNotMatch(aviso, /<svg/);
    assert.match(renderCurvaReal(null), /data-curva-aviso/);
  });
  await caso('curva: cabecalho de decisao ganha a linha so com curva disponivel', () => {
    const painel = { series: [], juroReal: { valor: 9.2, selicMeta: 13.75, ipcaEsperado: 4.2 }, cicloSelic: null, barreira: null };
    assert.match(rp(painel, 2026, normal), /data-ntnb-ref[^>]*>NTN-B de referência: 7,40% \(vencimento 15\/08\/2031\)/);
    assert.doesNotMatch(rp(painel, 2026, null), /NTN-B de referência/);
    assert.doesNotMatch(rp(painel, 2026, { motivo: 'x' }), /NTN-B de referência/);
    assert.equal(rp(painel, 2026), rp(painel, 2026, null));
  });
}
