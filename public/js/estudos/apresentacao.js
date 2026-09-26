// Unica responsabilidade: renderizar o catálogo de estudos em componentes Bootstrap.
import { niveis, apimec, conhecimentos, orientacoes, exercicios, fontes, fichaLaboratorio, recursosSistema, rotulosRotas } from './conteudo.js';
import { escapar, normalizar } from './texto.js';

const lista = itens => `<ul class="mb-3">${itens.map(item => `<li class="mb-2">${escapar(item)}</li>`).join('')}</ul>`;
const atalhos = rotas => `<div class="d-flex flex-wrap gap-2">${rotas.map(rota => `<a class="btn btn-sm btn-outline-primary" href="#/${rota}">Abrir ${rotulosRotas[rota]}</a>`).join('')}</div>`;
const linksFontes = ids => `<div class="d-flex flex-wrap gap-3 mt-3">${ids.map(id => { const fonte = fontes.find(f => f.id === id); return `<a href="${fonte.url}" target="_blank" rel="noopener noreferrer">${escapar(fonte.titulo)} ↗<span class="visually-hidden"> (nova aba)</span></a>`; }).join('')}</div>`;
const pesquisavel = dado => `data-estudo-busca="${escapar(normalizar(JSON.stringify(dado)))}"`;
const conclusao = (id, progresso) => `<div class="form-check border-top pt-3 mt-3"><input class="form-check-input" type="checkbox" id="concluir-${id}" data-concluir="${id}" ${progresso.concluidos.has(id) ? 'checked' : ''}><label class="form-check-label" for="concluir-${id}">Concluí a entrega e revisei o critério</label></div>`;

export function renderTrilhas(progresso, percurso) {
  const ids = (percurso === 'apimec' ? apimec : niveis).map(n => n.id);
  const resumo = progresso.resumo(ids);
  const proximo = progresso.proximo(ids);
  return `<div class="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Escolher percurso">
    <button class="btn ${percurso === 'formacao' ? 'btn-primary' : 'btn-outline-primary'}" data-percurso="formacao" aria-pressed="${percurso === 'formacao'}">Formação progressiva · 56 semanas</button>
    <button class="btn ${percurso === 'apimec' ? 'btn-primary' : 'btn-outline-primary'}" data-percurso="apimec" aria-pressed="${percurso === 'apimec'}">Percurso APIMEC · 32 semanas</button>
  </div>
  <div class="card border-0 bg-primary-subtle mb-4"><div class="card-body p-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div><h2 class="h5">${percurso === 'formacao' ? 'Da primeira vela à pesquisa reproduzível' : 'Fundamentos e técnica com referência oficial'}</h2>
      <p class="mb-2">${percurso === 'formacao' ? '6 níveis · 8 h por semana · aproximadamente 448 horas. O último nível inicia uma especialização contínua.' : '6 blocos · 10 h por semana · após a base essencial. Organização pedagógica independente, não é curso oficial da APIMEC.'}</p>
      <span data-progresso-texto>${resumo.concluidos} de ${resumo.total} etapas concluídas</span></div>
      <button class="btn btn-primary" data-continuar ${!proximo ? 'disabled' : ''}>${!proximo ? 'Percurso concluído' : resumo.concluidos ? 'Continuar estudos' : 'Começar agora'}</button>
    </div>
    <div class="progress mt-3" role="progressbar" aria-label="Progresso do percurso" aria-valuenow="${resumo.percentual}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${resumo.percentual}%">${resumo.percentual}%</div></div>
  </div></div>
  <p class="small text-secondary">${percurso === 'formacao' ? 'Avance quando conseguir demonstrar a competência. Os prazos não garantem domínio ou rentabilidade.' : 'CB + CG1 → CNPI · CB + CT1 → CNPI-T · CB + CG1 + CT1 → CNPI-P. Confira o manual vigente antes da inscrição.'}</p>
  ${percurso === 'apimec' ? `<p class="small text-secondary">Base pública consultada em 26/09/2026; não inclui áreas restritas nem extração integral do site. Certificação e credenciamento são etapas distintas.</p>${linksFontes(['cnpi', 'manual'])}` : ''}
  <div class="vstack gap-3 mt-3">${(percurso === 'formacao' ? niveis : apimec).map((n, i) => `<details class="card shadow-sm" id="etapa-${n.id}" ${pesquisavel(n)}>
    <summary class="card-header bg-white p-3"><span class="badge bg-primary-subtle text-primary me-2">${String(i + 1).padStart(2, '0')}</span><strong>${escapar(n.titulo)}</strong><span class="text-secondary ms-2 small">${n.semanas ? `${n.semanas} semanas · ${n.semanas * 8} h` : n.periodo}</span><span class="badge text-bg-success ms-2 ${progresso.concluidos.has(n.id) ? '' : 'd-none'}" data-selo="${n.id}">Concluído</span>${n.foco ? `<span class="d-block text-secondary small mt-2">${n.foco}</span>` : ''}</summary>
    <div class="card-body p-4">${n.pergunta ? `<h3 class="h5 mb-3">${escapar(n.pergunta)}</h3><h4 class="h6">O que estudar</h4>${lista(n.topicos)}<div class="bg-light rounded p-3 mb-3"><h4 class="h6">Laboratório no sistema</h4><p class="mb-0">${escapar(n.pratica)}</p></div>` : `<p>${escapar(n.descricao)}</p>`}
    <h4 class="h6">Sua entrega</h4><p>${escapar(n.entrega)}</p>
    ${n.criterio ? `<h4 class="h6">Critério para avançar</h4><p>${escapar(n.criterio)}</p>${atalhos(n.rotas)}` : linksFontes(n.fontes)}
    ${conclusao(n.id, progresso)}</div></details>`).join('')}</div>`;
}

