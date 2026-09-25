# SPEC - painel-ativos-frontend

> Estado mapeado diretamente da implementação em 2026-09-25. Seção 2.1 documenta o plano
> do servidor Node (proposto e implementado no mesmo dia). Seção 2.2 documenta a aba
> "Monitorados" (proposta e implementada no mesmo dia, mais tarde).

## 1. Visão geral

Frontend em HTML + JS puro + Bootstrap 5 (sem bundler no cliente) para o `gestor-ativos-brutos`, servido por um pequeno servidor Node/Express (`server.js`) que também atua como proxy reverso para o backend. Consome as rotas HTTP existentes para:

1. **Consultar** um ativo: cotação (com série histórica), decisão consolidada e histórico OHLCV.
2. **Cadastrar** um ativo no agendador do backend — o ativo entra em monitoramento recorrente (30s) com série histórica persistida.
3. **Listar os ativos monitorados** (aba "Monitorados"), enriquecida com a última decisão consolidada de cada um (`ISS-01`/`TASK-01` **RESOLVIDO**, ver 2.2).

Não é dono de nenhuma regra de negócio: toda a decisão (Graham + sinal técnico) é calculada no lado dos dois backends (`gestor-ativos-brutos` e `gerar-insights`); este projeto só exibe.

## 2. Decisões de arquitetura

| Decisão | Motivo |
| --- | --- |
| Sem bundler/build | Menos ferramenta pra manter; facilita empacotar em WebView; abrir e rodar sem `npm install`. |
| Bootstrap 5 via CDN, zero CSS próprio | Único requisito explícito do usuário era "zero preocupação com CSS". `css/app.css` tem só 2 regras que o Bootstrap não cobre (área segura de notch). |
| Web Components nativos, um por arquivo | SRP: cada componente renderiza uma única coisa. Sem framework, mantém a mesma capacidade de composição/reuso. |
| Sem Shadow DOM | Deliberado: o Bootstrap carregado uma vez em `index.html` precisa valer para todos os componentes, sem reimportar CSS em cada um. |
| Comunicação por `CustomEvent` | Componentes de captura de input (`AtivoSearchForm`) não conhecem quem consome o evento — permite reuso entre as páginas de consulta e cadastro. |
| Roteamento por hash (`#/rota`) | Funciona em qualquer hospedagem estática e dentro de WebView sem configuração de rewrite no servidor (ao contrário de History API). |
| Servidor Node/Express com proxy reverso (ver `2.1`) | Elimina CORS (chamadas do browser viram same-origin) e a necessidade de configurar a URL da API no cliente por ambiente. |

### 2.1 Plano: servidor Node com proxy reverso (2026-09-25)

**Problema que motivou:** a primeira versão (nginx servindo só estático) exigia que o cliente soubesse o endereço exato do backend (`window.PAINEL_ATIVOS_API_BASE_URL`) e dependia de CORS habilitado no Java para qualquer origem usada — na prática, toda vez que o front rodava numa porta diferente ou apontava pra um backend diferente (container isolado, rede do `docker-compose`, host local), era preciso editar `index.html` na mão.

**Desenho:**
1. Um servidor Node/Express (`server.js`) serve os arquivos estáticos de `public/` **e** faz proxy reverso das rotas do backend (`/ativos`, `/analises`, `/api`) — o browser só vê chamadas same-origin, sem CORS.
2. Resolução do destino do proxy com fallback validado por healthcheck (`proxy/backendConfig.js`):
   - Tenta `BACKEND_URL` (default `http://gestor-ativos-brutos:8091` — nome do serviço, resolve quando o front roda na mesma rede Docker do backend);
   - Se não responder, tenta `BACKEND_URL_FALLBACK` (default `http://localhost:8091` — quando o container roda solto, fora do compose);
   - Se nenhum responder, sobe mesmo assim em modo degradado (front estático continua acessível; só as chamadas de API falham até o backend aparecer) — mesmo espírito de resiliência já usado no backend Java.
3. `proxy/apiProxy.js` registra o `http-proxy-middleware` por rota, com `pathRewrite` pra recompor o prefixo que o Express remove ao montar o middleware em `app.use(rota, ...)` (achado durante a implementação: sem isso, `/analises/PETR4/analise` virava `/PETR4/analise` no destino).
4. `js/config/apiConfig.js` do cliente fica trivial (`baseUrl: ''`) — todo o `fetch` do front usa caminho relativo, sem nenhuma configuração por ambiente do lado do cliente.

