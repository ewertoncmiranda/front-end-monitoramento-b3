import { paraInstante, formatarDataHora } from '../utils/dataHora.js';
export { escaparHtml } from '../utils/html.js';

export const ETAPAS = [
  ['COTAHIST', 'Preço oficial B3', 'B3'],
  ['LIQUIDEZ', 'Liquidez', 'B3'],
  ['PRONTIDAO', 'Prontidão', 'B3'],
  ['QUALIDADE_OPCOES', 'Qualidade das opções', 'B3'],
  ['CONCILIACAO', 'Conciliação de preços', 'B3 / brapi'],
  ['DFP', 'Demonstrações financeiras', 'CVM'],
  ['TTM', 'Resultados em 12 meses', 'CVM'],
  ['IPE', 'Comunicados', 'CVM'],
  ['DVA', 'Valor adicionado', 'CVM'],
  ['EVENTOS', 'Eventos corporativos', 'CVM'],
  ['CHECAGENS', 'Checagens', 'ETL'],
].map(([codigo, nome, fonte]) => ({ codigo, nome, fonte }));

const STATUS = {
  SUCESSO: ['Sucesso', '✔', 'carga-success'],
  SEM_MUDANCA: ['Sem mudança', '＝', 'secondary'],
  ALERTA: ['Alerta', '▲', 'carga-warning'],
  SUCESSO_COM_ALERTA: ['Sucesso com alerta', '▲', 'carga-warning'],
  SUCESSO_PARCIAL: ['Sucesso parcial', '▲', 'carga-partial'],
  FALHA: ['Falha', '✖', 'carga-danger'],
  EXECUTANDO: ['Em execução', '⟳', 'carga-primary'],
  PENDENTE: ['Pendente', '◷', 'carga-primary'],
  INTERROMPIDA: ['Interrompida', '⏸', 'secondary'],
  PULADA: ['Pulada', '–', 'secondary'],
};

export function statusCarga(status) {
  const [rotulo, icone, classe] = STATUS[status] || ['Sem dado', '—', 'secondary'];
  return { rotulo, icone, classe };
}

export function rotuloEtapa(etapa) {
  return ETAPAS.find(e => e.codigo === etapa)?.nome || etapa || '—';
}

export function cargaAtiva(execucao) {
  const status = typeof execucao === 'string' ? execucao : execucao?.status;
  return ['PENDENTE', 'EXECUTANDO'].includes(status);
}

export const dataCarga = paraInstante;
export function formatarDataCarga(valor) {
  return paraInstante(valor) ? formatarDataHora(valor, '—') : '—';
}

export function defasagemEtapa(etapa, ultimoSucesso, agora = new Date()) {
  const inicio = dataCarga(ultimoSucesso);
  const fim = new Date(agora);
  const diaria = ['COTAHIST', 'LIQUIDEZ'].includes(etapa);
  const limite = diaria ? 1 : ['DFP', 'TTM', 'DVA'].includes(etapa) ? 120 : etapa === 'IPE' ? 2 : null;
  if (!inicio || Number.isNaN(+fim)) return { atrasada: false, dias: null, limite };
  const dias = Math.max(0, Math.floor((fim - inicio) / 86400000));
  let decorrido = dias;
  // O contrato não entrega calendário B3; contamos dias úteis sem feriados.
  if (diaria) {
    decorrido = 0;
    const cursor = new Date(inicio);
    for (let i = 0; i < dias; i++) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      if (![0, 6].includes(cursor.getUTCDay())) decorrido++;
    }
  }
  return { atrasada: limite !== null && decorrido > limite, dias, limite };
}

export function listaCargas(dados) {
  return Array.isArray(dados) ? dados : (dados?.content || dados?.etapas || dados?.itens || []);
}

export function etapasAtrasadas(dados, agora = new Date()) {
  return listaCargas(dados).filter(e => defasagemEtapa(e.etapa, e.ultimoSucessoEm, agora).atrasada);
}
