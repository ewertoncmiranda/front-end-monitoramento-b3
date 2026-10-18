# CARGA-PAI-1 — Rota, API e etapas

Implementado no serviço existente: rota `#/cargas` e detalhe `#/cargas/{id}`, grupo Avaliação e proxy `/cargas` para o gestor. O painel não consulta ETL nem banco.

API preserva status e corpo das falhas; cartões mostram todo o catálogo, tentativa, sucesso, selo com texto e ícone, link e atraso. Campos ausentes aparecem como travessão. Sem histórico, 503 e falhas de rede têm mensagem e tentativa novamente.

Defasagem de COTAHIST/LIQUIDEZ conta dias úteis; sem calendário oficial B3 no contrato, feriados não são descontados. Demais limites são dias corridos. Datas sem fuso do contrato são interpretadas como UTC.

Validação: `tests/cargas.test.mjs` cobre status, limites, fins de semana, ausência, URLs, POST e preservação do 409.
