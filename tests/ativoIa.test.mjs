// Card "IA" da ficha (TASK-CHAT-5): renderizacao pura e estados.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const {
  htmlPacote, htmlLeitura, htmlCard, sinaisMaisFortes, soRegra, AtivoIa,
  MENSAGEM_INDISPONIVEL, NOTA_SO_REGRA, SUGESTOES_DO_ATIVO,
} = await import('../public/js/components/ficha/AtivoIa.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

// Fixture no formato do CTR-IA-03 (insider-ia SPEC 13.3).
const pacote = (extra = {}) => ({
  simbolo: 'WEGE3', data_pregao: '2026-10-07',
  cotacao: { fechamento: 52.1, variacao_1d: 0.012, variacao_1m: -0.03, variacao_12m: 0.18 },
  fundamentos: { pl: 28.4, roe: 0.31, divida_liquida_ebitda: -0.2 },
  sinais: [
    { id: 'a', rotulo: 'Fraco', valor: 'X', direcao: 0 },
    { id: 'b', rotulo: 'Forte alta', valor: 'COMPRA_TECNICA', direcao: 2 },
    { id: 'c', rotulo: 'Forte baixa', valor: 'Y', direcao: -2 },
    { id: 'd', rotulo: 'Medio', valor: 'Z', direcao: 1 },
  ],
  opiniao: [
    { horizonte_pregoes: 126, opiniao: 'SINAL_NEUTRO', risco: 'RISCO_BAIXO', origem: 'MODELO' },
    { horizonte_pregoes: 21, opiniao: 'SINAL_POSITIVO', risco: 'RISCO_MEDIO', origem: 'MODELO' },
    { horizonte_pregoes: 63, opiniao: 'SINAL_NEGATIVO', risco: 'RISCO_ALTO', origem: 'REGRA' },
  ],
  comunicados: [],
  manchetes: [
    { titulo: 'WEG anuncia <b>fábrica</b>', link: 'https://exemplo.test/1', fonte: 'Valor', publicadoEm: '2026-10-06' },
    { titulo: 'Link perigoso', link: 'javascript:alert(1)', fonte: 'X' },
    { titulo: 'Terceira', link: 'https://exemplo.test/3', fonte: 'Y' },
    { titulo: 'Quarta nao aparece', link: 'https://exemplo.test/4', fonte: 'Z' },
  ],
  aviso: 'Leitura automática dos números, regra experimental. Não é recomendação de investimento.',
  ...extra,
});

await caso('pacote: tres horizontes em ordem, com cor e texto', () => {
  const html = htmlPacote(pacote());
  assert.match(html, /Curto[\s\S]*Médio[\s\S]*Longo/);
  assert.match(html, /Sinal positivo/);
  assert.match(html, /Risco alto/);
  assert.match(html, /07-10-2026/);
  assert.match(html, /Não é recomendação de investimento/);
});

await caso('pacote: os 3 sinais de maior |direcao|, e so 3 manchetes', () => {
  assert.deepEqual(sinaisMaisFortes(pacote().sinais).map((s) => s.id), ['b', 'c', 'd']);
  const html = htmlPacote(pacote());
  assert.doesNotMatch(html, /Fraco/);
  assert.doesNotMatch(html, /Quarta nao aparece/);
});

await caso('valor null aparece como "sem dado", nunca 0', () => {
  const html = htmlPacote(pacote({ cotacao: { fechamento: null, variacao_1d: null, variacao_1m: null, variacao_12m: null },
    fundamentos: { pl: null, roe: null, divida_liquida_ebitda: null } }));
  assert.equal((html.match(/sem dado/g) || []).length, 7);
  assert.doesNotMatch(html, /R\$ 0,00|\+0,0%|>0,0</);
});

await caso('numeros formatados em pt-BR e ROE como fracao', () => {
  const html = htmlPacote(pacote());
  assert.match(html, /R\$ 52,10/);
  assert.match(html, /\+1,2%/);
  assert.match(html, /-3,0%/);
  assert.match(html, /31,0%/);
});

await caso('conteudo externo escapado e link so http(s)', () => {
  const html = htmlPacote(pacote());
  assert.match(html, /WEG anuncia &lt;b&gt;fábrica&lt;\/b&gt;/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /rel="noopener noreferrer"/);
});

await caso('so regra no pregao mostra a nota; com modelo nao', () => {
  const soRegraPacote = pacote({ opiniao: pacote().opiniao.map((o) => ({ ...o, origem: 'REGRA' })) });
  assert.equal(soRegra(soRegraPacote.opiniao), true);
  assert.ok(htmlPacote(soRegraPacote).includes(NOTA_SO_REGRA));
  assert.ok(!htmlPacote(pacote()).includes(NOTA_SO_REGRA));
  assert.equal(soRegra([]), false);
});

await caso('servico fora: mensagem que aponta para a opiniao por regra acima', () => {
  assert.ok(htmlPacote(null).includes(MENSAGEM_INDISPONIVEL));
  assert.match(MENSAGEM_INDISPONIVEL, /opinião por regra continua acima/);
});

await caso('leitura: texto escapado, origem e "em cache"', () => {
  const html = htmlLeitura({ texto: 'Alta de <script>x</script> no mês.', origem: 'MODELO', modelo: 'gemini', em_cache: true,
    gerado_em: '2026-10-07T13:00:00Z' });
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /modelo · gemini/);
  assert.match(html, /em cache/);
  assert.match(htmlLeitura({ texto: 'x', origem: 'REGRA' }), /regra \(sem modelo\)/);
  assert.match(htmlLeitura(null), /indisponível/);
});

await caso('card: botao de leitura, conversa recolhida e sugestoes do ativo', () => {
  const html = htmlCard('WEGE3');
  assert.match(html, /data-ler/);
  assert.match(html, /<details[\s\S]*Conversar sobre WEGE3/);
  assert.equal(SUGESTOES_DO_ATIVO.length, 3);
});

// Troca de ativo durante a busca: a resposta do anterior nao pode sobrescrever.
await caso('troca de ativo cancela a renderizacao da busca anterior', async () => {
  const iaApi = await import('../public/js/api/iaApi.js');
  let resolver;
  globalThis.fetch = () => new Promise((r) => { resolver = r; });
  const corpo = { innerHTML: 'Carregando…' };
  let simbolo = 'WEGE3';
  const el = Object.create(AtivoIa.prototype);
  el.getAttribute = () => simbolo;
  el.querySelector = (sel) => (sel === '[data-pacote]' ? corpo : { addEventListener() {}, firstChild: null });
  const pendente = el.afterRender();
  simbolo = 'PETR4';
  resolver({ ok: true, status: 200, text: async () => JSON.stringify(pacote()) });
  await pendente;
  assert.equal(corpo.innerHTML, 'Carregando…');
  assert.ok(iaApi.buscarPacoteAtivo);
});

console.log(`ativoIa: ${casos} casos ok`);
