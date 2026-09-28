import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarFundamentos, buscarFundamentosCvm } from '../api/analisesApi.js';
import { buscarPregoes, velasDoBanco } from '../api/pregoesApi.js';
import { buscarBacktest } from '../api/validacaoApi.js';
import { indicadores, precoDasVelas, selosDeQualidade } from '../analise/fichaDoAtivo.js';
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
    history.replaceState(null, '', `#/gestao/${encodeURIComponent(simbolo)}`);
    this.desenharRecentes(guardarRecente(simbolo));

    resultado.innerHTML = `
      <div class="ficha d-flex flex-column gap-3">
        <ativo-hero></ativo-hero>
        <div class="row g-3">
          <div class="col-lg-6"><sinal-card></sinal-card></div>
          <div class="col-lg-6"><valor-justo-regua></valor-justo-regua></div>
        </div>
        <selos-qualidade></selos-qualidade>
        <indicadores-grid></indicadores-grid>
        <details class="ficha-cartao ficha-detalhes">
          <summary>Números completos da análise e do balanço</summary>
          <div class="mt-3" data-detalhes></div>
        </details>
      </div>
    `;
    const $ = (tag) => resultado.querySelector(tag);
    $('ativo-hero').setAtivo({ simbolo });

    // Cada fonte falha sozinha: sem balanco ainda ha preco e analise, e vice-versa.
    const fundamentosP = buscarFundamentos(simbolo).catch(() => null);
    const cvmP = buscarFundamentosCvm(simbolo).catch(() => null);
    const velasP = buscarPregoes(simbolo, { de: umMesAtras() }).then(velasDoBanco).catch(() => []);
    const aindaAqui = () => this._simbolo === simbolo && resultado.isConnected;

    velasP.then((velas) => aindaAqui() && $('ativo-hero').setVelas(velas));

    fundamentosP.then((fundamentos) => {
      if (!aindaAqui()) return;
      $('valor-justo-regua').setDados({ fundamentos });
      backtest().then((bt) => aindaAqui() && $('sinal-card').setDados({ fundamentos, backtest: bt }));
    });

    const [fundamentos, cvm, velas] = await Promise.all([fundamentosP, cvmP, velasP]);
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
    this.prepararDetalhes($('.ficha-detalhes'), fundamentos, cvm);
  }

  /** Os cartoes completos (antigo "Como funciona") so sao montados ao abrir. */
  prepararDetalhes(detalhes, fundamentos, cvm) {
    detalhes.addEventListener('toggle', () => {
      const alvo = detalhes.querySelector('[data-detalhes]');
      if (!detalhes.open || alvo.childElementCount) return;
      alvo.innerHTML = '<fundamentos-cvm-card></fundamentos-cvm-card><fundamentos-card></fundamentos-card>';
      alvo.querySelector('fundamentos-cvm-card').setFundamentos(cvm);
      alvo.querySelector('fundamentos-card').setFundamentos(fundamentos);
    });
  }
}

customElements.define('consulta-page', ConsultaPage);
