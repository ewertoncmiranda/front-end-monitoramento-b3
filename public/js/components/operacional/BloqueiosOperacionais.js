// Unica responsabilidade: painel de bloqueios (OPR-PAI-5): por que um sinal nao virou operacao
// simulada (liquidez, dado ausente, evento, fundamento, limite de risco), com filtro por motivo e
// simbolo. Puro: strings; a pagina liga os filtros. Texto da API sempre escapado.
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { ROTULO_GRUPO, contarPorGrupo, filtrarBloqueios, grupoDoMotivo } from '../../analise/operabilidade.js';
import { htmlAjuda } from '../../utils/ajuda.js';

export function htmlFiltrosBloqueios(itens, filtro = {}) {
  const contagem = contarPorGrupo(itens);
  const opcoes = Object.keys(ROTULO_GRUPO).filter((g) => contagem[g])
    .map((g) => `<option value="${g}"${filtro.grupo === g ? ' selected' : ''}>${escaparHtml(ROTULO_GRUPO[g])} (${contagem[g]})</option>`).join('');
  return `<div class="d-flex flex-wrap gap-2 mb-2 filtros-bloqueios">
    <label class="visually-hidden" for="filtro-bloqueio-grupo">Motivo</label>
    <select id="filtro-bloqueio-grupo" class="form-select form-select-sm w-auto" data-filtro-grupo>
      <option value="">Todos os motivos (${(itens || []).length})</option>${opcoes}
    </select>
    <label class="visually-hidden" for="filtro-bloqueio-simbolo">Ativo</label>
    <input id="filtro-bloqueio-simbolo" class="form-control form-control-sm w-auto" placeholder="Filtrar ativo"
      maxlength="8" value="${escaparHtml(filtro.simbolo || '')}" data-filtro-simbolo>
  </div>`;
}

export function htmlListaBloqueios(itens, filtro = {}) {
  const visiveis = filtrarBloqueios(itens, filtro);
  if (!(itens || []).length) return '<p class="small text-muted mb-0">Nenhum bloqueio registrado neste pregão.</p>';
  if (!visiveis.length) return '<p class="small text-muted mb-0">Nenhum bloqueio com esse filtro.</p>';
  const linhas = visiveis.map((b) => `<li class="list-group-item px-0">
      <div class="d-flex flex-wrap align-items-baseline gap-2">
        <a class="fw-semibold" href="#/gestao/${encodeURIComponent(b.simbolo || '')}">${escaparHtml(b.simbolo || '')}</a>
        ${b.faixa ? `<span class="badge text-bg-light border">liquidez ${escaparHtml(b.faixa)}</span>` : ''}
      </div>
      <ul class="small mb-0 ps-3">${(b.motivos || []).map((m) => `<li>
        <span class="badge text-bg-light border">${escaparHtml(ROTULO_GRUPO[grupoDoMotivo(m.codigo)])}</span>
        ${escaparHtml(m.detalhe || m.codigo || '')}${m.valor ? ` <span class="text-muted">(${escaparHtml(m.valor)}${m.limite ? ` · limite ${escaparHtml(m.limite)}` : ''})</span>` : ''}
      </li>`).join('')}</ul>
    </li>`).join('');
  return `<ul class="list-group list-group-flush">${linhas}</ul>`;
}

export function htmlBloqueios(dados, filtro = {}) {
  const itens = dados?.itens || [];
  const quando = dados?.dataPregao ? ` em ${escaparHtml(formatarData(dados.dataPregao))}` : '';
  return `<section class="ficha-cartao mb-3 bloqueios-operacionais">
    <div class="d-flex justify-content-between align-items-center"><p class="ficha-rotulo mb-2">Sinais que não viraram operação${quando}</p>${htmlAjuda('operabilidade-bloqueios', 'Bloqueios operacionais', 'Lista os motivos que impedem a regra de abrir novas posições: liquidez, dado ausente, drawdown.')}</div>
    <p class="small text-muted">Quando um ativo tem sinal mas não entra na carteira simulada, o motivo aparece aqui.</p>
    ${htmlFiltrosBloqueios(itens, filtro)}
    <div data-lista-bloqueios>${htmlListaBloqueios(itens, filtro)}</div>
  </section>`;
}
