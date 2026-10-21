# MICRO-PAI-1 — IMPLEMENTADO (2026-10-20)

## Entregue
- `pregoesApi.velasDoBanco` repassa `precoMedio`, `melhorOfertaCompra`, `melhorOfertaVenda` (numero ou null) e `marcaEx` (string ou null). Gestor sem os campos segue funcionando.
- `analise/overlays/overlayPrecoMedio.js`: linha tracejada discreta "Preço médio do dia", desligavel por checkbox em `PainelCandles`. Velas sem o campo sao puladas.
- `analise/overlays/overlayDataEx.js`: mapa de marcas (EB, ED, EG, EJ, ER, ES, EX; combinacoes juntam nomes; desconhecida = "evento"), marcadores sobre a vela com rotulo textual ("Ex JCP") e lista abaixo do grafico com `title` ("Data ex: JCP (EJ)").
- `detectorPadroes.js`: vela com `marcaEx` nao conta como `gap` e engolfo de alta/baixa (que usam a abertura contra o fechamento anterior) nao dispara nela. Novo alerta `gap-data-ex` ("Gap explicado por data ex"). Padroes sem gap inalterados.
- Testes: `tests/ficha360/micro_grafico.test.mjs`. `npm test` passa.

## Evidência
- `npm test` completo verde.
- Preview (`painel-cons-micro1-8104`) com mock de gestor (campos novos): linha de preço médio liga/desliga, marcador "Ex" e lista com tooltip aparecem em `#/ativo/PETR4?secao=grafico`. Com o gestor real do Docker (sem os campos): checkbox desabilitado com explicacao, grafico normal.

## Desvios
- Intervalos semana/mes: overlay desligado (o gestor nao devolve os dias de uma vela agregada, entao nao ha media ponderada por volume confiavel). Tambem desligado em periodos da BRAPI.
- Overlays nao foram colocados em `REGISTRO_OVERLAYS` (o teste existente exige 14 e `PainelTecnico` esta fora do escopo); `PainelCandles` os combina com as linhas/marcadores do painel tecnico.
- Tooltip: a lightweight-charts nao tem tooltip em marcador; o texto fica na lista abaixo do grafico (`title` + texto visivel).
- Console tem `TypeError ... innerHTML` em `PainelCandles.carregar` na primeira montagem (corrida de `attributeChangedCallback` antes do render); ja existia no HEAD, nao tratado.
- Entrada `painel-cons-micro1-8104` do launch.json usa BACKEND_URL do mock (8106); o preview caiu em 8105 uma vez por porta ocupada.
