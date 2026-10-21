# MICRO-PAI-3 — IMPLEMENTADO (2026-10-21)

Datas ex na seção Proventos e custo de execução / alerta de data ex no plano de operação. Contrato: `GET /ativos/{simbolo}/datas-ex` (MICRO-GES-2).

- `public/js/analise/ficha360/datasEx.js` (novo, lógica pura): `DIAS_ALERTA_DATA_EX = 10`, `alertaDataEx`, `eventosRecentes` (24 meses), `spreadDaVela` ((venda−compra)/meio em %), `custoDeExecucao` (mediana dos últimos 21 pregões com oferta), `precoMedioDoDia`, `alvoLiquido`, `htmlAvisosPlano`.
- `ficha360Api.js`: rota `datasEx` (o `FichaContexto` já expõe qualquer chave de `CHAVES_DO_CONTEXTO`; não precisou de alteração).
- `SecaoProventos`: bloco "Datas ex" (tabela com data, tipo em selo de texto, ajuste implícito R$ e %, valor declarado, yield do evento, razão de ajuste; próxima data estimada com confiança e `leitura`; origem dos dados). Sem dados/404/503: estado vazio discreto, resto da seção segue.
- `planoDeOperacao.js`: `montarPlano` aceita `datasEx` opcional e acrescenta, só quando há dado: `alertaDataEx` (a até 10 dias, com tipo e ajuste médio histórico do tipo), `custoExecucao` (ida e volta, %), `alvoLiquido` (alvo e upside descontados do custo) e `entradaPrecoMedio` (vela com `precoMedio`). Não altera ação, força, R/R nem motivos. Sem os campos, o plano é idêntico ao anterior.
- `SecaoDecisao`: busca `datasEx` e renderiza `htmlAvisosPlano` (mudança mínima).
- Teste: `tests/ficha360/micro_renda.test.mjs`.

## Observações

- `spread_mediano_63d` não é usado; só as velas (`melhorOfertaCompra`/`melhorOfertaVenda`).
## Desvios

- Bug preexistente corrigido (já na develop): com a resposta real do gestor (`{simbolo, velas:[{maxima, minima, ...}]}`), `montarPlano` lançava `pregoes.slice is not a function`. `montarPlano` agora normaliza a entrada (array ou `{velas}`; `maxima`/`minima` viram `max`/`min` sem perder os campos originais; entrada vazia ou inválida segue dando "Menos de 15 pregões disponíveis"). Teste com a forma real em `micro_renda.test.mjs`.
