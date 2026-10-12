import { escaparHtml } from '../../utils/html.js';
import { formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { ESTRATEGIAS_PADRAO, htmlComboboxAtivo } from './utils.js';

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
  const linhas = itens.map(({ estrategia, resultado, erro }) => {
    if (erro) {
      return `<tr>
        <td>${escaparHtml(estrategia)}</td>
        <td colspan="4" class="text-muted small">${escaparHtml(erro)}</td>
      </tr>`;
    }
    const entradas = resultado?.entradas || [];
    const taxaAcerto = resultado?.taxaAcerto != null
      ? formatarPercentual(Number(resultado.taxaAcerto) / 100, 1, { vazio: SEM })
      : SEM;
    const retornoMedio = resultado?.retornoMedio != null
      ? formatarPercentual(resultado.retornoMedio, 2, { sinal: true, vazio: SEM })
      : SEM;
    const ganhos = entradas.filter((e) => e.resultado === 'GANHO').length;
    const perdas = entradas.filter((e) => e.resultado === 'PERDA').length;
    const total = entradas.length;
    const barraGanho = total ? Math.round(ganhos / total * 100) : 0;
    return `<tr>
      <td class="fw-500">${escaparHtml(estrategia)}</td>
      <td class="text-end">${escaparHtml(taxaAcerto)}</td>
      <td class="text-end">${escaparHtml(retornoMedio)}</td>
      <td class="text-end">${total || SEM}</td>
      <td style="min-width:80px">
        <div class="progress" style="height:6px;border-radius:3px">
          <div class="progress-bar bg-success" style="width:${barraGanho}%"></div>
        </div>
        <div class="d-flex justify-content-between" style="font-size:10px;color:var(--bs-secondary-color,#666)">
          <span>G ${ganhos}</span><span>P ${perdas}</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<div class="table-responsive mt-3">
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
  </div>`;
}
