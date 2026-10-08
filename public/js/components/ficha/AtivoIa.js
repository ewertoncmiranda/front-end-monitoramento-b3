import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarData, formatarDataHora } from '../../utils/dataHora.js';
import { buscarPacoteAtivo, gerarLeitura } from '../../api/iaApi.js';
import { OPINIOES, RISCOS } from './OpiniaoHorizontes.js';
import '../ia/ChatIa.js';

// Unica responsabilidade: card "IA" da ficha (TASK-CHAT-5), na aba Resumo
// logo abaixo de <opiniao-horizontes>. Tres partes:
//  1. pacote do ativo (CTR-IA-03): horizontes compactos, 3 sinais mais
//     fortes, 3 ultimas manchetes - so leitura, sem cota;
//  2. leitura (CTR-IA-04): botao "Ler com IA", paragrafo com origem e cache;
//  3. conversa: <details> com <chat-ia simbolo>.
// O painel nao gera opiniao (TASK-IA-37 descartada): so le o que o lote gravou.
// Valor ausente aparece como "sem dado", nunca 0. Texto do modelo entra
// escapado; link so http(s).

export const SUGESTOES_DO_ATIVO = [
  'Por que o sinal está neutro?',
  'O que mudou desde ontem?',
  'Quais riscos aparecem nos números?',
];

export const MENSAGEM_INDISPONIVEL = 'IA indisponível; a opinião por regra continua acima.';
export const NOTA_SO_REGRA = 'Leitura do modelo ainda não gerada para este pregão; favoritos entram no próximo lote.';

const HORIZONTES = { 21: 'Curto', 63: 'Médio', 126: 'Longo' };
const SEM_DADO = '<span class="text-muted">sem dado</span>';

const numero = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

function pct(v, casas = 1) {
  const n = numero(v);
  if (n === null) return SEM_DADO;
  const texto = `${n > 0 ? '+' : ''}${(n * 100).toFixed(casas).replace('.', ',')}%`;
  return `<span class="${n > 0 ? 'text-success' : n < 0 ? 'text-danger' : ''}">${texto}</span>`;
}

function decimal(v, casas = 1) {
  const n = numero(v);
  return n === null ? SEM_DADO : n.toFixed(casas).replace('.', ',');
}

function moeda(v) {
  const n = numero(v);
  return n === null ? SEM_DADO : `R$ ${n.toFixed(2).replace('.', ',')}`;
}

/** Link externo so com http(s); outro esquema vira texto puro. */
function link(href, texto) {
  const seguro = typeof href === 'string' && /^https?:\/\//i.test(href);
  if (!seguro) return escaparHtml(texto || '');
  return `<a href="${escaparHtml(href)}" target="_blank" rel="noopener noreferrer">${escaparHtml(texto || href)}</a>`;
}

function badge(mapa, valor) {
  const item = mapa[valor] || { rotulo: valor || 'Sem dado', classe: 'text-bg-secondary' };
  return `<span class="badge ${item.classe}">${escaparHtml(item.rotulo)}</span>`;
}

function direcao(d) {
  const n = numero(d) || 0;
  if (n > 0) return '<span class="text-success" aria-hidden="true">▲</span><span class="visually-hidden">favorável</span>';
  if (n < 0) return '<span class="text-danger" aria-hidden="true">▼</span><span class="visually-hidden">desfavorável</span>';
  return '<span class="text-muted" aria-hidden="true">●</span><span class="visually-hidden">neutro</span>';
}

/** Os sinais de maior |direcao| (o servico ja manda no maximo 3; o front garante). */
export function sinaisMaisFortes(sinais, limite = 3) {
  return [...(sinais || [])]
    .sort((a, b) => Math.abs(numero(b.direcao) || 0) - Math.abs(numero(a.direcao) || 0))
    .slice(0, limite);
}

