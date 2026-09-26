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
      ativosMonitoradosApi.js       Endpoint de /ativos/registrados
      analisesApi.js                Endpoint de /analises (analise consolidada e fundamentos)
      historicoApi.js              Endpoint de historico OHLCV
    utils/
      recomendacaoBadge.js          Recomendacao -> classe de badge Bootstrap (compartilhado)
    components/
      base/BaseComponent.js        Ciclo de vida comum dos Web Components
      AtivoSearchForm.js            Captura simbolo, dispara evento
      SeletorDeAtivos.js            Busca + carteira clicavel (envolve o AtivoSearchForm)
      CarteiraResumo.js             Carteira so leitura, usada no Cadastro
      AtivoQuoteCard.js             Renderiza cotacao
      AnaliseResultCard.js          Renderiza decisao consolidada
      AtivosMonitoradosTable.js     Renderiza a carteira monitorada + linha expansivel
      FundamentosCard.js            Renderiza os fundamentos brutos de um unico ciclo
      FundamentosCvmCard.js         Renderiza os fundamentos contabeis da CVM (completo ou resumo)
      PainelPadroes.js              Liga/desliga padroes no grafico e mostra a estatistica
      HistoricoTable.js             Renderiza serie OHLCV
      StatusAlert.js                 Alerta de sucesso/erro/aviso
      LoadingSpinner.js              Indicador de carregamento
      AppHeader.js                    Navbar superior (telas medias+)
      BottomNav.js                     Navegacao inferior estilo app (celular)
    pages/
      ConsultaPage.js                 Orquestra a tela de consulta
      CadastroPage.js                 Orquestra a tela de cadastro
      AtivosMonitoradosPage.js        Orquestra a aba "Monitorados"
      MetodologiaPage.js              Orquestra a busca interativa de fundamentos
      CandlesPage.js                  Orquestra a aba de candles
      FormulasPage.js                 Explica as formulas/regras e as fontes de dados (estatico)
      ArquiteturaPage.js              Descreve as 5 pecas, com links de GitHub e Docker Hub (estatico)
      PadroesPage.js                  Leitura de grafico e armadilhas de analise (estatico)
      GlossarioPage.js                Glossario de mercado e de engenharia, com busca (estatico)
    analise/
      detectorPadroes.js            Deteccao de padroes e alertas (puro, testavel)
      taxaAcerto.js                 Taxa de acerto sempre com taxa-base (puro)
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

## Selecao de ativo nas abas

As abas que operam sobre um ativo (Consulta, Como funciona e Candles) nao exigem mais que
voce digite o ticker: alem do campo de busca, elas listam os ativos ja cadastrados como
botoes clicaveis — o mesmo comportamento que a aba Monitorados ja tinha.

Isso e um componente so, `SeletorDeAtivos`, que **envolve** o `AtivoSearchForm` existente
em vez de reimplementar o campo, e reemite o mesmo evento `ativo-buscado`. Por isso as
paginas nao precisaram mudar de logica — trocaram a tag:

```html
<!-- antes -->
<ativo-search-form rotulo-botao="Consultar"></ativo-search-form>
<!-- depois -->
<seletor-de-ativos rotulo-botao="Consultar"></seletor-de-ativos>
```

A carteira e conveniencia, nao dependencia: se `GET /ativos/registrados` falhar, a lista
some com um aviso discreto e o campo de busca continua funcionando. Carteira vazia mostra
um atalho para a aba de Cadastro.

A aba Cadastro usa o `CarteiraResumo`, uma variante **somente leitura** — ali os simbolos
nao sao clicaveis, porque clicar num ativo ja registrado so o recadastraria. Serve para
voce nao tentar cadastrar algo que ja esta la, e se atualiza sozinha apos um cadastro.

## Padroes sobre o grafico de candles (`#/candles`)

Alem de desenhar o candlestick, a aba deixa ligar e desligar detectores de padrao
sobre o grafico, por clique, sem recarregar nada. Cada padrao aceso vira marcador na
vela correspondente.

A deteccao roda **no cliente**, sobre os candles ja carregados
(`public/js/analise/detectorPadroes.js`, modulo puro, sem DOM e sem fetch). Isso torna
o toggle instantaneo e permite rodar o mesmo detector sobre dados sinteticos — o que e
a base da calibragem descrita abaixo.

### O que e detectado, e o que nao e

Entram apenas padroes com definicao precisa o bastante para um programa aplicar sem
julgamento humano: doji, martelo, enforcado, estrela cadente, marubozu (alta e baixa),
engolfo (alta e baixa), harami, estrela da manha e estrela da noite.

Ombro-cabeca-ombro, topo duplo, triangulos e bandeiras **nao** sao detectados, e a
propria interface explica por que. Nao e falta de esforco: sao figuras cuja definicao
depende de tolerancias arbitrarias, e automatiza-las produziria um detector que dispara
em ruido — a apofenia descrita na aba Padroes. O OCO, alem disso, leva de 3 a 6 meses
para se formar e nao cabe na janela maxima de 3 meses.

### Taxa de acerto: por que ela nunca aparece sozinha

O criterio e explicito: para um padrao de alta, acerto significa que o fechamento H
pregoes depois foi maior (o horizonte H e configuravel: 1, 3, 5 ou 10). Ocorrencias
proximas ao fim da serie sao descartadas, porque nao ha H pregoes adiante para julgar.

Duas salvaguardas, ambas deliberadas:

