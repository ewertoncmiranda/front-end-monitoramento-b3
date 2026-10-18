import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarCargas, obterCarga, obterUltimasCargas } from '../api/cargasApi.js';
import { listaCargas, cargaAtiva, escaparHtml, rotuloEtapa, dataCarga } from '../analise/cargas.js';
import '../components/cargas/EstadoEtapas.js';
import '../components/cargas/HistoricoCargas.js';
import '../components/cargas/DetalheCarga.js';
import '../components/cargas/RodarCarga.js';

export class CargasPage extends BaseComponent {
  template() {
    return `<div class="container py-3"><header class="d-flex justify-content-between align-items-center gap-2 mb-3"><div><h1 class="h4">Cargas de dados</h1><p data-andamento aria-live="polite"></p></div><button class="btn btn-primary" data-rodar>Rodar carga</button></header><div data-mensagem role="status"></div><estado-etapas></estado-etapas><historico-cargas></historico-cargas><detalhe-carga></detalhe-carga><rodar-carga></rodar-carga></div>`;
  }

  afterRender() {
    this._viva = true;
    this._abort = new AbortController();
    this.querySelector('[data-rodar]').onclick = () => this.querySelector('rodar-carga').abrir();
    const abrir = e => { window.location.hash = `#/cargas/${encodeURIComponent(e.detail.id)}`; };
    this.addEventListener('carga-abrir', abrir);
    this.addEventListener('carga-aberta', abrir);
    // O histórico filtra e pagina localmente o resultado completo. Não há disputa
    // entre uma consulta de filtro e a atualização ao vivo.
    this.addEventListener('cargas-filtrar', () => this._atualizar());
    this._visibilidade = () => {
      this._parar();
      if (!document.hidden && this._viva) this._atualizar();
    };
    document.addEventListener('visibilitychange', this._visibilidade);
    this._atualizar();
  }

  disconnectedCallback() {
    this._viva = false;
    this._parar();
    this._abort?.abort();
    document.removeEventListener('visibilitychange', this._visibilidade);
  }

  _parar() {
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
  }

  _agendar() {
    this._parar();
    if (this._viva && !document.hidden && this._ativa) {
      this._timer = setTimeout(() => this._atualizar(), 5000);
    }
  }

  async _atualizar() {
    if (this._ocupada || !this._viva || document.hidden) return;
    this._ocupada = true;
    try {
      const opcoes = { signal: this._abort.signal };
      const [ultimas, historico] = await Promise.all([
        obterUltimasCargas(opcoes), listarCargas({ limite: 500 }, opcoes),
      ]);
      if (!this._viva) return;
      const lista = listaCargas(historico);
      const ativa = lista.find(cargaAtiva);
      const selecionada = decodeURIComponent(window.location.hash.split('?')[0].split('/')[2] || '');
      const ids = [...new Set([selecionada, ativa?.id].filter(Boolean))];
      const detalhes = await Promise.all(ids.map(id => obterCarga(id, opcoes)));
      if (!this._viva) return;
      const detalhe = detalhes.find(e => e.id === selecionada);
      const andamento = detalhes.find(cargaAtiva);
      this._ativa = andamento?.id || null;
      this.querySelector('estado-etapas').setDados(ultimas);
      this.querySelector('historico-cargas').setDados(historico);
      if (detalhe) this.querySelector('detalhe-carga').setExecucao(detalhe);
      const etapa = andamento?.etapas?.find(e => e.status === 'EXECUTANDO');
      const inicio = dataCarga(andamento?.iniciadaEm);
      const minutos = inicio ? Math.max(0, Math.floor((Date.now() - inicio) / 60000)) : null;
      this.querySelector('[data-andamento]').textContent = andamento
        ? `${andamento.tipo} em andamento${minutos !== null ? ` · há ${minutos} min` : ''}${etapa ? ` · ${rotuloEtapa(etapa.etapa)}` : ''}` : '';
      this.querySelector('[data-rodar]').disabled = !!this._ativa;
      this.querySelector('rodar-carga').setExecucaoAtiva(this._ativa);
      this.querySelector('[data-mensagem]').textContent = lista.length ? ''
        : 'Nenhuma carga registrada ainda — a primeira rotina da manhã preenche esta tela';
    } catch (e) {
      if (e.name === 'AbortError' || !this._viva) return;
      this.querySelector('[data-mensagem]').innerHTML = `<div class="alert alert-warning">${e.status === 503
        ? 'O banco ainda não tem o controle de cargas.'
        : `Não foi possível consultar as cargas: ${escaparHtml(e.message)}`} <button class="btn btn-outline-secondary btn-sm" data-tentar>Tentar de novo</button></div>`;
      this.querySelector('[data-tentar]').onclick = () => this._atualizar();
    } finally {
      this._ocupada = false;
      this._agendar();
    }
  }
}
customElements.define('cargas-page', CargasPage);
