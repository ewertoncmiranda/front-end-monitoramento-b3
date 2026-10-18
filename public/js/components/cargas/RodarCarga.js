import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml as esc } from '../../utils/html.js';
import { dispararCarga } from '../../api/cargasApi.js';
// Registra a <busca-ativos> compartilhada (Carteiras, Simulador e aqui).
import '../busca/BuscaAtivos.js';

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

export class RodarCarga extends BaseComponent {
  constructor() { super(); this._ativa = null; this._enviando = false; this._pendente = null; }
  template() { return `<dialog class="border rounded shadow p-0" style="width:min(95vw,680px);max-height:90vh" aria-label="Rodar carga"><form class="p-3" novalidate><div class="d-flex justify-content-between"><h2 class="h5">Rodar carga</h2><button type="button" data-fechar class="btn-close" aria-label="Fechar"></button></div><label class="form-label" for="carga-tipo">Tipo</label><select id="carga-tipo" class="form-select mb-3"><option value="ROTINA">Rotina</option><option value="COMPLETA">Completa</option><option value="PARCIAL">Parcial</option></select><div data-anos hidden><label for="carga-anos" class="form-label">Anos (opcional, separados por vírgula)</label><input id="carga-anos" class="form-control mb-3" placeholder="Ex.: 2024, 2025, 2026"></div><div class="mb-3"><span class="form-label d-block">Ativos (opcional)</span><busca-ativos modo="multiplo"></busca-ativos><small class="text-muted">Sem seleção: todos os ativos.</small></div><fieldset data-etapas class="my-3" hidden><legend class="fs-6">Etapas</legend>${ETAPAS_CARGA.map(e => `<label class="me-3 mb-2"><input type="checkbox" name="etapa" value="${e}"> ${e}</label>`).join('')}</fieldset><label class="d-block my-3"><input type="checkbox" data-forcar> Forçar reprocessamento</label><div data-erro role="alert" class="text-danger mb-2"></div><div data-resumo class="alert alert-info" hidden></div><button type="submit" class="btn btn-primary" data-revisar>Revisar carga</button><button type="button" class="btn btn-primary" data-confirmar hidden>Confirmar e iniciar carga</button><button type="button" class="btn btn-secondary ms-2" data-voltar hidden>Voltar e editar</button></form></dialog>`; }
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
    this.querySelectorAll('#carga-tipo,#carga-anos,[name="etapa"],[data-forcar]').forEach(e => { e.disabled = false; });
    this._congelarBusca(false);
    this.querySelector('[data-confirmar]').hidden = true;
    this.querySelector('[data-voltar]').hidden = true;
    this.querySelector('[data-revisar]').hidden = false;
    this.querySelector('[data-resumo]').hidden = true;
    this.querySelector('[data-erro]').textContent = '';
  }
  revisar() {
    if (this._enviando || this._ativa) return;
    try { const busca = this.querySelector('busca-ativos');
      this._pendente = validarCarga({ tipo: this.querySelector('#carga-tipo').value, anos: this.querySelector('#carga-anos').value, simbolos: busca.simbolos || [], etapas: [...this.querySelectorAll('[name="etapa"]:checked')].map(e => e.value), forcar: this.querySelector('[data-forcar]').checked });
      this.querySelector('[data-erro]').textContent = '';
      this.querySelector('[data-resumo]').textContent = resumoCarga(this._pendente);
      this.querySelector('[data-resumo]').hidden = false;
      this.querySelectorAll('#carga-tipo,#carga-anos,[name="etapa"],[data-forcar]').forEach(e => { e.disabled = true; });
      this._congelarBusca(true);
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
  // A busca redesenha cartões e filtros a cada ação; inert congela tudo o que ela desenhar
  // enquanto a revisão está na tela, sem depender dos detalhes internos do componente.
  _congelarBusca(congelar) { const busca = this.querySelector('busca-ativos'); if (busca) busca.inert = congelar; }
  _abrirExecucao(id) { this._ativa = id; this.querySelector('dialog').close(); this.dispatchEvent(new CustomEvent('carga-aberta', { detail: { id }, bubbles: true })); }
  disconnectedCallback() { this.querySelector('dialog')?.close(); }
}
customElements.define('rodar-carga', RodarCarga);
