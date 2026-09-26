import { categoriaComunicado } from '../api/comunicadosApi.js';
import { escaparHtml } from '../utils/html.js';

// Unica responsabilidade: desenhar UM comunicado oficial da CVM. Funcao pura,
// usada tanto na edicao semanal quanto na linha do tempo do ativo.
//
// Todo texto vem da CVM e passa por escaparHtml - o assunto e texto livre
// digitado pela companhia. So o link oficial do documento e exibido; o
// conteudo nao e copiado (infra#CTR-10).

// Assunto passa de 4 mil caracteres em alguns documentos; o resumo evita que
// um so item empurre a edicao inteira para baixo.
const LIMITE_RESUMO = 280;

export function renderComunicado(comunicado, { mostrarSimbolo = null } = {}) {
  const categoria = categoriaComunicado(comunicado.categoria);
  const detalhes = [comunicado.tipo, comunicado.especie].filter(Boolean).map(escaparHtml).join(' · ');

  return `
    <li class="list-group-item px-0">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
        <span class="small text-muted" title="Data de entrega à CVM">${formatarData(comunicado.dataEntrega)}</span>
        <span class="badge ${categoria.classe}">${escaparHtml(categoria.rotulo)}</span>
        ${mostrarSimbolo ? `<span class="badge text-bg-light border">${escaparHtml(mostrarSimbolo)}</span>` : ''}
        ${comunicado.versao > 1 ? `<span class="badge text-bg-light border" title="Documento reapresentado">versão ${comunicado.versao}</span>` : ''}
      </div>
      ${renderAssunto(comunicado)}
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-1">
        <span class="small text-muted">${detalhes}</span>
        <a class="small" href="${escaparHtml(comunicado.link)}" target="_blank" rel="noopener noreferrer">
          Abrir documento na CVM ↗
        </a>
      </div>
    </li>
  `;
}

function renderAssunto(comunicado) {
  // Relatorio automatico de proventos vem sem assunto: cai para a categoria
  // original, para a linha nunca ficar em branco.
  const texto = (comunicado.assunto || comunicado.categoriaOriginal || '').trim();
  if (texto.length <= LIMITE_RESUMO) {
    return `<p class="mb-0">${escaparHtml(texto)}</p>`;
  }
  return `
    <details>
      <summary class="mb-0">${escaparHtml(texto.slice(0, LIMITE_RESUMO).trimEnd())}…</summary>
      <p class="mb-0 mt-1 small">${escaparHtml(texto)}</p>
    </details>
  `;
}

export function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = String(iso).split('-');
  return `${dia}/${mes}/${ano}`;
}
