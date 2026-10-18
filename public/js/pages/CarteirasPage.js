// CART-PAI-7 / CARTDB-PAI-1..2 — Pagina de carteiras: lista, cria, edita e
// remove no gestor, e importa para ele as carteiras antigas do navegador.
import { BaseComponent } from '../components/base/BaseComponent.js';
import { limparCarteirasLocais, listarCarteiras as listarLocais } from '../utils/carteirasStore.js';
import { prepararImportacao } from '../analise/carteirasMigracao.js';
import {
  arquivarCarteira, importarCarteiras, listarCarteiras, mensagemDeErro,
} from '../api/carteirasApi.js';
import { escaparHtml } from '../utils/html.js';
import '../components/carteiras/CarteiraModal.js';
import '../components/carteiras/CarteiraCabecalho.js';
import '../components/carteiras/CarteiraAtivoLinha.js';
import '../components/carteiras/CarteiraAdicionarAtivo.js';

/** Painel de importacao: so aparece enquanto houver carteiras guardadas no navegador. */
export function htmlImportacao(locais) {
  if (!locais.length) return '';
  const nomes = locais.map((c) => escaparHtml(c.nome || 'sem nome')).join(', ');
  return `<div class="alert alert-info small d-flex flex-wrap justify-content-between align-items-center gap-2" role="status">
    <span><strong>${locais.length} carteira(s) deste navegador ainda não estão no gestor:</strong> ${nomes}.
      A cópia do navegador só é apagada depois que o gestor confirmar.</span>
    <button type="button" class="btn btn-sm btn-primary" data-acao="importar">Importar para o gestor</button>
  </div>`;
}

export function htmlResultadoImportacao({ resposta = null, erro = null, avisos = [] }) {
  const listaAvisos = avisos.length
    ? `<ul class="mb-0 mt-1">${avisos.map((a) => `<li class="text-muted">${escaparHtml(a)}</li>`).join('')}</ul>`
    : '';
  if (erro) {
    return `<div class="alert alert-warning small" role="alert"><strong>Importação não concluída: nada foi gravado e a cópia do navegador foi mantida.</strong>
      <div>${escaparHtml(mensagemDeErro(erro))}</div>${listaAvisos}</div>`;
  }
  const novas = Number(resposta?.importadas ?? 0);
  const existentes = Number(resposta?.jaExistentes ?? 0);
  return `<div class="alert alert-success small" role="status"><strong>Importação concluída: a cópia do navegador foi apagada.</strong>
    <div>${novas} carteira(s) nova(s) no gestor${existentes ? `, ${existentes} já estava(m) lá (nada duplicado)` : ''}.</div>${listaAvisos}</div>`;
}

export function htmlListaCarteiras(carteiras) {
  if (!carteiras.length) {
    return `
<div class="text-center py-5">
  <p class="text-muted mb-3">Nenhuma carteira criada ainda.</p>
  <button class="btn btn-primary" data-acao="nova-carteira">Criar primeira carteira</button>
</div>`;
  }
  return carteiras.map((c) => {
    const ativos = c.ativos ?? [];
    const linhas = ativos
      .map((a) => `<carteira-ativo-linha data-simbolo="${escaparHtml(a.simbolo)}"></carteira-ativo-linha>`)
      .join('');
    return `
<div class="mb-4" data-carteira-id="${escaparHtml(c.id)}">
  <carteira-cabecalho></carteira-cabecalho>
  ${ativos.length > 0 ? `<div class="table-responsive mb-2">
    <table class="table table-sm align-middle">
      <thead><tr><th>Ativo</th><th>Entrada</th><th>Capital</th><th>Retorno</th><th></th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
  </div>` : ''}
  <carteira-adicionar-ativo></carteira-adicionar-ativo>
</div>`;
  }).join('');
}

export class CarteirasPage extends BaseComponent {
  template() {
    return `
<div class="container py-3">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="h4 mb-0">Carteiras</h1>
    <button class="btn btn-primary" data-acao="nova-carteira">Nova carteira</button>
  </div>
  <p class="small text-muted mb-3">Carteiras salvas no gestor: sobrevivem a recarregar a página e a reiniciar o Docker.
    São compartilhadas por quem usa esta instância (não há separação por usuário). Capital é alocação simulada, não compra executada.</p>
  <carteira-modal id="modal-carteira"></carteira-modal>
  <div id="carteiras-importacao"></div>
  <div id="carteiras-erro"></div>
  <div id="lista-carteiras">
    <p class="text-muted">Carregando carteiras…</p>
  </div>
</div>
`;
  }

