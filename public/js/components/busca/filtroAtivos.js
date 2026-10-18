// Unica responsabilidade: o HTML da barra de busca de ativos - Buscar
// (simbolo ou nome), Setor, UF e Filtrar, com os filtros operacionais logo
// abaixo. Mesmo desenho da tela Ativos; puro, sem DOM. `prefixo` deixa os ids
// unicos quando ha mais de uma busca na pagina (uma por carteira, por exemplo).
import { escaparHtml } from '../../utils/html.js';
import { htmlFiltrosOperacionais } from '../ativos/FiltrosOperacionais.js';

export function htmlFiltroAtivos(estado = {}, { setores = [], opcoesOperacionais = {}, prefixo = 'ba' } = {}) {
  const id = (nome) => `${prefixo}-${nome}`;
  const opcoesSetor = setores.map((s) =>
    `<option value="${escaparHtml(s)}"${s === estado.setor ? ' selected' : ''}>${escaparHtml(s)}</option>`).join('');
  // Os selects operacionais ganham o prefixo para nao repetir id entre instancias.
  const operacionais = htmlFiltrosOperacionais(opcoesOperacionais, estado)
    .replaceAll('id="opr-f-', `id="${id('opr')}-`)
    .replaceAll('for="opr-f-', `for="${id('opr')}-`);
  return `
    <div class="row g-2 align-items-end mb-2" data-ba-barra>
      <div class="col-md-4">
        <label for="${id('busca')}" class="form-label small mb-1">Buscar</label>
        <input type="search" class="form-control form-control-sm" id="${id('busca')}" data-ba-campo="q"
               placeholder="Símbolo ou nome da empresa" autocomplete="off" value="${escaparHtml(estado.q || '')}">
      </div>
      <div class="col-md-3">
        <label for="${id('setor')}" class="form-label small mb-1">Setor</label>
        <select class="form-select form-select-sm" id="${id('setor')}" data-ba-campo="setor">
          <option value="">Todos os setores</option>${opcoesSetor}
        </select>
      </div>
      <div class="col-6 col-md-2">
        <label for="${id('uf')}" class="form-label small mb-1">UF</label>
        <input type="text" class="form-control form-control-sm" id="${id('uf')}" data-ba-campo="uf"
               placeholder="Ex.: SP" maxlength="2" style="text-transform:uppercase" value="${escaparHtml(estado.uf || '')}">
      </div>
      <div class="col-6 col-md-3">
        <button type="button" class="btn btn-primary btn-sm w-100" data-ba-filtrar>Filtrar</button>
      </div>
    </div>
    <div data-ba-operacionais>${operacionais}</div>`;
}
