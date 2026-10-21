# FONTES-PAI-4 — IMPLEMENTADO (2026-10-21)

Selos de confiabilidade (FONTES-GES-4, `GET /ativos/{simbolo}/confiabilidade`) no cabeçalho da ficha e
filtro de confiabilidade na tabela de ativos.

## Arquivos
- `public/js/analise/ficha360/confiabilidade.js` (novo, lógica pura): `piorNivel`, `compararSelos`
  (mais grave primeiro, empate pela ordem CADASTRO, AUDITOR, DIVIDA, FUNDOS, DIVIDENDO), `normalizarConfiabilidade`,
  `htmlFaixaConfiabilidade`, e o ponto de extensão da tabela (`nivelDaLinha`, `filtrarPorConfiabilidade`).
- `SecaoCabecalho.js`: faixa sob o cabeçalho. Selo-resumo "Confiabilidade: OK/ALERTA/CRÍTICO"; ALERTA e CRÍTICO em destaque
  (cor + ícone + texto); `detalhe` em `title` e em `visually-hidden` para leitor de tela; SEM_DADO cinza e recolhido
  em "N sem dado". Resposta ausente/inválida: faixa não existe, HTML idêntico ao de antes.
- `ficha360Api.js`: só a chave `confiabilidade`. `FichaContexto.js` não precisou mudar (as chaves vêm de `ROTAS`);
  404 e 503 já viram `null` ali, então não quebram a ficha.
- `AtivosPage.js`: select "Confiabilidade (cadastro CVM, nesta página)": Todos / Com restrição / Só críticos / Só OK.
- `tests/ficha360/fontes_confiabilidade.test.mjs` (10 casos); `npm test` inteiro passa.

## Tabela de ativos
Nenhuma chamada por linha. `/painel/ativos` não traz confiabilidade; traz `situacaoRegistro` (selo CADASTRO),
então o filtro usa esse campo e atua só nas linhas da página carregada. `nivelDaLinha` já prefere um futuro
`item.confiabilidade.nivel` da listagem.

## Desvios
- O filtro por confiabilidade completa na tabela (auditor, dívida, fundos, dividendo; e filtro no servidor, sobre todas
  as páginas) depende de um campo novo na listagem do gestor: tarefa futura FONTES-GES-6. Até lá o filtro cobre só o cadastro CVM e só a página atual.
- O filtro da tabela não vai para o link (`hashDaBase` e `filtrosBase.js` intocados).
- Preview: a entrada `painel-cons-f4-8112` foi criada em `gerar-insights/.claude/launch.json`, mas a porta 8112 estava com outro
  preview e a ferramenta caiu em 8113 sem honrar o `BACKEND_URL`; a verificação foi feita subindo `server.js` direto (porta 8116) contra um mock Node
  (PETR4 = selos, ITUB4 = 503, demais = 404, resto repassado a `localhost:8091`).

## Verificação no navegador
PETR4: resumo ALERTA, selo CRÍTICO (dívida), 3 ALERTA, OK, "1 sem dado"; tooltips com o `detalhe`. ITUB4 (503) e VALE3 (404): cabeçalho
normal, sem faixa. Console: só os 503/404 esperados e um erro preexistente em `PainelCandles.js:151` (fora do escopo, proibido). Filtro da tabela:
30 linhas, "Só OK" 27, "Com restrição" 0. Servidores e mock parados.
