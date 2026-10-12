import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { htmlComboboxAtivo } from './utils.js';

const SEM = 'sem dado';
export const hojeIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
export const dataFutura = (data, hoje = hojeIso()) => Boolean(data && data > hoje);

export function validarCenario({ simbolo, dataEntrada, janela, capital }, hoje = hojeIso()) {
  if (!simbolo) return 'Selecione um ativo monitorado.';
  if (!dataEntrada) return 'Informe uma data de entrada com cotação real.';
  if (dataFutura(dataEntrada, hoje)) return 'Data futura bloqueada: use apenas pregões com cotação real.';
  const j = Number(janela);
  if (!Number.isFinite(j) || j < 1 || j > 63) return 'Janela deve ficar entre 1 e 63 pregões.';
  if (!Number.isFinite(Number(capital)) || Number(capital) <= 0) return 'Capital deve ser maior que zero.';
  return null;
}

export function htmlFormularioCenario(ativos = []) {
  return `<form id="form-cenario" class="row g-3">
    <div class="col-md-3"><label for="cenario-ativo" class="form-label">Ativo</label>${htmlComboboxAtivo('cenario-ativo', ativos)}</div>
    <div class="col-md-3"><label for="cenario-data" class="form-label">Data de entrada</label><input type="date" max="${hojeIso()}" class="form-control form-control-sm" id="cenario-data" required></div>
    <div class="col-md-2"><label for="cenario-janela" class="form-label">Janela (1–63)</label><input type="number" min="1" max="63" value="21" class="form-control form-control-sm" id="cenario-janela" required></div>
    <div class="col-md-2"><label for="cenario-capital" class="form-label">Capital (R$)</label><input type="number" min="1" step="100" value="10000" class="form-control form-control-sm" id="cenario-capital" required></div>
    <div class="col-md-2"><label class="form-label">&nbsp;</label><button class="btn btn-primary btn-sm w-100" type="submit">Simular</button></div>
  </form>`;
}

export const htmlControlesCenario = htmlFormularioCenario;

export function htmlResultadoCenario(dado) {
  if (!dado) return '';
  if (Array.isArray(dado.resultados)) {
    return `<section class="mt-3"><div class="row g-2">${dado.resultados.map((r) => `<div class="col-md-4"><div class="ficha-cartao h-100"><strong>${escaparHtml(r.estrategia || SEM)}</strong><div>${escaparHtml(formatarMoeda(r.ganhoPerdido, 'sem dado'))}</div><div>${escaparHtml(formatarPercentual(r.retorno, 2, { sinal: true, vazio: 'sem dado' }))}</div><small class="text-muted">posição vs CDI ainda sem dado</small></div></div>`).join('')}</div></section>`;
  }
  const retornos = dado.retornoPorEstrategia || {};
  const reais = dado.reaisGanhoPerdaPorEstrategia || {};
  const nomes = Object.keys(retornos);
  if (!nomes.length) return '<p class="small text-muted mt-3">Não há cotações suficientes para esse cenário.</p>';
  const cdi = dado.cdiPercentual;
  const cards = nomes.map((nome) => {
    const r = retornos[nome]; const acima = r != null && cdi != null ? Number(r) > Number(cdi) : null;
    return `<div class="col-md-4"><div class="ficha-cartao h-100"><strong>${escaparHtml(nome)}</strong><div>${escaparHtml(formatarMoeda(reais[nome], SEM))}</div><div>${escaparHtml(formatarPercentual(r, 2, { sinal: true, vazio: SEM }))}</div><small class="text-muted">${acima == null ? 'posição vs CDI indisponível' : acima ? 'acima do CDI' : 'abaixo do CDI'}</small></div></div>`;
  }).join('');
  const pontos = nomes.map((n, i) => { const v = retornos[n]; return v == null ? '' : `<circle cx="${30 + i * (540 / Math.max(1, nomes.length - 1))}" cy="${70 - Math.max(-.05, Math.min(.05, Number(v))) * 600}" r="4"><title>${escaparHtml(n)}</title></circle>`; }).join('');
  const yCdi = cdi == null ? null : 70 - Math.max(-.05, Math.min(.05, Number(cdi))) * 600;
  return `<section class="mt-3"><p class="small text-muted">De ${escaparHtml(formatarData(dado.dataEntrada))} a ${escaparHtml(formatarData(dado.dataSaida))}. CDI: ${escaparHtml(formatarPercentual(cdi, 2, { sinal: true, vazio: SEM }))}.</p><div class="row g-2">${cards}</div>
    <svg class="simulador-grafico mt-3" viewBox="0 0 600 110" role="img" aria-label="Retornos das estratégias comparados ao CDI"><line x1="20" y1="70" x2="580" y2="70" class="eixo"/>${yCdi == null ? '' : `<line x1="20" y1="${yCdi}" x2="580" y2="${yCdi}" class="cdi"/><text x="22" y="${yCdi - 4}">CDI</text>`}<g class="estrategias">${pontos}</g></svg>
    <p class="small mb-0">Melhor resultado: <strong>${escaparHtml(dado.melhorEstrategia || SEM)}</strong>; pior resultado: <strong>${escaparHtml(dado.piorEstrategia || SEM)}</strong>.</p></section>`;
}
