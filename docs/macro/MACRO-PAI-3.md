# MACRO-PAI-3 — IMPLEMENTADO (2026-10-20)

## Entregue
- Bloco **"Ativos acima da barreira"** dentro do painel de decisão: um cartão por ativo de `barreira.ativosAcimaDaBarreira`, com link `#/ativo/{SIMBOLO}`, earnings yield e distância até a barreira (ex.: "+3,05 p.p. da barreira").
- Estado vazio: "Nenhum ativo acima da barreira; mediana da base em X%."
- Funções `ativosAcima` e `distanciaTexto` em `analise/macro/painel.js`; render em `renderAtivosAcima` (`IndicesMacroPage.js`).
- Testes em `tests/indicesMacro.test.mjs`.

## Evidência
- `npm test` passou.
- Preview com mock: três cartões (TAEE11, BBAS3, CMIG4) com link e distância; com lista vazia, mensagem com mediana 9,40%.

## Desvios
- Não reaproveitei `htmlCartaoAtivo` (`components/busca/cartoesAtivos.js`): ele exige preço, sparkline, setor e botões de seleção que o endpoint não traz. Usei um cartão-link simples.
