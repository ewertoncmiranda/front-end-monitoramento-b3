import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarSaudeDosDados } from '../api/validacaoApi.js';
import { listarFavoritos } from '../api/favoritosApi.js';
import { buscarNewsletter } from '../api/comunicadosApi.js';
import { fontesForaDoPrazo, maioresMovimentos, resumoDaSemana } from '../analise/inicio.js';
import { ESTADO_GERAL, formatarIdade } from '../analise/saudeDosDados.js';
import { formatarMoeda, formatarPercentual } from '../utils/numero.js';
import { formatarData } from '../utils/dataHora.js';
import { htmlSelo } from '../utils/selos.js';
import { escaparHtml } from '../utils/html.js';
import { htmlEstadoVazio } from '../components/EstadoVazio.js';
import '../components/LoadingSpinner.js';

// Unica responsabilidade: a pagina Inicio (REQ-UX-7) - um resumo do que mudou:
// saude dos dados, favoritos com variacao e comunicados da semana. Cada bloco
// busca e falha sozinho; nenhum depende dos outros.
const carregando = '<loading-spinner></loading-spinner>';

export class InicioPage extends BaseComponent {
  template() {
    return `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 class="mb-0">Início</h4>
        <form class="d-flex gap-2" data-abrir role="search">
          <label class="visually-hidden" for="inicio-ativo">Abrir ficha de um ativo</label>
          <input id="inicio-ativo" class="form-control form-control-sm" placeholder="Abrir ficha: PETR4" autocomplete="off" maxlength="12" style="max-width:12rem">
          <button class="btn btn-sm btn-primary" type="submit">Abrir</button>
        </form>
      </div>
      <div class="row g-3">
        <section class="col-lg-6" aria-labelledby="ini-saude"><div class="card shadow-sm cartao-inicio"><div class="card-body">
          <h6 id="ini-saude">Saúde dos dados</h6><div data-saude>${carregando}</div></div></div></section>
        <section class="col-lg-6" aria-labelledby="ini-fav"><div class="card shadow-sm cartao-inicio"><div class="card-body">
          <h6 id="ini-fav">Favoritos em movimento</h6><div data-favoritos>${carregando}</div></div></div></section>
        <section class="col-12" aria-labelledby="ini-com"><div class="card shadow-sm"><div class="card-body">
          <h6 id="ini-com">Comunicados da semana</h6><div data-comunicados>${carregando}</div></div></div></section>
      </div>
      <p class="small text-muted mt-3 mb-0">Resumo informativo; nenhum sinal aqui é recomendação de investimento (regra experimental).</p>
    `;
  }

  afterRender() {
    this.querySelector('[data-abrir]').addEventListener('submit', (e) => {
      e.preventDefault();
      const simbolo = this.querySelector('#inicio-ativo').value.trim().toUpperCase();
      if (/^[A-Z0-9]{4,8}$/.test(simbolo)) window.location.hash = `#/gestao/${encodeURIComponent(simbolo)}`;
    });
    this.bloco('[data-saude]', buscarSaudeDosDados(), htmlSaude, 'Saúde dos dados indisponível');
    this.bloco('[data-favoritos]', listarFavoritos(), htmlFavoritos, 'Favoritos indisponíveis');
    this.bloco('[data-comunicados]', buscarNewsletter(), htmlComunicados, 'Comunicados indisponíveis');
  }

  /** Cada bloco resolve sozinho; erro vira estado vazio com a causa. */
  bloco(seletor, promessa, desenhar, titulo) {
    const pintar = (html) => {
      const alvo = this.isConnected && this.querySelector(seletor);
      if (alvo) alvo.innerHTML = html;
    };
    promessa.then(
      (dados) => pintar(desenhar(dados)),
      (erro) => pintar(htmlEstadoVazio({
        titulo, causa: erro.message, acaoHref: '#/avaliacao', acaoRotulo: 'Ver saúde dos dados',
      })),
    );
  }
}

