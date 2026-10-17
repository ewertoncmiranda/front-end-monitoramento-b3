# SPEC — Feature Carteiras

| Campo | Valor |
|---|---|
| Feature | CARTEIRAS-1 |
| Sprint | feature-historico-operacao |
| Estado | PLANEJADO |
| Criado em | 2026-10-17 |
| Depende de | nenhuma rota nova no backend |

## Objetivo

Nova aba `#/carteiras`. O usuário cria carteiras nomeadas, cada uma com uma estratégia das 7 existentes. Cada carteira agrega N ativos monitorados com data de entrada e capital alocado. O painel exibe a evolução patrimonial desde a entrada mais antiga, comparada ao CDI e ao Ibovespa. Persistência 100% em `localStorage` — zero dependência de backend novo.

## Regras de colisão entre agentes

Cada tarefa abaixo declara os arquivos que **somente ela** pode modificar. Agentes paralelos não podem tocar arquivos de outra tarefa. A ordem de execução sinaliza quando o paralelismo é seguro.

---

## Tarefas

### T1 — Store de carteiras (`carteirasStore.js`)
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/utils/carteirasStore.js` *(novo)*

**Dependências:** nenhuma  
**Pode rodar em paralelo com:** T2, T3

CRUD sobre `localStorage['b3-carteiras']`. Exportar:

```js
export function listarCarteiras()        // -> Carteira[]
export function obterCarteira(id)        // -> Carteira | null
export function criarCarteira({ nome, estrategia, cor })  // -> Carteira
export function atualizarCarteira(id, campos)             // -> Carteira
export function removerCarteira(id)      // -> void
export function adicionarAtivo(carteiraId, { simbolo, dataEntrada, capital }) // -> Ativo
export function removerAtivo(carteiraId, simbolo)         // -> void
```

Estrutura de `Carteira`: `{ id, nome, estrategia, cor, criadaEm, ativos: [{ simbolo, dataEntrada, capital }] }`.

---

### T2 — API de preço por data (`carteirasPrecoApi.js`)
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/api/carteirasPrecoApi.js` *(novo)*

**Dependências:** nenhuma  
**Pode rodar em paralelo com:** T1, T3

Wrapper sobre `buscarPregoes` que resolve o preço de fechamento em uma data específica (ou o mais próximo disponível). Exportar:

```js
// Retorna { dataEfetiva, preco } ou null se não houver dado.
export async function buscarPrecoNaData(simbolo, dataIso)

// Retorna { precoEntrada, precoAtual, retorno } para um ativo.
// retorno = (precoAtual - precoEntrada) / precoEntrada
export async function calcularRetornoAtivo(simbolo, dataEntradaIso)
```

Usa `buscarPregoes(simbolo, { de: dataEntrada, intervalo: 'dia' })` (endpoint existente).

---

### T3 — Componente modal "Nova/Editar carteira" (`CarteiraModal.js`)
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/components/carteiras/CarteiraModal.js` *(novo)*

**Dependências:** T1 (importa `criarCarteira`, `atualizarCarteira`)  
**Pode rodar em paralelo com:** T4, T5 (após T1)

Web component `<carteira-modal>`. Modal Bootstrap com campos: nome (text), estratégia (select das 7), cor (color picker simples via `<input type="color">`). Emite evento `carteira-salva` com `{ carteira }` ao confirmar.

Estratégias disponíveis: `Fundamentalista`, `Dividendos`, `Momentum`, `Reversão`, `Crescimento`, `Graham`, `Qualidade`.

---

### T4 — Componente linha de ativo (`CarteiraAtivoLinha.js`)
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/components/carteiras/CarteiraAtivoLinha.js` *(novo)*

**Dependências:** T2 (usa `calcularRetornoAtivo`)  
**Pode rodar em paralelo com:** T3, T5 (após T2)

Web component `<carteira-ativo-linha>`. Recebe `{ simbolo, dataEntrada, capital }` via `setAtivo(obj)`. Busca o retorno assincronamente e renderiza: símbolo, data de entrada, capital alocado, retorno (%) e status (badge ▲/▼). Mostra spinner enquanto carrega; exibe `—` em caso de falha.

---

### T5 — Componente cabeçalho de carteira (`CarteiraCabecalho.js`)
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/components/carteiras/CarteiraCabecalho.js` *(novo)*

**Dependências:** T2 (usa `calcularRetornoAtivo` para cada ativo)  
**Pode rodar em paralelo com:** T3, T4 (após T2)

Web component `<carteira-cabecalho>`. Recebe a `Carteira` via `setCarteira(obj)`. Calcula patrimônio ponderado (soma `capital × (1 + retorno)` de cada ativo), retorno médio ponderado, exibe nome, estratégia, badge de cor, patrimônio estimado e retorno. Linha "vs CDI" calculada via `taxasBase.js` (já existente). Linha "vs Ibov" exibida como `—` por ora (dado não disponível sem rota nova).

---

### T6 — Componente formulário "Adicionar ativo" (`CarteiraAdicionarAtivo.js`)
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/components/carteiras/CarteiraAdicionarAtivo.js` *(novo)*

**Dependências:** T1 (usa `adicionarAtivo`)  
**Pode rodar em paralelo com:** T3, T4, T5 (após T1)

Web component `<carteira-adicionar-ativo>`. Campos: combobox `<seletor-de-ativos>`, data de entrada (input date), capital alocado (input number, R$). Validação: data não pode ser futura; capital > 0. Emite `ativo-adicionado` ao salvar.

---

### T7 — Página principal (`CarteirasPage.js`)
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/pages/CarteirasPage.js` *(novo)*

**Dependências:** T1, T3, T4, T5, T6 (todas as peças acima)  
**Pode rodar em paralelo com:** T8

Web component `<carteiras-page>`. Estrutura:

```
┌─────────────────────────────────────────────┐
│ Carteiras                        [+ Nova]   │
│ [pill: Conservadora] [pill: Moderada] …     │
├─────────────────────────────────────────────┤
│ <carteira-cabecalho>                        │
│ tabela de <carteira-ativo-linha> (loop)     │
│ [Adicionar ativo]  [Editar]  [Remover]      │
└─────────────────────────────────────────────┘
```

Estado vazio: ilustração + texto "Nenhuma carteira criada. Clique em + Nova para começar."

---

### T8 — Roteador e navegação
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/router.js` *(modificar — adicionar rota `carteiras`)*
- `public/index.html` *(modificar — adicionar link de nav e import de CarteirasPage)*

**Dependências:** nenhuma (pode preparar a rota antes da página existir usando import condicional)  
**Pode rodar em paralelo com:** T1…T7

Adicionar:
- `'carteiras': 'carteiras-page'` no mapa do router
- `<script type="module" src="js/pages/CarteirasPage.js">` no index
- Link `#/carteiras` no menu lateral com ícone `📁` ou `🗂`

---

## Ordem de execução recomendada

```
T1 ──┬──> T3 ──┐
     ├──> T6   │
T2 ──┼──> T4   ├──> T7
     └──> T5 ──┘
T8 (paralelo com tudo, integra por último)
```

## Critério de aceite

- `#/carteiras` carrega sem erro de console.
- Criar, editar e remover carteira persiste no reload (localStorage).
- Adicionar e remover ativo persiste no reload.
- Retorno de cada ativo é calculado a partir da data de entrada e exibido com sinal.
- Patrimônio estimado soma capital × (1 + retorno) de todos os ativos.
- Estado vazio exibe mensagem amigável.
- `npm test` continua verde.
