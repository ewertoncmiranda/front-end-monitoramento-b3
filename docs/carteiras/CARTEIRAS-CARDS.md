# CARTEIRAS-CARDS — IMPLEMENTADO (2026-10-21)

Branch `feature-carteiras-cards` (worktree `C:/Users/User/projetos/painel-carteiras`), sem commit nem push.

## Entregue

- **Modelo por quantidade.** A posição de cada ticker é derivada das operações do gestor (`GET /carteiras/{id}/operacoes`): quantidade = compras - vendas; preço médio = custo médio ponderado (corretagem e impostos entram no custo); venda baixa o custo pelo preço médio vigente; data de entrada = primeira compra da posição atual (zerou e recomprou = nova entrada); operação estornada e o estorno saem do cálculo. Lógica pura em `public/js/analise/carteiraPosicao.js`.
- **Adicionar ações** (`CarteiraAdicionarAtivo.js`): busca de ativos reaproveitada, quantidade inteira > 0, data (padrão hoje, não futura), preço do dia preenchido com o último fechamento (rótulo "Fechamento de dd-mm-aaaa"), edição do preço ("Preço informado manualmente"), corretagem opcional, total estimado em tempo real (`aria-live`), aviso "registro informado, não ordem executada". Estados: carregando preço, ticker sem cotação (bloqueia), erro de rede (permite preço manual), sucesso. Grava `POST /carteiras/{id}/operacoes` tipo `COMPRA`, com `chaveIdempotencia` por tentativa (reenvio após falha reaproveita a chave).
- **Cards** (`CarteiraCardAtivo.js`): ticker com link `#/ativo/T`, setor (`/base/ativos`), quantidade, preço médio, entrada + dias, preço atual + data do pregão, valor atual, valorização/perda em R$ e % com cor, seta e sinal/rótulo textual, sparkline do preço desde a entrada (`Sparkline.js`, mesmo estilo do `IndicesMacroPage`), barra de participação, aviso de concentração (>30%), menu (comprar mais, vender, estornar última operação), skeleton. Grade de 1 a 4 colunas.
- **Resumo** (`CarteiraCabecalho.js`): valor investido (custo), valor atual, resultado R$ e %, melhor e pior ativo, número de ativos, data do último preço, proventos recebidos (+ yield on cost) e retorno total; proventos estimados e retorno com estimados em indicadores separados e rotulados "estimado". Ausente = omitido.
- **Barra de ferramentas**: filtro (ticker/setor), ordenação (maior alta, maior queda, maior posição, ticker, data de entrada), cards/tabela compacta; visão, ordenação, agrupamento e período persistem em `localStorage` (`b3-carteiras-prefs`, com try/catch).
- **Venda**: painel inline, quantidade <= posição (bloqueia acima, e o gestor também recusa), registra `VENDA`. **Estorno** via `POST .../operacoes/{id}/estorno`; recusas do gestor aparecem com o `motivo`.
- **Legado** (só capital): aparece como "legado (capital)"; "Converter em quantidade" só aparece quando há fechamento até 7 dias após a data de entrada (quantidade = piso(capital / preço), sobra informada; registra COMPRA e remove o registro de capital, com confirmação).
- **Evolução** (`carteiraEvolucao.js`, seção na carteira): base 100 na primeira compra, carteira (retorno ponderado pelo tempo: aportes e vendas não viram lucro) x CDI (`/indices-macro/CDI`, % ao dia capitalizado) x BOVA11 (proxy do Ibovespa, rotulado), diferença contra o CDI em p.p., períodos (desde a entrada, 3, 6, 12 meses), SVG com texto alternativo e tabela recolhida, aviso de método, estados (carregando, sem dados, erro parcial). Uma busca de pregões por ticker serve preço, sparkline e evolução.
- **Alocação**: barras por ativo ou por setor ("Sem setor"), percentuais em texto, destaque acima de `LIMITE_CONCENTRACAO` (30%).
- **Proventos** (`carteiraProventos.js`): recebidos = `GET /carteiras/{id}/proventos` (líquido); estimados = `GET /proventos/{ticker}` (dedupe) x quantidade detida na data com, só eventos com data com >= primeira compra e <= hoje. Por ticker vale um ou outro, nunca somados; totais separados.
- Erros com o `motivo` do gestor (`httpClient` agora guarda `ApiError.motivo`), `aria-live`, tema claro/escuro por variáveis Bootstrap.

