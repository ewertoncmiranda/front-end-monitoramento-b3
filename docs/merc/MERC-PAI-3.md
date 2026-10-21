# MERC-PAI-3 — Cards reais do carrossel do mercado

**Status:** IMPLEMENTADO

## Resumo

Substitui o `cardPanoramaProvisorio` na `InicioPage` pelos quatro cards reais do
carrossel "Panorama do mercado": altas/quedas, liquidez, negociação e amplitude.

## Arquivos criados

| Arquivo | Responsabilidade |
|---|---|
| `public/js/components/inicio/cards/CardAltasQuedas.js` | Card de maiores altas e quedas com `<ranking-tickers>` |
| `public/js/components/inicio/cards/CardLiquidez.js` | Card de liquidez (volume médio 63 pregões) com selos de spread |
| `public/js/components/inicio/cards/CardNegociacao.js` | Card de mais/menos negociadas com contagem de negócios |
| `public/js/components/inicio/cards/CardAmplitude.js` | Card de amplitude do mercado (sem ranking) |
| `tests/mercCards.test.mjs` | Testes dos quatro cards e de `formatarVolume` |

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `public/js/pages/InicioPage.js` | Remove import de `cardPanoramaProvisorio`; adiciona os 4 cards |
| `public/js/utils/numero.js` | Adiciona `formatarVolume` (exportada) |
| `tests/mercCarrossel.test.mjs` | Atualiza o caso que verifica a InicioPage (agora testa os 4 cards) |

## Arquivos não alterados (conforme contrato)

`CarrosselMercado.js`, `RankingTickers.js`, `mercadoApi.js`, `cardPanoramaProvisorio.js`
(este arquivo permanece em disco e continua sendo usado para `htmlRodapePanorama`).

## Desvios

**Selos de liquidez e contador de negócios como campo `setor`:**
`RankingTickers` escapa a saída de `formatar`, impossibilitando HTML por essa via.
A solução foi pré-processar cada item e escrever o texto do selo/contador no campo
`setor` do item antes de atribuir `ranking.dados`. O campo `setor` já é renderizado
como texto secundário abaixo do ticker, sem escapar HTML adicional.
Isso preserva a separação de responsabilidades (sem tocar em `RankingTickers`)
e entrega a informação funcional ao usuário, ainda que sem badges visuais.
