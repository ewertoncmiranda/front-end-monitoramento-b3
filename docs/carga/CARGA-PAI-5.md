# CARGA-PAI-5 — Avisos de defasagem

Implementado em 2026-10-18. Início e Saúde dos dados incorporam um aviso compartilhado que consulta `GET /cargas/ultimas` no gestor, independentemente dos demais blocos. Quando o último sucesso ultrapassa o limite da etapa, mostra “Carga atrasada” e link para `#/cargas`.

Ausência de histórico não vira atraso nem zero. Falha na consulta informa indisponibilidade; não afirma que as cargas estão em dia. A requisição é cancelada ao desmontar, sem atualização de elemento removido e sem polling fora da página de cargas.

Validação: `tests/cargasDefasagem.test.mjs` cobre ausência, sucesso recente, atraso, integração nas duas telas, falha de rede e resposta após desmontagem. A regra compartilhada aproxima pregões por dias úteis; não há calendário de feriados da B3 no contrato disponível.