  afterRender() {
    this._carteiras = [];
    this.addEventListener('click', (e) => {
      if (e.target.closest('[data-acao="nova-carteira"]')) this.querySelector('#modal-carteira')?.abrirNova();
      if (e.target.closest('[data-acao="importar"]')) this.importar();
      if (e.target.closest('[data-acao="recarregar"]')) this.carregar();
    });
    this.querySelector('#modal-carteira')?.addEventListener('carteira-salva', () => this.carregar());
    this.addEventListener('editar-carteira', (e) => {
      const carteira = e.detail?.carteira;
      if (carteira) this.querySelector('#modal-carteira')?.abrirEdicao(carteira);
    });
    this.addEventListener('remover-carteira', (e) => this.remover(e.detail?.carteira));
    this.addEventListener('ativo-adicionado', () => this.carregar());
    this.carregar();
  }

  /** Lista no gestor. Falha nao toca na copia do navegador: ela continua importavel. */
  async carregar() {
    this._mostrarErro('');
    try {
      this._carteiras = await listarCarteiras();
      this._desenharImportacao();
      this._renderizarCarteiras(this._carteiras);
    } catch (erro) {
      const locais = listarLocais().length;
      this._lista().innerHTML = '';
      this.querySelector('#carteiras-importacao').innerHTML = '';
      this._mostrarErro(`${mensagemDeErro(erro)}${locais ? ` As ${locais} carteira(s) guardadas neste navegador estão preservadas e podem ser importadas quando o gestor responder.` : ''}`, true);
    }
  }

  async remover(carteira) {
    if (!carteira) return;
    if (!window.confirm(`Remover a carteira "${carteira.nome}"? Ela sai da lista e fica arquivada no gestor.`)) return;
    try {
      await arquivarCarteira(carteira.id);
      await this.carregar();
    } catch (erro) {
      this._mostrarErro(mensagemDeErro(erro));
    }
  }

  async importar() {
    const botao = this.querySelector('[data-acao="importar"]');
    if (botao) { botao.disabled = true; botao.textContent = 'Importando…'; }
    const { payload, avisos } = prepararImportacao(listarLocais());
    let resultado;
    try {
      const resposta = await importarCarteiras(payload);
      limparCarteirasLocais();
      resultado = { resposta, avisos };
    } catch (erro) {
      resultado = { erro, avisos };
    }
    await this.carregar();
    this.querySelector('#carteiras-importacao').insertAdjacentHTML('afterbegin', htmlResultadoImportacao(resultado));
  }

  _desenharImportacao() {
    this.querySelector('#carteiras-importacao').innerHTML = htmlImportacao(listarLocais());
  }

  _renderizarCarteiras(carteiras) {
    const lista = this._lista();
    if (!lista) return;
    lista.innerHTML = htmlListaCarteiras(carteiras);
    carteiras.forEach((c) => {
      const card = lista.querySelector(`[data-carteira-id="${CSS.escape(c.id)}"]`);
      if (!card) return;
      card.querySelector('carteira-cabecalho')?.setCarteira(c);
      const ativos = c.ativos ?? [];
      card.querySelectorAll('carteira-ativo-linha').forEach((linha, i) => {
        if (ativos[i]) linha.setAtivo(ativos[i]);
      });
      card.querySelector('carteira-adicionar-ativo')?.setCarteiraId(c.id, ativos.map((a) => a.simbolo));
    });
  }

  _lista() {
    return this.querySelector('#lista-carteiras');
  }

  _mostrarErro(mensagem, comRecarregar = false) {
    const alvo = this.querySelector('#carteiras-erro');
    if (!alvo) return;
    alvo.innerHTML = mensagem
      ? `<div class="alert alert-danger small d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>${escaparHtml(mensagem)}</span>
          ${comRecarregar ? '<button type="button" class="btn btn-sm btn-outline-danger" data-acao="recarregar">Tentar de novo</button>' : ''}
        </div>`
      : '';
  }
}

customElements.define('carteiras-page', CarteirasPage);
