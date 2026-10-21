import { BaseComponent } from '../base/BaseComponent.js';
import { mensagemDeErro } from '../../api/carteirasApi.js';
import { hojeLocal, novaChave, registrarOperacao } from '../../api/carteirasOperacoesApi.js';
import { buscarPrecoNaData, buscarUltimoFechamento } from '../../api/carteirasPrecoApi.js';
import { totalEstimado } from '../../analise/carteiraPosicao.js';
import { formatarData } from '../../utils/dataHora.js';
import { formatarMoeda } from '../../utils/numero.js';
import '../busca/BuscaAtivos.js';

/**
 * Valida a ordem de forma pura. Retorna a mensagem de erro ou null.
 * `estado.preco` = { status: 'ok'|'carregando'|'sem-cotacao'|'erro', ... }.
 */
export function validarCompra({ simbolo, quantidade, data, preco, status = 'ok' }, hoje = hojeLocal()) {
  if (!simbolo) return 'Selecione ou digite um ativo antes de adicionar.';
  const q = Number(quantidade);
  if (quantidade === '' || quantidade === null || quantidade === undefined || !Number.isInteger(q) || q <= 0) return 'A quantidade deve ser um número inteiro maior que zero.';
  if (!data) return 'Informe a data de entrada.';
  if (data > hoje) return 'A data de entrada não pode ser uma data futura.';
  if (status === 'carregando') return 'Aguarde o preço do dia carregar.';
  if (status === 'sem-cotacao') return `${simbolo} não tem cotação: não é possível registrar sem preço.`;
  if (status === 'erro' && !(Number(preco) > 0)) return 'Não foi possível buscar o preço do dia; informe o preço manualmente ou tente de novo.';
  if (!(Number(preco) > 0)) return 'O preço deve ser maior que zero.';
  return null;
}

/**
 * Formulario "Adicionar ações": registra uma operacao de COMPRA no gestor.
 * API: setCarteiraId(id, simbolosExistentes), preencher(simbolo)
 * Evento: ativo-adicionado { simbolo, quantidade, preco, operacao }
 */
export class CarteiraAdicionarAtivo extends BaseComponent {
  constructor() {
    super();
    this._carteiraId = null;
    this._simbolo = '';
    this._preco = { status: 'ok', valor: '', data: null, manual: false };
  }

  template() {
    const hoje = hojeLocal();
    return `
      <div id="form-adicionar-ativo" class="card card-body mb-3">
        <h2 class="h6 mb-3">Adicionar ações</h2>
        <div id="msg-form" role="alert"></div>
        <div class="mb-3">
          <span class="form-label fw-semibold d-block">Ativo</span>
          <busca-ativos id="seletor-ativo" modo="unico"></busca-ativos>
        </div>
        <div class="row g-3 mb-2">
          <div class="col-12 col-md-3">
            <label for="quantidade" class="form-label fw-semibold">Quantidade de ações</label>
            <input type="number" id="quantidade" class="form-control" min="1" step="1" inputmode="numeric" placeholder="100">
          </div>
          <div class="col-12 col-md-3">
            <label for="data-entrada" class="form-label fw-semibold">Data de entrada</label>
            <input type="date" id="data-entrada" class="form-control" max="${hoje}" value="${hoje}">
          </div>
          <div class="col-12 col-md-3">
            <label for="preco" class="form-label fw-semibold">Preço (R$)</label>
            <input type="number" id="preco" class="form-control" min="0.01" step="0.01" readonly aria-describedby="preco-info">
            <div id="preco-info" class="form-text" aria-live="polite">Escolha um ativo para ver o preço do dia.</div>
            <button type="button" id="btn-editar-preco" class="btn btn-link btn-sm p-0" hidden>Editar preço</button>
          </div>
          <div class="col-12 col-md-3">
            <label for="corretagem" class="form-label fw-semibold">Corretagem (opcional)</label>
            <input type="number" id="corretagem" class="form-control" min="0" step="0.01" placeholder="0,00">
          </div>
        </div>
        <p class="mb-2" aria-live="polite">Total estimado: <strong id="total-estimado">—</strong></p>
        <p class="small text-body-secondary mb-3">Registro informado, não ordem executada: nada é enviado à corretora.</p>
        <button type="button" id="btn-adicionar" class="btn btn-success">Adicionar ações</button>
      </div>
    `;
  }

