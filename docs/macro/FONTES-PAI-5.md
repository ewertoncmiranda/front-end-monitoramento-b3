# FONTES-PAI-5 — IMPLEMENTADO (2026-10-21)

## Entregue
- Cartão **"Juro real: NTN-B (Tesouro IPCA+)"** em `#/indices`, logo abaixo do cabeçalho de decisão: taxa da referência (vencimento mais próximo de 5 anos, rotulada como tal), data-base, selo de curva normal/invertida/plana (ícone + texto) com leitura curto vs longo, gráfico SVG inline da taxa de compra por vencimento (`role="img"`, `aria-label`, tooltips) e tabela recolhida com os pontos.
- Ligação ao cabeçalho de decisão: o card "Juro real" ganha "NTN-B de referência: X% (vencimento dd/mm/aaaa)" quando a curva está disponível; sem curva, o HTML é idêntico ao anterior.
- 503, erro de rede ou `motivo` preenchido: o cartão vira um aviso discreto com o motivo; o resto da página não muda.
- Lógica pura em `public/js/analise/macro/curvaReal.js`; `buscarCurvaReal()` em `indicesMacroApi.js`; `renderCurvaReal` e `renderPainel(painel, ano, curva)` em `IndicesMacroPage.js`.

## Evidência
- `npm test` passou (5 casos novos em `tests/indicesMacro.test.mjs`: forma da curva, referência, cartão, aviso, ligação ao painel).
- Preview `painel-cons-f5-8114` com mock Node (curva e painel; resto repassado ao 8091): cartão 7,41% (15/08/2031), "Curva normal", gráfico e tabela com 8 pontos, linha NTN-B no card de juro real. Caso 503: só o aviso, painel e 14 cartões normais.
- Console: sem erro novo da tela (503 esperado e um 400 do gestor antigo em série sem dado).

## Desvios
- A curva chega separada do painel; o cabeçalho é redesenhado quando ela chega.
- Não alterei `painel.js` (fora da lista de arquivos); a linha é montada na página.
- O caso `motivo` foi coberto por teste unitário; no preview verifiquei o 503.
