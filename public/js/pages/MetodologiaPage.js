import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarFundamentos } from '../api/analisesApi.js';
import '../components/AtivoSearchForm.js';
import '../components/FundamentosCard.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a aba "Como funciona" - explica de onde
// vem cada numero (formulas usadas pelo gerar-insights) e, a partir de um
// simbolo, busca e delega a renderizacao dos fundamentos reais pra
// FundamentosCard.
export class MetodologiaPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-3">Como funciona</h4>
      ${this.explicacao()}
      <hr class="my-4">
      <h5 class="mb-2">Ver os numeros de um ativo</h5>
      <p class="text-muted small">Mostra o retrato exato da ultima analise persistida - os mesmos numeros calculados pelo gerar-insights naquele ciclo, sem media com o historico.</p>
      <ativo-search-form rotulo-botao="Buscar" placeholder="Ex.: PETR4"></ativo-search-form>
      <div id="fundamentos-resultado" class="mt-3"></div>
    `;
  }

  afterRender() {
    const form = this.querySelector('ativo-search-form');
    const resultado = this.querySelector('#fundamentos-resultado');

    form.addEventListener('ativo-buscado', async (event) => {
      const { simbolo } = event.detail;
      resultado.innerHTML = '<loading-spinner></loading-spinner>';

      try {
        const fundamentos = await buscarFundamentos(simbolo);
        resultado.innerHTML = '<fundamentos-card></fundamentos-card>';
        resultado.querySelector('fundamentos-card').setFundamentos(fundamentos);
      } catch (erro) {
        resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
      }
    });
  }

  explicacao() {
    return `
      <div class="small">
        <p>Todo ativo monitorado passa por duas etapas, feitas por dois serviços diferentes:</p>
        <ol>
          <li><strong>Coleta</strong> (gestor-ativos-brutos): busca a cotação e, quando é ativo monitorado, o histórico de candles na BRAPI.</li>
          <li><strong>Análise</strong> (gerar-insights): consome esses dados e calcula, a cada coleta, o retrato completo abaixo — sem IA, tudo por fórmula fixa.</li>
        </ol>

        <h6 class="mt-3">Valuation por Graham</h6>
        <p>Para 3 cenários de crescimento (conservador 0%, base 3%, otimista 5%), o múltiplo de lucro implícito é <code>8.5 + 2 × crescimento</code>, e o preço justo é <code>lucro por ação × múltiplo</code>. A margem de segurança de cada cenário é <code>(preço justo − preço atual) ÷ preço justo</code>.</p>

        <h6 class="mt-3">Earnings yield e P/L</h6>
        <p><code>earnings yield = lucro por ação ÷ preço</code> (o inverso do P/L, em %). Classificado como Atrativo (≥12%), Razoável (≥8%), Baixo (≥6%) ou Muito baixo. O P/L é classificado como Baixo com atenção (&lt;8), Saudável (8–15), Esticado (15–20) ou Exigente (&gt;20).</p>

        <h6 class="mt-3">Contexto técnico do dia</h6>
        <p>Posição do preço atual dentro do range de 52 semanas (0% = mínima, 100% = máxima), variação desde a abertura, variação vs. fechamento anterior e amplitude intradiária — tudo em %.</p>

        <h6 class="mt-3">Sinal técnico de série (quando há histórico)</h6>
        <p>Sobre os candles coletados: <strong>média móvel</strong> dos fechamentos, <strong>z-score</strong> do último fechamento em relação a essa média (quantos desvios-padrão de distância) e <strong>score de volume</strong> (volume do último candle ÷ volume médio).</p>

        <h6 class="mt-3">Recomendação, risco e confiança</h6>
        <p>Regras fixas sobre os números acima: <code>COMPRA_FORTE</code> exige margem conservadora ≥20% e earnings yield ≥12%; <code>COMPRA_MODERADA</code> exige margem base ≥20% e earnings yield ≥8%; <code>VENDA_VALUATION</code> quando a margem base é negativa; <code>ALERTA_RISCO</code> perto da máxima de 52 semanas com margem base baixa; senão <code>MANTER</code>. Risco e confiança seguem a mesma lógica combinando margem, earnings yield, posição no range e volatilidade intradiária.</p>

        <h6 class="mt-3">Decisão consolidada (o que aparece em Consulta e Monitorados)</h6>
        <p>A tela de Consulta e a coluna "Decisão" da aba Monitorados mostram uma <strong>média</strong> de todo o histórico de análises do ativo (sinal mais frequente, % de vendas, média das margens) — não um único ciclo. Esta aba mostra o oposto: o retrato <strong>exato do último ciclo</strong>, sem média.</p>
      </div>
    `;
  }
}

customElements.define('metodologia-page', MetodologiaPage);
