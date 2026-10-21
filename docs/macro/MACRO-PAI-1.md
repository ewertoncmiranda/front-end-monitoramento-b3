# MACRO-PAI-1 — IMPLEMENTADO (2026-10-20)

## Entregue
- **Cabeçalho "Painel de decisão"** no topo de `#/indices`, acima dos grupos, com quatro indicadores, cada um com a `leitura` do gestor:
  - juro real (com Selic meta e IPCA esperado);
  - ciclo da Selic, com selo texto + ícone (▲ ALTA, ▼ QUEDA, ■ ESTÁVEL), nunca só cor;
  - Focus do ano corrente (Selic e IPCA);
  - barreira de compra (earnings yield mínimo, com a mediana da base).
- **`api/indicesMacroApi.js`:** `buscarPainelMacro()` (`GET /indices-macro/painel`).
- **`analise/macro/painel.js`:** lógica pura (`indicadoresDecisao`, `seloCiclo`, `temDados`, `pct`).
- Bloco nulo mostra "⚠ motivo" no próprio cartão. Se o `/painel` falhar ou vier sem nenhum dado, aparece uma linha discreta e os cartões seguem normais.
- Layout em grade responsiva (1 coluna no celular, 2 em sm, 4 em lg).
- Testes em `tests/indicesMacro.test.mjs` (já no `npm test`).

## Evidência
- `npm test` passou inteiro.
- Preview contra mock do gestor (o gestor no ar é a versão antiga, sem `/painel`): cabeçalho com os 4 indicadores e selo "▼ QUEDA" renderizados, console sem erros.
- Caso 404: aviso discreto "Painel de decisão sem dados no momento." e os 14 cartões de índices carregados normalmente.

## Desvios
- Verificado só contra mock (JSON no formato do `PainelMacroDTO`); falta conferir com o gestor novo no ar.
- Focus usa o ano corrente, lido de `series[]`; a leitura vem da própria série.
- Três entradas `painel-cons-mock-*` foram acrescentadas ao `launch.json` do projeto gerar-insights (BACKEND_URL de mocks em scratchpad).
