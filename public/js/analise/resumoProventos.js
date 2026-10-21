import { escaparHtml as h } from '../utils/html.js';

const numero = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const reais = (v) => numero(v) ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 6 }) : 'Indisponível';
const pct = (v) => numero(v) ? `${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : 'Indisponível';
const data = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v.split('-').reverse().join('/') : 'Não informada';
const quantidade = (v) => numero(v) ? String(v) : 'Indisponível';
const tipos = { JCP: 'JCP', DIVIDENDO: 'Dividendo', RENDIMENTO: 'Rendimento', BONIFICACAO: 'Bonificação', GRUPAMENTO: 'Grupamento', DESDOBRAMENTO: 'Desdobramento', SUBSCRICAO: 'Subscrição', OUTRO: 'Outro evento' };

export function eventosDaVela(eventos, candle) {
  if (!candle?.dataIso) return [];
  return (eventos || []).filter((e) => e.dataEx >= candle.dataIso && e.dataEx <= (candle.dataFim || candle.dataIso));
}

export function htmlEventoDaVela(eventos, candle) {
  const itens = eventosDaVela(eventos, candle);
  if (!itens.length) return '';
  return itens.map((e) => `${h(data(e.dataEx))}: ${h(tipos[e.tipo] || e.tipo || 'Evento')} · ${h(reais(e.valorPorAcao))} por ação · ajuste observado ${h(pct(e.ajustePercentual))}`).join('<br>');
}

/** Faixa independente do preço, com eventos consolidados e acesso por teclado. */
export function htmlFaixaEventos(eventos) {
  if (!eventos?.length) return '<p class="small text-muted mb-0">Nenhum evento identificado no período.</p>';
  return `<div class="d-flex flex-wrap gap-2" aria-label="Eventos no eixo das datas">${eventos.map((e) => `<button type="button" class="btn btn-sm btn-outline-secondary" data-evento-ex="${h(e.dataEx)}" title="${h(tipos[e.tipo] || e.tipo || 'Evento')}"><span class="text-warning" aria-hidden="true">●</span> ${h(data(e.dataEx))}</button>`).join('')}</div>`;
}

function card(titulo, valor, detalhe, explicacao) {
  return `<div class="col-12 col-md-6"><article class="card h-100"><div class="card-body"><h6 class="text-muted">${titulo}</h6><p class="fs-5 fw-semibold mb-1">${valor}</p><p class="small mb-2">${detalhe}</p><p class="small text-muted mb-0">${explicacao}</p></div></article></div>`;
}

export function htmlResumoProventos(dto, { erro = false } = {}) {
  if (!dto) return `<div class="small text-muted p-3 border rounded" role="status">${erro ? 'Resumo de proventos indisponível. Não foi possível consultar os eventos oficiais; o gráfico continua disponível.' : 'Carregando resumo de proventos…'}</div>`;
  const r = dto.resumo || {};
  const eventos = dto.eventos || [];
  const completo = r.coberturaCompleta === true;
  const total = reais(r.totalPorAcao);
  const retorno = completo ? pct(r.retornoComProventosPercentual) : 'Indisponível';
  const pagamentos = (e) => (e.pagamentos || []).length
    ? e.pagamentos.map((p) => `${h(data(p.dataPagamento))} · ${h(reais(p.valorPorAcao))}${p.tipo ? ` (${h(p.tipo)})` : ''}`).join('<br>')
    : h(data(e.dataPagamento));
  return `<section aria-label="Proventos e leitura do período" class="mt-3">
    <div class="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-2"><h6 class="mb-0">Proventos e efeito no preço</h6><span class="small text-muted">${h(data(dto.de))} a ${h(data(dto.ate))} · valores brutos por ação</span></div>
    <div class="row g-2">
      ${card('Proventos no período', total, `${h(quantidade(r.quantidadeEventos))} eventos · ${h(quantidade(r.eventosComValor))} com valor associado${completo ? '' : ' · cobertura parcial'}`, `JCP: ${h(reais(r.jcpPorAcao))} · Dividendos: ${h(reais(r.dividendosPorAcao))}. Total dos valores identificados; ausência de valor não significa zero.`)}
      ${card('Retorno com proventos', h(retorno), `Preço: ${h(pct(r.retornoPrecoPercentual))} · contribuição: ${completo && numero(r.contribuicaoProventosPontosPercentuais) ? `${h(Number(r.contribuicaoProventosPontosPercentuais).toLocaleString('pt-BR', { maximumFractionDigits: 2 }))} p.p.` : 'indisponível'}`, 'Variação do preço mais direitos a proventos, com a mesma base de capital. Posição mantida, sem reinvestimento; valores brutos, antes de impostos e custos.')}
      ${card('Efeito nas datas ex', h(pct(r.ajusteMedioPercentual)), 'Média dos ajustes implícitos observados', 'Fechamento do pregão anterior menos abertura na data ex, dividido pelo fechamento anterior. Inclui movimento de mercado; não é o valor do provento nem um sinal de compra ou venda.')}
      ${card('Regularidade dos eventos', `${h(quantidade(r.mesesComEventos))} meses com eventos`, `Intervalo médio: ${numero(r.intervaloMedioDias) ? `${h(Number(r.intervaloMedioDias).toLocaleString('pt-BR', { maximumFractionDigits: 1 }))} dias` : 'indisponível'} · último: ${h(data(r.ultimoEvento))}`, 'Frequência das datas ex observadas no período. Não comprova frequência de pagamentos e não prevê distribuições futuras.')}
    </div>
    <article class="border rounded p-3 mt-2" aria-label="Contribuição para a leitura holística"><h6>Leitura holística do período</h6><p class="mb-1">${h(dto.sinteseHolistica || 'Sem informação suficiente para consolidar o efeito dos proventos no retorno.')}</p><p class="small text-muted mb-0">${h(dto.premissa || 'Preço bruto, valores oficiais identificados e posição mantida sem reinvestimento.')} Esta leitura contextualiza o retorno; não altera isoladamente a recomendação do ativo.</p></article>
    ${(r.limitacoes || []).length ? `<ul class="small text-muted mt-2 mb-2">${r.limitacoes.map((l) => `<li>${h(l)}</li>`).join('')}</ul>` : ''}
    <details class="border rounded p-3 mt-2"><summary>Eventos de proventos e outros direitos (${eventos.length})</summary><p class="small text-muted mt-2">Uma linha por evento identificado. Data ex é a retirada do direito, não a data de pagamento. Fonte e cobertura são explicitadas por evento.</p>
      <div class="table-responsive"><table class="table table-sm small align-middle"><caption>Eventos consolidados do período selecionado</caption><thead><tr><th>Data ex</th><th>Tipo</th><th>Valor por ação</th><th>Pagamento / parcelas</th><th>Ajuste observado</th><th>Fonte</th></tr></thead><tbody>${eventos.map((e) => `<tr><td><button type="button" class="btn btn-link btn-sm p-0" data-evento-ex="${h(e.dataEx)}">${h(data(e.dataEx))}</button></td><td>${h(tipos[e.tipo] || e.tipo || 'Evento')} <span class="text-muted">${h(e.marca || '')}</span></td><td>${h(reais(e.valorPorAcao))}</td><td>${pagamentos(e)}</td><td>${h(reais(e.ajusteImplicito))} · ${h(pct(e.ajustePercentual))}<br><span class="text-muted">${h(reais(e.fechamentoAnterior))} → ${h(reais(e.aberturaEx))}</span></td><td>${h(e.fonte || 'Não informada')}</td></tr>`).join('') || '<tr><td colspan="6">Nenhum evento identificado no período. A ausência no calendário não comprova ausência de proventos.</td></tr>'}</tbody></table></div>
    </details>
  </section>`;
}
