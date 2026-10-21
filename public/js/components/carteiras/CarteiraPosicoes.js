// CARTEIRAS-CARDS — Posicoes de uma carteira: carrega operacoes e cotacoes,
// deriva as posicoes e desenha barra de ferramentas, alocacao, cards/tabela e evolucao.
import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { formatarMoeda } from '../../utils/numero.js';
import { mensagemDeErro, removerAtivo } from '../../api/carteirasApi.js';
import { estornarOperacao, hojeLocal, novaChave, registrarOperacao } from '../../api/carteirasOperacoesApi.js';
import { carregarDadosCarteira, carregarReferencias, precoNaEntrada } from '../../api/carteirasDadosApi.js';
import {
  alocacao, avaliarPosicao, comParticipacao, converterCapitalEmQuantidade, filtrarPosicoes, LIMITE_CONCENTRACAO,
  ordenarPosicoes, posicaoLegada, posicoesAbertas, resumirCarteira, totalEstimado,
} from '../../analise/carteiraPosicao.js';
import { operacoesEfetivas } from '../../analise/carteiraPosicao.js';
import { proventosPorAtivo, totaisProventos } from '../../analise/carteiraProventos.js';
import { montarEvolucao } from '../../analise/carteiraEvolucao.js';
import { htmlCardAtivo, htmlLinhaAtivo } from './CarteiraCardAtivo.js';
import {
  htmlAlocacao, htmlBarraFerramentas, htmlEvolucao, htmlGradeSkeleton, htmlPainelVenda, htmlVazio, lerPrefs, salvarPrefs,
} from './carteiraSecoes.js';

/** Constroi as posicoes (abertas + legadas) ja avaliadas, com participacao, proventos e concentracao. Pura. */
export function construirPosicoes(carteira, dados, hoje = hojeLocal()) {
  const { operacoes, series = {}, setores = {}, recebidos = null, proventosAtivo = {} } = dados;
  const abertas = posicoesAbertas(operacoes);
  const comOperacao = new Set(operacoesEfetivas(operacoes).map((o) => String(o.simbolo).toUpperCase()));
  const mercado = (s, desde) => {
    const m = series[s];
    return { preco: m?.preco ?? null, dataPreco: m?.dataIso ?? null, serie: (m?.serie || []).filter((p) => !desde || p.dataIso >= desde), setor: setores[s] ?? null, hoje };
  };
  const posicoes = abertas.map((p) => avaliarPosicao(p, mercado(p.simbolo, p.dataEntrada)));
  for (const a of carteira.ativos || []) {
    const s = String(a.simbolo).toUpperCase();
    if (comOperacao.has(s)) continue;
    const m = mercado(s, a.dataEntrada);
    const precoEntrada = precoNaEntrada(series[s]?.serie, a.dataEntrada);
    const l = posicaoLegada(a, { ...m, precoEntrada });
    l.podeConverter = converterCapitalEmQuantidade(a.capital, precoEntrada) !== null;
    posicoes.push(l);
  }
  const custos = Object.fromEntries(posicoes.filter((p) => !p.legado).map((p) => [p.simbolo, p.custoTotal]));
  const prov = proventosPorAtivo({ recebidos: recebidos || [], operacoes, proventosPorSimbolo: proventosAtivo, custos, hoje });
  const comPart = comParticipacao(posicoes).map((p) => ({
    ...p, proventos: prov.get(p.simbolo) ?? null, concentrado: p.participacao !== null && p.participacao > LIMITE_CONCENTRACAO, limiteConcentracao: LIMITE_CONCENTRACAO,
  }));
  const tot = totaisProventos(prov);
  return { posicoes: comPart, resumo: resumirCarteira(comPart, { proventosRecebidos: tot.recebido, proventosEstimados: tot.estimado }) };
}

export class CarteiraPosicoes extends BaseComponent {
  constructor() {
    super();
    this._carteira = null;
    this._dados = null;
    this._prefs = lerPrefs();
    this._filtro = '';
    this._venda = null;
    this._evo = { carregando: false, erro: null, avisos: [], evolucao: null, periodo: this._prefs.periodo };
  }

