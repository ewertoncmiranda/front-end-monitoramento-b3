import assert from 'node:assert/strict';
import { ETAPAS,statusCarga,cargaAtiva,defasagemEtapa,etapasAtrasadas,formatarDataCarga } from '../public/js/analise/cargas.js';
import { listarCargas,obterCarga,dispararCarga } from '../public/js/api/cargasApi.js';
assert.equal(ETAPAS.length,11);
assert.equal(statusCarga('FALHA').icone,'✖');
assert.equal(statusCarga(null).rotulo,'Sem dado');
assert.equal(formatarDataCarga(null),'—');
assert.equal(cargaAtiva({status:'PENDENTE'}),true);
assert.equal(cargaAtiva('SUCESSO'),false);
assert.equal(defasagemEtapa('DFP',null).dias,null);
assert.equal(defasagemEtapa('DFP','2026-01-01T12:00:00Z',new Date('2026-05-02T12:00:00Z')).atrasada,true);
assert.equal(defasagemEtapa('COTAHIST','2026-10-16T12:00:00Z',new Date('2026-10-19T12:00:00Z')).atrasada,false);
assert.equal(defasagemEtapa('COTAHIST','2026-10-16T12:00:00Z',new Date('2026-10-20T12:00:00Z')).atrasada,true);
assert.equal(etapasAtrasadas([{etapa:'IPE',ultimoSucessoEm:'2026-10-01T12:00:00Z'}],new Date('2026-10-10')).length,1);
const anterior=globalThis.fetch;let chamada;
try {
 globalThis.fetch=async(url,opts)=>{chamada={url,opts};return {ok:true,status:200,text:async()=>'{"id":"abc"}'};};
 await listarCargas({status:'SUCESSO',desde:'2026-10-01'});assert.match(chamada.url,/desde=2026-10-01/);
 await obterCarga('x/y');assert.equal(chamada.url,'/cargas/x%2Fy');
 await dispararCarga({tipo:'ROTINA'});assert.equal(chamada.opts.method,'POST');
 globalThis.fetch=async()=>({ok:false,status:409,text:async()=>'{"execucaoEmAndamento":"abc"}'});
 await assert.rejects(dispararCarga({tipo:'ROTINA'}),e=>e.status===409&&e.data.execucaoEmAndamento==='abc');
} finally {globalThis.fetch=anterior;}
console.log('Cargas: lógica e contrato HTTP OK');