**Implementado e testado** (build da imagem + container rodando na rede `infra-b3-ecossytem_observability`, mesma do `gestor-ativos-brutos` real): resolução do backend primário por nome de serviço, proxy das 4 rotas com dados reais (cotação, análise, histórico, registro), Consulta e Cadastro validados na tela.

### 2.2 Aba "Monitorados" + cadastro persistente (2026-09-25)

**Motivação:** o backend passou a persistir o cadastro de ativos em `ativo_monitorado` e reprocessá-los a cada 30s (ver `gestor-ativos-brutos/SPEC.md`, seção 2.2 Fluxo E), fechando `ISS-01`/`TASK-01` deste front (não existia `GET` para listar o que foi cadastrado).

**Desenho:**
1. Nova página `AtivosMonitoradosPage` (rota `#/monitorados`) busca `GET /ativos/registrados` e delega a renderização a `AtivosMonitoradosTable`.
2. **Enriquecimento:** para cada ativo listado, a página busca em paralelo `GET /analises/{simbolo}/analise` (o mesmo contrato já usado em `ConsultaPage`) e repassa pra tabela via `setAnalise(simbolo, analise)` — cada busca falha de forma independente (`.catch(() => null)`), então um ativo sem análise ainda (cadastro muito recente, ou falha na BRAPI) não trava a linha dos demais; a célula mostra um spinner até a resposta chegar, e "Sem análise ainda" se não houver dado.
3. `badgeClassParaRecomendacao` foi extraído de `AnaliseResultCard` para `js/utils/recomendacaoBadge.js` (compartilhado com `AtivosMonitoradosTable`) — sem essa extração o mapeamento recomendação→cor de badge ficaria duplicado nos dois componentes.
4. `CadastroPage`: o aviso fixo sobre "backend não expõe listagem" virou um link para `#/monitorados`, e a mensagem de sucesso do cadastro também linka pra lá.

**Implementado e testado** (rebuild da imagem, container na rede do ecossistema): `#/monitorados` lista os ativos reais cadastrados (`MGLU3`, `WEGE3`), decisão consolidada aparece pra quem já tem `insight_acao` (`MGLU3` → `VENDA_VALUATION`, 100% confiança), "Sem análise ainda" pra quem não tem; confirmado por log do `AgendadorAtivos` que o reprocessamento a cada ~30s ocorre sem ação do usuário; testado em viewport mobile (375×812) com scroll horizontal da tabela.

## 3. Estrutura de componentes

| Componente/módulo | Responsabilidade única | Arquivo |
| --- | --- | --- |
| `server` (Node) | Entrypoint: serve `public/` e registra o proxy | `server.js` |
| `backendConfig` (Node) | Resolver a URL do backend real, com fallback validado por healthcheck | `proxy/backendConfig.js` |
| `apiProxy` (Node) | Registrar o proxy reverso por rota (`/ativos`, `/analises`, `/api`) | `proxy/apiProxy.js` |
| `apiConfig` | Saber a URL base da API (hoje sempre relativa, ver `2.1`) | `js/config/apiConfig.js` |
| `httpClient` | Executar fetch e traduzir erros (HTTP e rede) | `js/api/httpClient.js` |
| `ativosApi` | Endpoints de `/ativos` | `js/api/ativosApi.js` |
| `ativosMonitoradosApi` | Endpoint de `/ativos/registrados` | `js/api/ativosMonitoradosApi.js` |
| `analisesApi` | Endpoint de `/analises` | `js/api/analisesApi.js` |
| `historicoApi` | Endpoint de histórico OHLCV | `js/api/historicoApi.js` |
| `recomendacaoBadge` | Mapear recomendação → classe de badge Bootstrap (compartilhado) | `js/utils/recomendacaoBadge.js` |
| `BaseComponent` | Ciclo de vida comum dos Web Components | `js/components/base/BaseComponent.js` |
| `AtivoSearchForm` | Capturar símbolo digitado, disparar evento | `js/components/AtivoSearchForm.js` |
| `AtivoQuoteCard` | Renderizar cotação (`Ativo`) | `js/components/AtivoQuoteCard.js` |
| `AnaliseResultCard` | Renderizar decisão consolidada (`RespostaAnaliseIaDTO`) | `js/components/AnaliseResultCard.js` |
| `AtivosMonitoradosTable` | Renderizar a carteira monitorada + decisão de cada ativo | `js/components/AtivosMonitoradosTable.js` |
| `HistoricoTable` | Renderizar série OHLCV | `js/components/HistoricoTable.js` |
| `StatusAlert` | Alerta de sucesso/erro/aviso | `js/components/StatusAlert.js` |
| `LoadingSpinner` | Indicador de carregamento | `js/components/LoadingSpinner.js` |
| `AppHeader` | Navbar superior (telas médias+) | `js/components/AppHeader.js` |
| `BottomNav` | Navegação inferior estilo app (celular) | `js/components/BottomNav.js` |
| `ConsultaPage` | Orquestrar busca + renderização da consulta | `js/pages/ConsultaPage.js` |
| `CadastroPage` | Orquestrar o registro de um ativo | `js/pages/CadastroPage.js` |
| `AtivosMonitoradosPage` | Orquestrar a listagem da carteira monitorada + busca da decisão de cada ativo | `js/pages/AtivosMonitoradosPage.js` |
| `router` | Rota (hash) → página | `js/router.js` |
| `main` | Ponto de entrada (registra componentes, inicia router) | `js/main.js` |

