import { escaparHtml } from '../../utils/html.js';
import { formatarPercentual } from '../../utils/numero.js';

const FONTES = [
  ['principal', 'Regra principal'],
  ['momentum', 'Técnico · momentum'],
  ['reversao', 'Técnico · reversão'],
  ['ia', 'IA'],
  ['ranking', 'V2 / ranking sombra'],
  ['operacionalidade', 'Operabilidade'],
];

function normalizar(dados = {}) {
  dados = dados.consenso || dados;
  if (Array.isArray(dados.sinais)) {
    const rotulos = {
      REGRA_PRINCIPAL: 'Regra principal', TECNICO_MOMENTUM: 'Técnico · momentum',
      TECNICO_REVERSAO: 'Técnico · reversão', REGRA_V2_SOMBRA: 'V2 / ranking sombra', OPINIAO_IA: 'IA',
    };
    return dados.sinais.map((s) => ({ ...s, rotulo: rotulos[s.fonte] || s.fonte, sinal: s.valor,
      explicacao: s.detalhe }));
  }
  if (Array.isArray(dados.itens)) return dados.itens;
  return FONTES.map(([chave, rotulo]) => ({ fonte: chave, rotulo, ...(dados[chave] || {}) }));
}
function confianca(item) {
  if (item.confianca === null || item.confianca === undefined) return 'sem dado';
  if (item.confiancaCalibrada === false || item.calibrada === false) return 'não calibrada';
  return formatarPercentual(item.confianca, 0, { vazio: 'sem dado' });
}

export function htmlConsenso(dados) {
  if (!dados || dados.indisponivel) {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Consenso de sinais</p><p class="small text-muted mb-0">Consenso ainda indisponível.</p></section>';
  }
  const bloco = dados.consenso || dados;
  const itens = normalizar(dados);
  const cards = itens.map((item) => {
    const sinal = item.sinal ?? item.valor ?? item.status ?? null;
    return `<div class="col-sm-6 col-lg-4"><div class="border rounded p-2 h-100">
      <span class="small text-muted">${escaparHtml(item.rotulo || item.nome || item.fonte || 'Sinal')}</span>
      <strong class="d-block">${escaparHtml(sinal ?? 'sem dado')}</strong>
      <span class="small text-muted">Confiança: ${escaparHtml(confianca(item))}</span>
      ${item.explicacao || item.descricao ? `<p class="small mb-0 mt-1">${escaparHtml(item.explicacao || item.descricao)}</p>` : ''}
    </div></div>`;
  }).join('');
  const divergencias = (bloco.divergencias || []).map((d) => `<li>${escaparHtml(d.descricao || d.codigo || d)}</li>`).join('');
  return `<section class="ficha-cartao">
    <p class="ficha-rotulo">Consenso de sinais</p>
    ${bloco.resumo ? `<p>${escaparHtml(bloco.resumo)}</p>` : ''}
    ${bloco.direcaoAnalitica ? `<p class="small mb-1">Direção analítica: <strong>${escaparHtml(bloco.direcaoAnalitica)}</strong> · Operabilidade: <strong>${escaparHtml(bloco.operabilidade || 'sem dado')}</strong></p>` : ''}
    <p class="small text-muted">Sinal analítico e operabilidade são leituras separadas.</p>
    <div class="row g-2">${cards}</div>
    ${divergencias ? `<div class="alert alert-warning small py-2 mt-2 mb-0"><strong>Divergências:</strong><ul class="mb-0">${divergencias}</ul></div>` : ''}
  </section>`;
}
