# MACRO-PAI-4 — IMPLEMENTADO (2026-10-21)

## Entregue
- **Glossário** (`GlossarioPage.js`): 3 grupos novos ("Juros, inflação e a régua da renda fixa", "Bancos, quem está dentro e confiabilidade", "Datas ex, ofertas e opções") com 34 verbetes, cada um com `id`, definição curta, "Como ler", "Aqui" (onde aparece) e link `#/...`. Cobrem: juro real, ciclo da Selic, barreira de compra, Focus, IPCA 12 meses, curva NTN-B, prêmio de risco, Graham ajustado, Basileia, capital principal, inadimplência, ROE do banco, P/VP do banco, ROE/P/VP, compra líquida de insiders, recompra líquida, selos de confiabilidade (geral + cadastro, auditor, dívida, fundos, dividendo), data ex, ajuste implícito, yield do evento, preço médio do dia, melhor oferta, spread %, preço justo pelo meio do spread, strike corrigido (INDOPC), defasagem do último negócio, custo de execução, alvo líquido. Os verbetes já existentes ROE, P/VP e Spread ganharam `id`, "Como ler" e link.
- `renderTermo` passou a mostrar `comoLer` e `link` e a pôr `id="verbete-..."`; a busca também varre o "como ler".
- **Fórmulas** (`FormulasPage.js`): 7 temas novos e 24 itens com expressão, variáveis, exemplo numérico e limites (`renderItem` mostra os campos opcionais; `TEMAS` passou a ser exportado). Exemplos reais: Graham 78,75 × 4,4 / 14,5 = 23,90; prêmio 12,50 − 7,20 = +5,30 p.p.; ITUB4 ROE 21,5 / P/VP 2,00 = 10,75; PETR4 ajuste implícito 42,37 − 41,90 = 0,47 (1,11%); IPCA 12m de 4,58%.
- Limiares reais: Basileia 10,5% (regulatório); +0,5 p.p. de inadimplência em 4 trimestres, janela de 6 meses e corte ±0,10 dos insiders, dívida 50%, payout 100%, auditor 24 meses, alerta de data ex 10 dias e defasagem 10% (todos marcados como "constante revisável"); ciclo da Selic 90 dias com tolerância 0,01.
- Teste novo `tests/ficha360/macro_glossario.test.mjs` (11 casos), rodado por `tests/ficha360/executar.mjs`.

## Evidência
- `npm test` inteiro passa (exit 0); `ficha360: 14/14 arquivos passaram`.
- O teste confere: todo verbete e fórmula esperados existem, sem ids duplicados (nem no HTML), toda expressão do plano escrita como combinado, contas dos exemplos, e todo `href="#/..."` das duas páginas resolve para rota real (`paginaDaRota`) e, em `?secao=`, para seção do `manifesto.js`.
- Regras e limiares conferidos nos docs e no código das worktrees MACRO, F1 a F4, M3, MICRO1 e MICRO2 e nos docs dos gestores (`cons-ges-*`, `cons-gestor`), onde moram Basileia 10,5, +0,5 p.p., 0,10/6 meses, 50%, 100% e 24 meses.
- Sem verificação no navegador (opcional); a checagem de links foi por Node.

## Desvios
- O link `#/ativo?secao=insiders` só resolve depois da integração da FONTES-PAI-3 (a seção `insiders` não existe no `manifesto.js` desta base). O teste a aceita por uma lista explícita de pendências.
- Os verbetes e fórmulas dos bancos, insiders, confiabilidade, data ex e opções descrevem telas que só existem depois da integração das outras worktrees.
- Exemplos marcados "didático" são contas de ilustração, não dados de ativo: recompra (−500 para −800), yield do evento (R$ 0,50), spread/preço justo (1,90 e 2,10), defasagem (1,50 e 2,00), custo 0,40%, ciclo da Selic (15,00 para 13,75). Os docs não trazem valor declarado da PETR4, por isso o yield do evento usa conta didática.
- Juro real: Selic 14,50% (FONTES-PAI-1) e IPCA esperado 5,22% (Focus 2026, MACRO-GES-2) vêm de dias diferentes; exemplo rotulado como ilustrativo.
- Compra líquida: o exemplo usa a janela de 3 meses do contrato (1.000 e 200); o selo usa 6 meses.
- Os textos novos usam acentos (como os grupos recentes); os verbetes antigos continuam sem acento.
