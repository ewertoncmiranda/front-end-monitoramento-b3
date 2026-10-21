// FONTES-PAI-2 (DEC-FONTES-1): ficha de banco na secao Fundamentos.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement = class { constructor() { this.isConnected = true; this.innerHTML = ''; } querySelectorAll() { return []; } };
globalThis.customElements = { define() {}, get() { return undefined; } };

const { modeloBanco, rotuloTrimestre, serieDoCampo, seloVisual } = await import('../../public/js/analise/ficha360/banco.js');
const { rotaDaChave } = await import('../../public/js/api/ficha360Api.js');
const { SecaoFundamentos } = await import('../../public/js/components/ficha360/secoes/SecaoFundamentos.js');

const tri = (dataBase, b, c, i, r) => ({ dataBase, basileia: b, capitalPrincipal: c, inadimplencia: i, roe: r });
const ITAU = {
  simbolo: 'ITUB4', ehBanco: true, motivo: null,
  ultimoTrimestre: tri('2026-06-30', 15.2, 13.1, 3.4, 21.5),
  serie: [tri('2025-09-30', 14.9, 12.8, 2.8, 20), tri('2026-06-30', 15.2, 13.1, 3.4, 21.5)],
  pvp: 2, pvpMotivo: null, roeSobrePvp: 10.75,
  selos: [{ tipo: 'BASILEIA', status: 'OK', valor: 15.2, referencia: 10.5, leitura: 'Basileia acima do mínimo.' },
    { tipo: 'INADIMPLENCIA', status: 'ALERTA', valor: 0.6, referencia: 0.5, leitura: 'Inadimplência subiu.' },
    { tipo: 'ROE', status: 'ACIMA', valor: 21.5, referencia: 14.75, leitura: 'ROE acima da Selic.' }],
  leitura: '1 selo exige atenção.',
};
const FC = { periodo: '2025-12-31', fonte: 'CVM', roe: 20, margem_liquida: 15, ebitda: 100 };

async function renderizar(banco) {
  const dados = { fundamentosCvm: FC, fundamentosHistorico: { pontos: [] }, banco };
  const el = new SecaoFundamentos();
  el._contexto = { obter: async (k) => dados[k] ?? null };
  await el.carregar();
  return el.innerHTML;
}

test('rotulo de trimestre e rota', () => {
  assert.equal(rotuloTrimestre('2026-06-30'), '2T/26');
  assert.equal(rotuloTrimestre('2025-12-31'), '4T/25');
  assert.equal(rotuloTrimestre(null), '—');
  assert.equal(rotaDaChave('banco', 'ITUB4'), '/ativos/ITUB4/banco');
});

test('modelo: nao banco, falha, sem dados e banco', () => {
  assert.equal(modeloBanco(null).estado, 'nao-banco');
  assert.equal(modeloBanco({ ehBanco: false }).estado, 'nao-banco');
  const sem = modeloBanco({ ehBanco: true, motivo: 'Sem IF.data', ultimoTrimestre: null, serie: null });
  assert.equal(sem.estado, 'sem-dados');
  assert.equal(sem.motivo, 'Sem IF.data');
  const m = modeloBanco(ITAU);
  assert.equal(m.estado, 'banco');
  assert.equal(m.trimestre, '2T/26');
  assert.equal(m.indicadores.find((i) => i.campo === 'basileia').valor, 15.2);
  assert.equal(m.selos[1].visual.icone, '⚠');
});

test('serie descarta nulos e selo desconhecido vira sem dado', () => {
  assert.deepEqual(serieDoCampo([tri('2025-09-30', null, 1, 1, 1), tri('2025-12-31', 2, 1, 1, 1)], 'basileia'), [{ periodo: '4T/25', valor: 2 }]);
  assert.equal(seloVisual('XPTO').texto, 'Sem dado');
});

test('banco: painel com indicadores, selos texto+icone e sparkline; demais dados preservados', async () => {
  const html = await renderizar(ITAU);
  for (const t of ['Índice de Basileia', 'Capital principal', 'Inadimplência', 'P/VP', 'ROE / P/VP', 'Atenção', '⚠', 'f360-sparkline', 'último trimestre 2T/26', 'Outros indicadores']) assert.ok(html.includes(t), t);
  assert.match(html, /<details/);
  assert.ok(html.includes('Dívida líquida / EBITDA'), 'dado nao apagado');
});

test('nao banco, ehBanco=false e falha do endpoint: secao identica a atual', async () => {
  const base = await renderizar(null);
  assert.equal(await renderizar({ ehBanco: false, simbolo: 'PETR4' }), base);
  assert.doesNotMatch(base, /<details|Basileia/);
  assert.ok(base.includes('Dívida líquida / EBITDA') && base.includes('Período do balanço'));
});

test('banco sem IF.data: aviso discreto com o motivo, sem painel', async () => {
  const html = await renderizar({ ehBanco: true, motivo: 'Sem dados do IF.data', ultimoTrimestre: null, serie: null });
  assert.ok(html.includes('Sem dados do IF.data') && html.includes('role="status"'));
  assert.doesNotMatch(html, /Índice de Basileia/);
});
