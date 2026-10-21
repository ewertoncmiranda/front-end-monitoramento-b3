# Consolidação do frontend — 2026-10-21

Status: **IMPLEMENTADO**.

## Entregue

Branch única: `feature-consolidacao-painel`, criada de `origin/develop` em `237fc77`. Todas as entregas abaixo foram integradas com commits de merge, preservando os commits e o histórico das branches de origem.

| PR substituído | Entrega |
|---|---|
| #68 | MERC-PAI-2 — setores e empresas |
| #70 | MERC-PAI-4 — volume anormal, macro e eventos |
| #71 | Painel macro, séries, curva real e barreira de compra |
| #72 | Proxy de opções e proventos |
| #73 | Preço médio e marcas ex no gráfico |
| #74 | Ofertas, preço justo e spread de opções |
| #75 | Prêmio de risco e valuation |
| #76 | Ficha de bancos e IF.data |
| #77 | Insiders e recompras |
| #78 | Confiabilidade e filtro |
| #79 | Datas ex e plano de operação |
| #80 | Glossário e fórmulas |
| #81 | Especificações MACRO e CONS |

MERC-PAI-1 e MERC-PAI-3 já estavam na develop; seus componentes e testes foram preservados.

## Conflitos resolvidos

- `package.json`: união dos testes de todas as entregas; nenhuma suíte substituída por outra.
- `InicioPage.js`: oito cards reais na mesma lista; o placeholder foi substituído pelos componentes entregues.
- `apiProxy.js` e testes: preservados `/mercado`, `/opcoes` e `/proventos` com prefixo e query intactos.
- `ficha360Api.js`: todas as chaves coexistem, incluindo prêmio de risco, banco, insiders, recompras, confiabilidade e datas ex.
- `SecaoFundamentos.js`: o painel IF.data convive com os indicadores próprios de bancos/seguradoras e a nota do plano financeiro; o filtro anterior de métricas foi preservado.
- `SPEC.md`: planos MERC, MACRO e CONS preservados, com status apontando para a branch única.

## Evidência

- `npm test` completo passou após a integração, incluindo os testes descobertos por `tests/ficha360/executar.mjs`, MERC e índices macro.
- Regressão de integração valida os oito cards reais e sua ordem, sem placeholder.
- Regressão valida o plano financeiro com e sem painel IF.data, preservando LPA e evitando cartões EBITDA/ROIC inadequados.
- `git merge-base --is-ancestor` confirmou **13/13 branches de origem** como ancestrais do resultado consolidado.
- Nenhum marcador de conflito restante; `git diff --check` passou.

## Regra permanente

**NUNCA MAIS CRIAR UMA BRANCH PARA CADA TAREFA. UMA FEATURE, UMA BRANCH E VÁRIOS COMMITS.**

Registrada no `AGENTS.md` do frontend e no `C:/Users/User/projetos/AGENTS.md`, que abrange os repositórios do ecossistema. Tarefas da mesma feature usam a mesma branch/worktree por repositório e o mesmo PR. Orientações anteriores de fragmentação por tarefa foram substituídas pela decisão do usuário.

Os PRs individuais são substituídos pelo PR único da branch consolidada. As branches antigas são preservadas para rastreabilidade; não há exclusão nem reescrita forçada de histórico.
