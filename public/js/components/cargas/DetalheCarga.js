import { BaseComponent } from '../base/BaseComponent.js';
import { formatarDataHora } from '../../utils/dataHora.js';
import { statusCarga } from '../../analise/cargas.js';

export const escapar = (v) => String(v ?? '—').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function valor(v) { return escapar(v == null ? '—' : typeof v === 'object' ? JSON.stringify(v, null, 2) : v); }
export function selo(status) {
  const { icone, classe, rotulo } = statusCarga(status);
  return `<span class="badge text-bg-${classe}">${icone} ${escapar(rotulo)}</span>`;
}
export function duracao(ms) { return ms == null ? '—' : `${Number(ms).toLocaleString('pt-BR')} ms`; }
export function data(v) { return escapar(formatarDataHora(v, '—')); }
function pares(obj) { return Object.entries(obj || {}).map(([k, v]) => `<dt class="col-sm-4 text-break">${escapar(k)}</dt><dd class="col-sm-8"><pre class="text-wrap text-break mb-0" style="white-space:pre-wrap;overflow-wrap:anywhere">${valor(v)}</pre></dd>`).join('') || '<dd>—</dd>'; }
export function renderizarDetalhe(execucao) {
  if (!execucao) return '<p class="text-muted">Selecione uma execução para ver o detalhe.</p>';
  const e = execucao;
  const etapas = [...(e.etapas || [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  return `<section aria-label="Detalhe da execução" class="text-break"><h2 class="h5">Execução ${escapar(e.id)} · ${escapar(e.tipo)} ${selo(e.status)}</h2>
    <p>Solicitada por: ${escapar(e.solicitadaPor)} · Início: ${data(e.iniciadaEm)} · Fim: ${data(e.finalizadaEm)} · Duração: ${duracao(e.duracaoMs)} · Versão ETL: ${escapar(e.versaoEtl)}</p>
    <h3 class="h6">Parâmetros usados</h3><dl class="row">${pares(e.parametros)}</dl>
    ${e.mensagemErro ? `<h3 class="h6">Erro da execução</h3><textarea class="form-control" readonly aria-label="Erro completo da execução">${escapar(e.mensagemErro)}</textarea><button type="button" class="btn btn-sm btn-outline-secondary my-2" data-copiar="execucao">Copiar erro completo</button>` : ''}
    <h3 class="h6">Linha do tempo das etapas</h3><ol class="list-group list-group-numbered">${etapas.map((etapa, i) => `<li class="list-group-item"><h4 class="h6">${escapar(etapa.etapa)} ${selo(etapa.status)}</h4><p>Início: ${data(etapa.iniciadaEm)} · Fim: ${data(etapa.finalizadaEm)} · Duração: ${duracao(etapa.duracaoMs)}</p><h5 class="h6">O que foi carregado</h5><dl class="row">${pares(etapa.metricas)}</dl><h5 class="h6">Alertas</h5><ul>${(etapa.alertas || []).map(a => `<li class="text-break">${escapar(a)}</li>`).join('') || '<li>—</li>'}</ul><h5 class="h6">Erros</h5>${etapa.erros?.length ? `<textarea readonly class="form-control" rows="4" aria-label="Erros completos de ${escapar(etapa.etapa)}">${escapar(etapa.erros.join('\n\n'))}</textarea><button type="button" class="btn btn-sm btn-outline-secondary mt-2" data-copiar="${i}">Copiar erros completos</button>` : '<p>—</p>'}</li>`).join('') || '<li class="list-group-item">Nenhuma etapa registrada.</li>'}</ol>
    <h3 class="h6 mt-3">Arquivos baixados</h3><div class="table-responsive"><table class="table table-sm"><thead><tr><th>Fonte</th><th>Competência</th><th>Arquivo</th><th>ETag</th><th>Linhas</th><th>Status</th></tr></thead><tbody>${(e.arquivos || []).map(a => `<tr><td>${escapar(a.fonte)}</td><td>${escapar(a.competencia)}</td><td class="text-break">${escapar(a.arquivo)}</td><td class="text-break">${escapar(a.etag)}</td><td>${valor(a.linhasCarregadas)}</td><td>${selo(a.status)}</td></tr>`).join('') || '<tr><td colspan="6">Nenhum arquivo registrado.</td></tr>'}</tbody></table></div><p role="status" data-copia-status></p></section>`;
}
export class DetalheCarga extends BaseComponent {
  setExecucao(execucao) { this._execucao = execucao; this.render(); }
  template() { return renderizarDetalhe(this._execucao); }
  afterRender() {
    this.querySelectorAll('[data-copiar]').forEach(botao => botao.addEventListener('click', async () => {
      const texto = botao.previousElementSibling.value;
      try { await navigator.clipboard.writeText(texto); this.querySelector('[data-copia-status]').textContent = 'Texto copiado.'; }
      catch { botao.previousElementSibling.focus(); botao.previousElementSibling.select(); this.querySelector('[data-copia-status]').textContent = 'Texto selecionado. Use Ctrl+C para copiar.'; }
    }));
  }
}
customElements.define('detalhe-carga', DetalheCarga);
