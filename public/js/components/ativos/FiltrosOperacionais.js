import { escaparHtml } from '../../utils/html.js';

export const FILTROS_OPERACIONAIS = [
  'statusOperacional', 'liquidez', 'risco', 'eventoRecente', 'operacao',
  'bloqueio', 'scoreNaoCalibrado', 'evidencia',
];

const DEFINICOES = [
  ['statusOperacional', 'Operabilidade', ['NAO_OPERAVEL', 'EM_OBSERVACAO', 'PAPER_TRADING_ELEGIVEL', 'BLOQUEADO']],
  ['liquidez', 'Liquidez', ['ALTA', 'MEDIA', 'INSUFICIENTE']],
  ['risco', 'Risco', ['BAIXO', 'MEDIO', 'ALTO']],
  ['eventoRecente', 'Evento recente', ['SIM', 'NAO']],
  ['operacao', 'Operação', ['ABERTA', 'FECHADA', 'SEM_OPERACAO']],
  ['bloqueio', 'Bloqueio', ['SIM', 'NAO']],
  ['scoreNaoCalibrado', 'Confiança', ['SIM', 'NAO']],
  ['evidencia', 'Evidência', ['SUFICIENTE', 'INSUFICIENTE']],
];

const rotulo = (valor) => String(valor).replaceAll('_', ' ').toLocaleLowerCase('pt-BR').replace(/^./, (c) => c.toUpperCase());

function valoresDe(opcoes, chave, padrao) {
  const valor = opcoes?.[chave];
  if (!Array.isArray(valor)) return padrao;
  return valor.map((v) => (typeof v === 'string' ? { valor: v, rotulo: rotulo(v) } : {
    valor: v.valor ?? v.codigo ?? v.id,
    rotulo: v.rotulo ?? v.descricao ?? rotulo(v.valor ?? v.codigo ?? v.id),
    contagem: v.contagem ?? v.total,
  }));
}
export function filtrosAtivos(estado = {}) {
  return Object.fromEntries(FILTROS_OPERACIONAIS
    .filter((chave) => estado[chave] !== '' && estado[chave] !== null && estado[chave] !== undefined)
    .map((chave) => [chave, estado[chave]]));
}

export function temFiltroOperacional(estado = {}) {
  return Object.keys(filtrosAtivos(estado)).length > 0;
}

export function htmlFiltrosOperacionais(opcoes = {}, estado = {}) {
  return `<details class="mb-3"${temFiltroOperacional(estado) ? ' open' : ''}>
    <summary class="small fw-semibold">Filtros operacionais avançados</summary>
    <div class="row g-2 mt-1">${DEFINICOES.map(([chave, titulo, padrao]) => {
      const itens = valoresDe(opcoes, chave, padrao);
      return `<div class="col-6 col-md-3"><label class="form-label small mb-1" for="opr-f-${chave}">${titulo}</label>
        <select class="form-select form-select-sm" id="opr-f-${chave}" data-filtro-operacional="${chave}">
          <option value="">Todos</option>${itens.map((item) => `<option value="${escaparHtml(item.valor)}"${estado[chave] === item.valor ? ' selected' : ''}>${escaparHtml(item.rotulo)}${item.contagem === undefined ? '' : ` (${escaparHtml(item.contagem)})`}</option>`).join('')}
        </select></div>`;
    }).join('')}</div>
    <button type="button" class="btn btn-link btn-sm px-0 mt-1" data-limpar-filtros-operacionais>Limpar filtros operacionais</button>
  </details>`;
}
