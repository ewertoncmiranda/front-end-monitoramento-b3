import { BaseComponent } from '../components/base/BaseComponent.js';

// Unica responsabilidade: explicar as formulas e regras de calculo usadas
// pelo ecossistema - conteudo 100% estatico, sem chamada de API. Cada metodo
// de secao explica uma unica formula/conjunto de regras (mesmo espirito SRP
// de FundamentosCard.js). Os numeros reais de um ativo ficam na aba
// "Como funciona".
export class FormulasPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-3">Formulas e calculos</h4>
      <p class="text-muted small">Tudo calculado pelo <code>gerar-insights</code> a cada coleta, por regra fixa - sem IA. Veja os numeros reais de um ativo na aba <a href="#/metodologia">Como funciona</a>.</p>

      ${this.secaoGraham()}
      ${this.secaoEarningsYield()}
      ${this.secaoContextoTecnico()}
      ${this.secaoSinalTecnico()}
      ${this.secaoDecisaoConsolidada()}
      ${this.secaoPerfilOperacao()}
      ${this.secaoLimitacoes()}
    `;
  }

  secaoGraham() {
    return `
      <h6 class="mt-3">Valuation por Graham</h6>
      <p class="small">Para 3 cenários de crescimento (conservador 0%, base 3%, otimista 5%), o múltiplo de lucro implícito é <code>8.5 + 2 × crescimento</code>, e o preço justo é <code>lucro por ação × múltiplo</code>. A margem de segurança de cada cenário é <code>(preço justo − preço atual) ÷ preço justo</code>.</p>
    `;
  }

  secaoEarningsYield() {
    return `
      <h6 class="mt-3">Earnings yield e P/L</h6>
      <p class="small"><code>earnings yield = lucro por ação ÷ preço</code> (o inverso do P/L, em %). Classificado como Atrativo (≥12%), Razoável (≥8%), Baixo (≥6%) ou Muito baixo. O P/L é classificado como Baixo com atenção (&lt;8), Saudável (8–15), Esticado (15–20) ou Exigente (&gt;20).</p>
    `;
  }

  secaoContextoTecnico() {
    return `
      <h6 class="mt-3">Contexto técnico do dia</h6>
      <p class="small">Posição do preço atual dentro do range de 52 semanas (0% = mínima, 100% = máxima), variação desde a abertura, variação vs. fechamento anterior e amplitude intradiária — tudo em %. A zona de 52 semanas é "Próximo da mínima" (≤25%), "Próximo da máxima" (≥85%) ou "Meio do range".</p>
    `;
  }

  secaoSinalTecnico() {
    return `
      <h6 class="mt-3">Sinal técnico de série (quando há histórico)</h6>
      <p class="small">Sobre os últimos 20 candles coletados: <strong>média móvel</strong> dos fechamentos, <strong>z-score</strong> do último fechamento em relação a essa média (quantos desvios-padrão de distância) e <strong>score de volume</strong> (volume do último candle ÷ volume médio). Desses três números derivam dois sinais categóricos:</p>
      <ul class="small">
        <li><strong>Sinal de momentum</strong> (tendência confirmada por volume): compra técnica quando o preço está acima da média móvel <em>e</em> o score de volume é maior que 1.3; venda técnica quando está abaixo da média <em>e</em> o score de volume é menor que 0.7.</li>
        <li><strong>Sinal de reversão</strong> (extremo estatístico): compra técnica quando o z-score é menor que -1.5 <em>e</em> o preço está a até 10% da mínima de 52 semanas (desconto anormal); venda técnica quando o z-score é maior que 1.5, ou o preço está a até 5% da máxima de 52 semanas (sobrecompra).</li>
      </ul>
    `;
  }

  secaoDecisaoConsolidada() {
    return `
      <h6 class="mt-3">Recomendação, risco e confiança (decisão de um ciclo)</h6>
      <p class="small">Regras fixas sobre a margem de segurança e o earnings yield: <code>COMPRA_FORTE</code> exige margem conservadora ≥20% e earnings yield ≥12%; <code>COMPRA_MODERADA</code> exige margem base ≥20% e earnings yield ≥8%; <code>VENDA_VALUATION</code> quando a margem base é negativa; <code>ALERTA_RISCO</code> perto da máxima de 52 semanas com margem base baixa; senão <code>MANTER</code>. Risco e confiança seguem a mesma lógica combinando margem, earnings yield, posição no range e volatilidade intradiária.</p>
      <p class="small">A tela de Consulta e a coluna "Decisão" da aba Monitorados mostram uma <strong>média</strong> de todo o histórico de análises do ativo (sinal mais frequente, % de vendas, média das margens) — não um único ciclo. A aba "Como funciona" mostra o oposto: o retrato <strong>exato do último ciclo</strong>, sem média.</p>
    `;
  }

  secaoPerfilOperacao() {
    return `
      <h6 class="mt-3">Perfil de operação e riscos separados de compra/venda</h6>
      <p class="small">Calculado no Java (<code>PerfilOperacaoClassificador</code>), a partir dos mesmos sinais acima — reaproveitados, não recalculados:</p>
      <ul class="small">
        <li><strong>Perfis aplicáveis</strong> (um ativo pode ter mais de um ao mesmo tempo): <em>Day trade</em> se o sinal de momentum não é neutro; <em>Swing/reversão</em> se o sinal de reversão não é neutro; <em>Longo prazo</em> se a margem do cenário conservador é ≥20% e a classificação de earnings yield é Atrativa ou Razoável.</li>
        <li><strong>Risco de comprar agora</strong>: Alto se o ativo está perto da máxima de 52 semanas <em>e</em> a margem base é baixa (&lt;10%); Baixo se nenhuma das duas condições vale; Médio no meio-termo.</li>
        <li><strong>Risco de vender agora</strong>: Alto se o ativo está perto da mínima de 52 semanas <em>e</em> a margem base ainda é boa (≥10% — você estaria vendendo barato); Baixo se está perto da máxima (bom momento pra realizar); Médio senão.</li>
        <li><strong>Confluência de sinais</strong>: conta quantos dos 3 sinais independentes (recomendação fundamentalista, momentum, reversão) apontam compra vs. venda vs. neutro. É só uma contagem de concordância — <strong>não é uma probabilidade estatística de sucesso.</strong></li>
      </ul>
    `;
  }

  secaoLimitacoes() {
    return `
      <h6 class="mt-3">O que isso não responde (ainda)</h6>
      <p class="small text-muted">Nenhum número desta página mede se uma recomendação passada "deu certo" (se o preço realmente se moveu como o sinal indicava). Isso exigiria acompanhar o resultado futuro de cada análise ao longo do tempo — um mecanismo que não existe hoje. Por isso o painel não mostra "taxa de acerto" nem probabilidade de sucesso de uma operação: seria um número inventado, não medido.</p>
    `;
  }
}

customElements.define('formulas-page', FormulasPage);
