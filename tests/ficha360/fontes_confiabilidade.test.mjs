// FONTES-PAI-4: selos de confiabilidade no cabecalho e ponto de extensao da tabela.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const c = await import('../../public/js/analise/ficha360/confiabilidade.js');
const { htmlCabecalho, dadosDoCabecalho } = await import('../../public/js/components/ficha360/secoes/SecaoCabecalho.js');
const { rotaDaChave, CHAVES_DO_CONTEXTO } = await import('../../public/js/api/ficha360Api.js');
const { FichaContexto } = await import('../../public/js/components/ficha360/FichaContexto.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const resposta = {
  simbolo: 'PETR4',
  resumo: { nivel: 'ALERTA', leitura: 'Pontos de atenção em AUDITOR, DIVIDENDO.' },
  selos: [
    { id: 'FUNDOS', nivel: 'SEM_DADO', titulo: 'Fundos com o ativo', detalhe: 'Sem posição de fundos.' },
    { id: 'DIVIDENDO', nivel: 'ALERTA', titulo: 'Sustentabilidade do dividendo', detalhe: 'Payout de 120.0% <do> lucro' },
    { id: 'CADASTRO', nivel: 'OK', titulo: 'Cadastro na CVM', detalhe: 'Situação: ATIVO' },
    { id: 'AUDITOR', nivel: 'CRITICO', titulo: 'Auditor', detalhe: 'Troca de auditor' },
  ],
};

await caso('pior nivel: CRITICO > ALERTA > OK; SEM_DADO so se tudo for sem dado', () => {
  assert.equal(c.piorNivel(['OK', 'ALERTA', 'SEM_DADO']), 'ALERTA');
  assert.equal(c.piorNivel(['OK', 'CRITICO', 'ALERTA']), 'CRITICO');
  assert.equal(c.piorNivel(['OK', 'SEM_DADO']), 'OK');
  assert.equal(c.piorNivel(['SEM_DADO']), 'SEM_DADO');
  assert.equal(c.piorNivel([]), 'SEM_DADO');
  assert.equal(c.piorNivel(['XYZ', 'OK']), 'OK');
});

await caso('ordenacao: mais grave primeiro, empate pela ordem dos ids', () => {
  const n = c.normalizarConfiabilidade(resposta);
  assert.deepEqual(n.selos.map((s) => s.id), ['AUDITOR', 'DIVIDENDO', 'CADASTRO', 'FUNDOS']);
  assert.equal(n.resumo, 'ALERTA');
});

await caso('resposta invalida ou sem selos vira null', () => {
  for (const r of [null, undefined, {}, { selos: [] }, { selos: 'x' }, 'erro']) assert.equal(c.normalizarConfiabilidade(r), null);
});

await caso('rotulos e textos dos niveis', () => {
  assert.equal(c.rotuloDoNivel('CRITICO'), 'CRÍTICO');
  assert.equal(c.rotuloDoNivel('ALERTA'), 'ALERTA');
  assert.equal(c.rotuloDoNivel('qualquer'), 'Sem dado');
});

await caso('faixa: resumo, tooltip, texto para leitor de tela, escape e SEM_DADO recolhido', () => {
  const html = c.htmlFaixaConfiabilidade(resposta);
  assert.match(html, /Confiabilidade: ALERTA/);
  assert.match(html, /title="Pontos de atenção em AUDITOR, DIVIDENDO\."/);
  assert.match(html, /f360-conf-critico[^>]*title="Troca de auditor"/);
  assert.match(html, /visually-hidden">\. Troca de auditor/);
  assert.match(html, /Payout de 120\.0% &lt;do&gt; lucro/);
  assert.doesNotMatch(html, /<do>/);
  assert.match(html, /<details class="f360-conf-sem-dado"><summary>1 sem dado/);
  assert.match(html, /aria-hidden="true">⛔/);
  const antesDoDetails = html.split('<details')[0];
  assert.doesNotMatch(antesDoDetails, /Fundos com o ativo/, 'SEM_DADO nao fica na faixa principal');
});

await caso('todos OK: so o resumo e os selos OK, sem destaque', () => {
  const html = c.htmlFaixaConfiabilidade({ resumo: { nivel: 'OK' }, selos: [{ id: 'CADASTRO', nivel: 'OK', titulo: 'Cadastro', detalhe: 'ok' }] });
  assert.match(html, /Confiabilidade: OK/);
  assert.doesNotMatch(html, /f360-conf-alerta|f360-conf-critico|<details/);
});

await caso('falha do endpoint (null/erro): faixa some e cabecalho igual ao de hoje', () => {
  assert.equal(c.htmlFaixaConfiabilidade(null), '');
  const d = dadosDoCabecalho('PETR4', {});
  const sem = htmlCabecalho(d, null, null);
  assert.equal(sem, htmlCabecalho(d));
  assert.doesNotMatch(sem, /f360-conf|Confiabilidade/);
  assert.match(htmlCabecalho(d, null, resposta), /Confiabilidade: ALERTA/);
});

await caso('chave confiabilidade na API e 404/503 do contexto viram null', async () => {
  assert.ok(CHAVES_DO_CONTEXTO.includes('confiabilidade'));
  assert.equal(rotaDaChave('confiabilidade', 'PETR4'), '/ativos/PETR4/confiabilidade');
  for (const status of [404, 503]) {
    const ctx = new FichaContexto('petr4', async () => { throw Object.assign(new Error(`HTTP ${status}`), { status }); });
    assert.equal(await ctx.obter('confiabilidade'), null);
  }
});

await caso('tabela: nivel da linha vem da listagem (situacaoRegistro) ou do campo futuro', () => {
  assert.equal(c.nivelDaLinha({ situacaoRegistro: 'ATIVO' }), 'OK');
  assert.equal(c.nivelDaLinha({ situacaoRegistro: 'SUSPENSO(A) - Decisão' }), 'CRITICO');
  assert.equal(c.nivelDaLinha({ situacaoRegistro: 'CANCELADA' }), 'CRITICO');
  assert.equal(c.nivelDaLinha({ situacaoRegistro: 'EM RECUPERACAO' }), 'ALERTA');
  assert.equal(c.nivelDaLinha({}), 'SEM_DADO');
  assert.equal(c.nivelDaLinha({ situacaoRegistro: 'ATIVO', confiabilidade: { nivel: 'ALERTA' } }), 'ALERTA', 'campo futuro da listagem vence');
});

await caso('tabela: filtro por confiabilidade', () => {
  const itens = [
    { simbolo: 'A', situacaoRegistro: 'ATIVO' }, { simbolo: 'B', situacaoRegistro: 'CANCELADA' },
    { simbolo: 'C', situacaoRegistro: 'X' }, { simbolo: 'D' },
  ];
  const ids = (f) => c.filtrarPorConfiabilidade(itens, f).map((i) => i.simbolo).join('');
  assert.equal(ids(''), 'ABCD');
  assert.equal(ids('OK'), 'A');
  assert.equal(ids('CRITICO'), 'B');
  assert.equal(ids('COM_RESTRICAO'), 'BC');
  assert.equal(ids('lixo'), 'ABCD');
  assert.deepEqual(c.filtrarPorConfiabilidade(null, 'OK'), []);
});

console.log(`\n${casos} casos ok`);