  afterRender() {
    this._simbolo = '';
    this._preco = { status: 'ok', valor: '', data: null, manual: false };
    this._chave = null;
    const busca = this.querySelector('#seletor-ativo');
    busca.addEventListener('busca-ativos:selecao', (e) => {
      this._simbolo = e.detail?.simbolos?.[0] ?? '';
      this._carregarPreco();
    });
    this.querySelector('#quantidade').addEventListener('input', () => this._atualizarTotal());
    this.querySelector('#corretagem').addEventListener('input', () => this._atualizarTotal());
    this.querySelector('#preco').addEventListener('input', (e) => {
      this._preco = { ...this._preco, valor: e.target.value, manual: true, status: 'ok' };
      this._atualizarPrecoInfo();
      this._atualizarTotal();
    });
    this.querySelector('#data-entrada').addEventListener('change', () => this._carregarPreco());
    this.querySelector('#btn-editar-preco').addEventListener('click', () => {
      const campo = this.querySelector('#preco');
      campo.readOnly = false;
      campo.focus();
    });
    // Sem <form>: a carteira fica dentro de outro formulario da pagina (form aninhado).
    this.querySelector('#btn-adicionar').addEventListener('click', () => this._submeter());
  }

  setCarteiraId(id, simbolosExistentes = []) {
    this._carteiraId = id;
    this._existentes = simbolosExistentes.map((s) => String(s).toUpperCase());
    // Uma busca por carteira: cada uma guarda seus filtros e seu ticker na sessao.
    const busca = this.querySelector('#seletor-ativo');
    if (busca) {
      busca.setAttribute('chave', `carteira-${id}`);
      this._simbolo = busca.simbolos?.[0] ?? '';
      if (this._simbolo) this._carregarPreco();
    }
  }

  /** "Comprar mais" do card: preenche o ticker, rola ate o formulario e foca a quantidade. */
  preencher(simbolo) {
    this._simbolo = String(simbolo).toUpperCase();
    this.querySelector('#seletor-ativo')?.setAttribute('valor', this._simbolo);
    this._carregarPreco();
    this.querySelector('#form-adicionar-ativo')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    this.querySelector('#quantidade')?.focus?.();
  }

  /** Preco do dia: ultimo fechamento (hoje) ou o fechamento da data escolhida. Cada resposta so vale se ainda for a ultima pedida. */
  async _carregarPreco() {
    const simbolo = this._simbolo;
    const data = this.querySelector('#data-entrada')?.value || hojeLocal();
    const token = (this._tokenPreco = (this._tokenPreco || 0) + 1);
    if (!simbolo) {
      this._preco = { status: 'ok', valor: '', data: null, manual: false };
      this._atualizarPrecoInfo();
      this._atualizarTotal();
      return;
    }
    this._preco = { status: 'carregando', valor: '', data: null, manual: false };
    this._atualizarPrecoInfo();
    try {
      const r = data >= hojeLocal() ? await buscarUltimoFechamento(simbolo) : await buscarPrecoNaData(simbolo, data).then((x) => (x ? { preco: x.preco, dataIso: x.dataEfetiva } : null));
      if (token !== this._tokenPreco) return;
      this._preco = r ? { status: 'ok', valor: String(r.preco), data: r.dataIso, manual: false } : { status: 'sem-cotacao', valor: '', data: null, manual: false };
    } catch {
      if (token !== this._tokenPreco) return;
      this._preco = { status: 'erro', valor: '', data: null, manual: false };
    }
    this._atualizarPrecoInfo();
    this._atualizarTotal();
  }

