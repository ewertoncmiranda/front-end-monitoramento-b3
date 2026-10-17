# SPEC — Ícones de ajuda na aba Operabilidade

| Campo | Valor |
|---|---|
| Feature | AJUDA-OPR |
| Sprint | feature-historico-operacao |
| Estado | PLANEJADO |
| Criado em | 2026-10-17 |
| Depende de | nenhuma |

## Objetivo

Adicionar um botão `?` no canto superior direito de cada card da aba Operabilidade. Ao clicar, um popover inline (sem dependência de biblioteca externa) exibe título e descrição do card. Nenhuma rota nova no backend.

## Regras de colisão entre agentes

Cada tarefa abaixo declara os arquivos que **somente ela** pode modificar. Agentes paralelos não devem tocar arquivos de outra tarefa sem resolução de dependência explícita.

---

## Tarefas

### T1 — Utilitário `htmlAjuda`
**Estado:** PLANEJADO  
**Arquivo proprietário (exclusivo):** `public/js/utils/ajuda.js` *(novo)*  
**Dependências:** nenhuma  
**Pode rodar em paralelo com:** T2

Criar função exportada:

```js
// Retorna HTML de um botão ? com popover atrelado ao id dado.
// Uso: ${htmlAjuda('opr-status', 'Status do sistema', 'Indica se...')}
export function htmlAjuda(id, titulo, texto) { ... }
```

O popover é um `<div role="tooltip">` absolutamente posicionado que fecha ao clicar fora (listener `mousedown` no `document` com `closest`). O botão usa `aria-expanded` e `aria-describedby`.

---

### T2 — Estilos CSS do botão e popover
**Estado:** PLANEJADO  
**Arquivo proprietário (exclusivo):** `public/css/app.css` — acrescentar ao final a seção `/* === AJUDA POPOVER === */`  
**Dependências:** nenhuma  
**Pode rodar em paralelo com:** T1

Seletores a adicionar: `.btn-ajuda`, `.ajuda-popover`, `.ajuda-popover.visivel`, `.ajuda-popover-titulo`, `.ajuda-popover-texto`, `.ajuda-popover-fechar`. O botão tem tamanho 18×18 px, `border-radius: 50%`, cor `text-muted`, sem borda aparente no estado normal.

---

### T3 — Integração em `OperabilidadePage.js`
**Estado:** PLANEJADO  
**Arquivo proprietário (exclusivo):** `public/js/pages/OperabilidadePage.js`  
**Dependências:** T1 (importa `htmlAjuda`)  
**Pode rodar em paralelo com:** T4, T5, T6 (após T1 concluída)

Adicionar `import { htmlAjuda } from '../utils/ajuda.js'` e inserir `${htmlAjuda(...)}` em:
- `htmlResumo` — card de status/badge
- `htmlMaturidade` — barras de pregões
- `htmlOperabilidade` — seção alertas, seção gráfico

Textos dos popovers: ver tabela na proposta em SPEC.md raiz (seção "Operabilidade — ícone de ajuda").

---

### T4 — Integração em `GraficoOperabilidade.js`
**Estado:** PLANEJADO  
**Arquivo proprietário (exclusivo):** `public/js/components/operacional/GraficoOperabilidade.js`  
**Dependências:** T1  
**Pode rodar em paralelo com:** T3, T5, T6

Adicionar `import { htmlAjuda }` e inserir o botão na função que renderiza o cabeçalho do gráfico retorno × CDI.

---

### T5 — Integração em `CarteiraSimulada.js`
**Estado:** PLANEJADO  
**Arquivo proprietário (exclusivo):** `public/js/components/operacional/CarteiraSimulada.js`  
**Dependências:** T1  
**Pode rodar em paralelo com:** T3, T4, T6

Adicionar botão `?` ao cabeçalho do card "Carteira simulada". Texto: "Posições abertas pela regra de entrada vigente. Preço de entrada, resultado parcial e tempo na posição. Sem execução real."

---

### T6 — Integração em `BloqueiosOperacionais.js`
**Estado:** PLANEJADO  
**Arquivo proprietário (exclusivo):** `public/js/components/operacional/BloqueiosOperacionais.js`  
**Dependências:** T1  
**Pode rodar em paralelo com:** T3, T4, T5

Adicionar botão `?` ao cabeçalho do card "Bloqueios operacionais". Texto: "Lista os motivos que impedem a regra de abrir novas posições: liquidez insuficiente, dado ausente, drawdown excedido."

---

## Ordem de execução recomendada

```
T1 ──┐
T2   │ (paralelo)
     ▼
     T3, T4, T5, T6  (paralelo entre si, após T1)
```

## Critério de aceite

- Cada card exibe botão `?` visível mas discreto no canto superior direito.
- Clicar abre o popover; clicar fora ou no `×` fecha.
- Nenhum layout se quebra em tela 375 px.
- `npm test` continua verde.
