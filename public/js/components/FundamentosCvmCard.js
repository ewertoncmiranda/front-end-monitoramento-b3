import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: renderizar os fundamentos contabeis vindos da CVM.
// Nao busca dado nem calcula nada - recebe pronto de GET
// /analises/{simbolo}/fundamentos-cvm e so decide como mostrar.
//
// Tem dois modos: "resumo" (tres numeros, pra encaixar na tela de Consulta) e
// completo (todas as secoes, pra aba Como funciona).
export class FundamentosCvmCard extends BaseComponent {
  setFundamentos(fundamentos) {
    this._fundamentos = fundamentos;
    this.innerHTML = this.template();
  }

  get resumido() {
    return this.getAttribute('modo') === 'resumo';
  }

  template() {
    const f = this._fundamentos;

    if (!f || !temAlgumDado(f)) {
      return this.resumido ? '' : cardVazio();
    }

    return this.resumido ? this.templateResumo(f) : this.templateCompleto(f);
  }

  templateResumo(f) {
    return `
      <div class="card shadow-sm mb-3">
        <div class="card-body py-2">
          <div class="d-flex flex-wrap align-items-center gap-3 small">
            <span class="badge bg-info text-dark">Fundamentos CVM</span>
            ${campoInline('ROE', formatarPercentual(f.roe))}
            ${campoInline('P/L', formatarNumero(f.preco_lucro))}
            ${campoInline('P/VP', formatarNumero(f.preco_valor_patrimonial))}
            <a class="ms-auto" href="#/gestao">Ver detalhe em Como funciona</a>
          </div>
        </div>
      </div>
    `;
  }

  templateCompleto(f) {
    return `
      <div class="card shadow-sm mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span class="fw-semibold">${f.simbolo || ''} — fundamentos CVM</span>
          <span class="text-muted small">${formatarData(f.periodo)}</span>
        </div>
        <div class="card-body">
          ${secaoAviso(f)}
          ${secaoRentabilidade(f)}
          ${secaoPorAcao(f)}
          ${secaoCapital(f)}
          ${secaoResultado(f)}
          ${secaoProcedencia(f)}
          ${secaoCobertura(f)}
        </div>
      </div>
    `;
  }
}

function temAlgumDado(f) {
  return Boolean(f.periodo || f.roe || f.lpa || f.vpa || f.lucro_liquido);
}

function cardVazio() {
  return `
    <div class="card shadow-sm mb-3">
      <div class="card-body">
        <p class="text-muted mb-0">
          Nenhum fundamento da CVM carregado para esse ativo ainda. O ETL carrega
          apenas os ativos registrados para monitoramento.
        </p>
      </div>
    </div>
  `;
}

// O balanco e do exercicio fechado e o preco e de agora; dizer a distancia
// entre os dois evita que o leitor compare coisas de datas diferentes sem saber.
function secaoAviso(f) {
  if (f.defasagem_dias === undefined || f.defasagem_dias === null) return '';
  const variante = f.defasagem_dias > 400 ? 'warning' : 'secondary';
  return `
    <p class="small mb-3">
      <span class="badge bg-${variante}">Balanço de ${formatarData(f.periodo)}</span>
      <span class="text-muted ms-2">
        ${f.defasagem_dias} dias atrás. Os múltiplos usam a cotação de
        ${formatarDataHora(f.preco_em)}.
      </span>
    </p>
  `;
}

function secaoRentabilidade(f) {
  if (f.roe === null && f.roic === null && f.margem_liquida === null) return '';
  return `
    <h6 class="mt-2">Rentabilidade</h6>
    <div class="row row-cols-2 row-cols-md-3 g-2 small mb-3">
      ${campo('ROE', formatarPercentual(f.roe))}
      ${campo('ROIC', formatarPercentual(f.roic))}
      ${campo('Margem líquida', formatarPercentual(f.margem_liquida))}
    </div>
  `;
}

function secaoPorAcao(f) {
  return `
    <h6 class="mt-2">Por acao</h6>
    <div class="row row-cols-2 row-cols-md-4 g-2 small mb-3">
      ${campo('LPA', formatarMoeda(f.lpa))}
      ${campo('VPA', formatarMoeda(f.vpa))}
      ${campo('P/L', formatarNumero(f.preco_lucro))}
      ${campo('P/VP', formatarNumero(f.preco_valor_patrimonial))}
    </div>
  `;
}

function secaoCapital(f) {
  if (f.divida_bruta === null && f.caixa_equivalentes === null) return '';
  const classeDivida = f.divida_liquida < 0 ? 'text-success' : '';
  return `
    <h6 class="mt-2">Estrutura de capital</h6>
    <div class="row row-cols-2 row-cols-md-4 g-2 small mb-3">
      ${campo('Dívida bruta', formatarBilhoes(f.divida_bruta))}
      ${campo(
        'Dívida líquida',
        `<span class="${classeDivida}">${formatarBilhoes(f.divida_liquida)}</span>`,
      )}
      ${campo('Caixa', formatarBilhoes(f.caixa_equivalentes))}
      ${campo('Fluxo de caixa livre', formatarBilhoes(f.fluxo_caixa_livre))}
    </div>
    ${
      f.divida_liquida < 0
        ? '<p class="text-success small mb-3">Dívida líquida negativa: a empresa tem mais caixa do que dívida.</p>'
        : ''
    }
  `;
}