export function htmlSaude(saude) {
  const geral = ESTADO_GERAL[saude.estadoGeral] || ESTADO_GERAL.ATENCAO;
  const fora = fontesForaDoPrazo(saude);
  return `
    <p class="mb-2"><span class="badge ${geral.classe.replace('alert-', 'text-bg-')}">${geral.rotulo}</span>
      <span class="small text-muted ms-1">${saude.cobertura.comPrecoEFundamentos} de ${saude.cobertura.ativos} ativos com preço e balanço</span></p>
    ${fora.length ? `<ul class="list-unstyled small mb-2">${fora.map((f) => `<li class="d-flex justify-content-between gap-2">
        <span>${escaparHtml(f.nome)}</span><span>${htmlSelo(f.estado)} <span class="text-muted">${escaparHtml(formatarIdade(f.idadeHoras))}</span></span></li>`).join('')}</ul>`
      : '<p class="small text-success mb-2">Todas as fontes em dia.</p>'}
    <a class="small" href="#/avaliacao">Ver detalhes</a>`;
}

export function htmlFavoritos(favoritos) {
  if (!favoritos || !favoritos.length) {
    return htmlEstadoVazio({ titulo: 'Nenhum favorito ainda', causa: 'Favoritos recebem cotação intradiária no pregão.', acaoHref: '#/ativos', acaoRotulo: 'Escolher na tabela de ativos' });
  }
  const linhas = maioresMovimentos(favoritos);
  return `<div class="table-responsive"><table class="table table-sm align-middle small mb-1 tabela-cartoes">
    <thead><tr><th>Ativo</th><th class="text-end">Preço</th><th class="text-end">Variação</th></tr></thead>
    <tbody>${linhas.map((l) => {
      const cor = l.variacao === null ? 'text-muted' : l.variacao > 0 ? 'text-success' : l.variacao < 0 ? 'text-danger' : '';
      const seta = l.variacao > 0 ? '▲' : l.variacao < 0 ? '▼' : '=';
      return `<tr>
        <td data-label="Ativo"><a class="fw-semibold" href="#/gestao/${encodeURIComponent(l.simbolo)}">${escaparHtml(l.simbolo)}</a></td>
        <td data-label="Preço" class="text-end">${formatarMoeda(l.preco)}</td>
        <td data-label="Variação" class="text-end ${cor}">${l.variacao === null ? '—' : `${seta} ${formatarPercentual(l.variacao, 2, { sinal: true })}`}</td></tr>`;
    }).join('')}</tbody></table></div>
    <a class="small" href="#/favoritos">Ver todos os favoritos</a>`;
}

export function htmlComunicados(edicao) {
  const r = resumoDaSemana(edicao);
  if (!r.totalEmpresas) {
    return htmlEstadoVazio({ titulo: 'Sem comunicados nesta semana', causa: 'Nenhum documento da carteira nas categorias padrão.', acaoHref: '#/comunicados', acaoRotulo: 'Abrir comunicados' });
  }
  return `
    <p class="small text-muted mb-2">${r.totalDocumentos} documento(s) de ${r.totalEmpresas} empresa(s)${edicao.desde ? `, ${formatarData(edicao.desde)} a ${formatarData(edicao.ate)}` : ''}.
      ${r.comFatoRelevante.length ? `Fato relevante: <strong>${r.comFatoRelevante.map(escaparHtml).join(', ')}</strong>.` : 'Nenhum fato relevante.'}</p>
    <div class="d-flex flex-wrap gap-2 mb-2">${r.destaques.map((d) => `
      <a class="btn btn-sm btn-outline-secondary" href="#/comunicados?simbolo=${encodeURIComponent(d.simbolo)}${r.semana ? `&semana=${encodeURIComponent(r.semana)}` : ''}">
        ${escaparHtml(d.simbolo)} <span class="badge ${d.fatoRelevante ? 'text-bg-danger' : 'text-bg-secondary'}">${d.total}</span></a>`).join('')}</div>
    <a class="small" href="#/comunicados">Ver a edição completa</a>`;
}

customElements.define('inicio-page', InicioPage);
