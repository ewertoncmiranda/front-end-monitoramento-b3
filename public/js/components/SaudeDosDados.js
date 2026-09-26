import { BaseComponent } from './base/BaseComponent.js';
import { buscarSaudeDosDados } from '../api/validacaoApi.js';
import {
  ESTADO_FONTE,
  ESTADO_GERAL,
  ativosComPendencia,
  deTotal,
  formatarIdade,
  formatarPrazo,
} from '../analise/saudeDosDados.js';
import { formatarPercentual } from '../analise/diarioDeSinais.js';
import { escaparHtml } from '../utils/html.js';
import './LoadingSpinner.js';

// Unica responsabilidade: mostrar, ao vivo, se os dados que alimentam as
// regras merecem confianca - idade de cada fonte, cobertura por ativo e a
// checagem BRAPI x COTAHIST. E a evidencia da nota "Confiabilidade dos
// dados". Dados de /validacao/saude-dados (infra#CTR-12).

export class SaudeDosDados extends BaseComponent {
  template() {
    return '<div id="saude-conteudo"><loading-spinner></loading-spinner></div>';
  }

  async afterRender() {
    const area = this.querySelector('#saude-conteudo');
    try {
      const dados = await buscarSaudeDosDados();
      area.innerHTML = renderizar(dados);
    } catch (erro) {
      area.innerHTML = `<div class="alert alert-secondary small mb-0">
        Não foi possível carregar a saúde dos dados agora (${escaparHtml(erro.message)}).</div>`;
    }
  }
}

function renderizar(dados) {
  const geral = ESTADO_GERAL[dados.estadoGeral] || ESTADO_GERAL.ATENCAO;
  const atrasadas = dados.fontes.filter((f) => f.estado !== 'OK').length;
  return `
    <div class="alert ${geral.classe} py-2 small d-flex flex-wrap gap-2 align-items-center">
      <strong>${geral.rotulo}.</strong>
      <span>${atrasadas === 0 ? 'Todas as fontes em dia' : `${atrasadas} fonte(s) fora do prazo`}
        · ${dados.cobertura.comPrecoEFundamentos} de ${dados.cobertura.ativos} ativos com preço e balanço juntos
        · ${dados.precos.divergencias.length} divergência(s) de preço acima de ${formatarPercentual(dados.precos.limite, 0).replace('+', '')}</span>
    </div>
    ${renderAliases(dados.aliases)}
    ${renderCobertura(dados.cobertura)}
    <h6 class="mt-3">Fontes</h6>
    ${renderFontes(dados.fontes)}
    <h6 class="mt-3">Preço: BRAPI x fechamento oficial da B3</h6>
    ${renderPrecos(dados.precos)}
    <h6 class="mt-3">Pendências por ativo</h6>
    ${renderAtivos(dados.ativos)}
  `;
}

function renderAliases(aliases) {
  if (!aliases || !aliases.length) return '';
  return `<div class="alert alert-danger small py-2">
    <strong>Ticker antigo no universo:</strong> ${aliases.map(escaparHtml).join(', ')}.
    Preço e balanço dessa empresa ficam em códigos diferentes. O registro deveria ter usado o código canônico.
  </div>`;
}

function renderCobertura(c) {
  const cartao = (valor, rotulo, ruim) => `
    <div class="col"><div class="border rounded p-2 h-100 ${ruim ? 'border-warning' : ''}">
      <div class="fs-5 fw-semibold">${valor}</div><div class="small text-muted">${rotulo}</div>
    </div></div>`;
  return `
    <div class="row row-cols-2 row-cols-md-4 g-2">
      ${cartao(deTotal(c.comPrecoEFundamentos, c.ativos), 'com preço e balanço juntos', c.comPrecoEFundamentos < c.ativos)}
      ${cartao(deTotal(c.comEntregaConhecida, c.ativos), 'balanço com data de entrega (point-in-time)', c.comEntregaConhecida < c.ativos)}
      ${cartao(deTotal(c.comTtm, c.ativos), 'com lucro dos últimos 12 meses', c.comTtm < c.ativos)}
      ${cartao(c.semCnpj, 'sem CNPJ (não ligam ao balanço)', c.semCnpj > 0)}
    </div>`;
}

function renderFontes(fontes) {
  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle small mb-0">
        <thead><tr><th>Fonte</th><th>Última atualização</th><th>Prazo</th><th>Estado</th><th>Se atrasar</th></tr></thead>
        <tbody>
          ${fontes.map((f) => {
            const estado = ESTADO_FONTE[f.estado] || ESTADO_FONTE.SEM_DADO;
            return `<tr>
              <td class="fw-semibold">${escaparHtml(f.nome)}</td>
              <td title="${escaparHtml(f.atualizadoEm || '')}">${formatarIdade(f.idadeHoras)}</td>
              <td class="text-muted">${formatarPrazo(f.prazoHoras)}</td>
              <td><span class="badge ${estado.classe}">${estado.rotulo}</span>
                ${f.ultimoErro ? `<div class="text-danger">${escaparHtml(f.ultimoErro)}</div>` : ''}</td>
              <td class="text-muted">${escaparHtml(f.comoResolver)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderPrecos(p) {
  const resumo = `<p class="small text-muted mb-1">${p.paresComparados} pares (ativo, pregão) comparados nos
    últimos ${p.janelaDias} dias; divergência acima de ${formatarPercentual(p.limite, 0).replace('+', '')} vira alerta.</p>`;
  if (!p.paresComparados) {
    return `${resumo}<p class="small text-warning mb-0">Nenhum pregão em comum ainda: carregue o COTAHIST do ano corrente.</p>`;
  }
  if (!p.divergencias.length) {
    return `${resumo}<p class="small text-success mb-0">Nenhuma divergência: a BRAPI bate com o fechamento oficial.</p>`;
  }
  return `${resumo}
    <div class="table-responsive"><table class="table table-sm small mb-0">
      <thead><tr><th>Ativo</th><th>Pregão</th><th class="text-end">BRAPI</th><th class="text-end">B3</th><th class="text-end">Diferença</th></tr></thead>
      <tbody>${p.divergencias.slice(0, 10).map((d) => `<tr>
        <td>${escaparHtml(d.simbolo)}</td><td>${escaparHtml(d.data)}</td>
        <td class="text-end">${Number(d.fechamentoBrapi).toFixed(2)}</td>
        <td class="text-end">${Number(d.fechamentoB3).toFixed(2)}</td>
        <td class="text-end text-danger">${formatarPercentual(d.diferenca)}</td></tr>`).join('')}
      </tbody></table></div>`;
}

function renderAtivos(ativos) {
  const pendentes = ativosComPendencia(ativos);
  const semPendencia = (ativos || []).length - pendentes.length;
  if (!pendentes.length) {
    return `<p class="small text-success mb-0">Todos os ${ativos.length} ativos sem pendência.</p>`;
  }
  return `
    <p class="small text-muted mb-1">${semPendencia} de ${ativos.length} ativos sem pendência.</p>
    <ul class="list-group list-group-flush small">
      ${pendentes.map((a) => `
        <li class="list-group-item px-0 py-1 d-flex flex-wrap gap-1 align-items-center">
          <strong class="me-1">${escaparHtml(a.simbolo)}</strong>
          ${a.problemas.map((p) => `<span class="badge text-bg-light border text-wrap text-start">${escaparHtml(p)}</span>`).join('')}
        </li>`).join('')}
    </ul>`;
}

customElements.define('saude-dos-dados', SaudeDosDados);
