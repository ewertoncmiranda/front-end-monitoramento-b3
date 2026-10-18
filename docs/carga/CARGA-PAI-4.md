# CARGA-PAI-4 — Acompanhamento

A página agenda uma consulta após 5 segundos enquanto a lista ou o detalhe informar execução pendente/em execução. Atualiza detalhe, cabeçalho, cartões e histórico sem navegar. Ao ocultar a página suspende; ao mostrar consulta novamente; ao desconectar aborta requisições e elimina o temporizador. O fim da carga elimina o agendamento.

Validação: `tests/cargasPolling.test.mjs` cobre intervalo de cinco segundos, suspensão por visibilidade, fim de execução e desmontagem.
