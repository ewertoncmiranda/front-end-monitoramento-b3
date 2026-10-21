# PROVENTOS-GRAFICO

Status: IMPLEMENTADO — entrega em feature-proventos-grafico.

## Entregue

- Gráfico sem rótulos Ex JCP repetidos ou lista de marcas por pregão.
- Cards com valores oficiais identificados, retorno/preço, ajuste implícito e regularidade de datas ex, sempre no período selecionado.
- Leitura holística explicável, premissas e limitações; não altera o score/recomendação isoladamente.
- Eventos consolidados do gestor: faixa opcional de datas, contexto ao apontar/clicar na vela e tabela recolhível com parcelas, fonte e ajuste.
- Falha do resumo não impede a leitura das velas. Respostas atrasadas de outro período são descartadas.

## Contrato

GET /ativos/{simbolo}/proventos-resumo?de=AAAA-MM-DD&ate=AAAA-MM-DD. Mesmo proxy /ativos existente. Eventos contêm dataEx, marca, tipo, fechamentoAnterior, aberturaEx, ajusteImplicito, ajustePercentual, valorPorAcao, pagamentos e fonte. Resumo contém totais por tipo, contagens, variação de preço, regularidade e coberturaCompleta. Unidades percentuais já em porcentagem; contribuição em pontos percentuais. Não se utiliza provento contábil nem diferença de preço como valor oficial por ação.

## Evidência

npm test passou. Ficha360: 22 arquivos passaram, incluindo sete novos testes de contrato/renderização, cobertura parcial, nulidade, escape, intervalos diário/agregado, preservação de overlays técnicos e respostas atrasadas.

## Desvios e limites

O cache existente não registra cobertura integral das coletas. Retorno total/contribuição são indisponíveis enquanto não houver cobertura comprovada; valores identificados são explicitamente parciais, nunca zero por ausência. Não houve alteração em ETL, schema ou recomendação. Não houve implantação na stack local; exige as versões desta feature no frontend e gestor.
