// Unica responsabilidade: selos de estado unicos (REQ-UX-2). Cor sempre vem
// com texto; modulo puro, sem DOM.
import { escaparHtml } from './html.js';

export const SELOS = {
  OK: { rotulo: 'Em dia', classe: 'text-bg-success' },
  ATRASADA: { rotulo: 'Atrasada', classe: 'text-bg-danger' },
  ERRO: { rotulo: 'Erro', classe: 'text-bg-danger' },
  SEM_DADO: { rotulo: 'Sem dado', classe: 'text-bg-secondary' },
  ATENCAO: { rotulo: 'Atenção', classe: 'text-bg-warning' },
  EXPERIMENTAL: { rotulo: 'Experimental', classe: 'text-bg-warning' },
  FAVORITO: { rotulo: 'Favorito', classe: 'text-bg-primary' },
};

/** `<span class="badge ...">Rotulo</span>`; estado desconhecido vira "Sem dado". */
export function htmlSelo(estado, rotulo) {
  const selo = SELOS[estado] || SELOS.SEM_DADO;
  return `<span class="badge ${selo.classe}">${escaparHtml(rotulo || selo.rotulo)}</span>`;
}
