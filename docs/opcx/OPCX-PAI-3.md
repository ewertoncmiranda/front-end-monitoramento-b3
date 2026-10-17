# OPCX-PAI-3 — IMPLEMENTADO (2026-10-17)

Entregue em `public/js/pages/OpcaoPage.js`: saúde da cadeia num `<details>` no rodapé; resultado em `.opcoes-layout` com a sidebar `<ativo-contexto-opcoes>` antes da área principal; `setContexto(this._contexto)` logo após `painel.setDados(dados)`. Lógica e imports existentes mantidos.

Evidência: `npm test` verde (com `tests/opcx.test.mjs` incluído no script); navegador: sem ativo só seletor e saúde; com PETR4 sidebar ao lado da tabela; 375 px empilhada.

Desvios:
- SPEC contraditória (tarefa pede `<details open>`, aceite diz "saúde colapsada"): aberta sem ativo, recolhida ao abrir um ativo.
- Corrigido link direto `#/opcoes/PETR4`, quebrado na develop: `SeletorDeAtivos` não tem mais `selecionar()`; a página preenche o campo e abre o ativo. A `ConsultaPage` (`#/gestao`) chama o mesmo método inexistente e continua quebrada.
- `package.json`: acrescentado `node tests/opcx.test.mjs`.
- Duplicação: o card de contexto do `OpcoesPainel` repete quase todos os números da sidebar. Removê-lo exige editar `OpcoesPainel.js`, fora desta tarefa.
