import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { ESTRATEGIAS_PADRAO, htmlComboboxAtivo, classeValor } from './utils.js';

const SEM = '—';

// Calcula janela em pregões aproximada a partir de dois ISO dates.
// Usa proporção 252 pregões / 365 dias como estimativa.
export function janelaEntreDatas(inicioIso, fimIso) {
  const dias = Math.max(1, Math.round(
    (new Date(fimIso) - new Date(inicioIso)) / 86_400_000
  ));
  return Math.max(1, Math.round(dias * 252 / 365));
}

export function htmlFormularioRetroativo(ativos = []) {
  const hoje = new Date().toISOString().slice(0, 10);
  const umAnoAtras = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  return `
    <form id="form-retroativo" class="row g-3">
      <div class="col-md-4">
        <label class="form-label" for="retroativo-ativo">Ativo</label>
        ${htmlComboboxAtivo('retroativo-ativo', ativos)}
      </div>
      <div class="col-md-3">
        <label class="form-label" for="retroativo-inicio">Início</label>
        <input id="retroativo-inicio" type="date" class="form-control form-control-sm"
               value="${umAnoAtras}" required>
      </div>
      <div class="col-md-3">
        <label class="form-label" for="retroativo-fim">Fim</label>
        <input id="retroativo-fim" type="date" class="form-control form-control-sm"
               value="${hoje}" required>
      </div>
      <div class="col-md-2 d-flex align-items-end">
        <button type="submit" class="btn btn-primary btn-sm w-100">Analisar</button>
      </div>
    </form>`;
}

export const htmlControlesRetroativo = htmlFormularioRetroativo;

// dado = array de { estrategia, resultado: SimuladorRetroativoDTO, erro }
export function htmlResultadoRetroativo(dado) {
  // compatibilidade com chamada antiga (objeto único) ou vazio
  if (!dado) return '<p class="small text-muted mt-3">Preencha o formulário e clique em Analisar.</p>';
  if (!Array.isArray(dado)) {
    // formato legado: objeto único — exibe como antes
    const entradas = dado.entradas || [];
    if (!entradas.length) return '<p class="small text-muted mt-3">Nenhuma entrada com resultado real foi encontrada no período.</p>';
    return _htmlTabela([{ estrategia: dado.estrategia || '—', resultado: dado, erro: null }]);
  }
  if (!dado.length) return '<p class="small text-muted mt-3">Nenhuma estratégia retornou dados.</p>';
  return _htmlTabela(dado);
}

