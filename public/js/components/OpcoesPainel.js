import { BaseComponent } from './base/BaseComponent.js';
import { escaparHtml } from '../utils/html.js';

// BDI 12 = call, 14 = put (B3 COTAHIST).
const BDI_TIPO = { '12': 'CALL', '14': 'PUT' };
const BDI_COR  = { '12': 'text-success', '14': 'text-danger' };

// Unica responsabilidade: renderizar a tabela de opcoes de um ativo no ultimo
// pregao disponivel. Moneyness e calculado em relacao ao preco_medio da opcao
// vs preco_exercicio: ITM (in the money), ATM, OTM.
//
// Uso: <opcoes-painel></opcoes-painel>, depois .setDados(resposta).
export class OpcoesPainel extends BaseComponent {
  setDados(dados) {
    this._dados = dados;
    this.innerHTML = dados ? this._template(dados) : '';
  }

  _template(d) {
    if (!d.opcoes || d.opcoes.length === 0) {
      return '<p class="text-muted">Nenhuma opção encontrada para esse ativo no último pregão.</p>';
    }

    const calls = d.opcoes.filter((o) => o.bdi === '12' || o.bdi === 12);
    const puts  = d.opcoes.filter((o) => o.bdi === '14' || o.bdi === 14);

    const tabelaCalls = calls.length ? _tabelaOpcoes(calls, 'CALL') : '';
    const tabelaPuts  = puts.length  ? _tabelaOpcoes(puts,  'PUT')  : '';

    const dataPregao = d.opcoes[0]?.data_pregao
      ? new Date(d.opcoes[0].data_pregao + 'T00:00:00').toLocaleDateString('pt-BR')
      : '';

    return `
      <p class="text-muted small mb-2">Pregão: ${dataPregao} &nbsp;·&nbsp; ${d.opcoes.length} série(s)</p>
      ${tabelaCalls}
      ${tabelaPuts}
    `;
  }
}

function _tabelaOpcoes(opcoes, tipo) {
  const cor = tipo === 'CALL' ? 'text-success' : 'text-danger';
  const linhas = opcoes.map((o) => {
    const exercicio = Number(o.preco_exercicio ?? 0);
    const medio = Number(o.preco_medio ?? o.fechamento ?? 0);
    const moneyness = _moneyness(tipo, exercicio, medio);
    return `<tr class="${moneyness.classe}">
      <td class="fw-semibold">${escaparHtml(o.simbolo)}</td>
      <td>${_fmtData(o.data_vencimento)}</td>
      <td class="text-end">${_fmtMoeda(exercicio)}</td>
      <td class="text-end">${_fmtMoeda(o.fechamento)}</td>
      <td class="text-end">${_fmtMoeda(medio)}</td>
      <td class="text-end">${_fmtInt(o.numero_negocios)}</td>
      <td><span class="badge ${moneyness.badgeCls}">${moneyness.rotulo}</span></td>
    </tr>`;
  }).join('');

  return `
    <h6 class="${cor} mt-3">${tipo}</h6>
    <div class="table-responsive mb-3">
      <table class="table table-sm table-hover small align-middle">
        <thead>
          <tr>
            <th>Símbolo</th>
            <th>Vencimento</th>
            <th class="text-end">Exercício</th>
            <th class="text-end">Fechamento</th>
            <th class="text-end">Preço médio</th>
            <th class="text-end">Negócios</th>
            <th>Moneyness</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function _moneyness(tipo, exercicio, premioOuFechamento) {
  // Para CALL: ITM se exercicio < spot (mas so temos preco_medio da opcao, nao do spot).
  // Aproximacao: compara exercicio x preco_medio da opcao.
  // Na pratica o painel e mais utilitario do que analitico aqui.
  if (!exercicio || !premioOuFechamento) {
    return { rotulo: '—', classe: '', badgeCls: 'bg-secondary' };
  }
  // Sem o spot, classificamos pelo preco_exercicio vs preco_medio da opcao
  // apenas para dar uma referencia visual (nao e moneyness rigoroso sem o spot).
  // ATM: exercicio ~= medio (diferenca < 5%), ITM/OTM baseado na relacao.
  const razao = Math.abs(exercicio - premioOuFechamento) / exercicio;
  if (razao < 0.05) return { rotulo: 'ATM', classe: '', badgeCls: 'bg-warning text-dark' };
  if (tipo === 'CALL') {
    return exercicio < premioOuFechamento
      ? { rotulo: 'ITM', classe: 'table-success', badgeCls: 'bg-success' }
      : { rotulo: 'OTM', classe: 'table-secondary', badgeCls: 'bg-secondary' };
  }
  return exercicio > premioOuFechamento
    ? { rotulo: 'ITM', classe: 'table-success', badgeCls: 'bg-success' }
    : { rotulo: 'OTM', classe: 'table-secondary', badgeCls: 'bg-secondary' };
}

function _fmtMoeda(v) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return '—';
  return `R$ ${Number(v).toFixed(2)}`;
}

function _fmtInt(v) {
  if (v == null) return '—';
  return Number(v).toLocaleString('pt-BR');
}

function _fmtData(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = String(iso).split('-');
  return `${dia}/${mes}/${ano}`;
}

customElements.define('opcoes-painel', OpcoesPainel);
