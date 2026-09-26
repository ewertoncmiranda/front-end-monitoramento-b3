import { cursos, obterCurso } from './cursos.js';
import { escapar, normalizar } from './texto.js';

const totalAulas = curso => curso.modulos.reduce((total, modulo) => total + modulo.aulas.length, 0);
const busca = valor => escapar(normalizar(JSON.stringify(valor)));
const metadados = curso => [
  ['Autor', curso.autoria], ['Faculdade', curso.faculdade], ['Instituto', curso.instituto],
  ['Curso', curso.curso], ['Origem', curso.origem], ['Instituição', curso.instituicao], ['Ano', curso.ano],
].filter(([, valor]) => valor);
const renderMetadados = (curso, compacto = false) => `<dl class="${compacto ? 'small' : ''} row g-0 mb-3">${metadados(curso).map(([rotulo, valor]) => `<dt class="col-4 text-secondary fw-normal">${rotulo}</dt><dd class="col-8 mb-1">${escapar(valor)}</dd>`).join('')}</dl>`;

export function renderCatalogoCursos() {
  return `<div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
    <div><h2 class="h4 mb-1">Cursos da biblioteca</h2><p class="text-secondary mb-0">Nove documentos organizados para leitura guiada. O conteúdo não registra progresso.</p></div>
    <span class="badge text-bg-primary">${cursos.length} cursos</span>
  </div>
  <div class="row g-3">${cursos.map(curso => `<article class="col-12 col-md-6 col-xl-4" data-estudo-busca="${busca(curso)}">
    <div class="card h-100 border-0 shadow-sm"><div class="card-body p-4 d-flex flex-column">
      <div class="d-flex flex-wrap gap-2 mb-3"><span class="badge text-bg-light">${escapar(curso.nivel)}</span><span class="badge text-bg-light">${curso.paginas} páginas</span><span class="badge text-bg-light">${escapar(curso.ano)}</span></div>
      <h3 class="h5">${escapar(curso.titulo)}</h3>${renderMetadados(curso, true)}
      <p class="flex-grow-1">${escapar(curso.descricao)}</p>
      <p class="small text-secondary">${curso.modulos.length} módulos · ${totalAulas(curso)} aulas documentais</p>
      <button class="btn btn-primary align-self-start" data-abrir-curso="${curso.id}">Abrir curso</button>
    </div></div>
  </article>`).join('')}</div>`;
}

export function renderCurso(id) {
  const curso = obterCurso(id);
  if (!curso) return renderCatalogoCursos();
  return `<article data-curso-aberto="${curso.id}">
    <button class="btn btn-sm btn-outline-secondary mb-3" data-voltar-cursos>← Todos os cursos</button>
    <header class="card border-0 bg-dark text-white mb-4"><div class="card-body p-4 p-md-5">
      <div class="d-flex flex-wrap gap-2 mb-3"><span class="badge text-bg-light">${escapar(curso.nivel)}</span><span class="badge text-bg-light">${curso.paginas} páginas</span><span class="badge text-bg-light">${escapar(curso.ano)}</span></div>
      <h2 class="display-6 fw-semibold">${escapar(curso.titulo)}</h2><p class="lead text-white-50">${escapar(curso.descricao)}</p>
      <div class="curso-metadados text-white-50">${renderMetadados(curso, true)}</div>
      <div class="d-flex flex-wrap gap-2"><button class="btn btn-light" data-abrir-pdf="${curso.id}" data-pagina="1">Ler PDF</button><a class="btn btn-outline-light" href="${curso.pdf}" target="_blank" rel="noopener">Abrir em nova aba ↗</a></div>
    </div></header>
    <div class="alert alert-warning" role="note"><strong>Contexto da fonte:</strong> ${escapar(curso.aviso)}</div>
    <div class="vstack gap-3">${curso.modulos.map((modulo, indice) => `<section class="card border-0 shadow-sm">
      <div class="card-header bg-white p-3"><span class="badge bg-primary-subtle text-primary me-2">${String(indice + 1).padStart(2, '0')}</span><strong>${escapar(modulo.titulo)}</strong></div>
      <div class="card-body p-3 p-md-4"><div class="vstack gap-3">${modulo.aulas.map(aula => `<details class="border rounded-3 p-3">
        <summary class="d-flex flex-wrap justify-content-between align-items-center gap-2"><strong>${escapar(aula.titulo)}</strong><span class="small text-secondary">p. ${aula.paginas[0]}–${aula.paginas[1]}</span></summary>
        <div class="pt-3"><h4 class="h6">Objetivo</h4><p>${escapar(aula.objetivo)}</p><h4 class="h6">Tópicos documentados</h4><ul>${aula.topicos.map(topico => `<li>${escapar(topico)}</li>`).join('')}</ul>
        <div class="bg-light rounded p-3 mb-3"><strong>Atividade de leitura:</strong> ${escapar(aula.atividade)}</div>
        <button class="btn btn-sm btn-outline-primary" data-abrir-pdf="${curso.id}" data-pagina="${aula.paginas[0]}">Consultar páginas ${aula.paginas[0]}–${aula.paginas[1]}</button></div>
      </details>`).join('')}</div></div>
    </section>`).join('')}</div>
    <section class="mt-4" aria-labelledby="leitor-titulo"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2"><h3 id="leitor-titulo" class="h5 mb-0">Documento original</h3><button class="btn btn-sm btn-outline-secondary d-none" data-fechar-pdf>Fechar leitor</button></div><div data-pdf-container class="d-none"></div></section>
  </article>`;
}

export function abrirPdf(container, cursoId, pagina = 1) {
  const curso = obterCurso(cursoId);
  if (!curso || !container) return;
  const paginaSegura = Math.min(Math.max(Number(pagina) || 1, 1), curso.paginas);
  container.classList.remove('d-none');
  container.innerHTML = `<div class="ratio curso-pdf-ratio border rounded bg-secondary-subtle"><iframe title="PDF: ${escapar(curso.titulo)}" src="${curso.pdf}#page=${paginaSegura}&view=FitH" loading="lazy"></iframe></div><p class="small text-secondary mt-2">Se o navegador não exibir o documento, <a href="${curso.pdf}#page=${paginaSegura}" target="_blank" rel="noopener">abra o PDF em uma nova aba</a>.</p>`;
  container.closest('section').querySelector('[data-fechar-pdf]').classList.remove('d-none');
  container.closest('section').scrollIntoView({ block: 'start' });
}