> Todos os caminhos `js/...` e `index.html`/`css/...` desta tabela são relativos a `public/` (ex.: `public/js/main.js`) — é a pasta que o `server.js` serve como estático.

## 4. Contratos consumidos (backend `gestor-ativos-brutos`)

| Rota | Método | Usado em | Observação |
| --- | --- | --- | --- |
| `/ativos/robusto/{ativo}` | GET | `ConsultaPage` | Traz `Ativo` + publica série histórica no backend (efeito colateral do próprio backend, não deste front). |
| `/analises/{simbolo}/analise` | GET | `ConsultaPage`, `AtivosMonitoradosPage` | Decisão consolidada; se falhar, a tela continua exibindo o resto (`.catch(() => null)`). Na aba Monitorados é buscada uma vez por ativo listado, em paralelo. |
| `/api/v2/stocks/historical` | GET | `ConsultaPage` | `symbols`, `range=1mo`, `interval=1d`, `sortOrder=asc` fixos no `historicoApi.js`. |
| `/ativos/registrar/{ativo}` | POST | `CadastroPage` | Persiste o cadastro no backend (`ativo_monitorado`) e entra em monitoramento recorrente de 30s; confirmação via link para `#/monitorados`. |
| `/ativos/registrados` | GET | `AtivosMonitoradosPage` | Lista a carteira monitorada (`ISS-01`/`TASK-01` **RESOLVIDO**). |

Todas as 5 rotas acima são acessadas pelo **cliente** como caminho relativo (mesma origem do front) — quem fala com o backend de verdade é o `server.js`, via proxy reverso (`proxy/apiProxy.js`). CORS habilitado no backend em `ConfigCors` (`app.cors.allowed-origins`) desde 2026-09-25 deixou de ser necessário para este front especificamente, mas continua útil pra outros clientes que queiram chamar o backend direto do browser.

## 5. Configuração

| Variável | Onde | Padrão | Descrição |
| --- | --- | --- | --- |
| `PORT` | Ambiente do processo Node | `8080` | Porta HTTP do `server.js`. |
| `BACKEND_URL` | Ambiente do processo Node | `http://gestor-ativos-brutos:8091` | Destino primário do proxy. Nome do serviço, resolve dentro da rede Docker do `docker-compose`. |
| `BACKEND_URL_FALLBACK` | Ambiente do processo Node | `http://localhost:8091` | Destino usado se o primário não responder ao healthcheck no startup (container rodando fora do compose). |

Não existe mais configuração do lado do cliente (`window.PAINEL_ATIVOS_API_BASE_URL` foi removido) — o front sempre chama caminho relativo.

## 6. Requisitos

