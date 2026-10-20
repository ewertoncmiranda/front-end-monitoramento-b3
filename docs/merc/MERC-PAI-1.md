# MERC-PAI-1 — Carrossel e ranking reutilizáveis

**Status:** IMPLEMENTADO (branch `feature-merc-pai-1`, aguardando revisão). Contrato: `infra-b3-ecossytem/SPEC.md`, Plano MERC.

## Entregue

- `components/inicio/CarrosselMercado.js` (`<carrossel-mercado>`): recebe `el.cards = [{ id, titulo, render(host), tituloErro? }]`. Troca a cada 10 s; pausa com mouse em cima, foco dentro ou botão "Pausar"; setas, bolinhas, ←/→ e swipe por pointer events (toque/caneta, 40 px). Com `prefers-reduced-motion: reduce` não roda sozinho. ARIA: `role="region"`, `aria-roledescription="carrossel"`, cada card `role="group"` com `aria-label` "título (card N de M)" e região `aria-live` "Card N de M: título" (fica `off` enquanto roda sozinho, `polite` quando parado, conforme o padrão WAI-ARIA). Cada card desenha no próprio host; erro síncrono ou assíncrono vira estado vazio só nele. `disconnectedCallback` limpa o timer e os listeners (AbortController).
- `components/inicio/RankingTickers.js` (`<ranking-tickers>`): duas colunas "Maiores"/"Menores", até 10 linhas cada, posição, ticker (`#/ativo/XXXX`), setor, valor formatado por propriedade e barra proporcional. Valor direcional leva seta + texto oculto "alta/queda/estável" + cor da paleta F360 (C4). No celular (≤ 767 px) as colunas viram abas. Todo texto passa por `escaparHtml`. Listas vazias mostram estado vazio.
- `components/inicio/cardPanoramaProvisorio.js`: card provisório (altas e quedas via `<ranking-tickers>`) com rodapé "N ações líquidas · pregão de DD-MM-AAAA · período". Sem gestor: "Panorama indisponível" só no card. Será trocado pelo `CardAltasQuedas` (MERC-PAI-3).
- `api/mercadoApi.js`: `buscarPanorama(janela = '5d')` → `GET /mercado/panorama?janela=...`; erro com `status`, `data` e mensagem de `mensagem || erro || message`.
- Proxy: `/mercado` registrado em `proxy/apiProxy.js`; coberto em `tests/proxyFluxos.test.mjs`.
- `InicioPage.js`: só o encaixe, logo abaixo do `<aviso-defasagem-cargas>` e antes dos alertas operacionais.
- CSS em `public/css/app.css` (`.carrossel-mercado*`, `.ranking-tickers*`), cores pelos tokens `--f360-*`, que já trocam no tema escuro.

## Desvios

- O card provisório ficou num arquivo próprio (`cardPanoramaProvisorio.js`) em vez de dentro da `InicioPage`, para a página mudar só no encaixe e o card ter teste.
- O guard é `customElements.get?.(...)`: os stubs de testes antigos que importam a `InicioPage` não têm `get`.
- Botão "Pausar/Retomar" acrescentado (WCAG 2.2.2), além do pedido.

## Validação

`tests/mercCarrossel.test.mjs` (rotação, pausa e retomada, botão de pausa, teclado, setas, bolinhas, swipe, reduced-motion, ARIA, falha isolada por card, limpeza no disconnect, nome de elemento único, posição na Início) e `tests/mercRanking.test.mjs` (10+10, corte em 10, sinal/seta/texto, barras, escape, estado vazio, link, abas, `buscarPanorama`, card provisório). O stub de `customElements.define` lança em nome duplicado. `npm test` completo: exit 0. Sem verificação no navegador nesta tarefa.