  _atualizarPrecoInfo() {
    const { status, valor, data, manual } = this._preco;
    const campo = this.querySelector('#preco');
    const info = this.querySelector('#preco-info');
    const editar = this.querySelector('#btn-editar-preco');
    if (campo) { campo.value = valor; campo.readOnly = status !== 'erro' && !manual; }
    if (editar) editar.hidden = !(status === 'ok' && valor !== '' && !manual);
    if (!info) return;
    info.textContent = {
      carregando: 'Carregando o preço do dia…',
      'sem-cotacao': 'Ativo sem cotação: não dá para registrar.',
      erro: 'Erro de rede ao buscar o preço. Tente de novo ou informe o preço.',
      ok: manual ? 'Preço informado manualmente' : data ? `Fechamento de ${formatarData(data)}` : 'Escolha um ativo para ver o preço do dia.',
    }[status];
  }

  _atualizarTotal() {
    const total = totalEstimado(this.querySelector('#quantidade')?.value, this._preco.valor, this.querySelector('#corretagem')?.value);
    const alvo = this.querySelector('#total-estimado');
    if (alvo) alvo.textContent = total === null ? '—' : formatarMoeda(total);
    return total;
  }

  _validarCampos(simbolo, quantidade, data) {
    return validarCompra({ simbolo, quantidade, data, preco: this._preco.valor, status: this._preco.status });
  }

  async _submeter() {
    this._mensagem('');
    const quantidade = this.querySelector('#quantidade')?.value ?? '';
    const data = this.querySelector('#data-entrada')?.value ?? '';
    const simbolo = this._simbolo;
    const erro = this._validarCampos(simbolo, quantidade, data);
    if (erro) return this._mensagem(erro, 'danger');
    // Uma chave por tentativa: reenviar depois de falha de rede nao duplica a compra.
    this._chave = this._chave || novaChave('compra');
    const botao = this.querySelector('#btn-adicionar');
    if (botao) botao.disabled = true;
    const preco = Number(this._preco.valor);
    try {
      const operacao = await registrarOperacao(this._carteiraId, {
        tipo: 'COMPRA', simbolo, data, quantidade: Number(quantidade), precoUnitario: preco,
        custos: Number(this.querySelector('#corretagem')?.value) || 0, chave: this._chave,
      });
      this._chave = null;
      this._resetar();
      this._mensagem(`Registrado: ${quantidade} ${simbolo} a ${formatarMoeda(preco)}${this._preco.manual ? ' (preço informado manualmente)' : ''}. Registro informado, não ordem executada.`, 'success');
      this.dispatchEvent(new CustomEvent('ativo-adicionado', { detail: { simbolo, quantidade: Number(quantidade), preco, operacao }, bubbles: true }));
    } catch (err) {
      this._mensagem(mensagemDeErro(err), 'danger');
    } finally {
      if (botao) botao.disabled = false;
    }
  }

  _mensagem(texto, tipo = 'danger') {
    const alvo = this.querySelector('#msg-form');
    if (!alvo) return;
    alvo.className = texto ? `alert alert-${tipo} py-2 small` : '';
    alvo.textContent = texto;
  }

  _resetar() {
    this._simbolo = '';
    this._preco = { status: 'ok', valor: '', data: null, manual: false };
    const q = this.querySelector('#quantidade');
    const c = this.querySelector('#corretagem');
    if (q) q.value = '';
    if (c) c.value = '';
    this._atualizarPrecoInfo();
    this._atualizarTotal();
    // Tira o ticker escolhido; filtros e resultados ficam para o proximo ativo.
    this.querySelector('#seletor-ativo')?.limpar?.();
  }
}

if (!customElements.get('carteira-adicionar-ativo')) customElements.define('carteira-adicionar-ativo', CarteiraAdicionarAtivo);
