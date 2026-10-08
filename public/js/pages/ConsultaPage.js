import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarFundamentos, buscarFundamentosCvm } from '../api/analisesApi.js';
import { buscarComposicaoCapital } from '../api/composicaoCapitalApi.js';
import { buscarPregoes, velasDoBanco } from '../api/pregoesApi.js';
import { buscarBacktest } from '../api/validacaoApi.js';
import { indicadores, precoDasVelas, selosDeQualidade } from '../analise/fichaDoAtivo.js';
import { ABAS, abaDoHash, abaValida, hashDaFicha, proximaAba } from '../analise/abasFicha.js';
import { escaparHtml } from '../utils/html.js';
import '../components/SeletorDeAtivos.js';
import '../components/FundamentosCard.js';
import '../components/FundamentosCvmCard.js';
import '../components/StatusAlert.js';
import '../components/ficha/AtivoHero.js';
import '../components/ficha/SinalCard.js';
import '../components/ficha/ValorJustoRegua.js';
import '../components/ficha/SelosQualidade.js';
import '../components/ficha/IndicadoresGrid.js';
import '../components/ficha/FatoresAtivo.js';
import '../components/ficha/ProventosContabeis.js';
import '../components/ficha/ComunicadosDoAtivo.js';
import '../components/ficha/OpiniaoHorizontes.js';
import '../components/ficha/ComposicaoCapital.js';

const CHAVE_RECENTES = 'ficha-recentes';
const MAX_RECENTES = 6;

// O placar muda uma vez por semana: uma chamada por sessao do navegador basta.
let backtestDaSessao = null;
function backtest() {
  backtestDaSessao ??= buscarBacktest().catch(() => {
    backtestDaSessao = null;
    return null;
  });
  return backtestDaSessao;
}

function lerRecentes() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_RECENTES) || '[]');
  } catch {
    return [];
  }
}

function guardarRecente(simbolo) {
  const lista = [simbolo, ...lerRecentes().filter((s) => s !== simbolo)].slice(0, MAX_RECENTES);
  try {
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify(lista));
  } catch {
    // Sem armazenamento (aba anonima): a lista de recentes so nao persiste.
  }
  return lista;
}

function umMesAtras(hoje = new Date()) {
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, hoje.getUTCDate())).toISOString().slice(0, 10);
}

// Unica responsabilidade: orquestrar a ficha do ativo - buscar cada fonte em
// paralelo e entregar a cada cartao o que ele desenha, assim que a sua parte
// chega. Nao sabe desenhar nada: cabecalho, sinal, valor justo, selos e
// indicadores sao componentes de components/ficha.
//
// Atributo `simbolo`: abre a ficha direto (link #/gestao/PETR4).
export class ConsultaPage extends BaseComponent {
  template() {
    return `
      <seletor-de-ativos rotulo-botao="Abrir ficha" placeholder="Ex.: PETR4  (atalho: /)"></seletor-de-ativos>
      <div class="d-flex align-items-center gap-2 flex-wrap mt-2 small" data-recentes></div>
      <div id="consulta-resultado" class="mt-3"></div>
    `;
  }

