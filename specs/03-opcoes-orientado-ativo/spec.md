# SPEC — Opções orientado ao ativo

| Campo | Valor |
|---|---|
| Feature | OPCOES-ATIVO-1 |
| Sprint | feature-historico-operacao |
| Estado | PLANEJADO |
| Criado em | 2026-10-17 |
| Depende de | nenhuma rota nova no backend |

## Objetivo

Reorganizar a aba `#/opcoes` para colocar o contexto do ativo em primeiro plano. Hoje a tela exibe a saúde da cadeia de opções (cobertura, gaps, freshness) antes mesmo de o usuário selecionar um ativo, o que confunde quem chegou para analisar um papel específico. A proposta move a saúde para um painel colapsável no rodapé e adiciona uma sidebar com os dados de contexto do ativo (preço, range, Graham, volatilidade, ex-dividendos) ao lado da tabela de opções.

## Regras de colisão entre agentes

Cada tarefa abaixo declara os arquivos que **somente ela** pode modificar. Agentes paralelos não podem tocar arquivos de outra tarefa sem resolução de dependência explícita.

---

## Tarefas

### T1 — Componente sidebar de contexto do ativo (`AtivoContextoOpcoes.js`)
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/components/opcoes/AtivoContextoOpcoes.js` *(novo)*

**Dependências:** nenhuma  
**Pode rodar em paralelo com:** T2

Web component `<ativo-contexto-opcoes>`. Recebe o objeto `contexto` (resultado de `_montarContexto` em `OpcaoPage.js`) via `setContexto(obj)`. Renderiza dois blocos:

**Bloco 1 — Preço e posição:**
- Preço atual, variação do dia (%)
- Máxima e mínima 63d + barra de posição no range (igual à usada em `ConsultaPage`)
- Variação no período (%)

**Bloco 2 — Referências de valuation e liquidez:**
- Graham Number (R$)
- Recomendação (badge)
- Margem de segurança (%)
- Volatilidade 21d anualizada (%)
- ATR14 (R$)
- Volume relativo (×)
- Ex-dividendos próximos/recentes (lista compacta)

Mostra `—` para campos `null`. Cada linha tem rótulo à esquerda e valor à direita (layout `d-flex justify-content-between`).

---

### T2 — CSS layout duas colunas para Opções
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/css/app.css` — acrescentar ao final a seção `/* === OPCOES LAYOUT === */`

**Dependências:** nenhuma  
**Pode rodar em paralelo com:** T1

Adicionar:

```css
.opcoes-layout { display: flex; gap: 1rem; align-items: flex-start; }
.opcoes-sidebar { width: 260px; flex-shrink: 0; position: sticky; top: 1rem; }
.opcoes-principal { flex: 1; min-width: 0; }
@media (max-width: 767px) {
  .opcoes-layout { flex-direction: column; }
  .opcoes-sidebar { width: 100%; position: static; }
}
```

---

### T3 — Refatoração de `OpcaoPage.js`
**Estado:** PLANEJADO  
**Arquivos proprietários (exclusivos):**
- `public/js/pages/OpcaoPage.js`

**Dependências:** T1 (importa `AtivoContextoOpcoes`), T2 (usa as classes CSS)  
**Pode rodar em paralelo com:** nenhuma (integra T1 e T2)

Mudanças em `OpcaoPage.js`:

1. Adicionar `import '../components/opcoes/AtivoContextoOpcoes.js'`
2. Mover `<saude-cadeia-opcoes>` do topo para um `<details>` colapsável no rodapé da página (aberto por padrão para não esconder a informação, mas dobrável)
3. Em `_renderizar`: envolver `opcoes-painel` + seletor de vencimento na estrutura `.opcoes-layout`:
   ```html
   <div class="opcoes-layout">
     <aside class="opcoes-sidebar">
       <ativo-contexto-opcoes></ativo-contexto-opcoes>
     </aside>
     <div class="opcoes-principal">
       <!-- seletor de vencimento + opcoes-painel -->
     </div>
   </div>
   ```
4. Após setar `painel.setDados(dados)`, chamar `contextoEl.setContexto(this._contexto)`.
5. Manter todos os imports e lógica existentes (não remover `_montarContexto`, `buscarPregoes`, etc.).

---

## Ordem de execução recomendada

```
T1 ──┐
T2 ──┤ (paralelo)
     ▼
     T3
```

## Critério de aceite

- Ao entrar em `#/opcoes` sem ativo selecionado, a tela mostra apenas o seletor de ativo + saúde colapsada. Não exibe a saúde expandida bloqueando a interação.
- Ao selecionar um ativo, a sidebar de contexto aparece ao lado da tabela de opções.
- Em mobile (< 768 px) a sidebar empilha acima da tabela.
- Saúde da cadeia fica num `<details>` visível mas dobrado após o usuário selecionar o ativo.
- `npm test` continua verde.
