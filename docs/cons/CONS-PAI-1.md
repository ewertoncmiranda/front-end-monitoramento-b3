# CONS-PAI-1 — IMPLEMENTADO (2026-10-20)

## Entregue
- `proxy/apiProxy.js`: `/opcoes` (SaudeOpcoesController, `GET /opcoes/saude`, consumido por `buscarSaudeOpcoes`) e `/proventos` (ProventoController, `GET /proventos/{simbolo}`) adicionados a `ROTAS_PROXIADAS`.
- `tests/proxyFluxos.test.mjs`: um caso por rota nova (chega ao backend falso, status 200 e corpo de volta). Casos existentes intactos.

## Evidência
- Gestor: `SaudeOpcoesController` `/opcoes/saude`; `ProventoController` `/proventos/{simbolo}`; `OpcaoController` usa `/ativos/{ativo}/opcoes` e `/composicao-capital` (já coberto por `/ativos`).
- Bases do gestor vs. proxy: `/analises /ativos /cargas /carteiras /indices-macro /operacional /simulador /validacao /api` já proxiadas; faltavam só `/opcoes` e `/proventos`.
- Front: `/ia`, `/ativo`, `/manchetes`, `/noticias` não são do gestor (tratados por `iaProxy`/`noticiasApi` no próprio Express). `/proventos` não é chamado hoje por `public/js/api`, mas foi pedido e existe no gestor.
- Rotas futuras (`/ativos/{s}/datas-ex`, `/microestrutura`, `/derivativos`, `/premio-risco`, `/banco`, `/insiders`, `/recompras`, `/confiabilidade`) ficam sob `/ativos`; `/indices-macro/painel` e `/curva-real` sob `/indices-macro`: já cobertas, nada feito.
- `npm test` passa inteiro.

## Desvios
- Nenhum prefixo novo além de `/opcoes` e `/proventos`. A suposição sobre `/opcoes` foi confirmada no código.
