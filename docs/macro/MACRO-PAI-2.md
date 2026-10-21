# MACRO-PAI-2 — IMPLEMENTADO (2026-10-20)

## Entregue
- **`pages/IndicesMacroPage.js`:**
  - Os cartões ficam agrupados em **Juros**, **Inflação**, **Câmbio** e **Atividade**, cada grupo com uma frase de leitura.
  - Cada cartão mostra:
    - um sparkline dos últimos 12 meses (`htmlSparkline`, com o estilo copiado de `<f360-sparkline>`);
    - a variação em 1, 3 e 12 meses (p.p. para taxas, % para dólar, euro e IBC-Br);
    - o acumulado em 12 meses do IPCA e do IGP-M mensais;
    - a tabela de pontos dentro de um `<details>`.
  - Cartões novos: Focus de Selic e IPCA (ano corrente e seguinte), `IPCA_12M` e `EURO`. Ficam como "Sem dado ainda" até o gestor com MACRO-GES-1/2 subir.
- **`analise/macro/series.js`** (funções puras): `emOrdem`, `mesesAntes`, `valorEm`, `variacoes`, `acumulado12m` (exige 12 meses consecutivos), `janela12m`, `formatarVariacao`.
- **`api/indicesMacroApi.js`:** parâmetro opcional `desde`. A página pede 13 meses; um gestor sem o MACRO-GES-4 ignora o parâmetro e devolve a série inteira.
- **`tests/indicesMacro.test.mjs`** (12 casos), incluído no `npm test`.

## Evidência
- `npm test` passou inteiro.
- No preview (worktree em http://localhost:8088 contra o gestor no ar em 8091):
  - as 14 chamadas `/indices-macro/*?desde=` voltaram 200;
  - **o acumulado de 12 meses do IPCA calculado pelo painel deu 4,58%, igual à série oficial SGS 13522 (4,58% em 09/2026)**;
  - o sparkline da Selic mostra a queda de 15% para 13,75%.

## Desvios
- O IGP-M em 12 meses só aparece quando houver 12 meses consecutivos no banco; hoje há buracos e o campo fica oculto, de propósito, em vez de mostrar um valor inventado.
- Variações abaixo de 0,005 aparecem como "0,00", sem sinal (CDI diário).