  template() {
    return `<div class="carteira-posicoes">
      <div id="cp-status" class="visually-hidden" role="status" aria-live="polite"></div>
      <div id="cp-erro"></div>
      <div id="cp-toolbar"></div><div id="cp-venda"></div><div id="cp-alocacao"></div><div id="cp-grade">${htmlGradeSkeleton()}</div><div id="cp-evolucao"></div></div>`;
  }

  afterRender() {
    this.addEventListener('click', (e) => this._clique(e));
    this.addEventListener('change', (e) => {
      if (e.target.id === 'ordem-posicoes') { this._prefs.ordem = e.target.value; salvarPrefs(this._prefs); this._desenharGrade(); }
    });
    this.addEventListener('input', (e) => {
      if (e.target.id === 'filtro-texto') { this._filtro = e.target.value; this._desenharGrade(); }
      if (e.target.id === 'venda-qtd' || e.target.id === 'venda-preco') this._totalVenda();
    });
  }

  setCarteira(carteira) {
    const primeira = !this._carteira;
    this._carteira = carteira;
    if (primeira) this.carregar();
    else this.carregar();
  }

  async carregar() {
    const carteira = this._carteira;
    if (!carteira) return;
    this._erro('');
    try {
      this._dados = await carregarDadosCarteira(carteira);
    } catch (erro) {
      this.querySelector('#cp-grade').innerHTML = '';
      this._erro(`${mensagemDeErro(erro)}`, true);
      return;
    }
    const { posicoes, resumo } = construirPosicoes(carteira, this._dados);
    this._posicoes = posicoes;
    this._resumo = resumo;
    this.dispatchEvent(new CustomEvent('carteira-resumo', { bubbles: true, detail: { carteiraId: carteira.id, resumo, erros: this._dados.erros } }));
    this._desenhar();
    const status = this.querySelector('#cp-status');
    if (status) status.textContent = resumo.dataUltimoPreco ? `Preços atualizados. Último pregão: ${formatarData(resumo.dataUltimoPreco)}.` : 'Carteira carregada.';
    this._carregarEvolucao();
  }

  async _carregarEvolucao() {
    const d = this._dados;
    if (!d?.primeira) { this._evo = { ...this._evo, carregando: false, evolucao: null, avisos: [] }; this._desenharEvolucao(); return; }
    this._evo = { ...this._evo, carregando: true, erro: null };
    this._desenharEvolucao();
    try {
      const ref = await carregarReferencias(d.primeira);
      this._ref = ref;
      this._evo = { ...this._evo, carregando: false, avisos: [...ref.avisos, ...d.erros.map((e) => `Sem ${e}: fora da evolução.`)] };
    } catch (erro) {
      this._ref = { cdi: null, proxyIbov: null };
      this._evo = { ...this._evo, carregando: false, erro: mensagemDeErro(erro), avisos: [] };
    }
    this._recalcularEvolucao();
  }

  _recalcularEvolucao() {
    if (!this._ref) return;
    const seriesPrecos = Object.fromEntries(Object.entries(this._dados.series).filter(([, v]) => v).map(([k, v]) => [k, v.serie]));
    this._evo.evolucao = montarEvolucao({ operacoes: this._dados.operacoes, seriesPrecos, cdi: this._ref.cdi, proxyIbov: this._ref.proxyIbov, periodo: this._evo.periodo });
    this._desenharEvolucao();
  }

  _desenhar() {
    this.querySelector('#cp-toolbar').innerHTML = this._posicoes.length ? htmlBarraFerramentas(this._prefs, this._filtro) : '';
    this._desenharAlocacao();
    this._desenharGrade();
    this._desenharEvolucao();
  }

  _desenharAlocacao() {
    const alvo = this.querySelector('#cp-alocacao');
    if (alvo) alvo.innerHTML = htmlAlocacao(alocacao(this._posicoes || [], this._prefs.alocacao), this._prefs.alocacao);
  }