| ID | Requisito | Status |
| --- | --- | --- |
| REQ-01 | Consultar cotação, decisão e histórico de um ativo | IMPLEMENTADO |
| REQ-02 | Cadastrar (registrar) um ativo no backend | IMPLEMENTADO |
| REQ-03 | Layout responsivo mobile-first | IMPLEMENTADO (Bootstrap grid + `BottomNav`/`AppHeader` alternados por breakpoint) |
| REQ-04 | Zero CSS customizado além do indispensável | IMPLEMENTADO |
| REQ-05 | Listar os ativos monitorados, com a última decisão de cada um | IMPLEMENTADO (2026-09-25, aba `#/monitorados`, ver `2.2`) |
| NFR-01 | Cliente sem etapa de build | ATENDIDO (o servidor Node tem `npm install`, mas o JS/CSS do browser continua sem bundler) |
| NFR-02 | Compatível com empacotamento em WebView (Android/iOS) | ATENDIDO (ES modules + Custom Elements, sem History API; o proxy é transparente pro cliente) |
| NFR-03 | Um arquivo = uma responsabilidade (SRP) | ATENDIDO |
| NFR-04 | Funcionar tanto dentro da rede Docker do backend quanto local/solto, sem reconfiguração manual | ATENDIDO (`BACKEND_URL`/`BACKEND_URL_FALLBACK` com healthcheck, ver `2.1`) |

## 7. Issues conhecidas

| ID | Severidade | Descrição | Impacto | Status |
| --- | --- | --- | --- | --- |
| ISS-01 | Médio | ~~`POST /ativos/registrar/{ativo}` não tem `GET` equivalente para listar o que já foi registrado~~ | ~~Tela de cadastro não confirma o que está na fila do agendador~~ | RESOLVIDO (2026-09-25) — `GET /ativos/registrados` novo no backend, consumido pela aba `#/monitorados` (`AtivosMonitoradosPage`) |
| ISS-02 | Baixo | Bootstrap carregado via CDN | Sem internet, a UI perde todo o estilo | ABERTO — mitigação documentada no README (vendorizar local) |
| ISS-03 | Baixo | Nenhum teste automatizado (nem do cliente, nem do `server.js`/proxy) | Regressões só são pegas manualmente | ABERTO |
| ISS-04 | Baixo | `http-proxy-middleware` remove o prefixo da rota ao ser montado via `app.use(rota, ...)` | Sem `pathRewrite`, o backend recebia `/PETR4/analise` em vez de `/analises/PETR4/analise` (achado e corrigido durante a implementação) | RESOLVIDO — `proxy/apiProxy.js` usa `pathRewrite: (path) => rota + path` |
| ISS-05 | Médio | O proxy repassava o header `Origin` original do browser pro backend | Browsers mandam `Origin` em requisições same-origin com método POST/PUT/DELETE (mas normalmente não em GET) — o CORS do `gestor-ativos-brutos` via esse `Origin` (ex.: `http://localhost:8082`, porta do compose), não achava na allowlist padrão (8080/5173/3000) e rejeitava com 403. `Cadastrar` (POST) quebrava; `Consultar` (GET) parecia funcionar porque o browser não mandava `Origin` nesse caso | RESOLVIDO — `proxy/apiProxy.js` remove o header `Origin` (`proxyReq.removeHeader('origin')`) antes de repassar pro backend, tornando a chamada de fato invisível pro CORS dele |

## 8. Backlog

| ID | Tarefa | Depende de | Status |
| --- | --- | --- | --- |
| TASK-01 | ~~Endpoint `GET /ativos/registrados` no `gestor-ativos-brutos`~~ + aba de listagem no front | ISS-01 | RESOLVIDO (2026-09-25) |
| TASK-02 | Vendorizar Bootstrap localmente como opção para build offline/WebView | ISS-02 | ABERTO |
| TASK-03 | Testes de componente (ex.: Web Test Runner) para `TechnicalSeriesAnalyzer`-like pure functions e componentes de renderização, e testes do proxy (`backendConfig`/`apiProxy`) | ISS-03 | ABERTO |
| TASK-04 | Adicionar este front como serviço no `docker-compose.yml` do `infra-b3-ecossystem` (rede `infra-b3-ecossytem_observability`, mesma do `gestor-ativos-brutos`), pra subir junto com o resto do ecossistema | — | RESOLVIDO |
| TASK-05 | Desativar/pausar um ativo monitorado pela UI (a coluna `ativo` já existe no schema, mas nada escreve `false` ainda) | REQ-05 | ABERTO — fora do escopo do pedido original (2026-09-25) |
