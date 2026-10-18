# CARGA-PAI-2 — Histórico e detalhe

Implementado em `HistoricoCargas.js` e `DetalheCarga.js`, componentes da página de cargas que recebem somente dados camelCase do gestor.

O histórico filtra status e intervalo inclusivo por data, rejeita intervalo invertido e pagina localmente em grupos de dez execuções. A API atual retorna uma lista limitada; a paginação cobre a lista recebida (a página solicita até 500). Os eventos `cargas-filtrar` e `carga-abrir` delegam leitura e navegação à página. Estado vazio, carregamento e erro com nova tentativa são explícitos.

O detalhe mostra parâmetros, etapas ordenadas, métricas completas (incluindo objetos de rejeição por motivo), alertas, erros integrais e arquivos. Erros ficam em áreas de texto selecionáveis com botão de copiar e alternativa Ctrl+C quando a área de transferência estiver indisponível. Valores externos são escapados e ausentes aparecem como travessão; zero continua zero.

Datas usam o utilitário comum do painel: timestamps sem fuso são UTC e exibidos em Brasília; datas puras preservam o dia. Selos reutilizam o catálogo compartilhado de status. Parâmetros longos quebram dentro do painel em telas estreitas.

Validação: `node tests/cargasDetalhe.test.mjs` cobre escape de HTML, preservação de erros longos, ordenação das etapas, nulos/zeros, filtros inclusivos, paginação e horários UTC sem fuso/com Z.
