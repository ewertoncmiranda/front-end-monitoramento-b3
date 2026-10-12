import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { htmlComboboxAtivo, CAPITAIS_SIMULACAO, CAPITAL_BASE, labelCapital, classeValor } from './utils.js';

const SEM = 'sem dado';
export const hojeIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
export const dataFutura = (data, hoje = hojeIso()) => Boolean(data && data > hoje);

export function validarCenario({ simbolo, dataEntrada, janela }, hoje = hojeIso()) {
  if (!simbolo) return 'Selecione um ativo monitorado.';
  if (!dataEntrada) return 'Informe uma data de entrada com cotação real.';
  if (dataFutura(dataEntrada, hoje)) return 'Data futura bloqueada: use apenas pregões com cotação real.';
  const j = Number(janela);
  if (!Number.isFinite(j) || j < 1 || j > 63) return 'Janela deve ficar entre 1 e 63 pregões.';
  return null;
}

export function htmlFormularioCenario(ativos = [], valores = {}) {
  const dataEntrada = escaparHtml(valores.dataEntrada || '');
  const janela = escaparHtml(valores.janela || 21);
  return `<form id="form-cenario" class="row g-3">
    <div class="col-md-4"><label for="cenario-ativo" class="form-label">Ativo</label>${htmlComboboxAtivo('cenario-ativo', ativos, { value: valores.simbolo || '' })}</div>
    <div class="col-md-3"><label for="cenario-data" class="form-label">Data de entrada</label><input type="date" max="${hojeIso()}" value="${dataEntrada}" class="form-control form-control-sm" id="cenario-data" required></div>
    <div class="col-md-3"><label for="cenario-janela" class="form-label">Janela (1–63)</label><input type="number" min="1" max="63" value="${janela}" class="form-control form-control-sm" id="cenario-janela" required></div>
    <div class="col-md-2"><label class="form-label">&nbsp;</label><button class="btn btn-primary btn-sm w-100" type="submit">Simular</button></div>
  </form>`;
}

export const htmlControlesCenario = htmlFormularioCenario;

export function htmlResultadoCenario(dado) {
  if (!dado) return '';

  // Normaliza para o formato retornoPorEstrategia / reaisGanhoPerdaPorEstrategia
  let retornos = dado.retornoPorEstrategia || {};
  let reaisBase = dado.reaisGanhoPerdaPorEstrategia || {};

  if (Array.isArray(dado.resultados)) {
    retornos = Object.fromEntries(dado.resultados.map((r) => [r.estrategia, r.retorno]));
    reaisBase = Object.fromEntries(dado.resultados.map((r) => [r.estrategia, r.ganhoPerdido]));
  }

  const nomes = Object.keys(retornos);
  if (!nomes.length) return '<p class="small text-muted mt-3">Não há cotações suficientes para esse cenário.</p>';

  const cdi = dado.cdiPercentual;
  const periodo = (dado.dataEntrada || dado.dataSaida)
    ? `De ${escaparHtml(formatarData(dado.dataEntrada))} a ${escaparHtml(formatarData(dado.dataSaida))}.`
    : '';
  const cdiTexto = cdi != null
    ? ` CDI no período: <strong>${escaparHtml(formatarPercentual(cdi, 2, { sinal: true, vazio: SEM }))}</strong>.`
    : '';

  const cabTh = CAPITAIS_SIMULACAO.map((c) =>
    `<th class="text-end small">${escaparHtml(labelCapital(c))}</th>`
  ).join('');

  const linhas = nomes.map((nome) => {
    const pct = retornos[nome];
    const pnlBase = reaisBase[nome] ?? (pct != null ? Number(pct) * CAPITAL_BASE : null);
    const acima = pct != null && cdi != null ? Number(pct) > Number(cdi) : null;
    const classePct = classeValor(pct);

    const tdCapitais = CAPITAIS_SIMULACAO.map((c) => {
      const pnl = pnlBase != null ? pnlBase * (c / CAPITAL_BASE) : null;
      const cls = classeValor(pnl);
      return `<td class="text-end small ${cls}">${pnl != null ? escaparHtml(formatarMoeda(pnl, SEM)) : SEM}</td>`;
    }).join('');

    const cdiMark = acima == null ? '' : acima
      ? '<span class="badge text-bg-success ms-1" style="font-size:9px">↑ CDI</span>'
      : '<span class="badge text-bg-secondary ms-1" style="font-size:9px">↓ CDI</span>';

    return `<tr>
      <td class="small">${escaparHtml(nome)}${cdiMark}</td>
      <td class="text-end small ${classePct}">${escaparHtml(formatarPercentual(pct, 2, { sinal: true, vazio: SEM }))}</td>
      ${tdCapitais}
    </tr>`;
  }).join('');

  return `<section class="mt-3">
    <p class="small text-muted mb-2">${periodo}${cdiTexto}
      Melhor: <strong>${escaparHtml(dado.melhorEstrategia || SEM)}</strong> · Pior: <strong>${escaparHtml(dado.piorEstrategia || SEM)}</strong>.
    </p>
    <div class="table-responsive">
      <table class="table table-sm table-hover mb-0">
        <thead>
          <tr>
            <th class="small">Estratégia</th>
            <th class="text-end small">Retorno %</th>
            ${cabTh}
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
    <p class="text-muted small mt-1 mb-0">P&amp;L calculado proporcionalmente a partir do retorno percentual real (R$${CAPITAL_BASE.toLocaleString('pt-BR')} como base).</p>
  </section>`;
}