  _desenharEvolucao() {
    const alvo = this.querySelector('#cp-evolucao');
    if (!alvo) return;
    alvo.innerHTML = this._dados?.primeira ? htmlEvolucao(this._evo) : '';
  }

  _visiveis() {
    return ordenarPosicoes(filtrarPosicoes(this._posicoes || [], this._filtro), this._prefs.ordem);
  }

  _desenharGrade() {
    const alvo = this.querySelector('#cp-grade');
    if (!alvo) return;
    if (!(this._posicoes || []).length) { alvo.innerHTML = htmlVazio(); return; }
    const lista = this._visiveis();
    if (!lista.length) { alvo.innerHTML = '<p class="text-body-secondary">Nenhum ativo corresponde ao filtro.</p>'; return; }
    alvo.innerHTML = this._prefs.visao === 'tabela'
      ? `<div class="table-responsive mb-3"><table class="table table-sm align-middle"><thead><tr><th>Ativo</th><th class="text-end">Qtd.</th><th class="text-end">Preço médio</th><th>Entrada</th><th class="text-end">Preço atual</th><th class="text-end">Valor atual</th><th class="text-end">Resultado</th><th class="text-end">Part.</th></tr></thead><tbody>${lista.map(htmlLinhaAtivo).join('')}</tbody></table></div>`
      : `<div class="carteira-grade mb-3">${lista.map((p) => htmlCardAtivo(p)).join('')}</div>`;
  }

  _erro(msg, comTentar = false) {
    const alvo = this.querySelector('#cp-erro');
    if (!alvo) return;
    alvo.innerHTML = msg ? `<div class="alert alert-danger small d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert"><span>${escaparHtml(msg)}</span>${comTentar ? '<button type="button" class="btn btn-sm btn-outline-danger" data-acao="recarregar-posicoes">Tentar de novo</button>' : ''}</div>` : '';
  }

  _clique(e) {
    const t = e.target.closest('[data-visao],[data-alocacao],[data-periodo],[data-acao]');
    if (!t) return;
    if (t.dataset.visao) { this._prefs.visao = t.dataset.visao; salvarPrefs(this._prefs); this._desenhar(); return; }
    if (t.dataset.alocacao) { this._prefs.alocacao = t.dataset.alocacao; salvarPrefs(this._prefs); this._desenharAlocacao(); return; }
    if (t.dataset.periodo) { this._evo.periodo = t.dataset.periodo; this._prefs.periodo = t.dataset.periodo; salvarPrefs(this._prefs); this._recalcularEvolucao(); return; }
    const simbolo = t.dataset.simbolo;
    t.closest('details')?.removeAttribute('open');
    switch (t.dataset.acao) {
      case 'recarregar-posicoes': this.carregar(); break;
      case 'foco-adicionar': this.dispatchEvent(new CustomEvent('foco-adicionar', { bubbles: true })); break;
      case 'comprar': this.dispatchEvent(new CustomEvent('comprar-mais', { bubbles: true, detail: { simbolo } })); break;
      case 'vender': this._abrirVenda(simbolo); break;
      case 'cancelar-venda': this._venda = null; this._desenharVenda(); break;
      case 'confirmar-venda': this._confirmarVenda(); break;
      case 'estornar': this._estornar(simbolo); break;
      case 'remover-legado': this._removerLegado(simbolo); break;
      case 'converter': this._converter(simbolo); break;
      default: break;
    }
  }

  _abrirVenda(simbolo) {
    const p = (this._posicoes || []).find((x) => x.simbolo === simbolo && !x.legado);
    if (!p) return;
    this._venda = { simbolo, posicao: p.quantidade, preco: p.precoAtual, dataPreco: p.dataPreco };
    this._desenharVenda();
    this.querySelector('#venda-qtd')?.focus?.();
  }

  _desenharVenda() {
    const alvo = this.querySelector('#cp-venda');
    if (alvo) alvo.innerHTML = htmlPainelVenda(this._venda);
    this._totalVenda();
  }

