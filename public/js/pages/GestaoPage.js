import { BaseComponent } from '../components/base/BaseComponent.js';
import { escaparHtml } from '../utils/html.js';
import '../pages/ConsultaPage.js';
import '../pages/CadastroPage.js';

/** `#/gestao/PETR4` (rota da busca global) ou `#/gestao?ativo=PETR4` -> "PETR4". */
function ativoDoHash() {
  const [caminho, consulta = ''] = window.location.hash.split('?');
  const doCaminho = decodeURIComponent(caminho.replace(/^#\/gestao\/?/, ''));
  return (doCaminho || new URLSearchParams(consulta).get('ativo') || '').trim().toUpperCase();
}

// Unica responsabilidade: a aba Gestao - a ficha do ativo (<consulta-page>)
// como tela principal e o cadastro ao lado. O antigo "Como funciona" virou
// parte da ficha: explicacao em popover em cada indicador e os numeros
// completos num bloco expansivel, junto do ativo que se esta olhando.
export class GestaoPage extends BaseComponent {
  template() {
    const ativo = ativoDoHash();
    return `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 class="mb-0">Ficha do ativo</h4>
        <ul class="nav nav-pills nav-sm ficha-abas" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#gestao-painel-ficha" type="button" role="tab">Ficha</button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#gestao-painel-cadastro" type="button" role="tab">Cadastro</button>
          </li>
        </ul>
      </div>
      <div class="tab-content">
        <div class="tab-pane fade show active" id="gestao-painel-ficha" role="tabpanel">
          <consulta-page ${ativo ? `simbolo="${escaparHtml(ativo)}"` : ''}></consulta-page>
        </div>
        <div class="tab-pane fade" id="gestao-painel-cadastro" role="tabpanel">
          <cadastro-page></cadastro-page>
        </div>
      </div>
    `;
  }
}

customElements.define('gestao-page', GestaoPage);