- **Taxa-base ao lado.** Se o ativo subiu em 55% de todos os pregoes da janela, um
  padrao de alta que acerta 58% esta praticamente empatado com escolher um dia ao acaso.
  O numero que informa e a *vantagem* — a diferenca entre os dois.
- **Sem percentual abaixo de 5 ocorrencias.** Nesse caso a interface mostra a contagem
  crua ("2 acertos em 3 ocorrencias"). Transformar 2/3 em "66,7%" daria a esses poucos
  casos uma precisao que eles nao tem.

### Calibragem no ruido

Cada cartao mostra quantas vezes aquele padrao aparece numa serie **aleatoria** do mesmo
tamanho, ao lado da contagem real. Os valores vem de `npm test`, que roda o detector
sobre 20 passeios aleatorios de 63 candles:

| Padrao | Ocorrencias por serie aleatoria |
| --- | --- |
| Harami | 16,1 — uma a cada quatro velas |
| Engolfo de baixa | 8,8 |
| Engolfo de alta | 7,4 |
| Doji | 3,8 |
| Estrela da manha | 2,7 |
| Martelo | 0,2 |

E o numero mais desconfortavel: em ruido puro, a estrela da manha exibiu **+12,1 pontos
de vantagem** sobre a taxa-base, e a estrela da noite, −10,8. Ou seja, vantagem medida em
amostra pequena e ruido com aparencia de estatistica. Por isso o limite para o painel
chamar algo de "acima da base" e exigente (15 pontos).

### Alertas

Uma segunda familia de marcadores sinaliza armadilhas visiveis no proprio OHLCV: gap de
abertura (que pode ser provento nao ajustado, nao movimento), volume anomalo e liquidez
baixa. Nao sao sinais de operacao — sao avisos de que aquela vela pode nao significar o
que parece.

## Aba "Monitorados" (`#/monitorados`)

Cadastrar um ativo em `#/cadastro` persiste no backend e o coloca em monitoramento recorrente (cotação + histórico a cada 30s, sem intervenção manual). A aba `#/monitorados` lista a carteira (`GET /ativos/registrados`) e, para cada ativo, busca em paralelo a última decisão consolidada (`GET /analises/{simbolo}/analise`) — mesma rota já usada em `#/consulta`. Um ativo recém-cadastrado ou sem análise ainda aparece como "Sem análise ainda"; a busca de cada símbolo falha de forma independente, então isso nunca trava a lista inteira.

Não há, de propósito, UI para desativar/pausar um ativo monitorado nem para configurar o intervalo — fora do escopo pedido (ver `TASK-05` no `SPEC.md`).

Clicar em qualquer linha da tabela expande, abaixo dela, a mesma visão estruturada da tela de Consulta (cotação, decisão, histórico) — clicar de novo recolhe. Os dados de cotação/histórico são buscados só na primeira expansão de cada ativo (com cache); a decisão é reaproveitada da própria listagem.

## Abas de referência: "Como funciona", "Formulas", "Arquitetura", "Padroes" e "Glossario"

Três abas com responsabilidade única, cada uma:

- **`#/metodologia` (Como funciona)**: busca um símbolo e mostra `GET /analises/{simbolo}/fundamentos` — o retrato **de um único ciclo** (sem média), incluindo o perfil de operação (day trade / swing-reversão / longo prazo, não exclusivos), os riscos de comprar/vender agora e a confluência entre sinais (recomendação fundamentalista + momentum + reversão — uma contagem de concordância, não uma probabilidade de sucesso).
- **`#/formulas` (Formulas)**: conteúdo estático explicando cada fórmula/regra usada (Graham, earnings yield, contexto técnico, sinal técnico de série, perfil de operação/riscos) — sem chamar API.
- **`#/arquitetura` (Arquitetura)**: o que o ecossistema faz hoje. Diagrama do fluxo, o caminho do dado do cadastro ate a tela, um cartao por peca (papel, stack, o que faz, o que **nao** faz) com link para o repositorio no GitHub e para a imagem no Docker Hub, e a tabela das duas fontes externas (BRAPI e CVM) com o que cada uma entrega e seu limite. Conteudo estatico, estrutura declarativa no array `PECAS`.
- **`#/padroes` (Padroes e armadilhas)**: como se le um grafico de candles e onde a leitura costuma dar errado. Padroes de 1 a 3 velas, formacoes graficas (com selo de "cabe ou nao cabe no range de 3 meses"), a diferenca de leitura entre trader e longo prazo, e 11 armadilhas de analise. Separado do Glossario de proposito: la sao verbetes com busca, aqui e texto com raciocinio.
- **`#/glossario` (Glossario)**: vocabulario de mercado e de engenharia explicado do zero, com busca. Fonte canonica em [`infra-b3-ecossytem/GLOSSARIO.md`](../infra-b3-ecossytem/GLOSSARIO.md) — os dois devem ser atualizados juntos.

Detalhes de arquitetura, contratos consumidos e backlog completo estão em [`SPEC.md`](./SPEC.md).

## Rumo a WebView

HTML/CSS/JS puro + Web Components + ES modules funcionam nativamente em Android WebView (Chromium) e iOS WKWebView modernos — o proxy reverso roda no servidor, então nada disso muda para o cliente embutido num app nativo. Único cuidado: o Bootstrap está via CDN, então uma WebView 100% offline precisa baixar `bootstrap.min.css`/`bootstrap.bundle.min.js` para uma pasta local dentro de `public/` (ex.: `public/vendor/`) e trocar os dois links em `index.html` — nenhuma outra mudança é necessária.
