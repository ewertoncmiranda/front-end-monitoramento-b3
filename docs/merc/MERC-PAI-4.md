# MERC-PAI-4 — Cards de volume anormal, macro e eventos recentes

**Status:** IMPLEMENTADO (branch `feature-merc-pai-4`, aguardando revisão). Contrato: `infra-b3-ecossytem/SPEC.md`, Plano MERC.

## Entregue

- `components/inicio/cards/CardVolumeAnormal.js`: card "Volume fora do normal". Usa `<ranking-tickers>` com coluna única (maiores), `direcional = false`, formata a razão com uma casa decimal (`4,2× a média`). Estado vazio quando `volumeAnormal` em `indisponivel` ou lista vazia.
- `components/inicio/cards/CardMacro.js`: card "Indicadores macro". Grade 2×2 com Selic, CDI no período, Dólar e IPCA 12m. Sem `<ranking-tickers>`. Funções exportadas: `formatarTaxaAa`, `formatarVariacaoPeriodo`, `formatarDolar`. Valores `null` exibem `—`. Avisa que o card não muda com o seletor de período. Estado vazio quando `macro` em `indisponivel`.
- `components/inicio/cards/CardEventos.js`: card "Eventos recentes". Lista até 10 itens de `panorama.eventos` com símbolo (link `#/ativo/XXXX`), tipo legível (`DESDOBRAMENTO` → `Desdobramento`, `GRUPAMENTO` → `Grupamento`, `BONIFICACAO` → `Bonificação`; outros exibidos como vieram), data formatada e fator. Estado vazio quando `eventos` em `indisponivel` ou lista vazia.
- `pages/InicioPage.js`: acréscimo mínimo — 3 imports e os 3 novos cards adicionados ao array do carrossel. Ordem final: `[cardPanoramaProvisorio(), cardVolumeAnormal(), cardMacro(), cardEventos()]`. O `cardPanoramaProvisorio` permanece (a troca é feita no merge com MERC-PAI-3).
- `tests/mercCardsMacro.test.mjs`: 24 casos (renderização, estado vazio por bloco, erro isolado e formatação numérica). Adicionado ao script `test` do `package.json`.

## Arquivos criados/editados

| Arquivo | Ação |
|---|---|
| `public/js/components/inicio/cards/CardVolumeAnormal.js` | criado |
| `public/js/components/inicio/cards/CardMacro.js` | criado |
| `public/js/components/inicio/cards/CardEventos.js` | criado |
| `public/js/pages/InicioPage.js` | editado (3 imports + array) |
| `tests/mercCardsMacro.test.mjs` | criado |
| `package.json` | editado (novo teste no script) |
| `docs/merc/MERC-PAI-4.md` | criado |

## Desvios

- Nenhum desvio em relação à especificação.

## Validação

`npm test` exit 0. `tests/mercCardsMacro.test.mjs` (24 casos): renderização com dados reais, estado vazio por `indisponivel`, estado vazio por lista vazia, erro propaga (isolado pelo carrossel), formatação `selic 0.15 → '15,00% a.a.'`, `cdiPeriodo 0.0028 → '+0,28% no período'`, `dolar 5.42 → 'R$ 5,42'`, `null → '—'`, corte em 10 eventos, escape HTML. Sem verificação no navegador nesta tarefa.