function _htmlTabela(itens) {
  // 7: identifica melhor taxa de acerto para destacar a linha
  const melhorTaxa = Math.max(...itens
    .filter(({ resultado }) => resultado?.taxaAcerto != null)
    .map(({ resultado }) => Number(resultado.taxaAcerto)));

  const linhas = itens.map(({ estrategia, resultado, erro }) => {
    if (erro) {
      return `<tr>
        <td>${escaparHtml(estrategia)}</td>
        <td colspan="4" class="text-muted small">${escaparHtml(erro)}</td>
      </tr>`;
    }
    const entradas = resultado?.entradas || [];
    const simbolo = resultado?.simbolo || '';
    const taxaAcerto = resultado?.taxaAcerto != null
      ? formatarPercentual(Number(resultado.taxaAcerto) / 100, 1, { vazio: SEM })
      : SEM;
    const retornoMedio = resultado?.retornoMedio != null
      ? formatarPercentual(Number(resultado.retornoMedio) / 100, 2, { sinal: true, vazio: SEM })
      : SEM;
    const ganhos = entradas.filter((e) => e.resultado === 'GANHO').length;
    const perdas = entradas.filter((e) => e.resultado === 'PERDA').length;
    const total = entradas.length;
    // 8: neutros na barra G/N/P
    const neutros = resultado?.neutros ?? (total - ganhos - perdas);
    const barraGanho = total ? Math.round(ganhos / total * 100) : 0;
    const barraNeutro = total ? Math.round(neutros / total * 100) : 0;
    const barraPerdas = total ? Math.round(perdas / total * 100) : 0;

    // 7: destaque verde na melhor estratégia
    const isMelhor = resultado?.taxaAcerto != null && Number(resultado.taxaAcerto) === melhorTaxa && melhorTaxa > 0;
    const melhorBadge = isMelhor ? ' <span class="badge text-bg-success ms-1" style="font-size:9px">↑ melhor</span>' : '';

    const summaryRow = `<tr class="${isMelhor ? 'table-success' : ''}">
      <td class="fw-500">${escaparHtml(estrategia)}${melhorBadge}</td>
      <td class="text-end">${escaparHtml(taxaAcerto)}</td>
      <td class="text-end">${escaparHtml(retornoMedio)}</td>
      <td class="text-end">${total || SEM}</td>
      <td style="min-width:80px">
        <div class="progress" style="height:6px;border-radius:3px">
          <div class="progress-bar bg-success" style="width:${barraGanho}%"></div>
          <div class="progress-bar bg-secondary opacity-50" style="width:${barraNeutro}%"></div>
          <div class="progress-bar bg-danger" style="width:${barraPerdas}%"></div>
        </div>
        <div class="d-flex justify-content-between" style="font-size:10px;color:var(--bs-secondary-color,#666)">
          <span>G ${ganhos}</span><span class="text-muted">N ${neutros}</span><span>P ${perdas}</span>
        </div>
      </td>
    </tr>`;

    if (!entradas.length) return summaryRow;

    const linhasEntrada = entradas.map((e) => {
      const cor = e.resultado === 'GANHO' ? 'text-success' : e.resultado === 'PERDA' ? 'text-danger' : 'text-muted';
      const retPct = e.resultadoPercentual != null
        ? formatarPercentual(Number(e.resultadoPercentual) / 100, 2, { sinal: true, vazio: SEM })
        : SEM;
      const btnId = `hist-retro-${escaparHtml(simbolo)}-${escaparHtml(String(e.dataPregao))}`;
      return `<tr>
          <td class="small text-nowrap">${escaparHtml(formatarData(e.dataPregao))} → ${escaparHtml(formatarData(e.dataJanela))}</td>
          <td class="small">${escaparHtml(formatarMoeda(e.precoEntrada, SEM))} → ${escaparHtml(formatarMoeda(e.precoSaida, SEM))}</td>
          <td class="small ${cor}">${escaparHtml(retPct)}</td>
          <td class="small text-center">${e.quintil ?? SEM}</td>
          <td><button class="btn btn-xs btn-outline-info py-0 px-1 small"
            data-historico-periodo="1"
            data-simbolo="${escaparHtml(simbolo)}"
            data-inicio="${escaparHtml(String(e.dataPregao))}"
            data-fim="${escaparHtml(String(e.dataJanela))}">P&amp;L</button>
          </td>
        </tr>
        <tr id="${btnId}" style="display:none"><td colspan="5" class="p-0 ps-3"></td></tr>`;
    }).join('');

    const expandRow = `<tr class="border-0">
      <td colspan="5" class="p-0 pb-1">
        <details>
          <summary class="small text-muted px-2 py-1" style="cursor:pointer;list-style:none">
            ▸ Ver ${entradas.length} entrada(s) com P&amp;L
          </summary>
          <div class="table-responsive">
            <table class="table table-sm mb-0">
              <thead><tr>
                <th class="small fw-normal text-muted">Período</th>
                <th class="small fw-normal text-muted">Preço</th>
                <th class="small fw-normal text-muted">Resultado</th>
                <th class="small fw-normal text-muted text-center">Quintil</th>
                <th></th>
              </tr></thead>
              <tbody>${linhasEntrada}</tbody>
            </table>
          </div>
        </details>
      </td>
    </tr>`;

    return summaryRow + expandRow;
  }).join('');

  // 4: frase-resumo automática: melhor e pior estratégia
  const comTaxa = itens.filter(({ resultado }) => resultado?.taxaAcerto != null);
  const ordenados = [...comTaxa].sort((a, b) => Number(b.resultado.taxaAcerto) - Number(a.resultado.taxaAcerto));
  const melhorItem = ordenados[0];
  const piorItem = ordenados.at(-1);
  const fraseResumo = melhorItem && melhorItem !== piorItem
    ? `<div class="d-flex flex-wrap gap-3 small px-3 py-2 rounded mb-3" style="background:var(--bs-secondary-bg,#f8f9fa)">
        <span class="text-success">↑ <strong>${escaparHtml(melhorItem.estrategia)}</strong>: melhor acerto (${escaparHtml(formatarPercentual(Number(melhorItem.resultado.taxaAcerto) / 100, 1, { vazio: '—' }))})</span>
        <span class="text-danger">↓ <strong>${escaparHtml(piorItem.estrategia)}</strong>: pior acerto (${escaparHtml(formatarPercentual(Number(piorItem.resultado.taxaAcerto) / 100, 1, { vazio: '—' }))})</span>
       </div>`
    : '';

  // 9: histograma horizontal de taxa de acerto
  const histograma = comTaxa.length
    ? `<div class="mt-3 pt-2 border-top">
        <p class="small fw-semibold mb-2">Taxa de acerto por estratégia (ranking)</p>
        ${ordenados.map(({ estrategia, resultado }) => {
          const pct = Number(resultado.taxaAcerto);
          const cor = pct >= 60 ? 'success' : pct >= 45 ? 'warning' : 'danger';
          return `<div class="d-flex align-items-center gap-2 mb-1">
            <span class="small text-muted" style="min-width:130px;white-space:nowrap">${escaparHtml(estrategia)}</span>
            <div class="flex-grow-1 progress" style="height:10px;border-radius:5px">
              <div class="progress-bar bg-${cor}" style="width:${pct.toFixed(1)}%" role="progressbar"></div>
            </div>
            <span class="small fw-semibold" style="min-width:36px;text-align:right">${pct.toFixed(0)}%</span>
          </div>`;
        }).join('')}
      </div>`
    : '';

  return `${fraseResumo}<div class="table-responsive mt-3">
    <table class="table table-sm table-hover">
      <thead>
        <tr>
          <th>Estratégia</th>
          <th class="text-end">Taxa acerto</th>
          <th class="text-end">Retorno médio</th>
          <th class="text-end">Entradas</th>
          <th>G / P</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  </div>${histograma}`;
}
