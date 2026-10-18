import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml as esc } from '../../utils/html.js';
import { dispararCarga } from '../../api/cargasApi.js';
import { listarAtivosBase } from '../../api/baseAtivosApi.js';

export const ETAPAS_CARGA = ['COTAHIST', 'LIQUIDEZ', 'PRONTIDAO', 'QUALIDADE_OPCOES', 'CONCILIACAO', 'DFP', 'TTM', 'IPE', 'DVA', 'EVENTOS', 'CHECAGENS'];
export function validarCarga({ tipo, anos = '', simbolos = [], etapas = [], forcar = false }, anoAtual = new Date().getFullYear()) {
  if (!['ROTINA', 'COMPLETA', 'PARCIAL'].includes(tipo)) throw new Error('Selecione um tipo de carga válido.');
  const tokens = Array.isArray(anos) ? anos : String(anos).trim().split(/[\s,;]+/).filter(Boolean);
  if (tipo !== 'ROTINA' && tokens.some(a => !/^\d{4}$/.test(String(a)) || Number(a) < 2016 || Number(a) > anoAtual)) throw new Error(`Informe anos entre 2016 e ${anoAtual}, separados por vírgula.`);
  const anosValidos = tipo === 'ROTINA' ? [] : [...new Set(tokens.map(Number))].sort((a,b) => a-b);
  const simbolosValidos = [...new Set(simbolos.map(s => String(s).trim().toUpperCase()).filter(Boolean))];
  if (simbolosValidos.some(s => !/^[A-Z0-9]{3,12}$/.test(s))) throw new Error('Informe símbolos válidos, como PETR4.');
  if (tipo === 'PARCIAL' && (!etapas.length || etapas.some(e => !ETAPAS_CARGA.includes(e)))) throw new Error('Selecione ao menos uma etapa válida para a carga parcial.');
  return { tipo, ...(anosValidos.length ? { anos: anosValidos } : {}), ...(simbolosValidos.length ? { simbolos: simbolosValidos } : {}), ...(tipo === 'PARCIAL' ? { etapas: ETAPAS_CARGA.filter(e => etapas.includes(e)) } : {}), forcar: Boolean(forcar) };
}
export function resumoCarga(p) {
  return `${{ ROTINA: 'Rotina', COMPLETA: 'Completa', PARCIAL: 'Parcial' }[p.tipo]} · Anos: ${p.anos?.join(', ') || (p.tipo === 'COMPLETA' ? 'últimos 5 anos' : 'padrão da rotina/etapa')} · Ativos: ${p.simbolos?.join(', ') || 'todos'} · Etapas: ${p.etapas?.join(', ') || (p.tipo === 'ROTINA' ? 'todas exceto EVENTOS' : 'todas')} · Forçar reprocessamento: ${p.forcar ? 'sim' : 'não'}.`;
}

