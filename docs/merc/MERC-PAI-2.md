# MERC-PAI-2 — Card Setores × Empresas

**Status:** IMPLEMENTADO (branch `feature-merc-pai-2`, aguardando revisão). Contrato: `infra-b3-ecossytem/SPEC.md`, Plano MERC.

## Entregue

- `public/js/analise/panoramaMercado.js` — módulo puro (sem DOM), testável diretamente com node. Exporta:
  - `textoSelo(selo)` — `'JUNTO'` → `'andou junto'`, `'DISPERSO'` → `'disperso'`, qualquer outro → `'misto'`
  - `escalaBarras(itens, fnValor)` — máximo absoluto para normalizar barras; retorna 1 se vazio ou todos zero
  - `estadoVazioBloco(indisponivel, nomeBloco)` — true se nomeBloco está em indisponivel
  - `setoresOrdenados(setores)` — ordena por `variacaoMediana` decrescente; "Outros" sempre por último
  - `formatarDesvio(desvio)` — ratio → `'+1,23 pp'` / `'-0,45 pp'`
  - `formatarVariacaoSetor(v)` — ratio → `'+2,30%'`

- `public/js/components/inicio/cards/CardSetoresEmpresas.js` — exporta `cardSetoresEmpresas({ buscar, janela })`. Retorna `{ id, titulo, tituloErro, render(host) }` para o carrossel. Comportamento:
  - Lista setores ordenados por `variacaoMediana` (maior primeiro), cada um com barra divergente em torno de zero, percentual de variação, número de empresas, selo de coesão e chips do melhor/pior desvio
  - "Outros" aparece sempre por último, sem chips de melhor/pior
  - Clique expande e mostra `<ranking-tickers>` com `melhores`/`piores` configurado: `direcional = false`, `rotulos = { maiores: 'Destaques', menores: 'Ficaram para trás' }`, `valor = item => item.desvio`, `formatar = item => formatarDesvio(item.desvio)`; apenas um setor fica expandido por vez
  - Estado vazio quando `setores` em `indisponivel` ou lista vazia (`htmlEstadoVazio`)
  - Rodapé com `htmlRodapePanorama` (importado de `cardPanoramaProvisorio.js`)
  - Erro no gestor propaga como throw (o `CarrosselMercado` isola por card)

- `public/js/pages/InicioPage.js` — edição mínima: importa `cardSetoresEmpresas` e o adiciona antes do card provisório no array `cards` do carrossel

- `tests/mercSetoresEmpresas.test.mjs` — stubs de HTMLElement/customElements (padrão `mercCarrossel.test.mjs`); testes de `panoramaMercado.js` (textoSelo, escalaBarras, estadoVazioBloco, setoresOrdenados, formatarDesvio) e do card (render com mock, estado vazio por bloco em indisponivel, estado vazio por lista vazia, erro lança, clique expande e colapsa com RankingTickers configurado)

## Desvios

- A barra divergente usa `left:50%` / `left:{50-pct}%` com largura proporcional em estilos inline; não requereu CSS adicional em `app.css` pois usa apenas tokens `--f360-*` e classes Bootstrap já existentes
- O diretório `public/js/components/inicio/cards/` foi criado para abrigar os cards futuros (MERC-PAI-3, MERC-PAI-4)

## Validação

`tests/mercSetoresEmpresas.test.mjs` (8 casos): stub lança em duplicado; textoSelo; escalaBarras; estadoVazioBloco; setoresOrdenados (ordenação, Outros por último, empate, vazio); formatarDesvio; card com mock de buscarPanorama; bloco em indisponivel; setores vazio; erro no gestor; clique expande e colapsa com configuração do RankingTickers. `npm test` completo: exit 0.