  _totalVenda() {
    const t = totalEstimado(this.querySelector('#venda-qtd')?.value, this.querySelector('#venda-preco')?.value);
    const alvo = this.querySelector('#venda-total');
    if (alvo) alvo.textContent = t === null ? '—' : formatarMoeda(t);
  }

  async _confirmarVenda() {
    const v = this._venda;
    const msg = (m) => { const a = this.querySelector('#msg-venda'); if (a) { a.className = m ? 'alert alert-danger py-2 small' : ''; a.textContent = m; } };
    const qtd = Number(this.querySelector('#venda-qtd')?.value);
    const preco = Number(this.querySelector('#venda-preco')?.value);
    if (!Number.isInteger(qtd) || qtd <= 0) return msg('A quantidade deve ser um número inteiro maior que zero.');
    if (qtd > v.posicao) return msg(`Você só tem ${v.posicao} de ${v.simbolo}: a venda não pode passar da posição.`);
    if (!(preco > 0)) return msg('Informe um preço maior que zero.');
    this._chaveVenda = this._chaveVenda || novaChave('venda');
    try {
      await registrarOperacao(this._carteira.id, { tipo: 'VENDA', simbolo: v.simbolo, data: hojeLocal(), quantidade: qtd, precoUnitario: preco, chave: this._chaveVenda });
      this._chaveVenda = null;
      this._venda = null;
      this._desenharVenda();
      await this.carregar();
      const s = this.querySelector('#cp-status');
      if (s) s.textContent = `Venda de ${qtd} ${v.simbolo} registrada. Registro informado, não ordem executada.`;
    } catch (erro) {
      msg(mensagemDeErro(erro));
    }
  }

  async _estornar(simbolo) {
    const ultimas = operacoesEfetivas(this._dados.operacoes).filter((o) => String(o.simbolo).toUpperCase() === simbolo)
      .sort((a, b) => String(b.executadaEm).localeCompare(String(a.executadaEm)));
    const op = ultimas[0];
    if (!op) return;
    if (!window.confirm(`Estornar a ${op.tipo === 'COMPRA' ? 'compra' : 'venda'} de ${op.quantidade} ${simbolo} (${formatarData(op.executadaEm)})? O estorno fica no histórico.`)) return;
    try {
      await estornarOperacao(this._carteira.id, op.id);
      await this.carregar();
    } catch (erro) {
      this._erro(mensagemDeErro(erro));
    }
  }

  async _removerLegado(simbolo) {
    if (!window.confirm(`Remover ${simbolo} (capital legado) desta carteira?`)) return;
    try {
      await removerAtivo(this._carteira.id, simbolo);
      this.dispatchEvent(new CustomEvent('carteira-alterada', { bubbles: true }));
    } catch (erro) {
      this._erro(mensagemDeErro(erro));
    }
  }

  async _converter(simbolo) {
    const p = (this._posicoes || []).find((x) => x.simbolo === simbolo && x.legado);
    const conv = p && converterCapitalEmQuantidade(p.capital, p.precoEntrada);
    if (!conv) return;
    if (!window.confirm(`Converter ${simbolo}: ${conv.quantidade} ações a ${formatarMoeda(conv.precoUnitario)} (fechamento na entrada, ${formatarData(p.dataEntrada)}); sobra ${formatarMoeda(conv.sobra)} do capital. O registro de capital legado será removido. Registro informado, não ordem executada.`)) return;
    try {
      await registrarOperacao(this._carteira.id, { tipo: 'COMPRA', simbolo, data: p.dataEntrada, quantidade: conv.quantidade, precoUnitario: conv.precoUnitario, chave: novaChave('conversao') });
      await removerAtivo(this._carteira.id, simbolo);
      this.dispatchEvent(new CustomEvent('carteira-alterada', { bubbles: true }));
    } catch (erro) {
      this._erro(mensagemDeErro(erro));
    }
  }
}

if (!customElements.get('carteira-posicoes')) customElements.define('carteira-posicoes', CarteiraPosicoes);