  afterRender() {
    this.querySelector('seletor-de-ativos').addEventListener('ativo-buscado', (e) => this.abrir(e.detail.simbolo));
    this.desenharRecentes(lerRecentes());

    this._atalho = (e) => {
      const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      if (e.key === '/' && !digitando && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.querySelector('seletor-de-ativos input')?.focus();
      }
    };
    document.addEventListener('keydown', this._atalho);

    const inicial = this.getAttribute('simbolo');
    if (inicial) this.querySelector('seletor-de-ativos').selecionar(inicial.toUpperCase());
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._atalho);
  }

  desenharRecentes(lista) {
    const area = this.querySelector('[data-recentes]');
    if (!lista.length) {
      area.innerHTML = '';
      return;
    }
    area.innerHTML = `<span class="text-body-secondary">Recentes:</span>
      ${lista.map((s) => `<button type="button" class="btn btn-link btn-sm p-0 link-secondary" data-recente="${escaparHtml(s)}">${escaparHtml(s)}</button>`).join('<span class="text-body-tertiary">·</span>')}`;
    area.querySelectorAll('[data-recente]').forEach((b) =>
      b.addEventListener('click', () => this.querySelector('seletor-de-ativos').selecionar(b.dataset.recente)));
  }

  async abrir(simbolo) {
    const resultado = this.querySelector('#consulta-resultado');
    this._simbolo = simbolo;
    const input = this.querySelector('seletor-de-ativos input');
    if (input) input.value = simbolo;
    // Link compartilhavel sem recarregar a pagina (hashchange remontaria tudo).
    this._aba = abaDoHash(window.location.hash);
    history.replaceState(null, '', hashDaFicha(simbolo, this._aba));
    this.desenharRecentes(guardarRecente(simbolo));

    resultado.innerHTML = `
      <div class="ficha d-flex flex-column gap-3">
        <ativo-hero></ativo-hero>
        <nav class="ficha-abas-nav" role="tablist" aria-label="Seções da ficha de ${escaparHtml(simbolo)}">
          ${ABAS.map((a) => `<button type="button" class="btn btn-sm" role="tab" id="aba-${a.id}" data-aba="${a.id}"
            aria-controls="painel-${a.id}" aria-selected="false" tabindex="-1">${a.rotulo}</button>`).join('')}
          <a class="btn btn-sm btn-link ms-auto" href="#/candles">Velas e padrões ›</a>
        </nav>
        <div id="painel-resumo" role="tabpanel" aria-labelledby="aba-resumo" class="d-flex flex-column gap-3">
          <div class="row g-3">
            <div class="col-lg-6"><sinal-card></sinal-card></div>
            <div class="col-lg-6"><valor-justo-regua></valor-justo-regua></div>
          </div>
          <opiniao-horizontes simbolo="${escaparHtml(simbolo)}"></opiniao-horizontes>
          <selos-qualidade></selos-qualidade>
          <indicadores-grid></indicadores-grid>
        </div>
        <div id="painel-fundamentos" role="tabpanel" aria-labelledby="aba-fundamentos" class="d-none" data-lazy></div>
        <div id="painel-fatores" role="tabpanel" aria-labelledby="aba-fatores" class="d-none" data-lazy></div>
        <div id="painel-comunicados" role="tabpanel" aria-labelledby="aba-comunicados" class="d-none ficha-cartao" data-lazy></div>
      </div>
    `;
    this._dados = { fundamentos: null, cvm: null, composicao: null };
    this.ligarAbas(resultado, simbolo);
    const $ = (tag) => resultado.querySelector(tag);
    $('ativo-hero').setAtivo({ simbolo });

    // Cada fonte falha sozinha: sem balanco ainda ha preco e analise, e vice-versa.
    const fundamentosP = buscarFundamentos(simbolo).catch(() => null);
    const cvmP = buscarFundamentosCvm(simbolo).catch(() => null);
    const composicaoP = buscarComposicaoCapital(simbolo).catch(() => null);
    const velasP = buscarPregoes(simbolo, { de: umMesAtras() }).then(velasDoBanco).catch(() => []);
    const aindaAqui = () => this._simbolo === simbolo && resultado.isConnected;

    velasP.then((velas) => aindaAqui() && $('ativo-hero').setVelas(velas));

    fundamentosP.then((fundamentos) => {
      if (!aindaAqui()) return;
      $('valor-justo-regua').setDados({ fundamentos });
      backtest().then((bt) => aindaAqui() && $('sinal-card').setDados({ fundamentos, backtest: bt }));
    });

    const [fundamentos, cvm, composicao, velas] = await Promise.all([fundamentosP, cvmP, composicaoP, velasP]);
    if (!aindaAqui()) return;

    if (!fundamentos && !cvm && velas.length === 0) {
      resultado.innerHTML = `<status-alert variante="warning"
        mensagem="Não há dados de ${escaparHtml(simbolo)} no banco. Confira o código ou veja a lista na aba Base."></status-alert>`;
      return;
    }

    const perfil = fundamentos?.perfilEmpresa || {};
    $('ativo-hero').setAtivo({ simbolo, setor: perfil.sector, industria: perfil.industry, cnpj: cvm?.cnpj });
    $('selos-qualidade').setSelos(selosDeQualidade({ fundamentos, cvm, ultimaVela: precoDasVelas(velas) }));
    $('indicadores-grid').setIndicadores(indicadores(fundamentos, cvm));
    this._dados = { fundamentos, cvm, composicao };
    // Link direto para a aba Fundamentos: o painel so pode ser montado quando os dados chegam.
    if (this._aba === 'fundamentos') this.montarPainel(resultado, 'fundamentos', simbolo);
  }

  /** Abas da ficha (REQ-UX-9): troca sem recarregar, painel lazy, aba no link e teclado (setas/Home/End). */
  ligarAbas(resultado, simbolo) {
    const nav = resultado.querySelector('.ficha-abas-nav');
    const ativar = (id, { foco = false } = {}) => {
      this._aba = abaValida(id);
      nav.querySelectorAll('[data-aba]').forEach((b) => {
        const ativa = b.dataset.aba === this._aba;
        b.classList.toggle('btn-primary', ativa);
        b.classList.toggle('btn-outline-secondary', !ativa);
        b.setAttribute('aria-selected', String(ativa));
        b.tabIndex = ativa ? 0 : -1;
        if (ativa && foco) b.focus();
      });
      ABAS.forEach((a) => resultado.querySelector(`#painel-${a.id}`).classList.toggle('d-none', a.id !== this._aba));
      history.replaceState(null, '', hashDaFicha(simbolo, this._aba));
      // Fundamentos espera os dados da analise; as demais abas buscam sozinhas.
      if (this._aba !== 'fundamentos' || this._dados.fundamentos || this._dados.cvm) {
        this.montarPainel(resultado, this._aba, simbolo);
      }
    };
    nav.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-aba]');
      if (botao) ativar(botao.dataset.aba);
    });
    nav.addEventListener('keydown', (e) => {
      const proxima = proximaAba(this._aba, e.key);
      if (proxima) {
        e.preventDefault();
        ativar(proxima, { foco: true });
      }
    });
    ativar(this._aba);
  }

  /** Monta o conteudo de uma aba so na primeira vez que ela aparece. */
  montarPainel(resultado, aba, simbolo) {
    const painel = resultado.querySelector(`#painel-${aba}`);
    if (!painel || !painel.hasAttribute('data-lazy') || painel.childElementCount) return;
    const seguro = escaparHtml(simbolo);
    if (aba === 'fundamentos') {
      painel.innerHTML = '<fundamentos-cvm-card></fundamentos-cvm-card><composicao-capital></composicao-capital><fundamentos-card></fundamentos-card>';
      painel.querySelector('fundamentos-cvm-card').setFundamentos(this._dados.cvm);
      painel.querySelector('composicao-capital').setDados(this._dados.composicao);
      painel.querySelector('fundamentos-card').setFundamentos(this._dados.fundamentos);
    } else if (aba === 'fatores') {
      painel.innerHTML = `<div class="row g-3">
        <div class="col-lg-6"><fatores-ativo simbolo="${seguro}"></fatores-ativo></div>
        <div class="col-lg-6"><proventos-contabeis simbolo="${seguro}"></proventos-contabeis></div></div>`;
    } else if (aba === 'comunicados') {
      painel.innerHTML = `<p class="ficha-rotulo">Comunicados oficiais (CVM)</p><comunicados-do-ativo simbolo="${seguro}"></comunicados-do-ativo>`;
    }
  }
}

customElements.define('consulta-page', ConsultaPage);
