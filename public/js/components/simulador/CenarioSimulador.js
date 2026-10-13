import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { htmlComboboxAtivo, CAPITAIS_SIMULACAO, CAPITAL_BASE, labelCapital, classeValor, ESTRATEGIAS_PADRAO } from './utils.js';

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
  const estrategiaSelecionada = valores.estrategia || '';
  const opcoesEstrategia = ESTRATEGIAS_PADRAO.map((e) =>
    `<option value="${e}"${e === estrategiaSelecionada ? ' selected' : ''}>${escaparHtml(e.replace(/_/g, ' '))}</option>`
  ).join('');
  return `<form id="form-cenario" class="row g-2">
    <div class="col-md-3"><label for="cenario-ativo" class="form-label form-label-sm">Ativo</label>${htmlComboboxAtivo('cenario-ativo', ativos, { value: valores.simbolo || '' })}</div>
    <div class="col-md-2"><label for="cenario-data" class="form-label form-label-sm">Data de entrada</label><input type="date" max="${hojeIso()}" value="${dataEntrada}" class="form-control form-control-sm" id="cenario-data" required></div>
    <div class="col-md-2"><label for="cenario-janela" class="form-label form-label-sm">Janela (1–63)</label><input type="number" min="1" max="63" value="${janela}" class="form-control form-control-sm" id="cenario-janela" required></div>
    <div class="col-md-3"><label for="cenario-estrategia" class="form-label form-label-sm">Estratégia</label>
      <select id="cenario-estrategia" class="form-select form-select-sm">
        <option value="">Todas</option>
        ${opcoesEstrategia}
      </select>
    </div>
    <div class="col-md-2 d-flex align-items-end"><button class="btn btn-primary btn-sm w-100" type="submit">+ Simular</button></div>
  </form>`;
}

export const htmlControlesCenario = htmlFormularioCenario;

function idadeTag(iso) {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso)) / 60_000);
  if (mins < 1) return '<span class="badge text-bg-secondary ms-1" style="font-size:9px">agora</span>';
  if (mins < 60) return `<span class="badge text-bg-secondary ms-1" style="font-size:9px">${mins}min</span>`;
  const h = Math.floor(mins / 60);
  return `<span class="badge text-bg-secondary ms-1" style="font-size:9px">${h}h atrás</span>`;
}

export function htmlCardCenario(card) {
  const { id, simbolo, dataEntrada, janela, estrategia, resultado, dataSimulacao } = card;

  const header = `<div class="d-flex justify-content-between align-items-start mb-2">
    <div class="lh-sm">
      <strong>${escaparHtml(simbolo)}</strong>
      <span class="text-muted small ms-1">${escaparHtml(formatarData(dataEntrada))} · ${escaparHtml(String(janela))} pregões</span>
      ${idadeTag(dataSimulacao)}
    </div>
    <button type="button" class="btn-close" style="font-size:0.6rem;flex-shrink:0" data-remover-card="${id}" aria-label="Remover"></button>
  </div>`;

  if (!estrategia) {
    return `<div class="ficha-cartao h-100">${header}${htmlResultadoCenario(resultado)}</div>`;
  }

  const retornos = resultado?.retornoPorEstrategia || {};
  const reaisBase = resultado?.reaisGanhoPerdaPorEstrategia || {};
  const chave = Object.keys(retornos).find((k) => k.toUpperCase().startsWith(estrategia.toUpperCase())) || estrategia;
  const pct = retornos[chave];
  const pnlBase = reaisBase[chave] ?? (pct != null ? Number(pct) * CAPITAL_BASE : null);
  const cdi = resultado?.cdiPercentual;
  const acima = pct != null && cdi != null ? Number(pct) > Number(cdi) : null;
  const classePct = classeValor(pct);

  const cdiMark = acima == null ? '' : acima
    ? '<span class="badge text-bg-success ms-1">↑ CDI</span>'
    : '<span class="badge text-bg-secondary ms-1">↓ CDI</span>';

  const destaque = `<div class="rounded p-2 mb-2" style="background:var(--bs-primary-bg-subtle,#cfe2ff)">
    <div class="d-flex align-items-center flex-wrap gap-1 mb-1">
      <strong class="text-primary small">${escaparHtml(chave.replace(/_v\d+$/, '').replace(/_/g, ' '))}</strong>
      <span class="fw-bold ${classePct} ms-1">${escaparHtml(formatarPercentual(pct, 2, { sinal: true, vazio: SEM }))}</span>
      ${cdiMark}
    </div>
    <div class="d-flex flex-wrap gap-2">
      ${CAPITAIS_SIMULACAO.map((c) => {
        const pnl = pnlBase != null ? pnlBase * (c / CAPITAL_BASE) : null;
        return `<span class="small ${classeValor(pnl)}">${escaparHtml(labelCapital(c))}: <strong>${pnl != null ? escaparHtml(formatarMoeda(pnl, SEM)) : SEM}</strong></span>`;
      }).join('')}
    </div>
  </div>`;

  const outrasNomes = Object.keys(retornos).filter((k) => k !== chave);
  const outras = outrasNomes.length ? `<details>
    <summary class="small text-muted" style="cursor:pointer;list-style:none">▸ Demais estratégias (${outrasNomes.length})</summary>
    <table class="table table-sm mb-0 mt-1"><tbody>
      ${outrasNomes.map((nome) => {
        const p = retornos[nome];
        return `<tr>
          <td class="small py-1">${escaparHtml(nome.replace(/_v\d+$/, '').replace(/_/g, ' '))}</td>
          <td class="small py-1 text-end ${classeValor(p)}">${escaparHtml(formatarPercentual(p, 2, { sinal: true, vazio: SEM }))}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
  </details>` : '';

  return `<div class="ficha-cartao h-100">${header}${destaque}${outras}</div>`;
}

export function htmlComparacaoCenarios(cards) {
  if (!cards.length) return '';
  return `<div class="row g-3">${cards.map((c) => `<div class="col-md-6">${htmlCardCenario(c)}</div>`).join('')}</div>`;
}

export function htmlResultadoCenario(dado) {
  if (!dado) return '';

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
