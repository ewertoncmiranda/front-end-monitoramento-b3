# OPCX-PAI-2 — IMPLEMENTADO (2026-10-17)

Entregue: seção `/* === OPCOES LAYOUT === */` no fim de `public/css/app.css` com `.opcoes-layout`, `.opcoes-sidebar` (260 px, sticky a 1rem) e `.opcoes-principal`; abaixo de 768 px empilha a sidebar e a solta do topo (`position: static`, largura total).

Evidência: caso de CSS em `tests/opcx.test.mjs`; navegador em 1280 px (lado a lado, sticky) e 375 px (empilhada, sem rolagem horizontal).

Desvio: corrigido `tests/ficha360/paleta.test.mjs` (F360-PAI-11), que falhava em checkout com CRLF (`core.autocrlf=true`): o teste agora normaliza o fim de linha.
