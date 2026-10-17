// Unica responsabilidade: carteira simulada (OPR-PAI-3): operacoes abertas/pendentes e fechadas, com
// tamanho, custos, resultado bruto/pos-custos/pos-IR e motivos de entrada e saida. Puro: strings.
// Todo texto da API entra escapado; valor ausente aparece como "sem dado", nunca 0.
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { formatarMoeda, formatarNumero } from '../../utils/numero.js';
import { MOTIVO_SAIDA, separarCarteira } from '../../analise/operabilidade.js';
import { htmlAjuda } from '../../utils/ajuda.js';

const SEM = 'sem dado';
const moeda = (v) => escaparHtml(formatarMoeda(v, SEM));
const dataTxt = (v) => escaparHtml(formatarData(v, SEM));

function classeResultado(v) {
  const n = Number(v);
  if (v === null || v === undefined || Number.isNaN(n)) return '';
  return n > 0 ? 'text-success' : n < 0 ? 'text-danger' : '';
}

function motivoEntrada(op) {
  const m = op.motivoEntrada || {};
  const sinal = m.sinal ? `${m.sinal.opiniao || ''} em ${m.sinal.horizonte_pregoes || op.horizontePregoes} pregões` : '';
  const faixa = op.faixaLiquidezEntrada ? `liquidez ${op.faixaLiquidezEntrada}` : '';
  return escaparHtml([sinal, faixa].filter(Boolean).join(' · ') || SEM);
}

function motivoSaida(op) {
  if (!op.motivoSaida) return SEM;
  const gatilhos = Object.values(op.motivoSaidaDetalhe?.gatilhos || {}).flat().map((g) => g.detalhe).filter(Boolean);
  const titulo = gatilhos.length ? ` title="${escaparHtml(gatilhos.join('; '))}"` : '';
  return `<span${titulo}>${escaparHtml(MOTIVO_SAIDA[op.motivoSaida] || op.motivoSaida)}</span>`;
}

export function htmlAbertas(abertas) {
  if (!abertas.length) return '<p class="small text-muted mb-0">Nenhuma posição simulada aberta.</p>';
  const linhas = abertas.map((op) => `<tr>
    <td><a href="#/gestao/${encodeURIComponent(op.simbolo)}">${escaparHtml(op.simbolo)}</a>${op.status === 'PENDENTE' ? ' <span class="badge text-bg-light border">entra na próxima abertura</span>' : ''}</td>
    <td>${escaparHtml(String(op.horizontePregoes ?? SEM))}</td>
    <td>${dataTxt(op.dataEntrada || op.dataDecisaoEntrada)}</td>
    <td class="text-end">${moeda(op.precoEntrada)}</td>
    <td class="text-end">${escaparHtml(formatarNumero(op.quantidade, 0, SEM))}</td>
    <td class="text-end">${moeda(op.valorEntrada)}</td>
    <td class="text-end">${moeda(op.stopAtual ?? op.stopInicial)}</td>
    <td class="text-end">${moeda(op.custosEntrada)}</td>
    <td class="small">${motivoEntrada(op)}</td>
  </tr>`).join('');
  return `<div class="table-responsive"><table class="table table-sm align-middle mb-0">
    <caption class="visually-hidden">Operações simuladas abertas</caption>
    <thead><tr><th scope="col">Ativo</th><th scope="col">Horizonte</th><th scope="col">Entrada</th>
      <th scope="col" class="text-end">Preço</th><th scope="col" class="text-end">Qtd.</th><th scope="col" class="text-end">Valor</th>
      <th scope="col" class="text-end">Stop</th><th scope="col" class="text-end">Custos</th><th scope="col">Por que entrou</th></tr></thead>
    <tbody>${linhas}</tbody></table></div>`;
}

export function htmlFechadas(fechadas) {
  if (!fechadas.length) return '<p class="small text-muted mb-0">Nenhuma operação simulada encerrada ainda.</p>';
  const linhas = fechadas.map((op) => {
    const custos = (op.custosEntrada === null || op.custosEntrada === undefined) && (op.custosSaida === null || op.custosSaida === undefined)
      ? null : Number(op.custosEntrada || 0) + Number(op.custosSaida || 0);
    return `<tr>
      <td><a href="#/gestao/${encodeURIComponent(op.simbolo)}">${escaparHtml(op.simbolo)}</a></td>
      <td>${dataTxt(op.dataEntrada)} → ${dataTxt(op.dataSaida)}</td>
      <td class="text-end">${moeda(op.precoEntrada)} → ${moeda(op.precoSaida)}</td>
      <td class="text-end ${classeResultado(op.resultadoBruto)}">${moeda(op.resultadoBruto)}</td>
      <td class="text-end">${moeda(custos)}</td>
      <td class="text-end ${classeResultado(op.resultadoPosCustos)}">${moeda(op.resultadoPosCustos)}</td>
      <td class="text-end">${moeda(op.impostoEstimado)}</td>
      <td class="text-end fw-semibold ${classeResultado(op.resultadoPosImpostoEstimado)}">${moeda(op.resultadoPosImpostoEstimado)}</td>
      <td class="small">${motivoSaida(op)}</td>
    </tr>`;
  }).join('');
  return `<div class="table-responsive"><table class="table table-sm align-middle mb-0">
    <caption class="visually-hidden">Operações simuladas encerradas</caption>
    <thead><tr><th scope="col">Ativo</th><th scope="col">Período</th><th scope="col" class="text-end">Entrada → saída</th>
      <th scope="col" class="text-end">Bruto</th><th scope="col" class="text-end">Custos</th><th scope="col" class="text-end">Pós-custos</th>
      <th scope="col" class="text-end">IR est.</th><th scope="col" class="text-end">Líquido</th><th scope="col">Motivo de saída</th></tr></thead>
    <tbody>${linhas}</tbody></table></div>`;
}

export function htmlCarteira(itens) {
  const { abertas, fechadas } = separarCarteira(itens);
  return `<section class="ficha-cartao mb-3">
      <div class="d-flex justify-content-between align-items-center"><p class="ficha-rotulo mb-2">Posições abertas (${abertas.length})</p>${htmlAjuda('operabilidade-carteira', 'Carteira simulada', 'Posições abertas pela regra de entrada vigente. Sem execução real.')}</div>${htmlAbertas(abertas)}
    </section>
    <section class="ficha-cartao mb-3">
      <p class="ficha-rotulo">Operações encerradas (${fechadas.length})</p>${htmlFechadas(fechadas)}
    </section>`;
}