function secaoResultado(f) {
  if (f.receita_liquida === null && f.lucro_liquido === null) return '';
  return `
    <h6 class="mt-2">Resultado do exercicio</h6>
    <div class="row row-cols-2 row-cols-md-4 g-2 small mb-3">
      ${campo('Receita líquida', formatarBilhoes(f.receita_liquida))}
      ${campo('EBIT', formatarBilhoes(f.ebit))}
      ${campo('Lucro liquido', formatarBilhoes(f.lucro_liquido))}
      ${campo('Ações fora da tesouraria', formatarInteiro(f.acoes_ex_tesouraria))}
    </div>
  `;
}

function secaoProcedencia(f) {
  return `
    <h6 class="mt-2">Procedencia</h6>
    <div class="d-flex flex-wrap gap-3 small mb-3 text-muted">
      <span>Fonte: <strong>${f.fonte || '-'}</strong></span>
      <span>Documento: <strong>${f.tipo_doc || '-'}</strong></span>
      <span>Período: <strong>${f.tipo_periodo || '-'}</strong></span>
      <span>Plano de contas: <strong>${f.plano_contas || '-'}</strong></span>
      <span>Versao CVM: <strong>${f.versao_cvm ?? '-'}</strong></span>
    </div>
  `;
}

// A secao que justifica o resto: metrica vazia aqui e decisao, nao falha.
// Sem essa explicacao, um "-" na tela passa por bug.
function secaoCobertura(f) {
  if (!f.cobertura) return '';

  const ausentes = Object.entries(f.cobertura).filter(
    ([, detalhe]) => detalhe && detalhe.estrategia !== 'rotulo' && detalhe.estrategia !== 'codigo',
  );

  if (ausentes.length === 0) {
    return '<p class="text-success small mb-0">Todas as metricas foram extraidas das contas padronizadas da CVM.</p>';
  }

  const linhas = ausentes
    .map(
      ([metrica, detalhe]) => `
        <tr>
          <td class="fw-semibold">${metrica}</td>
          <td><span class="badge ${badgeEstrategia(detalhe.estrategia)}">${detalhe.estrategia}</span></td>
          <td class="text-muted">${detalhe.motivo || '-'}</td>
        </tr>`,
    )
    .join('');

  return `
    <h6 class="mt-2">Métricas não disponíveis</h6>
    <p class="small text-muted mb-2">
      O valor vazio é deliberado: o plano de contas desta companhia não
      comporta a métrica. Preferimos uma ausência explícita a um número incorreto.
    </p>
    <div class="table-responsive">
      <table class="table table-sm mb-0">
        <thead><tr><th>Metrica</th><th>Situacao</th><th>Por que</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function badgeEstrategia(estrategia) {
  if (estrategia === 'nao-aplicavel') return 'bg-secondary';
  if (estrategia === 'nao-extraivel') return 'bg-warning text-dark';
  return 'bg-light text-dark';
}

function campo(rotulo, valor) {
  return `<div class="col"><span class="text-muted">${rotulo}:</span> ${valor}</div>`;
}

function campoInline(rotulo, valor) {
  return `<span><span class="text-muted">${rotulo}:</span> <strong>${valor}</strong></span>`;
}

function formatarMoeda(valor) {
  return valor === undefined || valor === null ? '-' : `R$ ${Number(valor).toFixed(2)}`;
}

function formatarNumero(valor) {
  return valor === undefined || valor === null ? '-' : Number(valor).toFixed(2);
}

function formatarPercentual(valor) {
  return valor === undefined || valor === null ? '-' : `${Number(valor).toFixed(2)}%`;
}

function formatarInteiro(valor) {
  return valor === undefined || valor === null ? '-' : Number(valor).toLocaleString('pt-BR');
}

// Valores contabeis vem na casa dos bilhoes; mostrar o numero inteiro
// atrapalha mais do que informa.
function formatarBilhoes(valor) {
  if (valor === undefined || valor === null) return '-';
  const numero = Number(valor);
  if (Math.abs(numero) >= 1_000_000_000) return `R$ ${(numero / 1_000_000_000).toFixed(2)} bi`;
  if (Math.abs(numero) >= 1_000_000) return `R$ ${(numero / 1_000_000).toFixed(1)} mi`;
  return `R$ ${numero.toFixed(2)}`;
}

function formatarData(valor) {
  if (!valor) return '-';
  const partes = String(valor).slice(0, 10).split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(valor);
}

function formatarDataHora(valor) {
  if (!valor) return 'cotação indisponível';
  return String(valor).replace('T', ' ').slice(0, 16);
}

customElements.define('fundamentos-cvm-card', FundamentosCvmCard);
