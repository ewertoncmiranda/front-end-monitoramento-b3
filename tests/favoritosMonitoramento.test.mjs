// TASK-05: pausar/desativar monitoramento pela interface usa o contrato /favoritos.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.HTMLElement = class {
  addEventListener() {}
  querySelectorAll() { return []; }
};
globalThis.customElements = { define() {} };

const { AtivosMonitoradosTable } = await import('../public/js/components/AtivosMonitoradosTable.js');

const tabela = new AtivosMonitoradosTable();
tabela.connectedCallback();
tabela.mostrarRemover(true);
tabela.setAtivos([{ simbolo: 'PETR4', ativo: true, tipoColeta: 'COTACAO_E_HISTORICO', intervaloSegundos: 900 }]);

assert.match(tabela.innerHTML, /Pausar/);
assert.match(tabela.innerHTML, /data-remover="PETR4"/);
assert.match(tabela.innerHTML, /Pausar monitoramento intradiário de PETR4/);

const api = readFileSync(new URL('../public/js/api/favoritosApi.js', import.meta.url), 'utf8');
assert.match(api, /httpDelete\(`\/favoritos\/\$\{encodeURIComponent\(simbolo\)\}`\)/);

console.log('favoritosMonitoramento.test.mjs ok');