## Evidência

- `npm test` inteiro passa (exit 0). Novos: `carteiraPosicao` (14 casos), `carteiraProventos` (7), `carteiraEvolucao` (9), `carteirasCard` (10), `carteirasPosicoes` (9); reescritos: `carteirasAdicionarAtivo` (6), `carteiraCabecalho` (5), `carteirasPage`, `carteirasApi` (+motivo). `carteirasAtivoLinha` foi removido junto com `CarteiraAtivoLinha.js`; a cobertura migrou para `carteirasCard`.
- Gestor Docker (`localhost:8091`): tem `GET /carteiras`, `/operacoes`, `/proventos`, `/proventos/{t}`, `/indices-macro/CDI`; `/rentabilidade` exige `inicio` e `fim` (não usado).
- Integração em Node (`preview` 8120 -> mock 8099): criar carteira, preço do dia de PETR4, COMPRA 100, venda de 500 bloqueada com o motivo, venda parcial, ativo legado, posições/resumo/proventos estimados (47,00), evolução (carteira, CDI, BOVA11, +13,7 p.p. no mock), estorno restaura 100, carteira arquivada. Mock e servidor parados no fim.
- `launch.json`: entrada `painel-carteiras-8120` (BACKEND_URL do mock, 8099).

## Desvios

- **Sem verificação visual no navegador.** O painel do navegador estava no limite de abas (compartilhado com outras sessões; não fechei abas alheias) e o Claude in Chrome não estava conectado. Mobile, tema escuro e console não foram vistos; ficam cobertos por testes de HTML e pela integração em Node. Verificar à mão em `#/carteiras`.
- Datas no formato do projeto (`dd-mm-aaaa`, `utils/dataHora.formatarData`), não `dd/mm/aaaa`.
- Mock em vez do Docker para o fluxo de escrita (não criar carteira na base real). O Docker já tem as rotas.
- Setor vem de `/base/ativos?q=` (uma chamada por ticker, cache de sessão).
- Ibovespa: o gestor não tem série própria; usa-se BOVA11 (rótulo "proxy"). Se o gestor não tiver cotações de BOVA11 (caso do Docker no teste), a linha é omitida com aviso.
- Proventos estimados são brutos (JCP sem IR), usam a data com (`ultimaDataComDireito`) e não consideram desdobramentos. Compras com custo incluem corretagem no preço médio.
- Snapshots/rentabilidade do gestor não foram usados (exigem `POST /snapshots` e V43); a evolução é calculada no front. `/proventos` já estava em `ROTAS_PROXIADAS` da base: sem mudança no proxy.
- Conversão de legado remove o registro de capital (confirmação explícita).

## Propostas não implementadas (por prioridade)

1. Alertas de preço e de data com/ex (notificação na tela e no card).
2. Exportar CSV/PDF da carteira e do histórico de operações.
3. Modo privacidade (oculta valores em R$, mantém %).
4. Meta de alocação por ativo/setor e sugestão de rebalanceamento.
5. Importar da corretora por CSV (nota de negociação) com pré-visualização.
6. Simulação "e se eu comprasse mais" (preço médio e participação novos).
7. Treemap de alocação por ativo e setor.
8. Comparar carteiras lado a lado.
9. Notas por ativo; agrupar cards por setor.
10. Linha de Ibovespa oficial (pedir série ao gestor) e rentabilidade via snapshots do gestor.
