// Unica responsabilidade: ler a situacao do registro da companhia na CVM
// (cvm_empresa.situacao_registro, V18) e decidir selo e alerta (REQ-ETL-1).
// Modulo puro, sem DOM. Valores reais do FCA: Ativo, Suspenso, Cancelado,
// "Em análise" (e variantes). Cor sempre acompanha texto.
import { escaparHtml } from '../utils/html.js';

const PADRAO = {
  ATIVO: { rotulo: 'CVM: ativo', tom: 'success', alerta: null },
  SUSPENSO: {
    rotulo: 'CVM: suspenso', tom: 'warning', alerta: 'warning',
    mensagem: 'Registro suspenso na CVM: a negociação e a divulgação de resultados podem estar interrompidas.',
  },
  CANCELADO: {
    rotulo: 'CVM: cancelado', tom: 'danger', alerta: 'danger',
    mensagem: 'Registro cancelado na CVM: a empresa pode não divulgar mais balanços nem ter negociação regular.',
  },
  DESCONHECIDO: { rotulo: 'CVM: situação não classificada', tom: 'secondary', alerta: null },
};

function normalizar(texto) {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
}

/** {chave, rotulo, tom, alerta, mensagem?, original} ou null quando a situacao nao e conhecida (sem dado). */
export function statusCvm(situacao) {
  if (situacao === null || situacao === undefined || String(situacao).trim() === '') return null;
  const n = normalizar(situacao);
  const chave = n.startsWith('ATIV') ? 'ATIVO' : n.startsWith('SUSPENS') ? 'SUSPENSO'
    : n.startsWith('CANCELAD') ? 'CANCELADO' : 'DESCONHECIDO';
  return { chave, original: String(situacao).trim(), ...PADRAO[chave] };
}

/** Selo com texto (nunca so cor); sem situacao, nada. */
export function htmlSeloStatusCvm(situacao) {
  const s = statusCvm(situacao);
  if (!s) return '';
  return `<span class="badge text-bg-${s.tom}" data-status-cvm="${s.chave}"
    title="Situação do registro na CVM: ${escaparHtml(s.original)}">${s.rotulo}</span>`;
}

/** Faixa de alerta so para suspenso e cancelado. */
export function htmlAlertaStatusCvm(situacao) {
  const s = statusCvm(situacao);
  if (!s || !s.alerta) return '';
  return `<div class="alert alert-${s.alerta} py-2 small mb-3" role="alert" data-alerta-cvm="${s.chave}">
    <strong>${s.rotulo}.</strong> ${escaparHtml(s.mensagem)}</div>`;
}
