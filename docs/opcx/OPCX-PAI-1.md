# OPCX-PAI-1 — IMPLEMENTADO (2026-10-17)

Entregue: `public/js/components/opcoes/AtivoContextoOpcoes.js` (`<ativo-contexto-opcoes>`, `setContexto(obj)`). Bloco "Preço e range": preço, variação do dia, máxima e mínima de 63 pregões, barra de posição no range, variação no período. Bloco "Valor e risco": Graham Number, recomendação (badge), margem de segurança, volatilidade 21d, ATR 14, volume relativo, ex-dividendos (até 3). Campo ausente vira `—`.

Evidência: `tests/opcx.test.mjs` (5 casos desta tarefa) passa; no navegador, PETR4 preenche os dois blocos sem erro no console.

Notas: reaproveita `moeda`/`numero`/`pontos`/`dataBr` de `analise/fichaDoAtivo.js`, o badge de `utils/recomendacaoBadge.js` e as cores da paleta F360 (com fallback).
