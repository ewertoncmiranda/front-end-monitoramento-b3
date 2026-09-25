# Painel de Ativos B3 - Frontend

Frontend em HTML + JS puro + Bootstrap 5 (sem bundler no cliente) para o `gestor-ativos-brutos`, servido por um pequeno servidor Node/Express que também faz **proxy reverso** para o backend real.

## Decisões de arquitetura

- **Cliente sem build/bundler.** Bootstrap 5 via CDN (CSS + JS). Módulos JS nativos (`<script type="module">`), sem webpack/vite. Mais fácil de empacotar num WebView.
- **Zero CSS próprio.** Todo o visual vem de classes do Bootstrap. O único arquivo `public/css/app.css` existe só para 2 ajustes que o Bootstrap não cobre (área segura de notch em celular).
- **Web Components nativos, um por arquivo (SRP).** Cada componente em `public/js/components/` faz uma única coisa. As páginas em `public/js/pages/` só orquestram.
- **Sem Shadow DOM.** De propósito: o Bootstrap carregado uma vez em `index.html` precisa valer para todos os componentes.
- **Comunicação por eventos customizados** (`CustomEvent`) entre componentes de input e as páginas que os usam.
- **Roteamento por hash** (`#/consulta`, `#/cadastro`): funciona em qualquer hospedagem estática e dentro de WebView sem configurar rewrite de URL no servidor.
- **Servidor Node/Express com proxy reverso.** O browser só chama caminho relativo (`/ativos/...`, `/analises/...`, `/api/...`) na própria origem do front; é o servidor quem decide para onde mandar isso de verdade. Elimina CORS e qualquer configuração de URL de API no lado do cliente. Detalhes do plano e do porquê em [`SPEC.md`](./SPEC.md) (seção 2.1).

## Estrutura

```
public/                      Tudo que o servidor expõe como estático
  index.html                   Shell: carrega Bootstrap, monta os outlets
  css/app.css                  Os 2 ajustes que o Bootstrap nao cobre
  js/
    config/apiConfig.js          URL base da API (hoje sempre relativa)
    api/
      httpClient.js               Fetch + tratamento de erro generico
      ativosApi.js                 Endpoints de /ativos
      analisesApi.js               Endpoint de /analises
      historicoApi.js              Endpoint de historico OHLCV
    components/
      base/BaseComponent.js        Ciclo de vida comum dos Web Components
      AtivoSearchForm.js            Captura simbolo, dispara evento
      AtivoQuoteCard.js             Renderiza cotacao
      AnaliseResultCard.js          Renderiza decisao consolidada
      HistoricoTable.js             Renderiza serie OHLCV
      StatusAlert.js                 Alerta de sucesso/erro/aviso
      LoadingSpinner.js              Indicador de carregamento
      AppHeader.js                    Navbar superior (telas medias+)
      BottomNav.js                     Navegacao inferior estilo app (celular)
    pages/
      ConsultaPage.js                 Orquestra a tela de consulta
      CadastroPage.js                 Orquestra a tela de cadastro
    router.js                          Rota (hash) -> pagina
    main.js                            Ponto de entrada
proxy/
  backendConfig.js            Resolve a URL do backend, com fallback validado por healthcheck
  apiProxy.js                  Registra o proxy reverso por rota
server.js                     Entrypoint: sobe o Express, serve public/, liga o proxy
package.json / package-lock.json
Dockerfile                    Build multi-stage (node:20-alpine)
```

## Pré-requisitos

- Node.js 20+ instalado (para rodar local sem Docker). Para rodar via Docker, só o Docker mesmo.
- `gestor-ativos-brutos` acessível — local (`http://localhost:8091`, se você seguiu o `docker-compose` do `infra-b3-ecossystem`) ou pela rede Docker (`http://gestor-ativos-brutos:8091`).
- CORS não precisa mais ser configurado no backend para este front (o proxy resolve isso do lado do servidor) — mas o backend continua com CORS habilitado por padrão para outros clientes.

## Como rodar local (sem Docker)

```bash
npm install
```

```bash
node server.js
```

Acesse `http://localhost:8080`. Por padrão, o servidor tenta `http://gestor-ativos-brutos:8091` (nome de serviço Docker, não resolve fora de um container) e cai automaticamente para `http://localhost:8091`. Rodando fora de container, isso já cobre o caso comum (backend local na porta 8091).

Para apontar pra outro endereço:

```bash
BACKEND_URL_FALLBACK=http://localhost:9090 node server.js
```

## Como rodar com Docker

Builda a imagem (multi-stage: `npm ci` numa camada, `node:20-alpine` rodando `server.js` na outra):

```bash
docker build -t painel-ativos-frontend .
```

**Rodando solto** (fora do `docker-compose`, backend acessível pelo host):

```bash
docker run --rm -p 8080:8080 -e BACKEND_URL_FALLBACK=http://host.docker.internal:8091 painel-ativos-frontend
```

**Rodando na mesma rede do backend** (ex.: rede `infra-b3-ecossytem_observability`, a mesma que o `docker-compose` do `infra-b3-ecossystem` usa para `gestor-ativos-brutos`):

```bash
docker run --rm -p 8080:8080 --network infra-b3-ecossytem_observability painel-ativos-frontend
```

Nesse segundo caso não precisa de nenhuma variável extra: o padrão `BACKEND_URL=http://gestor-ativos-brutos:8091` já resolve pelo nome do serviço.

Em qualquer um dos dois, acesse `http://localhost:8080`.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `8080` | Porta HTTP do servidor. |
| `BACKEND_URL` | `http://gestor-ativos-brutos:8091` | Destino primário do proxy (nome de serviço Docker). |
| `BACKEND_URL_FALLBACK` | `http://localhost:8091` | Usado se o primário não responder a um healthcheck (`/actuator/health`) no startup. |

Se nenhum dos dois responder, o servidor sobe mesmo assim (modo degradado): a UI estática funciona normalmente, só as chamadas de API falham até o backend aparecer.

## Pendências que dependem de fora deste projeto

1. **Cadastro sem listagem.** `POST /ativos/registrar/{ativo}` existe, mas não há nenhum `GET` para listar o que já foi registrado (a fila é só em memória, no `AgendadorAtivos`). A tela de cadastro avisa isso ao usuário; para ficar completo, precisa de um endpoint novo no Java (`TASK-01` no `SPEC.md`).
2. **Este serviço ainda não está no `docker-compose.yml`** do `infra-b3-ecossystem` — hoje ele é buildado/rodado manualmente. Ver `TASK-04` no `SPEC.md`.

Detalhes de arquitetura, contratos consumidos e backlog completo estão em [`SPEC.md`](./SPEC.md).

## Rumo a WebView

HTML/CSS/JS puro + Web Components + ES modules funcionam nativamente em Android WebView (Chromium) e iOS WKWebView modernos — o proxy reverso roda no servidor, então nada disso muda para o cliente embutido num app nativo. Único cuidado: o Bootstrap está via CDN, então uma WebView 100% offline precisa baixar `bootstrap.min.css`/`bootstrap.bundle.min.js` para uma pasta local dentro de `public/` (ex.: `public/vendor/`) e trocar os dois links em `index.html` — nenhuma outra mudança é necessária.
