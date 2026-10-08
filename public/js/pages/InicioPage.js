import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarSaudeDosDados } from '../api/validacaoApi.js';
import { listarFavoritos } from '../api/favoritosApi.js';
import { buscarNewsletter } from '../api/comunicadosApi.js';
import { buscarManchetesFavoritos } from '../api/noticiasApi.js';
import { resumirManchetes } from '../api/iaApi.js';
import { fontesForaDoPrazo, maioresMovimentos, resumoDaSemana, comunicadoDestaqueDosFavoritos } from '../analise/inicio.js';
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
        <section class="col-12" aria-labelledby="ini-not"><div class="card shadow-sm"><div class="card-body">
          <h6 id="ini-not">Notícias dos favoritos</h6><div data-noticias>${carregando}</div></div></div></section>
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

    const favoritosP = listarFavoritos();
    const newsletterP = buscarNewsletter();

    // Manchetes: busca so quando ha favoritos; erros viram null (card lida com isso).
    const manchetesP = favoritosP
      .then((favs) => (favs?.length ? buscarManchetesFavoritos(favs.map((f) => f.simbolo)) : null))
      .catch(() => null);

    // Card de noticias precisa de manchetes + newsletter + lista de favoritos.
    const noticiasP = Promise.all([
      manchetesP,
      newsletterP.catch(() => null),
      favoritosP.catch(() => []),
    ]);

    this.bloco('[data-saude]', buscarSaudeDosDados(), htmlSaude, 'Saúde dos dados indisponível');
    this.bloco('[data-favoritos]', favoritosP, htmlFavoritos, 'Favoritos indisponíveis');
    this.bloco('[data-comunicados]', newsletterP, htmlComunicados, 'Comunicados indisponíveis');

    // Noticias usa handler proprio para guardar manchetes no botao de resumo.
    noticiasP.then(([manchetes, newsletter, favs]) => {
      this._manchetesDados = manchetes;
      const alvo = this.isConnected && this.querySelector('[data-noticias]');
      if (alvo) alvo.innerHTML = htmlNoticiasFavoritos(manchetes, newsletter, favs);
    }).catch((erro) => {
      const alvo = this.isConnected && this.querySelector('[data-noticias]');
      if (alvo) alvo.innerHTML = htmlEstadoVazio({ titulo: 'Notícias indisponíveis', causa: erro.message, acaoHref: '#/avaliacao', acaoRotulo: 'Ver saúde dos dados' });
    });

    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-resumir-ia]');
      if (btn) this._resumirComIA(btn);
    });
  }

  async _resumirComIA(btn) {
    const painel = this.querySelector('[data-resumo-ia]');
    if (!painel) return;
    btn.disabled = true;
    btn.textContent = 'Resumindo…';
    try {
      const resultado = await resumirManchetes(this._manchetesDados?.manchetes || []);
      painel.innerHTML = htmlResumo(resultado, this._manchetesDados?.manchetes);
      btn.hidden = true;
    } catch {
      painel.innerHTML = '<p class="small text-muted mt-2">Resumo indisponível agora.</p>';
      btn.disabled = false;
      btn.textContent = 'Resumir com IA';
    }
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

/** Tempo relativo simples, sem dependencia externa. */
function tempoAtras(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'agora';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

/**
 * TASK-NOT-3 + TASK-NOT-4: card de noticias e comunicado em destaque.
 * manchetes: resultado de /noticias/favoritos (ou null se sem favoritos / erro).
 * newsletter: edicao atual (ou null).
 * favs: array de AtivoMonitoradoDTO.
 */
export function htmlNoticiasFavoritos(manchetes, newsletter, favs) {
  const simbolosFavs = (favs || []).map((f) => f.simbolo);

  if (!simbolosFavs.length) {
    return htmlEstadoVazio({
      titulo: 'Nenhum favorito ainda',
      causa: 'Adicione ativos aos favoritos para ver as notícias.',
      acaoHref: '#/ativos',
      acaoRotulo: 'Escolher na tabela de ativos',
    });
  }

  const partes = [];

  // --- NOT-4: comunicado em destaque ---
  const destaque = comunicadoDestaqueDosFavoritos(newsletter, simbolosFavs);
  if (destaque) {
    const href = `#/comunicados?simbolo=${encodeURIComponent(destaque.simbolo)}${destaque.semana ? `&semana=${encodeURIComponent(destaque.semana)}` : ''}`;
    partes.push(`
      <div class="alert alert-warning py-2 px-3 mb-3 d-flex align-items-center gap-2 small" role="alert">
        <span class="badge text-bg-danger flex-shrink-0">FATO RELEVANTE</span>
        <span><strong>${escaparHtml(destaque.simbolo)}</strong> publicou
          ${destaque.total > 1 ? `${destaque.total} fatos relevantes` : 'um fato relevante'} esta semana.</span>
        <a class="ms-auto text-nowrap" href="${href}">Ver comunicado</a>
      </div>`);
  }

  // --- NOT-3: lista de manchetes ---
  if (!manchetes) {
    partes.push('<p class="small text-muted">Manchetes indisponíveis no momento.</p>');
  } else {
    const lista = manchetes.manchetes || [];
    if (!lista.length) {
      partes.push('<p class="small text-muted">Nenhuma manchete recente para os favoritos.</p>');
    } else {
      const desatBadge = manchetes.desatualizado
        ? '<span class="badge text-bg-secondary ms-1" title="Cache vencido; dados podem estar desatualizados">desatualizado</span>'
        : '';
      partes.push(`
        <ul class="list-unstyled mb-2 noticias-lista">
          ${lista.map((m) => {
            const badges = (m.simbolos || [])
              .map((s) => `<span class="badge text-bg-secondary me-1">${escaparHtml(s)}</span>`)
              .join('');
            return `<li class="mb-2">
              <a class="d-block text-body text-decoration-none small fw-semibold manchete-titulo" href="${escaparHtml(m.link)}" target="_blank" rel="noopener noreferrer">${escaparHtml(m.titulo)}</a>
              <span class="text-muted" style="font-size:.75rem">${escaparHtml(m.fonte || '')} · ${tempoAtras(m.publicadoEm)}</span>
              <div class="mt-1">${badges}</div>
            </li>`;
          }).join('')}
        </ul>
        <span class="small text-muted">${desatBadge}</span>`);
    }
    if (manchetes.falhas?.length) {
      partes.push(`<p class="small text-warning mb-1">Sem dados para: ${manchetes.falhas.map(escaparHtml).join(', ')}.</p>`);
    }
  }

  if (manchetes?.manchetes?.length) {
    partes.push(`
      <button class="btn btn-sm btn-outline-secondary mt-2" data-resumir-ia type="button">✦ Resumir com IA</button>
      <div data-resumo-ia></div>`);
  }

  partes.push('<a class="small d-block mt-2" href="#/comunicados">Ver comunicados oficiais</a>');
  return partes.join('');
}

/**
 * TASK-NOT-5: renderiza o resumo retornado por /ia/manchetes/resumo.
 * Links fora da lista original sao descartados (seguranca + consistencia).
 */
export function htmlResumo(resultado, manchetesOriginais) {
  if (!resultado?.topicos?.length) {
    return '<p class="small text-muted mt-2">Resumo indisponível agora.</p>';
  }
  const linksValidos = new Set((manchetesOriginais || []).map((m) => m.link).filter(Boolean));
  const itens = resultado.topicos.slice(0, 3).map((t) => {
    const linksOk = (t.links || []).filter((l) => linksValidos.has(l));
    const refs = linksOk.map((l, i) =>
      `<a href="${escaparHtml(l)}" target="_blank" rel="noopener noreferrer">[${i + 1}]</a>`).join(' ');
    return `<li class="mb-1">${escaparHtml(t.texto)}${refs ? ` ${refs}` : ''}</li>`;
  });
  return `<div class="mt-2 border-top pt-2">
    <p class="small text-muted mb-1">Resumo por IA:</p>
    <ol class="small mb-0">${itens.join('')}</ol>
  </div>`;
}

customElements.define('inicio-page', InicioPage);
