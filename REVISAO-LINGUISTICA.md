# Revisão linguística do frontend

## Convenção

- Idioma declarado: português do Brasil (`pt-BR`).
- Codificação: UTF-8. Acentos, cedilha e til são permitidos e obrigatórios nos textos visíveis.
- Identificadores, rotas, nomes de campos JSON e valores de enum não são traduzidos.
- Termos técnicos consolidados, como API, ticker, z-score, ROE e OHLC, podem permanecer em inglês ou como sigla quando explicados no Glossário.

## Escolhas terminológicas

| Antes | Preferência na interface | Motivo |
|---|---|---|
| Candles | Velas (candles) na primeira ocorrência; depois, velas | Termo português sem perder a referência de mercado |
| Range | Período ou intervalo | Há equivalente direto em português |
| Backend | Serviço ou API | Mais claro para quem usa o painel |
| Switch/toggle | Opção, ativar ou desativar | Evita estrangeirismo desnecessário |
| Score | Pontuação | Usar “score” somente quando for o nome literal do contrato |

## Validação

`npm test` verifica automaticamente:

- `lang="pt-BR"` e UTF-8;
- ausência de indícios comuns de texto corrompido;
- preservação de cedilha e til;
- ausência dos principais rótulos antigos sem acentuação.

A concordância verbal e nominal continua sendo uma revisão semântica. Os textos operacionais principais foram revisados manualmente; novos textos devem seguir esta convenção.
