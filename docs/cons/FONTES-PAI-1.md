# FONTES-PAI-1 — IMPLEMENTADO (2026-10-21)

Valuation da ficha com prêmio de risco contra a NTN-B e earnings yield × Selic.

## Entregue

- `analise/ficha360/premioRisco.js` (novo, funções puras): `modeloPremioRisco(dto)` (nunca lança; DTO nulo ou campos nulos viram `{disponivel:false, motivo}`), `seloDoVeredito` (ACIMA/ABAIXO/IGUAL_A_RENDA_FIXA, texto + ícone ▲ ▼ =, com fallback pelo sinal do prêmio), `grahamAjustadoPeloJuro(V, Y)` = V × 4,4 / Y, formatadores.
- `ficha360Api.js`: nova chave `premioRisco` -> `GET /ativos/{simbolo}/premio-risco`. `FichaContexto.js` não precisou mudar: ele só repassa a chave e já converte 503/erro em `null`.
- `SecaoValuation`: bloco "Rendimento contra renda fixa" (earnings yield, juro real da NTN-B com vencimento e data-base, prêmio em p.p. com selo, `leitura`, linha contra a Selic meta via `premioSobreSelic`). Falha do endpoint (503, null, campos nulos) vira um aviso discreto (`role="status"`); o resto do valuation segue. Layout em grid Bootstrap (empilha no celular); selo nunca depende só de cor.
- Graham: o valor atual (`graham_number`, Graham Number = raiz de 22,5·LPA·VPA) NÃO tem ajuste de juros. Foi mantido, agora rotulado "Graham Number (valor atual)", e ao lado aparece "Graham ajustado pelo juro" = V × 4,4 / Y, com Y = Selic meta (`selicMeta`, % a.a.). Y nominal substitui o rendimento AAA da fórmula original (documentado no próprio cartão). Sem Selic (Y ausente ou <= 0), o cartão ajustado não aparece. Só exibição; a regra oficial de recomendação do gerar-insights não foi tocada.
- Teste novo `tests/ficha360/fontes_valuation.test.mjs` (7 casos: rota, modelo, selos, degradação, Graham ajustado, formatação, renderização completa e degradada com escape de HTML). `npm test` inteiro passa (exit 0).
- Preview: entrada `painel-cons-f1-8110` em `gerar-insights/.claude/launch.json` (BACKEND_URL no mock, porta 8197).

## Evidência

- Mock Node de gestor (scratchpad, porta 8197) respondendo `/ativos/PETR4/premio-risco` e repassando o resto ao gestor em 8091. Em `#/ativo/PETR4?secao=valuation`: Graham 78,75 e ajustado 23,90 (78,75 × 4,4 / 14,5), EY 12,50%, juro real 7,20% (venc. 15/08/2031, base 16/10/2026), prêmio +5,30 p.p. "▲ Acima da renda fixa", leitura, e "Contra a Selic meta (14,50%): -2,00 p.p. ▼ Abaixo da renda fixa".
- Caso 503: proxy repassou 503 do mock (curl); a degradação para aviso é coberta pelo teste de renderização.
- Servidores e mock parados.

## Desvios

- Navegador de preview compartilhado: outra sessão redirecionava a aba a cada poucos segundos, então o caso 503 e a leitura do console não foram observados no navegador. O único erro de console visto (`PainelCandles.carregar`, innerHTML de null) vem de outro servidor (8116), não do código desta tarefa.
- O proxy do painel atribuiu a porta 8112 (8110 ocupada).
- `FichaContexto.js` sem alteração (a chave vive em `ficha360Api.js`).
