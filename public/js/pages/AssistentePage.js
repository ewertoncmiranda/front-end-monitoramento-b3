import { BaseComponent } from '../components/base/BaseComponent.js';
import { escaparHtml } from '../utils/html.js';
import '../components/ia/ChatIa.js';

// Unica responsabilidade: tela "Assistente" (TASK-CHAT-4, rota #/assistente).
// Conversa geral com o servico de IA (CTR-IA-02) via <chat-ia> sem simbolo,
// com o que o assistente faz e o que NAO faz escrito antes da conversa.

export const SUGESTOES_GERAIS = [
  'O que é P/L?',
  'Como ler o score de confiança?',
  'O que mudou na WEGE3 esta semana?',
];

export function htmlAssistente() {
  return `
    <div class="container py-3 assistente-pagina">
      <h1 class="h4 mb-1">Assistente</h1>
      <p class="text-muted small mb-3">Perguntas sobre os ativos e os indicadores deste painel.</p>
      <div class="row g-3">
        <div class="col-lg-8">
          <section class="ficha-cartao">
            <chat-ia sugestoes="${escaparHtml(SUGESTOES_GERAIS.join('|'))}"></chat-ia>
          </section>
        </div>
        <aside class="col-lg-4">
          <section class="ficha-cartao small assistente-sobre">
            <p class="ficha-rotulo">O que o assistente faz</p>
            <ul class="mb-2 ps-3">
              <li>Explica indicadores (P/L, ROE, fatores, score de confiança) e como ler as telas.</li>
              <li>Resume o que os números públicos dizem sobre um ativo: cotação oficial da B3, balanços e comunicados da CVM.</li>
              <li>Cita de onde tirou cada informação.</li>
            </ul>
            <p class="ficha-rotulo">O que ele não faz</p>
            <ul class="mb-2 ps-3">
              <li><strong>Não recomenda</strong> compra, venda ou preço-alvo.</li>
              <li>Não usa dado privado nem notícia paga: só dados públicos já carregados no painel.</li>
              <li>Não garante resultado: o histórico não mostrou vantagem consistente das regras.</li>
            </ul>
            <p class="text-muted mb-0">Leitura automática, experimental. Não é recomendação de investimento
              (Res. CVM 20/2021). Para um ativo específico, a conversa também está na
              <a href="#/gestao">ficha do ativo</a>.</p>
          </section>
        </aside>
      </div>
    </div>`;
}

export class AssistentePage extends BaseComponent {
  template() {
    return htmlAssistente();
  }
}

customElements.define('assistente-page', AssistentePage);
