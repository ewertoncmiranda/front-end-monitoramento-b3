import { BaseComponent } from '../base/BaseComponent.js';
import { escapar, selo, data, duracao, valor } from './DetalheCarga.js';

export function filtrarHistorico(lista, filtros = {}) {
  return (lista || []).filter(e => {
    const dia = String(e.iniciadaEm || e.criadaEm || '').slice(0, 10);
    return (!filtros.status || e.status === filtros.status) && (!filtros.inicio || dia >= filtros.inicio) && (!filtros.fim || dia <= filtros.fim);
  }).sort((a, b) => String(b.iniciadaEm || b.criadaEm || '').localeCompare(String(a.iniciadaEm || a.criadaEm || '')));
}
export function paginarHistorico(lista, pagina = 1, tamanho = 10) {
  const paginas = Math.max(1, Math.ceil(lista.length / tamanho));
  const atual = Math.min(paginas, Math.max(1, pagina));
  return { itens: lista.slice((atual - 1) * tamanho, atual * tamanho), pagina: atual, paginas, total: lista.length };
}
export class HistoricoCargas extends BaseComponent {
  constructor() { super(); this._lista = []; this._filtros = { status: '', inicio: '', fim: '' }; this._pagina = 1; }
  setDados(dados) { this._lista = Array.isArray(dados) ? dados : (dados?.content || []); this._carregando = false; this._erro = null; this.render(); }
  setCarregando() { this._carregando = true; this.render(); }
  setErro(erro) { this._carregando = false; this._erro = erro?.message || String(erro); this.render(); }
  template() {
    const p = paginarHistorico(filtrarHistorico(this._lista, this._filtros), this._pagina);
    this._pagina = p.pagina;
    const status = ['PENDENTE', 'EXECUTANDO', 'SUCESSO', 'SUCESSO_COM_ALERTA', 'SUCESSO_PARCIAL', 'FALHA', 'INTERROMPIDA'];
    const nomes = { ROTINA: 'Rotina', COMPLETA: 'Completa', PARCIAL: 'Parcial', ROTINA_MANHA: 'Rotina da manhã', PAINEL: 'Painel', API: 'API' };
    return `<section aria-label="Histórico de execuções"><h2 class="h5">Histórico de execuções</h2><form class="row g-2 mb-3" data-filtros><label class="col-auto">Status<select name="status" class="form-select"><option value="">Todos</option>${status.map(s => `<option value="${s}" ${s === this._filtros.status ? 'selected' : ''}>${s.replaceAll('_', ' ')}</option>`).join('')}</select></label><label class="col-auto">De<input class="form-control" type="date" name="inicio" value="${escapar(this._filtros.inicio)}"></label><label class="col-auto">Até<input class="form-control" type="date" name="fim" value="${escapar(this._filtros.fim)}"></label><div class="col-auto align-self-end"><button class="btn btn-outline-primary" type="submit">Filtrar</button></div><p class="mb-0" role="alert" data-filtro-erro></p></form>
      ${this._carregando ? '<p role="status">Carregando histórico…</p>' : this._erro ? `<div class="alert alert-danger">${escapar(this._erro)} <button type="button" class="btn btn-sm btn-outline-danger" data-repetir>Tentar de novo</button></div>` : `<div class="table-responsive"><table class="table table-striped table-sm align-middle"><thead><tr><th>Início</th><th>Tipo</th><th>Quem pediu</th><th>Duração</th><th>Status</th><th>ok · alerta · falha</th><th>Detalhe</th></tr></thead><tbody>${p.itens.map(e => `<tr><td>${data(e.iniciadaEm)}</td><td>${escapar(nomes[e.tipo] || e.tipo)}</td><td>${escapar(nomes[e.solicitadaPor] || e.solicitadaPor)}</td><td>${duracao(e.duracaoMs)}</td><td>${selo(e.status)}</td><td>${valor(e.etapasOk)} · ${valor(e.etapasAlerta)} · ${valor(e.etapasFalha)}</td><td><button type="button" class="btn btn-sm btn-outline-primary" data-abrir="${escapar(e.id)}">Abrir execução ${escapar(e.id)}</button></td></tr>`).join('') || `<tr><td colspan="7">${this._lista.length ? 'Nenhuma execução corresponde aos filtros.' : 'Nenhuma carga registrada ainda — a primeira rotina da manhã preenche esta tela'}</td></tr>`}</tbody></table></div><nav aria-label="Paginação do histórico" class="d-flex gap-2 align-items-center"><button class="btn btn-sm btn-outline-secondary" data-pagina="${p.pagina - 1}" ${p.pagina === 1 ? 'disabled' : ''}>Anterior</button><span>Página ${p.pagina} de ${p.paginas} · ${p.total} execuções</span><button class="btn btn-sm btn-outline-secondary" data-pagina="${p.pagina + 1}" ${p.pagina === p.paginas ? 'disabled' : ''}>Próxima</button></nav>`}</section>`;
  }
  _emitir(nome, detail) { this.dispatchEvent(new CustomEvent(nome, { detail, bubbles: true })); }
  afterRender() {
    this.querySelector('[data-filtros]')?.addEventListener('submit', ev => {
      ev.preventDefault(); const form = ev.currentTarget;
      const filtros = { status: form.elements.status.value, inicio: form.elements.inicio.value, fim: form.elements.fim.value };
      if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) { this.querySelector('[data-filtro-erro]').textContent = 'A data inicial deve ser anterior à data final.'; return; }
      this._filtros = filtros; this._pagina = 1; this.render(); this._emitir('cargas-filtrar', { ...filtros, pagina: 1, tamanho: 10 });
    });
    this.querySelectorAll('[data-abrir]').forEach(b => b.addEventListener('click', () => this._emitir('carga-abrir', { id: b.dataset.abrir })));
    this.querySelectorAll('[data-pagina]').forEach(b => b.addEventListener('click', () => { this._pagina = Number(b.dataset.pagina); this.render(); }));
    this.querySelector('[data-repetir]')?.addEventListener('click', () => this._emitir('cargas-filtrar', { ...this._filtros, pagina: this._pagina, tamanho: 10 }));
  }
}
customElements.define('historico-cargas', HistoricoCargas);
