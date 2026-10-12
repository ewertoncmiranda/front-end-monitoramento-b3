import { BaseComponent } from './base/BaseComponent.js';
import { escaparHtml } from '../utils/html.js';

const SEM_DADO = 'sem dado';

function primeiro(dados, ...chaves) {
  for (const chave of chaves) {
    if (dados?.[chave] !== undefined) return dados[chave];
  }
  return null;
}

function inteiro(valor) {
  if (valor == null || valor === '' || !Number.isFinite(Number(valor))) return SEM_DADO;
  return Number(valor).toLocaleString('pt-BR');
}

function data(valor) {
  if (!valor) return SEM_DADO;
  const partes = String(valor).slice(0, 10).split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(valor);
}

function percentual(dados, validos, invalidos) {
  const informado = primeiro(dados, 'percentualValido', 'percentual_valido');
  if (informado != null && Number.isFinite(Number(informado))) {
    const numero = Number(informado);
    return `${(numero <= 1 ? numero * 100 : numero).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
  if (Number.isFinite(Number(validos)) && Number.isFinite(Number(invalidos)) && Number(validos) + Number(invalidos) > 0) {
    return `${(Number(validos) * 100 / (Number(validos) + Number(invalidos))).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
  return SEM_DADO;
}

function listaPrefixos(valor) {
  if (!Array.isArray(valor) || valor.length === 0) {
    return '<span class="text-muted">Nenhum prefixo suspeito informado.</span>';
  }
  return `<ul class="list-inline mb-0">${valor.map((item) => {
    const prefixo = typeof item === 'string' ? item : item?.prefixo ?? item?.simbolo ?? item?.codigo;
    const total = typeof item === 'object' ? item?.total ?? item?.quantidade : null;
    return `<li class="list-inline-item badge text-bg-warning mb-1">${escaparHtml(prefixo || SEM_DADO)}${total == null ? '' : ` · ${escaparHtml(inteiro(total))}`}</li>`;
  }).join('')}</ul>`;
}

export function htmlSaudeCadeiaOpcoes(dados) {
  if (!dados || dados.indisponivel) {
    return `<section class="card border-secondary" aria-labelledby="saude-opcoes-titulo">
      <div class="card-body">
        <h5 id="saude-opcoes-titulo" class="card-title">Saúde da cadeia de opções</h5>
        <p class="small text-muted mb-0">Diagnóstico ainda indisponível neste ambiente. A ausência desta rota não transforma dados desconhecidos em zero.</p>
      </div>
    </section>`;
  }

  const validos = primeiro(dados, 'registrosValidos', 'validos', 'registros_validos');
  const invalidos = primeiro(dados, 'registrosInvalidos', 'invalidos', 'registros_invalidos');
  const vencimento9999 = primeiro(dados, 'registrosVencimento9999', 'vencimento9999', 'registros_vencimento_9999');
  const comCadeia = primeiro(dados, 'ativosMonitoradosComCadeia', 'ativos_com_cadeia');
  const semCadeia = primeiro(dados, 'ativosMonitoradosSemCadeia', 'ativos_sem_cadeia');
  const ultimoPregao = primeiro(dados, 'ultimoPregaoComOpcoesValidas', 'ultimoPregaoValido', 'ultimo_pregao_com_opcoes_validas');
  const prefixos = primeiro(dados, 'prefixosSuspeitos', 'prefixos_suspeitos');

  const card = (rotulo, valor, classe = '') => `<div class="col-6 col-lg-3">
    <div class="border rounded p-2 h-100 ${classe}">
      <span class="small text-muted d-block">${escaparHtml(rotulo)}</span>
      <strong>${escaparHtml(inteiro(valor))}</strong>
    </div>
  </div>`;

  return `<section class="card" aria-labelledby="saude-opcoes-titulo">
    <div class="card-body">
      <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <div><h5 id="saude-opcoes-titulo" class="card-title mb-1">Saúde da cadeia de opções</h5>
          <p class="small text-muted mb-0">Qualidade da carga usada apenas para estudo e simulação.</p></div>
        <div class="text-end"><span class="small text-muted d-block">Último pregão válido</span><strong>${escaparHtml(data(ultimoPregao))}</strong></div>
      </div>
      <div class="row g-2 mb-3">
        ${card('Registros válidos', validos, 'border-success-subtle')}
        ${card('Registros inválidos', invalidos, 'border-danger-subtle')}
        ${card('Vencimento 9999', vencimento9999, 'border-warning-subtle')}
        <div class="col-6 col-lg-3"><div class="border rounded p-2 h-100"><span class="small text-muted d-block">Percentual válido</span><strong>${escaparHtml(percentual(dados, validos, invalidos))}</strong></div></div>
        ${card('Ativos com cadeia', comCadeia)}
        ${card('Ativos sem cadeia', semCadeia, 'border-warning-subtle')}
      </div>
      <div><span class="small text-muted d-block mb-1">Prefixos suspeitos</span>${listaPrefixos(prefixos)}</div>
    </div>
  </section>`;
}

export class SaudeCadeiaOpcoes extends BaseComponent {
  setDados(dados) {
    this.innerHTML = htmlSaudeCadeiaOpcoes(dados);
  }
}

customElements.define('saude-cadeia-opcoes', SaudeCadeiaOpcoes);