// Busca múltipla compartilhável: o projeto ainda não possuía este elemento.
export class BuscaAtivosCarga extends BaseComponent {
  constructor() { super(); this.simbolos = []; this._versao = 0; }
  template() { return '<label class="form-label">Símbolos (opcional)</label><div class="input-group"><input class="form-control" aria-label="Buscar ativo por símbolo ou nome" placeholder="Busque símbolo ou nome"><button type="button" class="btn btn-outline-secondary" data-adicionar>Adicionar símbolo</button></div><div data-sugestoes></div><div data-selecionados class="mt-2"></div><small class="text-muted">Sem seleção: todos os ativos. Selecione vários símbolos.</small>'; }
  afterRender() {
    const input = this.querySelector('input');
    input.addEventListener('input', () => { clearTimeout(this._timer); const versao = ++this._versao; this._timer = setTimeout(() => this._buscar(input.value, versao), 250); });
    this.querySelector('[data-adicionar]').onclick = () => this._adicionar(input.value);
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); this._adicionar(input.value); } };
    this.querySelector('[data-sugestoes]').onclick = e => { const b = e.target.closest('[data-simbolo]'); if (b) this._adicionar(b.dataset.simbolo); };
    this.querySelector('[data-selecionados]').onclick = e => { const b = e.target.closest('[data-remover]'); if (b) { this.simbolos = this.simbolos.filter(s => s !== b.dataset.remover); this._chips(); } };
  }
  async _buscar(q, versao) {
    if (!q.trim()) { this.querySelector('[data-sugestoes]').innerHTML = ''; return; }
    try { const dados = await listarAtivosBase({ q: q.trim(), tamanho: 8 }); if (versao !== this._versao || !this.isConnected) return;
      this.querySelector('[data-sugestoes]').innerHTML = (dados?.content || []).map(a => `<button type="button" class="btn btn-sm btn-outline-secondary m-1" data-simbolo="${esc(a.simbolo)}">${esc(a.simbolo)} · ${esc(a.nome || a.nomeEmpresa || '')}</button>`).join('');
    } catch { if (versao === this._versao && this.isConnected) this.querySelector('[data-sugestoes]').textContent = 'Busca indisponível. Você pode adicionar o símbolo diretamente.'; }
  }
  _adicionar(valor) { if (this.querySelector('input').disabled) return; const novos = String(valor).toUpperCase().split(/[\s,;]+/).filter(Boolean); if (!novos.length) return; this.simbolos = [...new Set([...this.simbolos, ...novos])]; this.querySelector('input').value = ''; this._versao++; this.querySelector('[data-sugestoes]').innerHTML = ''; this._chips(); }
  _chips() { this.querySelector('[data-selecionados]').innerHTML = this.simbolos.map(s => `<button type="button" class="btn btn-sm btn-outline-primary m-1" data-remover="${esc(s)}" aria-label="Remover ${esc(s)}">${esc(s)} ×</button>`).join(''); }
  disconnectedCallback() { clearTimeout(this._timer); this._versao++; }
}
if (!customElements.get('busca-ativos')) customElements.define('busca-ativos', BuscaAtivosCarga);