/** true quando todas as opinioes do pregao vieram da regra (nenhuma do modelo). */
export function soRegra(opiniao) {
  return Array.isArray(opiniao) && opiniao.length > 0 && opiniao.every((o) => o.origem === 'REGRA');
}

export function htmlPacote(dados) {
  if (!dados) return `<p class="small text-muted mb-0">${escaparHtml(MENSAGEM_INDISPONIVEL)}</p>`;
  const opiniao = Array.isArray(dados.opiniao) ? [...dados.opiniao].sort((a, b) => a.horizonte_pregoes - b.horizonte_pregoes) : [];
  const cot = dados.cotacao || {};
  const fund = dados.fundamentos || {};
  const sinais = sinaisMaisFortes(dados.sinais);
  const manchetes = (dados.manchetes || []).slice(0, 3);

  const horizontes = opiniao.length
    ? `<div class="ia-horizontes">${opiniao.map((o) => `
        <div class="ia-horizonte">
          <span class="small text-muted">${escaparHtml(HORIZONTES[o.horizonte_pregoes] || `${o.horizonte_pregoes} pregões`)}</span>
          ${badge(OPINIOES, o.opiniao)} ${badge(RISCOS, o.risco)}
          <span class="small text-muted">${o.origem === 'MODELO' ? 'modelo' : 'regra'}</span>
        </div>`).join('')}</div>`
    : `<p class="small text-muted mb-2">Sem opinião gravada para este pregão.</p>`;

  const nota = soRegra(opiniao) ? `<p class="small text-muted mb-2">${escaparHtml(NOTA_SO_REGRA)}</p>` : '';

  const numeros = `
    <dl class="ia-numeros small mb-2">
      <div><dt>Fechamento</dt><dd>${moeda(cot.fechamento)}</dd></div>
      <div><dt>Dia</dt><dd>${pct(cot.variacao_1d)}</dd></div>
      <div><dt>1 mês</dt><dd>${pct(cot.variacao_1m)}</dd></div>
      <div><dt>12 meses</dt><dd>${pct(cot.variacao_12m)}</dd></div>
      <div><dt>P/L</dt><dd>${decimal(fund.pl)}</dd></div>
      <div><dt>ROE</dt><dd>${numero(fund.roe) === null ? SEM_DADO : `${(numero(fund.roe) * 100).toFixed(1).replace('.', ',')}%`}</dd></div>
      <div><dt>Dív. líq./EBITDA</dt><dd>${decimal(fund.divida_liquida_ebitda)}</dd></div>
    </dl>`;

  const listaSinais = sinais.length
    ? `<ul class="list-unstyled small mb-2">${sinais.map((s) => `
        <li>${direcao(s.direcao)} ${escaparHtml(s.rotulo || s.id || '')}: <span class="text-muted">${escaparHtml(String(s.valor ?? 'sem dado'))}</span></li>`).join('')}</ul>`
    : `<p class="small text-muted mb-2">Sem sinais no pregão.</p>`;

  const listaManchetes = manchetes.length
    ? `<ul class="list-unstyled small mb-2">${manchetes.map((m) => `
        <li>${link(m.link, m.titulo)} <span class="text-muted">· ${escaparHtml(m.fonte || '')}${m.publicadoEm ? ` · ${escaparHtml(formatarData(m.publicadoEm))}` : ''}</span></li>`).join('')}</ul>`
    : `<p class="small text-muted mb-2">Sem manchetes recentes.</p>`;

  return `
    <p class="small text-muted mb-2">Pregão de ${escaparHtml(formatarData(dados.data_pregao))}</p>
    ${horizontes}${nota}${numeros}
    <p class="ficha-rotulo mb-1">Sinais mais fortes</p>${listaSinais}
    <p class="ficha-rotulo mb-1">Últimas manchetes</p>${listaManchetes}
    ${dados.aviso ? `<p class="small text-muted mb-0">${escaparHtml(dados.aviso)}</p>` : ''}`;
}

