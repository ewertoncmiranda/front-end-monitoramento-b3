# CARGA-PAI-3 — disparo pelo painel

Implementado em 2026-10-18. `<rodar-carga>` abre um diálogo com tipo, anos, seleção múltipla de símbolos, etapas parciais e forçar reprocessamento. A revisão valida e fixa os parâmetros, apresenta resumo e exige confirmação explícita antes do POST ao gestor. Carga ativa e envio duplicado são bloqueados. A resposta 202 emite `carga-aberta` com `{ id }`; 409 oferece link para execução ativa; 503 informa indisponibilidade do ETL.

O elemento `<busca-ativos>` previsto no plano não existia neste checkout. Foi implementado junto do módulo, com busca na API existente `/base/ativos`, seleção de múltiplos símbolos, remoção acessível e adição direta quando a busca estiver indisponível. Não há novo comando operacional.

Validação: `node tests/cargasDisparo.test.mjs`, cobrindo tipos, anos, símbolos, etapas, deduplicação, resumo, bloqueio pré-confirmação e execução ativa, além de respostas 202/409/503. A integração da página cabe à CARGA-PAI-1/4.
