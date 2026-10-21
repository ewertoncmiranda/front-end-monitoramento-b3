# FONTES-PAI-3 — IMPLEMENTADO (2026-10-21)

Seção "Quem está dentro" na ficha 360: insiders (administradores e controladores) e recompras.

- `GET /ativos/{simbolo}/insiders` e `/recompras` (contrato FONTES-GES-3), chaves `insiders` e `recompras` em `ficha360Api.js`.
- `SecaoInsiders`: selo do sinal (ícone + texto) com a leitura; tabelas das janelas de 3, 6 e 12 meses com abertura por cargo; barras SVG acessíveis (`role="img"` + `aria-label`); aviso de point-in-time ("dado vale a partir da entrega"); bloco de recompras com aviso de que variação positiva do saldo pode ser cancelamento ou entrega a plano; nota de que é sinal de confirmação, não gatilho.
- 503, 404 ou `disponivel=false`: estado vazio discreto com o motivo; a ficha não quebra.
- Manifesto: `insiders` ("Quem está dentro") logo após `proventos`; ids existentes e `?secao=` intactos.
- Lógica pura em `public/js/analise/ficha360/insiders.js`; testes em `tests/ficha360/fontes_insiders.test.mjs`.

## Desvios
- `FichaContexto.js` não foi alterado: é genérico e as chaves vivem em `ficha360Api.js`.
- `tests/ficha360/pagina.test.mjs` exigia a lista exata de seções; incluído `insiders` entre `proventos` e `opcoes`.
