import assert from 'node:assert/strict';
globalThis.HTMLElement=class {};
globalThis.customElements={define(){},get(){return null;}};
globalThis.document={hidden:false,removeEventListener(){}};
const {CargasPage}=await import('../public/js/pages/CargasPage.js');
const pagina=new CargasPage();pagina._viva=true;pagina._ativa='uuid';
const st=globalThis.setTimeout,ct=globalThis.clearTimeout;let delay,callback,cancelados=0;
globalThis.setTimeout=(cb,ms)=>{callback=cb;delay=ms;return 7;};
globalThis.clearTimeout=()=>cancelados++;
try {
 pagina._agendar();assert.equal(delay,5000);assert.equal(pagina._timer,7);
 document.hidden=true;pagina._agendar();assert.equal(pagina._timer,null);assert.equal(cancelados,1);
 document.hidden=false;pagina._ativa=null;pagina._agendar();assert.equal(pagina._timer,null);
 pagina._ativa='uuid';pagina._agendar();pagina.disconnectedCallback();assert.equal(pagina._timer,null);assert.equal(pagina._viva,false);
} finally {globalThis.setTimeout=st;globalThis.clearTimeout=ct;}
console.log('Cargas: polling suspende ao ocultar, terminar e desmontar OK');

// Consulta real da página com API simulada: o detalhe terminal prevalece sobre
// histórico ainda ativo; outra execução continua fornecendo a etapa do cabeçalho.
const originalFetch = globalThis.fetch;
const estado = { cards: null, detalhe: null, historico: null, header: '', disabled: false };
const elementos = {
 'estado-etapas': { setDados(d) { estado.cards = d; } },
 'historico-cargas': { setDados(d) { estado.historico = d; } },
 'detalhe-carga': { setExecucao(d) { estado.detalhe = d; } },
 'rodar-carga': { setExecucaoAtiva(id) { estado.ativa = id; } },
 '[data-andamento]': { set textContent(v) { estado.header = v; } },
 '[data-rodar]': { set disabled(v) { estado.disabled = v; } },
 '[data-mensagem]': {},
};
globalThis.window = { location: { hash: '#/cargas/antiga' } };
let ativaTerminou = false;
let geracao = 1;
let sinal;
globalThis.fetch = async (url, opts) => {
 sinal = opts.signal;
 const data = url === '/cargas/ultimas' ? [{ etapa: 'IPE', geracao }]
  : url.startsWith('/cargas?') ? [{ id: 'nova', status: 'EXECUTANDO' }]
  : url === '/cargas/antiga' ? { id: 'antiga', status: 'SUCESSO', geracao }
  : { id: 'nova', status: ativaTerminou ? 'SUCESSO' : 'EXECUTANDO', tipo: 'ROTINA', etapas: [{ etapa: 'DFP', status: 'EXECUTANDO' }] };
 return { ok: true, text: async () => JSON.stringify(data) };
};
const paginaApi = new CargasPage();
paginaApi._viva = true;
paginaApi._abort = new AbortController();
paginaApi.querySelector = seletor => elementos[seletor];
try {
 await paginaApi._atualizar();
 assert.equal(estado.detalhe.id, 'antiga');
 assert.match(estado.header, /Demonstrações financeiras/);
 assert.equal(estado.ativa, 'nova');
 assert.equal(estado.disabled, true);
 geracao++;
 await paginaApi._atualizar();
 assert.equal(estado.cards[0].geracao, 2);
 assert.equal(estado.detalhe.geracao, 2);
 ativaTerminou = true;
 await paginaApi._atualizar();
 assert.equal(paginaApi._timer, null);
 assert.equal(estado.disabled, false);
 paginaApi.disconnectedCallback();
 assert.equal(sinal.aborted, true);
} finally {
 paginaApi.disconnectedCallback();
 globalThis.fetch = originalFetch;
}
console.log('Cargas: atualização integrada, detalhe independente e fim prevalece sobre histórico OK');
// Ocultar e retornar enquanto a consulta está pendente não duplica pedidos
// nem perde o próximo agendamento quando a execução continua ativa.
let liberar;
const pendente = new Promise(resolve => { liberar = resolve; });
let pedidos = 0;
const paginaVisivel = new CargasPage();
paginaVisivel._viva = true;
paginaVisivel._abort = new AbortController();
paginaVisivel.querySelector = seletor => elementos[seletor];
const fetchAntesVisibilidade = globalThis.fetch;
globalThis.fetch = async url => {
 pedidos++;
 if (url === '/cargas/ultimas') await pendente;
 const data = url === '/cargas/ultimas' ? []
  : url.startsWith('/cargas?') ? [{ id: 'nova', status: 'EXECUTANDO' }]
  : url.endsWith('/antiga') ? { id: 'antiga', status: 'SUCESSO' }
  : { id: 'nova', status: 'EXECUTANDO', tipo: 'ROTINA' };
 return { ok: true, text: async () => JSON.stringify(data) };
};
try {
 const atualizacao = paginaVisivel._atualizar();
 document.hidden = true;
 paginaVisivel._parar();
 document.hidden = false;
 await paginaVisivel._atualizar();
 assert.equal(pedidos, 2);
 liberar();
 await atualizacao;
 assert.ok(paginaVisivel._timer);
} finally {
 paginaVisivel.disconnectedCallback();
 globalThis.fetch = fetchAntesVisibilidade;
}
console.log('Cargas: retorno visível durante consulta pendente mantém uma atualização OK');
