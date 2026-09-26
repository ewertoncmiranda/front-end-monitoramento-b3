// Unica responsabilidade: coordenar navegação, busca e progresso da área de estudos.
import { BaseComponent } from '../components/base/BaseComponent.js';
import { niveis, apimec } from '../estudos/conteudo.js';
import { ProgressoEstudos } from '../estudos/progresso.js';
import { normalizar } from '../estudos/texto.js';
import { renderTrilhas, renderConhecimento, renderOrientacoes, renderMateriais } from '../estudos/apresentacao.js';

const secoes = { trilhas: 'Planos de estudo', conhecimento: 'Conhecimento', orientacoes: 'Orientações', materiais: 'Material didático' };

export class EstudosPage extends BaseComponent {
  constructor() {
    super();
    let armazenamento;
    try { armazenamento = window.localStorage; } catch { /* O estudo funciona sem persistência. */ }
    this.progresso = new ProgressoEstudos(armazenamento, [...niveis, ...apimec].map(n => n.id));
    this.secao = 'trilhas';
    this.percurso = 'formacao';
  }

  template() {
    return `<section aria-labelledby="estudos-titulo" class="mb-5">
      <header class="bg-dark text-white rounded-4 p-4 p-md-5 mb-4">
        <span class="badge text-bg-light mb-3">B3 ECOSYSTEM · APRENDIZAGEM</span>
        <div class="row align-items-center g-4"><div class="col-lg-8"><h1 id="estudos-titulo" class="display-6 fw-semibold">Entenda os dados.<br>Construa sua análise.</h1><p class="lead mb-0 text-white-50">Da primeira vela à pesquisa reproduzível: conhecimento, prática e critérios para avançar no seu ritmo.</p></div><div class="col-lg-4"><div class="border border-secondary rounded-3 p-3"><p class="small text-white-50 mb-1">UM MÉTODO PARA CADA ETAPA</p><p class="mb-0">Descrever → classificar → comparar → testar → reproduzir</p></div></div></div>
      </header>
      <nav class="d-flex flex-wrap gap-2 mb-4" aria-label="Seções de estudos">${Object.entries(secoes).map(([id, nome]) => `<button class="btn ${id === this.secao ? 'btn-primary' : 'btn-outline-secondary'}" data-secao="${id}" aria-pressed="${id === this.secao}" aria-controls="estudos-conteudo">${nome}</button>`).join('')}</nav>
      <div class="row align-items-end g-3 mb-4"><div class="col-md-7"><label for="estudos-busca" class="form-label small">Buscar nesta seção</label><input type="search" class="form-control" id="estudos-busca" placeholder="Ex.: valuation, risco, candles, APIMEC" autocomplete="off"></div><div class="col-md-5"><p id="estudos-salvamento" class="small text-secondary mb-0" role="status"></p></div></div>
      <div id="estudos-contagem" class="small text-secondary mb-2" role="status"></div>
      <div id="estudos-conteudo"></div>
      <p id="estudos-vazio" class="alert alert-light border d-none">Nenhum resultado nesta seção. Tente outro termo ou consulte o <a href="#/glossario">Glossário</a>.</p>
      <footer class="border-top mt-4 pt-3 small text-secondary">Formação educativa. As estimativas de duração e metas de estudo são pedagógicas. Concluir a trilha não certifica competência profissional nem garante rentabilidade.</footer>
    </section>`;
  }

  afterRender() {
    this.onclick = evento => {
      const secao = evento.target.closest('[data-secao]');
      if (secao) {
        this.secao = secao.dataset.secao;
        this.querySelectorAll('[data-secao]').forEach(btn => {
          const ativa = btn.dataset.secao === this.secao;
          btn.classList.toggle('btn-primary', ativa);
          btn.classList.toggle('btn-outline-secondary', !ativa);
          btn.setAttribute('aria-pressed', String(ativa));
        });
        this.querySelector('#estudos-busca').value = '';
        this.renderConteudo();
      }
      const percurso = evento.target.closest('[data-percurso]');
      if (percurso) { this.percurso = percurso.dataset.percurso; this.renderConteudo(); }
      if (evento.target.closest('[data-continuar]')) {
        this.querySelector('#estudos-busca').value = '';
        this.filtrar();
        const id = this.progresso.proximo(this.idsPercurso());
        const etapa = this.querySelector(`#etapa-${id}`);
        if (etapa) { etapa.open = true; etapa.scrollIntoView({ block: 'start' }); etapa.querySelector('summary').focus(); }
      }
    };
    this.onchange = evento => {
      if (!evento.target.matches('[data-concluir]')) return;
      const { concluir: id } = evento.target.dataset;
      this.progresso.concluir(id, evento.target.checked);
      this.querySelector(`[data-selo="${id}"]`).classList.toggle('d-none', !evento.target.checked);
      const resumo = this.progresso.resumo(this.idsPercurso());
      this.querySelector('[data-progresso-texto]').textContent = `${resumo.concluidos} de ${resumo.total} etapas concluídas`;
      const barra = this.querySelector('[role="progressbar"]');
      barra.setAttribute('aria-valuenow', resumo.percentual);
      barra.firstElementChild.style.width = `${resumo.percentual}%`;
      barra.firstElementChild.textContent = `${resumo.percentual}%`;
      const continuar = this.querySelector('[data-continuar]');
      continuar.disabled = !this.progresso.proximo(this.idsPercurso());
      continuar.textContent = continuar.disabled ? 'Percurso concluído' : 'Continuar estudos';
      this.atualizarSalvamento();
    };
    this.querySelector('#estudos-busca').addEventListener('input', () => this.filtrar());
    this.renderConteudo();
  }

  idsPercurso() { return (this.percurso === 'apimec' ? apimec : niveis).map(n => n.id); }

  atualizarSalvamento() {
    this.querySelector('#estudos-salvamento').textContent = this.progresso.persistente
      ? 'Progresso salvo apenas neste navegador. Não sincroniza entre dispositivos.'
      : 'Armazenamento indisponível: progresso mantido apenas enquanto esta página estiver aberta.';
  }

  renderConteudo() {
    const renderizadores = { trilhas: () => renderTrilhas(this.progresso, this.percurso), conhecimento: renderConhecimento, orientacoes: renderOrientacoes, materiais: renderMateriais };
    this.querySelector('#estudos-conteudo').innerHTML = renderizadores[this.secao]();
    this.atualizarSalvamento();
    this.filtrar();
  }

  filtrar() {
    const termo = normalizar(this.querySelector('#estudos-busca').value.trim());
    let visiveis = 0;
    this.querySelectorAll('[data-estudo-busca]').forEach(el => {
      const combina = !termo || el.dataset.estudoBusca.includes(termo);
      el.classList.toggle('d-none', !combina);
      if (combina) visiveis++;
    });
    this.querySelector('#estudos-vazio').classList.toggle('d-none', visiveis > 0);
    this.querySelector('#estudos-contagem').textContent = termo ? `${visiveis} resultado(s) nesta seção` : '';
  }
}

customElements.define('estudos-page', EstudosPage);
