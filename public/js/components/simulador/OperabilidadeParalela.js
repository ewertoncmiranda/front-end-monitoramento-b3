import { escaparHtml } from '../../utils/html.js';
import { formatarPercentual } from '../../utils/numero.js';
import { obterOperabilidade } from '../../analise/operabilidadeStore.js';

export function htmlOperabilidadeParalela(dados = obterOperabilidade()) {
  const r = dados?.resumo || dados;
  if (!r || r.indisponivel) return '<aside class="ficha-cartao"><p class="ficha-rotulo">Paper trading real</p><p class="small text-muted mb-0">Abra a tela Operabilidade para carregar a comparação, sem repetir chamadas à API.</p></aside>';
  return `<aside class="ficha-cartao"><p class="ficha-rotulo">Paper trading real</p><strong>${escaparHtml(r.statusSistema || 'sem dado')}</strong><dl class="small mb-0"><dt>Retorno líquido</dt><dd>${escaparHtml(formatarPercentual(r.retornoLiquidoAcumulado, 2, { sinal: true, vazio: 'sem dado' }))}</dd><dt>CDI líquido</dt><dd>${escaparHtml(formatarPercentual(r.cdiLiquidoIrAcumulado, 2, { sinal: true, vazio: 'sem dado' }))}</dd><dt>Pregões avaliados</dt><dd>${r.pregoesAvaliados ?? 'sem dado'}</dd></dl></aside>`;
}
