import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { htmlSelo } from '../../utils/selos.js';
import { buscarOpiniao } from '../../api/opiniaoApi.js';
import { htmlEstadoVazio } from '../EstadoVazio.js';

// Rotulos neutros (decisao do usuario); a cor induz, mas o texto vai sempre
// junto - nunca so a cor.
export const OPINIOES = {
  SINAL_POSITIVO: { rotulo: 'Sinal positivo', classe: 'text-bg-success' },
  SINAL_NEGATIVO: { rotulo: 'Sinal negativo', classe: 'text-bg-danger' },
  SINAL_NEUTRO: { rotulo: 'Sinal neutro', classe: 'text-bg-warning' },
  SEM_BASE: { rotulo: 'Sem base', classe: 'text-bg-secondary' },
};

export const RISCOS = {
  RISCO_BAIXO: { rotulo: 'Risco baixo', classe: 'text-bg-success' },
  RISCO_MEDIO: { rotulo: 'Risco médio', classe: 'text-bg-warning' },
  RISCO_ALTO: { rotulo: 'Risco alto', classe: 'text-bg-danger' },
};

const HORIZONTES = [
  { pregoes: 21, rotulo: 'Curto prazo' },
  { pregoes: 63, rotulo: 'Médio prazo' },
  { pregoes: 126, rotulo: 'Longo prazo' },
];

const AVISO_PADRAO = 'Leitura automática dos números, regra experimental. Não é recomendação de investimento.';

// Unica responsabilidade: cartao "Opiniao por horizonte" da ficha (aba
// Resumo, TASK-OPI-1) - curto, medio e longo prazo lado a lado, com
// justificativa citando o dado, o que invalida a leitura, data do pregao e
// origem (modelo local x regra). Dados de GET /ativos/{s}/opiniao.
export class OpiniaoHorizontes extends BaseComponent {
  template() {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Opinião por horizonte</p><div data-corpo class="small text-muted">Carregando…</div></section>';
  }

  async afterRender() {
    const simbolo = this.getAttribute('simbolo');
    const corpo = this.querySelector('[data-corpo]');
    if (!simbolo) return;
    try {
      const dados = await buscarOpiniao(simbolo);
      if (this.getAttribute('simbolo') !== simbolo) return;
      corpo.innerHTML = renderizar(dados);
    } catch {
      corpo.innerHTML = htmlEstadoVazio({ titulo: 'Opinião indisponível', causa: 'O gestor ainda não expõe a opinião por horizonte, ou a tabela opiniao_ia (V22) não existe neste banco.', acaoHref: '#/avaliacao', acaoRotulo: 'Ver saúde dos dados' });
    }
  }
}

/** Badge com cor e texto juntos; valor desconhecido vira cinza com o proprio codigo. */
function badge(mapa, valor) {
  const item = mapa[valor] || { rotulo: valor || 'Sem dado', classe: 'text-bg-secondary' };
  return `<span class="badge ${item.classe}">${escaparHtml(item.rotulo)}</span>`;
}

function origemLegivel(h) {
  if (h.origem === 'MODELO') return `Modelo local${h.modelo ? ` (${escaparHtml(h.modelo)})` : ''}`;
  if (h.origem === 'REGRA') return 'Regra (sem modelo)';
  return escaparHtml(h.origem || 'origem não informada');
}

function lista(itens, vazio) {
  if (!itens || itens.length === 0) return `<p class="small text-muted mb-0">${escaparHtml(vazio)}</p>`;
  return `<ul class="small mb-0 ps-3">${itens.map((t) => `<li>${escaparHtml(t)}</li>`).join('')}</ul>`;
}

// Justificativas visiveis antes do "mais N": o modelo as vezes cita todas as
// evidencias e o cartao viraria uma lista sem fim.
const VISIVEIS = 4;

/**
 * Leitura da justificativa com o dado que ela cita (rotulo e valor da
 * evidencia). Se a leitura ja traz o valor, nao repete.
 */
export function justificativas(h) {
  const evidencias = new Map((h.evidencias || []).map((e) => [e.id, e]));
  return (h.justificativa || []).map((j) => {
    const leitura = (j.leitura || '').trim();
    const e = evidencias.get(j.evidenciaId);
    const valor = e && e.valor !== null && e.valor !== undefined ? String(e.valor) : '';
    const jaCita = !valor || leitura.includes(valor);
    return jaCita ? leitura : `${leitura} (${e.rotulo || e.id}: ${valor})`.trim();
  }).filter(Boolean);
}

function listaCurta(itens, vazio) {
  if (!itens || itens.length <= VISIVEIS) return lista(itens, vazio);
  const resto = itens.slice(VISIVEIS);
  return `${lista(itens.slice(0, VISIVEIS), vazio)}<details class="small"><summary class="text-muted">mais ${resto.length}</summary>${lista(resto, '')}</details>`;
}

function coluna(definicao, h) {
  const titulo = `<div class="d-flex justify-content-between align-items-baseline gap-2">
      <span class="fw-semibold">${definicao.rotulo}</span>
      <span class="small text-muted">${definicao.pregoes} pregões</span>
    </div>`;
  if (!h) {
    return `<div class="col-md-4"><div class="border rounded p-2 h-100">${titulo}
      <div class="mt-2">${badge(OPINIOES, 'SEM_BASE')}</div>
      <p class="small text-muted mt-2 mb-0">Nenhuma leitura para este horizonte no último pregão.</p></div></div>`;
  }
  const ausentes = h.dadosAusentes || [];
  return `<div class="col-md-4"><div class="border rounded p-2 h-100 d-flex flex-column gap-2">
      ${titulo}
      <div class="d-flex flex-wrap gap-1">${badge(OPINIOES, h.opiniao)} ${badge(RISCOS, h.risco)}</div>
      <div><p class="small fw-semibold mb-1">Por quê</p>${listaCurta(justificativas(h), 'Sem justificativa registrada.')}</div>
      <div><p class="small fw-semibold mb-1">O que invalida</p>${listaCurta(h.oQueInvalida, 'Nada registrado.')}</div>
      ${ausentes.length ? `<details class="small"><summary class="text-muted">${ausentes.length} dado${ausentes.length === 1 ? '' : 's'} ausente${ausentes.length === 1 ? '' : 's'}</summary>${lista(ausentes, '')}</details>` : ''}
      <p class="small text-muted mt-auto mb-0">Pregão ${escaparHtml(formatarData(h.dataPregao))} · ${origemLegivel(h)}</p>
    </div></div>`;
}

export function renderizar(dados) {
  const aviso = escaparHtml((dados && dados.aviso) || AVISO_PADRAO);
  const cabecalho = `<p class="small text-muted mb-2">${htmlSelo('EXPERIMENTAL')} ${aviso}</p>`;
  const horizontes = (dados && dados.horizontes) || [];
  if (!horizontes.length) {
    return cabecalho + htmlEstadoVazio({
      titulo: 'Sem opinião ainda',
      causa: 'A opinião por horizonte é gerada depois dos insights diários do pregão; este ativo ainda não tem leitura.',
    });
  }
  const porPregoes = new Map(horizontes.map((h) => [h.horizontePregoes, h]));
  return `${cabecalho}<div class="row g-2">${HORIZONTES.map((d) => coluna(d, porPregoes.get(d.pregoes))).join('')}</div>`;
}

customElements.define('opiniao-horizontes', OpiniaoHorizontes);
