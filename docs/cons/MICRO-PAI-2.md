# MICRO-PAI-2 — IMPLEMENTADO (2026-10-20)

## Entregue
- `public/js/analise/opcoesMicro.js` (lógica pura): `precoJusto`, `spreadPercentual`, `strikeCorrigido`, `temOferta`, `precoParaCalculo`, `ultimoNegocioDefasado`, `mediana`, `resumoMicroestrutura`. Aceita camelCase e snake_case; campos ausentes dão null/false.
- Cadeia (`components/OpcoesPainel.js`): colunas "Preço justo" e "Spread %"; selo "⚠ strike corrigido"; selo "∅ sem oferta"; selo "⏱ último negócio defasado" quando |fechamento − meio| / meio > `LIMITE_DEFASAGEM_ULTIMO_NEGOCIO` (10%); filtro "Só séries com oferta". Selos com texto e ícone, não só cor; tabela dentro de `table-responsive`.
- Coluna "Prêmio usado" mostra a origem: "pelo meio do spread" ou "último negócio".
- `SecaoOpcoes` da ficha: séries com oferta (X de N) e spread mediano do vencimento mais próximo.
- Testes: `tests/ficha360/micro_opcoes.test.mjs`.
- INDOPC (1 char, pos. 202 do COTAHIST; `indice_correcao CHAR(1)` na V45): "0", vazio ou ausente = sem correção; qualquer outro valor = strike corrigido. A SPEC e o leitor `cotahist` só definem o tipo, não a tabela de códigos; o painel não interpreta o índice, só exibe o código no título do selo.

## Evidência
- `npm test` inteiro passa (exit 0), inclusive micro_opcoes.
- Preview com mock (`/ativos/PETR4/opcoes` com campos novos; resto repassado ao gestor 8091): colunas e selos corretos em `#/opcoes/PETR4`, filtro "só com oferta" reduz as linhas, seção da ficha mostra "3 de 4" e spread mediano 13.3%. Mock sem os campos novos: tabela renderiza com "último negócio" e "sem oferta", sem erro.
- Console: 404 de `/opcoes/saude` (rota do gestor, anterior à tarefa) e um erro de `PainelCandles.carregar` (arquivo proibido, fora do escopo).

## Desvios
- `OpcaoPage.js` não precisou mudar: o preço usado em prêmio/break-even/moneyness-fallback/hedge vive em `OpcoesPainel.js`, que agora usa o preço justo quando existe (fórmulas inalteradas, só a escolha do preço). O "Fechamento" continua sendo o último negócio.
- O componente da cadeia é `components/OpcoesPainel.js` (não há `components/opcoes/opcoes-painel`).
- Porta 8105 estava ocupada; o preview subiu em 8106.
