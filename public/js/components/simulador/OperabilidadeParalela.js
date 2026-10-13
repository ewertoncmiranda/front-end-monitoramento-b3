import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { obterOperabilidade } from '../../analise/operabilidadeStore.js';

const SEM = 'sem dado';

function pct(v, sinal = false) {
  return escaparHtml(formatarPercentual(v, 2, { sinal, vazio: SEM }));
}
function rs(v) {
  return escaparHtml(formatarMoeda(v, SEM));
}
function classeNum(v) {
  if (v == null || v === '') return '';
  return Number(v) >= 0 ? 'text-success' : 'text-danger';
}

export function htmlOperabilidadeParalela(dados = obterOperabilidade()) {
  const r = dados?.resumo || dados;
  if (!r || r.indisponivel) {
    return '<aside class="ficha-cartao"><p class="ficha-rotulo">Paper trading real</p><p class="small text-muted mb-0">Abra a tela Operabilidade para carregar a comparação, sem repetir chamadas à API.</p></aside>';
  }

  const periodo = (r.dataInicio || r.ultimoPregao)
    ? `<dt>Período</dt><dd>${escaparHtml(formatarData(r.dataInicio) || SEM)} → ${escaparHtml(formatarData(r.ultimoPregao) || SEM)}</dd>`
    : '';

  return `<aside class="ficha-cartao">
    <p class="ficha-rotulo">Paper trading real</p>
    <strong>${escaparHtml(r.statusSistema || SEM)}</strong>
    <dl class="small mb-2 mt-1">
      <dt>Retorno líquido</dt><dd class="${classeNum(r.retornoLiquidoAcumulado)}">${pct(r.retornoLiquidoAcumulado, true)}</dd>
      <dt>CDI líquido</dt><dd>${pct(r.cdiLiquidoIrAcumulado, true)}</dd>
      <dt>Excesso s/ CDI</dt><dd class="${classeNum(r.excessoSobreCdiLiquido)}">${pct(r.excessoSobreCdiLiquido, true)}</dd>
      <dt>Drawdown máx.</dt><dd class="text-danger">${pct(r.drawdownMaximo)}</dd>
    </dl>
    <hr class="my-1">
    <dl class="small mb-0">
      <dt>Capital inicial</dt><dd>${rs(r.capitalInicial)}</dd>
      <dt>Patrimônio</dt><dd>${rs(r.patrimonio)}</dd>
      <dt>Exposição</dt><dd>${pct(r.exposicao)}</dd>
      <dt>Posições abertas</dt><dd>${r.posicoesAbertas ?? SEM}</dd>
      ${periodo}
      <dt>Pregões avaliados</dt><dd>${r.pregoesAvaliados ?? SEM}</dd>
    </dl>
  </aside>`;
}