export class RodarCarga extends BaseComponent {
  constructor() { super(); this._ativa = null; this._enviando = false; this._pendente = null; }
  template() { return `<dialog class="border rounded shadow p-0" style="width:min(95vw,680px);max-height:90vh" aria-label="Rodar carga"><form class="p-3" novalidate><div class="d-flex justify-content-between"><h2 class="h5">Rodar carga</h2><button type="button" data-fechar class="btn-close" aria-label="Fechar"></button></div><label class="form-label" for="carga-tipo">Tipo</label><select id="carga-tipo" class="form-select mb-3"><option value="ROTINA">Rotina</option><option value="COMPLETA">Completa</option><option value="PARCIAL">Parcial</option></select><div data-anos hidden><label for="carga-anos" class="form-label">Anos (opcional, separados por vírgula)</label><input id="carga-anos" class="form-control mb-3" placeholder="Ex.: 2024, 2025, 2026"></div><busca-ativos modo="multiplo"></busca-ativos><fieldset data-etapas class="my-3" hidden><legend class="fs-6">Etapas</legend>${ETAPAS_CARGA.map(e => `<label class="me-3 mb-2"><input type="checkbox" name="etapa" value="${e}"> ${e}</label>`).join('')}</fieldset><label class="d-block my-3"><input type="checkbox" data-forcar> Forçar reprocessamento</label><div data-erro role="alert" class="text-danger mb-2"></div><div data-resumo class="alert alert-info" hidden></div><button type="submit" class="btn btn-primary" data-revisar>Revisar carga</button><button type="button" class="btn btn-primary" data-confirmar hidden>Confirmar e iniciar carga</button><button type="button" class="btn btn-secondary ms-2" data-voltar hidden>Voltar e editar</button></form></dialog>`; }
  afterRender() {
    this.querySelector('[data-fechar]').onclick = () => this.fechar();
    this.querySelector('dialog').addEventListener('cancel', e => { if (this._enviando) e.preventDefault(); });
    this.querySelector('#carga-tipo').onchange = () => this._tipo();
    this.querySelector('form').onsubmit = e => { e.preventDefault(); this.revisar(); };
    this.querySelector('[data-confirmar]').onclick = () => this.confirmar();
    this.querySelector('[data-voltar]').onclick = () => this._editar();
  }
  setExecucaoAtiva(id) {
    this._ativa = id || null;
    if (this._ativa && this._pendente && !this._enviando) this._editar();
  }
  abrir() { if (this._ativa || this._enviando) return; this._editar(); this.querySelector('dialog').showModal(); }
  fechar() { if (!this._enviando) this.querySelector('dialog').close(); }
  _tipo() { const t = this.querySelector('#carga-tipo').value; this.querySelector('[data-anos]').hidden = t === 'ROTINA'; this.querySelector('[data-etapas]').hidden = t !== 'PARCIAL'; }
  _editar() {
    if (this._enviando) return;
    this._pendente = null;
    this.querySelectorAll('input,select,busca-ativos button').forEach(e => { e.disabled = false; });
    this.querySelector('[data-confirmar]').hidden = true;
    this.querySelector('[data-voltar]').hidden = true;
    this.querySelector('[data-revisar]').hidden = false;
    this.querySelector('[data-resumo]').hidden = true;
    this.querySelector('[data-erro]').textContent = '';
  }
  revisar() {
    if (this._enviando || this._ativa) return;
    try { const busca = this.querySelector('busca-ativos'); if (busca.querySelector('input')?.value.trim()) throw new Error('Adicione o símbolo digitado ou limpe a busca antes de revisar.');
      this._pendente = validarCarga({ tipo: this.querySelector('#carga-tipo').value, anos: this.querySelector('#carga-anos').value, simbolos: busca.simbolos || [], etapas: [...this.querySelectorAll('[name="etapa"]:checked')].map(e => e.value), forcar: this.querySelector('[data-forcar]').checked });
      // Descarte respostas pendentes e sugestões antes de congelar a revisão.
      busca._versao++;
      clearTimeout(busca._timer);
      busca.querySelector('[data-sugestoes]').innerHTML = '';
      this.querySelector('[data-erro]').textContent = '';
      this.querySelector('[data-resumo]').textContent = resumoCarga(this._pendente);
      this.querySelector('[data-resumo]').hidden = false;
      this.querySelectorAll('input,select,busca-ativos button').forEach(e => { e.disabled = true; });
      this.querySelector('[data-revisar]').hidden = true;
      this.querySelector('[data-confirmar]').hidden = false;
      this.querySelector('[data-voltar]').hidden = false;
    } catch (e) { this._pendente = null; this.querySelector('[data-erro]').textContent = e.message; }
  }
  async confirmar() {
    if (!this._pendente || this._enviando || this._ativa) return;
    this._enviando = true;
    this.querySelector('[data-confirmar]').disabled = true;
    this.querySelector('[data-voltar]').disabled = true;
    try {
      const resposta = await dispararCarga(this._pendente);
      if (!resposta?.id) throw new Error('O gestor não informou a execução. Confira o histórico antes de tentar novamente.');
      this._abrirExecucao(resposta.id);
    }
    catch (e) {
      const erro = this.querySelector('[data-erro]'); erro.textContent = e.status === 503 ? 'O ETL está fora do ar. Tente novamente quando o serviço estiver disponível.' : e.status === 409 ? 'Já existe uma carga rodando.' : (e.message || 'Não foi possível iniciar a carga.');
      const id = e.data?.execucaoEmAndamento ?? e.body?.execucaoEmAndamento;
      if (e.status === 409 && id) { this._ativa = id; const a = document.createElement('a'); a.href = `#/cargas/${encodeURIComponent(id)}`; a.textContent = ' Abrir carga em andamento'; erro.append(a); a.onclick = ev => { ev.preventDefault(); this._abrirExecucao(id); }; }
    } finally { this._enviando = false; this.querySelector('[data-confirmar]').disabled = false; this.querySelector('[data-voltar]').disabled = false; }
  }
  _abrirExecucao(id) { this._ativa = id; this.querySelector('dialog').close(); this.dispatchEvent(new CustomEvent('carga-aberta', { detail: { id }, bubbles: true })); }
  disconnectedCallback() { this.querySelector('dialog')?.close(); }
}
customElements.define('rodar-carga', RodarCarga);