export function renderConhecimento() {
  return `<h2 class="h4">Conhecimento para interpretar com autonomia</h2><p class="text-secondary">Conceitos organizados por tema. Use o Glossário para aprofundar o vocabulário.</p><div class="row g-3">${conhecimentos.map(c => `<article class="col-12 col-lg-6" ${pesquisavel(c)}><div class="card h-100 shadow-sm border-0"><div class="card-body p-4"><h3 class="h5">${c.titulo}</h3><p class="text-secondary">${c.descricao}</p>${lista(c.itens)}<a href="#/glossario" class="btn btn-sm btn-outline-primary">Consultar Glossário</a></div></div></article>`).join('')}</div>`;
}

export function renderOrientacoes() {
  return `<h2 class="h4">Orientações para estudar e decidir melhor</h2><p class="text-secondary">Hábitos, critérios e limites que acompanham todos os níveis.</p><div class="row g-3">${orientacoes.map(o => `<article class="col-12 col-lg-6" ${pesquisavel(o)}><div class="card h-100 border-0 shadow-sm"><div class="card-body p-4"><h3 class="h5">${o.titulo}</h3><p class="mb-0">${o.texto}</p>${o.fonte ? linksFontes([o.fonte]) : ''}</div></div></article>`).join('')}</div>`;
}

export function renderMateriais() {
  return `<h2 class="h4">Material didático e prática guiada</h2><p class="text-secondary">Exercícios, ficha de pesquisa e fontes para transformar leitura em entregas.</p>
  <div class="vstack gap-3 mb-4">${exercicios.map(e => `<details class="card" ${pesquisavel(e)}><summary class="card-header bg-white p-3"><span class="badge text-bg-light me-2">${e.nivel}</span><strong>${e.titulo}</strong></summary><div class="card-body p-4">${e.formula ? `<p class="bg-light rounded p-3 font-monospace text-break">${escapar(e.formula)}</p>` : ''}<ol>${e.passos.map(p => `<li class="mb-2">${escapar(p)}</li>`).join('')}</ol><p><strong>Entrega:</strong> ${escapar(e.entrega)}</p>${atalhos(e.rotas)}</div></details>`).join('')}</div>
  <article class="card mb-4" ${pesquisavel(fichaLaboratorio)}><div class="card-body p-4"><h3 class="h5">Ficha de laboratório de candles</h3><p>Preencha a mesma ficha em todos os níveis: descrever → classificar → comparar → testar → reproduzir.</p><div class="table-responsive"><table class="table"><caption>Campos para registrar cada estudo.</caption><thead><tr><th scope="col">Campo</th><th scope="col">O que registrar</th></tr></thead><tbody>${fichaLaboratorio.map(([campo, valor]) => `<tr><th scope="row">${campo}</th><td>${valor}</td></tr>`).join('')}</tbody></table></div></div></article>
  <article class="card mb-4" ${pesquisavel(recursosSistema)}><div class="card-body p-4"><h3 class="h5">Seu laboratório no B3 Ecosystem</h3><div class="table-responsive"><table class="table"><caption>Recursos e limites: implementação não comprova disponibilidade de dados.</caption><thead><tr><th scope="col">Recurso</th><th scope="col">Exercício</th><th scope="col">Limite</th></tr></thead><tbody>${recursosSistema.map(([nome, uso, limite, rota]) => `<tr><th scope="row"><a href="#/${rota}">${nome}</a></th><td>${uso}</td><td>${limite}</td></tr>`).join('')}</tbody></table></div><p class="small text-secondary mb-0">Tape reading, book de ofertas, times & trades e volume por preço exigem dados adicionais. IFR, MACD e outros conteúdos da trilha não são presumidos como ferramentas já implementadas.</p></div></article>
  <h3 class="h5">Biblioteca de fontes</h3><p class="small text-secondary">Referências consultadas em 26/09/2026. Verifique regras e disponibilidade na fonte. Links externos abrem em nova aba.</p><div class="row g-3">${fontes.map(f => `<article class="col-12 col-lg-6" ${pesquisavel(f)}><div class="card h-100 border-0 shadow-sm"><div class="card-body"><h4 class="h6"><a href="${f.url}" target="_blank" rel="noopener noreferrer">${f.titulo} ↗<span class="visually-hidden"> (nova aba)</span></a></h4><p class="small mb-0">${f.descricao}</p></div></div></article>`).join('')}</div>`;
}
