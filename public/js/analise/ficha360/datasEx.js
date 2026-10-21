// Unica responsabilidade: logica pura de datas ex e custo de execucao (MICRO-PAI-3).
// Tudo opcional: dado ausente devolve null, nunca zero.

export const DIAS_ALERTA_DATA_EX = 10;
export const MESES_TABELA_DATAS_EX = 24;
export const PREGOES_PARA_SPREAD = 21;

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const MS_DIA = 86400000;
const dia = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
};
const hojeUtc = (hoje) => Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

/** Aceita o DTO do gestor; devolve {eventos, resumo, origemDados} ou null sem eventos/resumo utilizaveis. */
export function normalizarDatasEx(dto) {
  if (!dto || typeof dto !== 'object') return null;
  const eventos = Array.isArray(dto.eventos) ? dto.eventos.filter((e) => dia(e?.dataEx) !== null) : [];
  const resumo = dto.resumo && typeof dto.resumo === 'object' ? dto.resumo : null;
  if (!eventos.length && !resumo?.proximaDataEstimada) return null;
  return { eventos, resumo, origemDados: dto.origemDados || null };
}

/** Eventos dos ultimos `meses` meses, do mais recente ao mais antigo. */
export function eventosRecentes(eventos = [], hoje = new Date(), meses = MESES_TABELA_DATAS_EX) {
  const corte = new Date(hoje.getFullYear(), hoje.getMonth() - meses, hoje.getDate());
  const limite = Date.UTC(corte.getFullYear(), corte.getMonth(), corte.getDate());
  return eventos.filter((e) => dia(e?.dataEx) >= limite).sort((a, b) => dia(b.dataEx) - dia(a.dataEx));
}

/** Ajuste percentual medio dos eventos passados do mesmo tipo (null sem historico). */
export function ajusteEsperadoPct(eventos = [], tipo) {
  const v = eventos.filter((e) => e?.tipo === tipo).map((e) => num(e.ajustePercentual)).filter((x) => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/** Alerta quando a proxima data ex estimada esta entre 0 e DIAS_ALERTA_DATA_EX dias. */
export function alertaDataEx(datasEx, hoje = new Date(), limiteDias = DIAS_ALERTA_DATA_EX) {
  const d = normalizarDatasEx(datasEx);
  const alvo = dia(d?.resumo?.proximaDataEstimada);
  if (alvo === null) return null;
  const dias = Math.round((alvo - hojeUtc(hoje)) / MS_DIA);
  if (dias < 0 || dias > limiteDias) return null;
  const tipo = d.resumo.proximoTipo || null;
  const ajuste = tipo ? ajusteEsperadoPct(d.eventos, tipo) : null;
  const quando = dias === 0 ? 'data ex hoje' : `data ex em ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  return { dias, data: d.resumo.proximaDataEstimada, tipo, ajusteEsperadoPct: ajuste, confianca: d.resumo.confianca || null, texto: quando };
}

/** Spread de fechamento em % = (venda - compra) / meio; null se faltar oferta valida. */
export function spreadDaVela(vela) {
  const c = num(vela?.melhorOfertaCompra); const v = num(vela?.melhorOfertaVenda);
  if (c === null || v === null || c <= 0 || v <= 0 || v < c) return null;
  return ((v - c) / ((v + c) / 2)) * 100;
}

const mediana = (xs) => {
  const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const velasDe = (pregoes) => (Array.isArray(pregoes) ? pregoes : Array.isArray(pregoes?.velas) ? pregoes.velas : []);

/** Custo de ida e volta (%): spread mediano dos ultimos pregoes com oferta; null sem nenhum. */
export function custoDeExecucao(pregoes, n = PREGOES_PARA_SPREAD) {
  const spreads = velasDe(pregoes).map(spreadDaVela).filter((s) => s !== null).slice(-n);
  return spreads.length ? { idaEVoltaPct: mediana(spreads), pregoes: spreads.length } : null;
}

/** Preco medio do ultimo pregao que o traz (>0); null caso contrario. */
export function precoMedioDoDia(pregoes) {
  const velas = velasDe(pregoes);
  const v = velas.length ? velas[velas.length - 1] : null;
  const p = num(v?.precoMedio);
  return p !== null && p > 0 ? p : null;
}

/** Alvo e upside descontados do custo de ida e volta; a direcao vem do sinal do upside. */
export function alvoLiquido(alvo, precoAtual, upsidePct, custoPct) {
  if (alvo == null || precoAtual == null || upsidePct == null || custoPct == null) return null;
  const compra = upsidePct >= 0;
  return {
    alvo: compra ? alvo - (precoAtual * custoPct) / 100 : alvo + (precoAtual * custoPct) / 100,
    upsidePct: compra ? upsidePct - custoPct : upsidePct + custoPct,
  };
}

/** HTML dos avisos opcionais do plano (alerta de data ex, custo, entrada pelo preco medio); '' se nao houver. */
export function htmlAvisosPlano(plano) {
  const f = (v, c = 2) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const itens = [];
  const a = plano?.alertaDataEx;
  if (a) {
    const aj = a.ajusteEsperadoPct != null ? `; ajuste esperado de cerca de ${f(a.ajusteEsperadoPct)}% no preço` : '';
    itens.push(`<li data-alerta-ex><strong>Atenção: ${esc(a.texto)}</strong>${a.tipo ? ` (${esc(a.tipo)})` : ''}${aj}${a.confianca ? `, confiança ${esc(a.confianca)}` : ''}. Estimativa indicativa.</li>`);
  }
  if (plano?.custoExecucao) {
    const c = plano.custoExecucao;
    let t = `Custo de execução (spread de fechamento mediano de ${c.pregoes} pregões, ida e volta): ${f(c.idaEVoltaPct)}%`;
    if (plano.alvoLiquido) t += `. Alvo líquido do custo: R$ ${f(plano.alvoLiquido.alvo)} (${f(plano.alvoLiquido.upsidePct, 1)}%)`;
    itens.push(`<li data-custo>${t}</li>`);
  }
  if (plano?.entradaPrecoMedio != null) {
    itens.push(`<li data-preco-medio>Entrada de referência pelo preço médio do último pregão: R$ ${f(plano.entradaPrecoMedio)} (ao lado do último preço).</li>`);
  }
  return itens.length ? `<div class="mt-3 pt-3 border-top" data-avisos-plano><ul class="mb-0 small ps-3">${itens.join('')}</ul></div>` : '';
}
