# FONTES-PAI-2 — IMPLEMENTADO (2026-10-21)

Ficha de banco na seção Fundamentos (DEC-FONTES-1: bancos por P/VP × ROE e Basileia). Consome `GET /ativos/{simbolo}/banco` (FONTES-GES-2).

- `ficha360Api.js`: nova chave de contexto `banco` (`/ativos/{s}/banco`); as existentes não mudaram. 503/erro vira `null` no `FichaContexto`.
- `analise/ficha360/banco.js` (puro): `modeloBanco(dto)` devolve `nao-banco` (ehBanco false, null ou falha), `sem-dados` (banco sem IF.data, mostra `motivo`) ou `banco`; rótulo de trimestre (`2T/26`), séries por campo, selos texto + ícone.
- `SecaoFundamentos.js`: para banco, painel com Basileia, capital principal, inadimplência, ROE, P/VP, ROE/P/VP, sparklines (`htmlSparkline`, estilo copiado como na MACRO-PAI-2), selos (✔ ▲ ⚠ ▼ — com texto), leituras e aviso de P/VP sem dado. Os indicadores atuais (EBITDA, dívida líquida/EBITDA, liquidez, DSO, etc.) ficam recolhidos em `<details>` "Outros indicadores", sem apagar dado. Não banco ou falha: HTML idêntico ao anterior.
- Acessibilidade/responsivo: grade `col-12 col-sm-6 col-lg-4`, selos nunca só por cor, aviso com `role="status"`.
- Testes: `tests/ficha360/fontes_banco.test.mjs` (lógica pura, rota, renderização banco/não banco/falha/sem IF.data). `npm test` passa.
- Verificação no navegador (mock + gestor 8091): ITUB4 mostra o painel; PETR4 inalterada; 503 (BBAS3) mantém a seção atual; sem erro novo no console (o erro de `PainelCandles` e os 502/503 já existiam/são do cenário).

## Desvios

- Nomes dos campos conferidos em `BancoDTO.java`. Valores do IF.data exibidos como percentual (15,2 = 15,20%), conforme FONTES-GES-2.
- Tela de ficha chama `/banco` para todo ativo (uma requisição a mais por abertura da ficha).
