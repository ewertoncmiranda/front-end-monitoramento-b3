import { formatarData, renderComunicado } from './ComunicadoItem.js';
import { escaparHtml } from '../utils/html.js';

// Unica responsabilidade: montar o conteudo do painel deslizante que abre ao
// clicar numa vela - o resumo da vela e os comunicados da CVM ligados a ela.
// Funcao pura: recebe tudo pronto (a regra de qual documento pertence a qual
// vela esta em analise/comunicadosPorCandle.js).
//
// O texto evita afirmar causa: a CVM informa so a data de entrega, e um fato
// relevante divulgado depois do fechamento explica a abertura seguinte, nao
// a vela do proprio dia.

export function renderNoticiasDoCandle({
  simbolo,
  candle,
  candleAnterior,
  grupo,
  carregando = false,
  erro = null,
  dadosAte = null,
  fonte = null,
  aviso = null,
}) {
  return `
    ${resumoDaVela(candle, candleAnterior)}
    ${corpo({ simbolo, candle, candleAnterior, grupo, carregando, erro, dadosAte })}
    <hr>
    <a class="small" href="#/comunicados?simbolo=${encodeURIComponent(simbolo)}">
      Ver a linha do tempo completa de ${escaparHtml(simbolo)} ›
    </a>
    ${fonte ? `<p class="small text-muted mt-2 mb-0">Fonte: ${escaparHtml(fonte)}. ${escaparHtml(aviso || '')}</p>` : ''}
  `;
}

function corpo({ simbolo, candle, candleAnterior, grupo, carregando, erro, dadosAte }) {
  if (carregando) {
    return '<loading-spinner></loading-spinner>';
  }
  if (erro) {
    return `<div class="alert alert-secondary small py-2">
      Não foi possível carregar os comunicados agora (${escaparHtml(erro)}). O gráfico segue funcionando.
    </div>`;
  }

  const noDia = grupo ? grupo.noDia : [];
  const desdeAnterior = grupo ? grupo.desdeAnterior : [];
  const partes = [];

  if (dadosAte && candle.dataIso > dadosAte) {
    partes.push(`<div class="alert alert-warning small py-2">
      A CVM publicou dados só até <strong>${formatarData(dadosAte)}</strong>. Comunicados deste
      dia ainda não entraram na base.</div>`);
  }

  partes.push(`
    <h6 class="mt-3">Entregues neste dia</h6>
    ${lista(noDia, `Nenhum comunicado de ${escaparHtml(simbolo)} entregue em ${formatarData(candle.dataIso)}.`)}
  `);

  if (candleAnterior) {
    partes.push(`
      <h6 class="mt-3">Desde o pregão anterior (${formatarData(candleAnterior.dataIso)})</h6>
      <p class="small text-muted mb-1">
        Podem ter sido divulgados após o fechamento anterior e explicar a abertura desta vela.
        A CVM informa só a data, não a hora.
      </p>
      ${lista(desdeAnterior, 'Nenhum.')}
    `);
  }

  return partes.join('');
}

function lista(documentos, vazio) {
  if (!documentos.length) {
    return `<p class="small text-muted mb-0">${vazio}</p>`;
  }
  return `<ul class="list-group list-group-flush">${documentos.map((c) => renderComunicado(c)).join('')}</ul>`;
}

function resumoDaVela(candle, anterior) {
  const variacao = anterior ? percentual(candle.close, anterior.close) : null;
  const gap = anterior ? percentual(candle.open, anterior.close) : null;

  return `
    <dl class="row small mb-0">
      <dt class="col-6 fw-normal text-muted">Abertura</dt><dd class="col-6 text-end mb-1">${preco(candle.open)}</dd>
      <dt class="col-6 fw-normal text-muted">Fechamento</dt><dd class="col-6 text-end mb-1">${preco(candle.close)}</dd>
      <dt class="col-6 fw-normal text-muted">Mínima / máxima</dt><dd class="col-6 text-end mb-1">${preco(candle.low)} / ${preco(candle.high)}</dd>
      ${
        variacao !== null
          ? `<dt class="col-6 fw-normal text-muted">Variação no dia</dt><dd class="col-6 text-end mb-1">${sinal(variacao)}</dd>
             <dt class="col-6 fw-normal text-muted" title="Abertura contra o fechamento anterior">Gap de abertura</dt><dd class="col-6 text-end mb-1">${sinal(gap)}</dd>`
          : ''
      }
    </dl>
  `;
}

function percentual(atual, referencia) {
  if (!referencia) return null;
  return ((atual - referencia) / referencia) * 100;
}

function sinal(valor) {
  if (valor === null || Number.isNaN(valor)) return '—';
  const classe = valor > 0 ? 'text-success' : valor < 0 ? 'text-danger' : '';
  const texto = `${valor > 0 ? '+' : ''}${valor.toFixed(2).replace('.', ',')}%`;
  return `<span class="${classe}">${texto}</span>`;
}

function preco(valor) {
  return valor === null || valor === undefined
    ? '—'
    : Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