export function htmlLeitura(leitura) {
  if (!leitura || !leitura.texto) return `<p class="small text-muted mb-0">Leitura indisponível agora.</p>`;
  const origem = leitura.origem === 'MODELO'
    ? `<span class="badge text-bg-light border">modelo${leitura.modelo ? ` · ${escaparHtml(leitura.modelo)}` : ''}</span>`
    : '<span class="badge text-bg-light border">regra (sem modelo)</span>';
  const cache = leitura.em_cache ? ' <span class="badge text-bg-light border">em cache</span>' : '';
  return `
    <p class="mb-1 ia-leitura-texto">${escaparHtml(leitura.texto)}</p>
    <p class="small text-muted mb-0">${origem}${cache}${leitura.gerado_em ? ` · ${escaparHtml(formatarDataHora(leitura.gerado_em))}` : ''}</p>`;
}

export function htmlCard(simbolo) {
  const s = escaparHtml(simbolo);
  return `
    <section class="ficha-cartao ativo-ia">
      <p class="ficha-rotulo">IA · <span class="badge text-bg-warning">Experimental</span></p>
      <div data-pacote class="small text-muted">Carregando…</div>
      <div class="d-flex align-items-center gap-2 mt-2">
        <button type="button" class="btn btn-sm btn-outline-primary" data-ler>Ler com IA</button>
        <span class="small text-muted">Parágrafo curto sobre ${s}; uma leitura por pregão.</span>
      </div>
      <div data-leitura class="mt-2" aria-live="polite"></div>
      <details class="mt-3" data-conversa>
        <summary>Conversar sobre ${s}</summary>
        <div class="mt-2" data-chat></div>
      </details>
    </section>`;
}

export class AtivoIa extends BaseComponent {
  template() {
    return htmlCard(this.getAttribute('simbolo') || '');
  }

  async afterRender() {
    const simbolo = this.getAttribute('simbolo');
    if (!simbolo) return;
    this.querySelector('[data-ler]').addEventListener('click', () => this.ler(simbolo));
    // O chat so monta ao abrir: nao cria sessao nem le o historico a toa.
    this.querySelector('[data-conversa]').addEventListener('toggle', (e) => {
      const alvo = this.querySelector('[data-chat]');
      if (e.target.open && !alvo.firstChild) {
        alvo.innerHTML = `<chat-ia simbolo="${escaparHtml(simbolo)}" sugestoes="${escaparHtml(SUGESTOES_DO_ATIVO.join('|'))}"></chat-ia>`;
      }
    });
    const corpo = this.querySelector('[data-pacote]');
    try {
      const dados = await buscarPacoteAtivo(simbolo);
      if (this.getAttribute('simbolo') !== simbolo) return;
      corpo.innerHTML = htmlPacote(dados);
    } catch {
      // 404 tambem cai aqui: enquanto a rota /ativo nao existe no servico, ele
      // nao distingue "ativo desconhecido" de "rota inexistente" (SPEC: so os
      // estados carregando, servico fora e so regra).
      if (this.getAttribute('simbolo') !== simbolo) return;
      corpo.innerHTML = `<p class="small text-muted mb-0">${escaparHtml(MENSAGEM_INDISPONIVEL)}</p>`;
    }
  }

  async ler(simbolo) {
    const botao = this.querySelector('[data-ler]');
    const alvo = this.querySelector('[data-leitura]');
    botao.disabled = true;
    alvo.innerHTML = '<p class="small text-muted mb-0">Gerando leitura…</p>';
    try {
      const leitura = await gerarLeitura(simbolo);
      if (this.getAttribute('simbolo') !== simbolo) return;
      alvo.innerHTML = htmlLeitura(leitura);
    } catch {
      if (this.getAttribute('simbolo') !== simbolo) return;
      alvo.innerHTML = `<p class="small text-muted mb-0">${escaparHtml(MENSAGEM_INDISPONIVEL)}</p>`;
    } finally {
      botao.disabled = false;
    }
  }
}

customElements.define('ativo-ia', AtivoIa);
