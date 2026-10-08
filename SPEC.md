# SPEC — painel-ativos-frontend

| Campo | Valor |
|---|---|
| Versão da SPEC | 2.0.0 |
| Data de corte | 2026-09-27 |
| Estado da revisão documental | VERIFICADO |
| Escopo | Código local, contratos consumidos, estudos e testes automatizados |
| Limite da revisão | Não comprova comportamento do container publicado, renderização visual ou completude editorial dos PDFs |
| Referências | SPECs de infra-b3-ecossytem, gestor-ativos-brutos, gerar-insights e etl-fundamentos-cvm |

## 1. Estados e evidências

Estados padronizados: **PLANEJADO**, **EM ANDAMENTO**, **IMPLEMENTADO**, **VERIFICADO** e **BLOQUEADO**.

- PLANEJADO: requisito ou correção ainda não entregue.
- EM ANDAMENTO: implementação ou cobertura parcial.
- IMPLEMENTADO: comportamento identificado no código; aceite integral ainda não demonstrado.
- VERIFICADO: critério específico confirmado pela evidência registrada nesta SPEC.
- BLOQUEADO: dependência impeditiva explicitada.

Uma inspeção de código não comprova teste visual, publicação ou funcionamento do backend. Descontinuação é uma resolução, mantendo-se o ID original. As notas exibidas em Avaliação são avaliações editoriais datadas, não métricas automáticas nem notas desta revisão.

## 1A. Coordenação entre agentes (estado em 2026-10-04)

**Hub:** `infra-b3-ecossytem/SPEC.md` seção 1A — fila única, contratos, handoff e diário. Leia antes de codar; atualize lá ao pegar e ao fechar tarefa. Em conflito com seções antigas abaixo, vale o hub e esta seção.

- **Dono neste repo:** UI e proxy Express. Só consome HTTP do gestor (nunca banco). Se faltar campo, abrir tarefa para o gestor no hub em vez de contornar.
- **Contrato novo disponível no gestor:** `/ativos/{s}/fatores`, `/ativos/{s}/proventos-contabeis`, `/validacao/backtest?metodo=RANKING`, `/validacao/saude-dados` (13 fontes + `coberturaProventosContabeis`). O proxy já cobre o prefixo `/validacao` e `/ativos`.
- **Fila local:** LAC-FE-1..4 `IMPLEMENTADO` (2026-10-07; seção final). Sem V16 ou sem o gestor atualizado as telas mostram "sem dado ainda" (verificado: o gestor em execução ainda responde 404 em `/fatores` e `/proventos-contabeis` até ser reimplantado). Regra experimental sempre visível. Datas por `utils/dataHora.js`.
- **ISS-07, ISS-10, ISS-11** `IMPLEMENTADO/VERIFICADO` em 2026-10-07 (ver seção 8). `npm test` roda 11 suítes.
- **Arquivos não commitados de outra sessão:** `public/js/utils/recomendacaoBadge.js`, `public/js/contracts/` — não editar nem commitar sem o dono.

## 2. Produto e responsabilidades

Aplicação de acompanhamento e estudo do mercado, com cliente HTML/ES modules/Web Components e servidor Node/Express. Sem bundler no cliente; o servidor requer instalação das dependências do package.json.

O backend fornece cotações, fundamentos, decisões, monitoramento, comunicados e resultados de validação. O cliente também executa cálculos: detecta padrões de velas, calcula taxas-base, ajusta OHLC com o fator disponível, agrega resultados e intervalos do backtest e administra o progresso local dos planos. Portanto, não é apenas um visualizador sem regras.

Bootstrap 5.3.3 e lightweight-charts 4.2.0 são carregados por CDN. Há CSS próprio para navegação, painéis, estudos e leitor PDF; a descrição anterior de “duas regras CSS” não corresponde ao código atual.

### 2.1 Navegação efetiva

Fonte: public/js/router.js e public/js/main.js.

| Rota | Conteúdo |
|---|---|
| #/gestao | Padrão. Agrupa Consulta, Cadastro e Como funciona em abas internas |
| #/ativos | Tabela única de ativos (REQ-UX-8): chips Todos/Favoritos/Monitorados, busca e setor no link; `#/base`, `#/favoritos`, `#/monitorados` e `#/setores` abrem esta tela na visão correspondente |
| #/candles | Velas, padrões, notícias e comunicados relacionados |
| #/comunicados | Newsletter por semana e linha do tempo por ativo |
| #/noticias | Notícias |
| #/indices | Séries macroeconômicas |
| #/avaliacao | Avaliação editorial, saúde de dados, backtest e diário de sinais |
| #/assistente | Assistente de IA conversacional (`<chat-ia>`), sem ativo fixo; grupo "Assistente" no menu. Depende do serviço de IA e fica indisponível sem ele (TASK-CHAT-4) |
| #/estudos | Formações, Conhecimento, Orientações, Material didático e Referência |
| #/glossario | Glossário geral, acadêmico e detalhamento de padrões |
| #/padroes | Explicação dos padrões e limitações |
| #/formulas | Explicação das fórmulas |
| #/arquitetura | Arquitetura do ecossistema |
| #/design-codigo | Organização do código |

Rotas desconhecidas exibem Gestão. As antigas #/consulta, #/cadastro e #/metodologia não selecionam suas antigas páginas: não estão mais no mapa. As páginas correspondentes continuam usadas dentro de GestaoPage.

### 2.2 Consulta e monitoramento

Consulta e detalhes de Monitorados combinam cotação, histórico, decisão e fundamentos. Falha na decisão não deve impedir exibir os demais dados. SeletorDeAtivos consulta /ativos/registrados e mantém busca manual como alternativa.

Cadastro envia POST /ativos/registrar/{ativo}. Confirmação significa registro aceito para monitoramento; não significa que o worker já produziu insight. Periodicidade e processamento pertencem ao backend e não são fixados pelo cliente em 30 segundos.

GETs são consultas: a revisão do gestor de 2026-09-27 removeu gravação e publicação dos fallbacks de cotação, histórico e perfil. Este contrato depende da publicação dessa versão do backend; inspecionar o cliente não demonstra que o container em execução a utiliza.

### 2.3 Velas e avaliação

Até três meses, o gráfico usa o endpoint de histórico e permite base ajustada ou bruta. O ajuste depende de adjustedClose disponível. Períodos de seis meses até desde 2016 usam /ativos/{simbolo}/pregoes, com base bruta e intervalos dia/semana/mês; o seletor de preço ajustado não é oferecido nesse ramo.

Padrões e comparação com taxa-base são calculados no navegador. Comunicados são associados por data de entrega; associação temporal não prova causalidade nem horário intradiário.

Avaliação combina texto estático datado e três componentes que consultam API: SaudeDosDados, BacktestPlacar e DiarioDeSinais. O placar já renderiza intervalos de confiança. A seção editorial ainda diz que esses intervalos estão pendentes: divergência ISS-07.

## 3. Estudos, cursos e PDFs

### 3.1 Formações unifica planos e biblioteca

EstudosPage oferece duas visões dentro de **Formações**: **Planos de estudo** e **Biblioteca de cursos**. Não existem duas rotas independentes para cursos e planos.

Os planos incluem formação progressiva (iniciante, essencial, básico, intermediário, avançado e especialização) e percurso APIMEC (diagnóstico, CB, CG1, CT1, conduta e simulados). São orientações pedagógicas locais, sem promessa de certificação.

planosCursos.js relaciona cursos às competências de cada etapa. Todos os 29 cursos estão associados ao plano progressivo. O mesmo documento pode integrar mais de uma etapa. As referências de cursos do percurso APIMEC apontam para IDs existentes.

### 3.2 Catálogo e estrutura editorial

Inventário confirmado em 2026-09-27: **29 cursos, 71 módulos e 97 aulas documentais**. O catálogo reúne nove cursos-base e vinte documentos adicionais únicos; arquivos duplicados não precisam originar cursos duplicados.

| Entidade | Campos |
|---|---|
| Curso | id, titulo, descricao, autoria, nivel, paginas, ano, pdf, modulos; aviso quando cadastrado |
| Metadados opcionais | faculdade, instituto, curso, origem, instituicao |
| Módulo | titulo, aulas |
| Aula | titulo, paginas [início, fim], objetivo, topicos, atividade |

Autoria, faculdade, instituto, curso, origem, instituição e ano são exibidos no card e no detalhe quando preenchidos. Campo ausente não autoriza inferir instituição ou autor.

As aulas são roteiros de leitura: objetivos, tópicos, atividades e referências ao documento. Não constituem transcrição integral, extração automática contínua ou verificação independente da correção da fonte.

### 3.3 Busca e filtros

A biblioteca combina busca textual, dificuldade e tipo por interseção (AND), com normalização de caixa e acentos, contador e mensagem de nenhum resultado.

Valores atuais de dificuldade (`nivel`): Introdutório, Básico, Intermediário, Avançado e Especialização. A abrangência fica em `escopo`: cursos sem escopo explícito usam “Curso focal”; o curso abrangente usa “Formação completa”. A biblioteca filtra dificuldade, escopo e tipo por interseção.

Tipos editoriais: Fundamentos do mercado, Análise fundamentalista, Macroeconomia e juros, Derivativos e risco, Métodos quantitativos, Microestrutura e trading. O mapeamento está em tiposCursos.js; curso não mapeado recebe fundamentos por padrão, o que exige cuidado na manutenção.

Filtros não são persistidos em URL ou armazenamento e são recriados ao voltar ao catálogo. A busca geral não filtra o conteúdo interno de um curso aberto nem a seção Referência; o glossário possui sua própria busca.

### 3.4 Leitor PDF

Os PDFs renomeados estão em public/assets/pdfs e são servidos estaticamente. Abrir curso exibe módulos e aulas; “Ler PDF” carrega iframe sob demanda. A aula permite abrir a página inicial do intervalo referenciado.

abrirPdf limita a página à faixa 1..curso.paginas e usa #page=...&view=FitH. O reconhecimento dessa âncora depende do visualizador do navegador. Há link para nova aba e botão de fechar, que remove o iframe.

Aceite: arquivo existente, URL local correspondente, páginas referenciadas dentro do documento e alternativa de abertura. A suíte verifica existência do arquivo e limites declarados; não confere o número físico de páginas, a renderização do PDF ou a fidelidade da aula ao texto original.

### 3.5 Glossário

GlossarioPage combina verbetes gerais, **118 verbetes acadêmicos** em glossarioAcademico.js e padrões detalhados em glossarioPadroes.js. A busca inclui termo, sigla, definição, exemplo, aplicação e ressalva quando presentes.

Não há sincronização automática comprovada com infra/GLOSSARIO.md. O glossário local não deve ser descrito como simples espelho desse arquivo.

O teste garante a presença de cinco termos acadêmicos de referência. Isso não demonstra que todos os termos técnicos de todos os PDFs foram extraídos e reconciliados: esse aceite permanece EM ANDAMENTO (ISS-09).

### 3.6 Progresso e limites

ProgressoEstudos registra conclusão de **etapas dos planos** em localStorage, chave b3.estudos.progresso.v1. Não há conta, sincronização entre dispositivos ou gravação no backend. Armazenamento indisponível mantém estado em memória enquanto o componente existe.

Cursos documentais não registram conclusão de aulas ou progresso de leitura. “Continuar estudos” procura a próxima etapa não concluída do percurso, não a última página de um PDF. A interface informa essa diferença.

## 4. Componentes e fontes

| Área | Fonte principal |
|---|---|
| Servidor estático e notícias | server.js, proxy/noticiasApi.js |
| Resolução do backend e proxy | proxy/backendConfig.js, proxy/apiProxy.js |
| Navegação | public/js/router.js, main.js, components/AppHeader.js, BottomNav.js |
| Área integrada de estudos | public/js/pages/EstudosPage.js |
| Catálogo | public/js/estudos/cursos.js, cursosAvancados.js |
| Renderização e PDF | public/js/estudos/apresentacaoCursos.js |
| Planos e associação de cursos | public/js/estudos/conteudo.js, planosCursos.js, apresentacao.js |
| Tipos, busca e progresso | public/js/estudos/tiposCursos.js, texto.js, progresso.js |
| Glossário | public/js/pages/GlossarioPage.js, estudos/glossarioAcademico.js, glossarioPadroes.js |
| Avaliação e regras de apresentação | public/js/pages/AvaliacaoPage.js, components/BacktestPlacar.js, analise/backtest.js |
| Enum de recomendações | public/js/contracts/recomendacao.js, gerado pela infraestrutura |

## 5. Contratos consumidos

| Contrato | Uso e semântica |
|---|---|
| GET /ativos/robusto/{ativo} | Cotação em Consulta e Monitorados; sem comandar processamento |
| GET /ativos/registrados | Carteira, seletores e resumo no Cadastro |
| POST /ativos/registrar/{ativo} | Registro explícito para coleta; confirmação assíncrona |
| GET /analises/{simbolo}/analise | Decisão consolidada; janela definida pelo backend, não média obrigatória de todo o histórico |
| GET /analises/{simbolo}/fundamentos | Último ciclo e perfil de operação |
| GET /analises/{simbolo}/fundamentos-cvm | Dados CVM; nulos podem representar ausência deliberada |
| GET /api/v2/stocks/historical | Histórico curto; filtros enviados pelo cliente |
| GET /ativos/{simbolo}/pregoes | Histórico longo bruto e agregações |
| GET /empresas/{simbolo}/comunicados | Linha do tempo e documentos relacionados às velas |
| GET /comunicados/newsletter | Edição semanal da carteira |
| GET /validacao/diario | Diário e resultados por horizonte |
| GET /validacao/saude-dados | Idade e cobertura das fontes |
| GET /validacao/backtest | Placar da última execução |
| GET /setores | Agrupamento por setor |
| GET /indices-macro/{codigo} | Séries macroeconômicas |
| GET /noticias/favoritos?simbolos=A,B | Manchetes dos favoritos (CTR-PAI-NOT-01), servido pelo próprio `server.js` com cache e deduplicação; usado no card da tela inicial |
| POST /ia/chat | Assistente, resposta por SSE (CTR-IA-02): eventos `inicio`, `token`, `fontes`, `aviso`, `fim` ou `erro` (`INDISPONIVEL`, `LIMITE`, `FORA_DO_TEMA`) |
| GET /ia/ativo/{simbolo} | Pacote do ativo para o card "IA" da ficha (CTR-IA-03); qualquer falha vira "IA indisponível" e a opinião por regra continua |
| POST /ia/ativo/{simbolo}/leitura | Leitura em parágrafo, com origem e "em cache" (CTR-IA-04) |
| POST /ia/manchetes/resumo | Resumo em 3 tópicos das manchetes exibidas; link fora da lista enviada é descartado também no front |
| GET /ia/saude | Estado do serviço de IA |

O proxy cobre oito prefixos: /ativos, /analises, /api, /setores, /indices-macro, /empresas, /comunicados e /validacao. Notícias têm tratamento próprio em server.js.

O prefixo `/ia/*` é um proxy à parte (`proxy/iaProxy.js`), que não passa pelo gestor: remove `/ia` e encaminha ao serviço de IA em `IA_URL` (padrão `http://ia-opiniao:8000`), repassando SSE sem acumular e removendo `Origin`. `/ia/opiniao*` e `/ia/indexar` são bloqueados (403 `ROTA_NAO_PERMITIDA`): o painel não gera opinião nem reindexa. Serviço fora responde 503 `IA_INDISPONIVEL`. Chamadas usam a mesma origem do front.

pathRewrite recompõe o prefixo removido pelo Express e trata a raiz sem barra final adicional. O proxy remove Origin antes de encaminhar. Isso não implementa autenticação.

O enum canônico de recomendação vem de infra/contracts/insight.schema.json, distribuído pelo script sincronizar-contratos.mjs. O utilitário de badges o utiliza e mantém aliases legados. O cliente ainda não valida todos os DTOs ou schemaVersion em runtime; não declarar essa garantia.

## 6. Requisitos e aceite

| ID | Requisito e critério | Estado |
|---|---|---|
| REQ-01 | Consultar cotação, decisão e histórico; tolerar ausência de análise | IMPLEMENTADO |
| REQ-02 | Cadastro explícito via POST com confirmação | IMPLEMENTADO |
| REQ-03 | Layout responsivo; verificação visual pendente nesta revisão | IMPLEMENTADO |
| REQ-04 | Bootstrap com CSS complementar delimitado; substitui a antiga restrição “zero CSS” | IMPLEMENTADO |
| REQ-05 | Listar monitorados e decisões | IMPLEMENTADO |
| REQ-06 | Expandir detalhes reaproveitando componentes | IMPLEMENTADO |
| REQ-07 | Exibir fundamentos de um ciclo e metodologia | IMPLEMENTADO |
| REQ-08 | Newsletter e linha do tempo CVM com fontes | IMPLEMENTADO |
| REQ-09 | Associar comunicados a velas sem afirmar causalidade | VERIFICADO — regras puras; interação visual não verificada |
| REQ-10 | Avaliação editorial separada de saúde, backtest e diário consultados via API | IMPLEMENTADO — ressalva ISS-07 |
| REQ-11 | Formações reúne planos e biblioteca | IMPLEMENTADO — inspeção do componente |
| REQ-12 | 29 cursos com IDs únicos, módulos, aulas, PDFs e páginas declaradas válidas | VERIFICADO — tests/cursos.test.mjs |
| REQ-13 | Exibir metadados disponíveis sem inventar ausentes | IMPLEMENTADO — renderMetadados; fidelidade às fontes não revalidada |
| REQ-14 | Leitor PDF sob demanda, referência de página e nova aba | IMPLEMENTADO — teste visual pendente |
| REQ-15 | Busca combinada com dificuldade, escopo e tipo | IMPLEMENTADO — testes verificam atributos HTML e o estado em URL; interação visual conferida manualmente em 2026-10-07 (restauração de busca/visão por link), sem teste automatizado de clique |
| REQ-16 | Todos os cursos associados ao plano progressivo; IDs APIMEC válidos | VERIFICADO — tests/cursos.test.mjs |
| REQ-17 | Glossário acadêmico e reconciliação integral com PDFs | EM ANDAMENTO — 118 verbetes; completude não demonstrada |
| REQ-18 | Progresso por etapa local; cursos documentais sem progresso | IMPLEMENTADO |
| NFR-01 | Cliente sem build; servidor com npm install | IMPLEMENTADO |
| NFR-02 | Navegação hash adequada a hospedagem estática; WebView exige validação própria | IMPLEMENTADO |
| NFR-03 | Separar dados editoriais, apresentação, navegação e serviços | IMPLEMENTADO |
| NFR-04 | Backend primário/fallback e subida degradada | IMPLEMENTADO — limites ISS-10 |
| NFR-05 | Texto pt-BR/UTF-8 e escape de conteúdo editorial na renderização | IMPLEMENTADO — teste linguístico parcial |
| NFR-06 | Não depender do backend para ler cursos, PDFs e glossário local | IMPLEMENTADO — bibliotecas CDN ainda dependem de rede |

## 7. Revisão em confronto com a SPEC anterior

| Achado | Evidência | Resolução documental |
|---|---|---|
| Área de estudos inteira ausente | EstudosPage e estudos/*.js | Seção 3 e REQ-11..18 |
| Navegação descrita em rotas antigas | router.js e GestaoPage | Mapa de rotas efetivas, seção 2.1 |
| “Nenhuma regra no cliente” | detectorPadroes, taxaAcerto, backtest | Responsabilidades corrigidas |
| “Zero CSS / duas regras” | public/css/app.css, 115 linhas não vazias medidas | Bootstrap + CSS complementar |
| GET descrito como produtor de eventos | Alterações locais do gestor de 27/09 | Contrato de leitura; deployment não presumido |
| Todo preço descrito como ajustado | CandlesPage.buscarVelas e pregoesApi | Bases e limites por período explicitados |
| Glossário descrito como espelho da infra | GlossarioPage e glossarioAcademico | Composição local e ausência de sincronização |
| Cobertura descrita como detector e idioma apenas | package.json e tests/*.mjs | Inclui comunicados, diário e cursos; limites explicitados |
| Avaliação diz que IC está pendente | AvaliacaoPage versus BacktestPlacar | ISS-07; notas não recalculadas sem critério/evidência |

## 8. Problemas e backlog

| ID | Prioridade | Descrição / aceite para encerrar | Estado |
|---|---|---|---|
| ISS-01 | Histórico | Listagem de monitorados entregue | IMPLEMENTADO |
| ISS-02 | Média | Bootstrap e gráficos dependem de CDN; validar alternativa offline antes de prometer suporte offline | VERIFICADO (2026-10-08: Bootstrap 5.3.3 e lightweight-charts 4.2.0 copiados para `public/vendor/`; `public/index.html` usa os arquivos locais; `tests/dependenciasLocais.test.mjs` confirma existência e integridade; commit `60f72db`) |
| ISS-03 | Média | Testes de componentes/proxy e fluxos reais ainda parciais; adicionar cenários de navegação, filtros, PDF e armazenamento indisponível | VERIFICADO (2026-10-07: navegação e filtros em tests/fluxosInterface.test.mjs; PDF e armazenamento em tests/estudosFluxos.test.mjs; proxy HTTP em tests/proxyFluxos.test.mjs; suíte npm test aprovada) |
| ISS-04 | Histórico | Recomposição de prefixo no proxy implementada | IMPLEMENTADO |
| ISS-05 | Histórico | Remoção de Origin no proxy implementada | IMPLEMENTADO |
| ISS-06 | Média | SPEC não representava o produto; revisão confrontada com código e suíte em 27/09 | VERIFICADO |
| ISS-07 | Média | Texto de Avaliação desatualizado sobre IC e tarefas; reconciliar afirmações, mantendo notas justificadas por evidência | IMPLEMENTADO (2026-10-07; teste em tests/componentes.test.mjs impede a regressão do texto) |
| ISS-08 | Baixa | Formação completa misturava abrangência e dificuldade; `nivel` ficou apenas como dificuldade e `escopo` passou a representar abrangência no catálogo, detalhe e filtros | IMPLEMENTADO (2026-10-07; tests/cursos.test.mjs e tests/estudosFluxos.test.mjs) |
| ISS-09 | Média | Não há matriz PDF/página/termo/verbetes que comprove todos os termos técnicos; concluir reconciliação documental | EM ANDAMENTO |
| ISS-10 | Média | backendConfig usa http.get e aceita HTTP 2xx–4xx como saúde; HTTPS não suportado por esse cliente e 404 pode escolher destino inadequado; verificar com servidor local controlado | VERIFICADO (2026-10-07: só 2xx com `status` UP conta; http e https; tests/backend.test.mjs com servidor local) |
| ISS-11 | Baixa | Curso aberto e filtros não têm URL compartilhável/restauração; evolução opcional, não regressão de requisito atual | IMPLEMENTADO (2026-10-07: `#/estudos?secao=&visao=&curso=&q=&nivel=&tipo=`, validado contra o catálogo; PDF aberto não entra no link) |

| ID | Tarefa preservada / adicional | Estado |
|---|---|---|
| TASK-01 | Endpoint e tela de monitorados | IMPLEMENTADO |
| TASK-02 | Vendorizar dependências de interface para uso offline | VERIFICADO (2026-10-08: ver ISS-02; commit `60f72db`) |
| TASK-03 | Ampliar testes de componentes, progresso e proxy | VERIFICADO (2026-10-07: cenários de navegação, filtros combinados, abertura/fechamento de PDF, progresso sem armazenamento persistente e encaminhamento do proxy cobertos; npm test aprovado) |
| TASK-04 | Serviço front-end no compose da infraestrutura | IMPLEMENTADO |
| TASK-05 | Pausar/desativar monitoramento pela interface | VERIFICADO (2026-10-08: botão "Remover" na visão Favoritos com `title="Pausar a coleta intradiária"`; dispara `DELETE /ativos/favoritar/{s}`, que pausa o ciclo intradiário BRAPI; commit `ef60374`) |
| TASK-06 | Reescrever SPEC com cursos, PDFs, glossário, filtros e planos | VERIFICADO |
| TASK-07 | Atualizar narrativa da Avaliação com evidências atuais | IMPLEMENTADO (2026-10-07) |
| TASK-08 | Auditar completude e proveniência dos termos de todos os PDFs | EM ANDAMENTO |
| TASK-09 | Corrigir seleção/healthcheck do backend e cobrir HTTP/HTTPS e erros | VERIFICADO (2026-10-07) |

## 9. Verificação de 2026-09-27

Executado **npm test**, com sucesso: detector de padrões, nove casos de associação de comunicados, dez casos de diário, convenções de português e integridade do catálogo de cursos.

Inspeção adicional por importação dos dados confirmou 29 cursos, 71 módulos, 97 aulas, cinco valores atuais de dificuldade, dois valores de escopo e 118 verbetes acadêmicos. Estes números descrevem o catálogo nesta data e devem ser atualizados quando ele mudar.

O teste de cursos verifica existência dos PDFs, IDs únicos, aulas preenchidas e limites de páginas declarados, associação ao plano progressivo, referências APIMEC, atributos dos filtros e cinco termos acadêmicos. Não verifica toda a renderização, todos os metadados contra os PDFs, número físico de páginas, operação do iframe ou exaustividade do glossário.

Esta revisão atualizou a documentação. Não realizou deploy, teste visual de navegador ou alteração de notas da página Avaliação. As alterações prévias em recomendacaoBadge.js e contracts/recomendacao.js pertencem à implementação integrada iniciada antes desta revisão.

## Plano LAC: 9 lacunas de assertividade (proposta de 30-09-2026, EM AVALIAÇÃO)

Plano completo em `infra-b3-ecossytem/SPEC.md`, seção Plano LAC. O painel só exibe; consome os endpoints LAC-GES-1..4 do gestor.

| ID | Tarefa | Endpoint |
|---|---|---|
| LAC-FE-1 | Aba Avaliação: placar por ranking ao lado do placar por classes. Por versão de regra, correlação de ranking com intervalo, barras por quintil e janelas sucessivas lado a lado. A hipótese registrada antes da execução aparece junto do resultado | `/validacao/backtest?metodo=RANKING` |
| LAC-FE-2 | Ficha do ativo: cartão "Fatores" com percentil no universo e no setor, agrupado por família (preço, qualidade, valor, evento), com a data do cálculo | `/ativos/{s}/fatores` |
| LAC-FE-3 | Ficha do ativo: proventos por período (DVA) junto dos eventos, marcando a origem de cada valor | `/ativos/{s}/proventos-contabeis` |
| LAC-FE-4 | Saúde dos dados: novas fontes (eventos corporativos, fatores, cobertura de proventos) | `/validacao/saude-dados` |

- Datas pelo `utils/dataHora.js` (Brasília, dd-MM-yyyy).
- Toda tela de recomendação mantém o aviso de regra **experimental** até uma versão ser promovida pelos critérios de LAC-INS-9 (gerar-insights).
- Aceite: `npm test` com os novos formatadores; telas com o banco sem a V16 mostram "sem dado ainda" em vez de erro.

### Estado das tarefas LAC-FE (2026-10-07)

| ID | Estado | Onde |
|---|---|---|
| LAC-FE-1 | IMPLEMENTADO | `components/PlacarRanking.js` na aba Avaliação: hipótese, IC da correlação, quintis, versão da regra |
| LAC-FE-2 | IMPLEMENTADO | `components/ficha/FatoresAtivo.js`: percentil no universo e no setor por família, com data |
| LAC-FE-3 | IMPLEMENTADO | `components/ficha/ProventosContabeis.js`: JCP/dividendos por período, origem marcada, ausente = "—" |
| LAC-FE-4 | IMPLEMENTADO | `SaudeDosDados.js`: cartão de cobertura de proventos; as fontes novas aparecem na tabela de fontes |

Regras puras em `analise/lacunas.js` (testes em `tests/lacunas.test.mjs`, renderização em `tests/componentes.test.mjs`). Falta: validar com dados reais depois do backfill (LAC-INFRA-3) e reimplantar o gestor com LAC-GES.

## Melhorias de experiência e listagem (proposta de 2026-10-07)

Origem: revisão visual do painel em 2026-10-07. Princípio: **juntar o que é coeso** (tudo que descreve "o ativo" ou "a saúde dos dados" na mesma superfície) e **explicar o estado** (vazio, lento, atrasado) em vez de deixar spinner ou tela em branco. Nada aqui muda regra de negócio; todo rótulo de sinal segue com o aviso de regra **experimental**.

### Diagnóstico (2026-10-07)

- Menu superior com 10 itens e `BottomNav` com os mesmos 10. Quatro listas do mesmo universo de ativos (Base, Favoritos, Setores e a rota antiga Monitorados).
- Monitorados afirma "reprocessado a cada 30 segundos", o que não vale desde o monitoramento em camadas (V13): favorito atualiza no ciclo intradiário (mínimo 900 s, 10:05–17:35); o restante vem do COTAHIST.
- Telas ficam em spinner sem tempo limite quando o gestor não responde.
- Fatores e proventos aparecem só como números; tabelas largas rolam na horizontal no celular e perdem o cabeçalho ao rolar.
- A abertura do painel é uma busca (Gestão), não um resumo do que mudou.

### Requisitos de experiência

| ID | Requisito | Fase | Estado |
|---|---|---|---|
| REQ-UX-1 | Estados que explicam: tempo limite nas chamadas HTTP, spinner que avisa quando demora e estado vazio com causa e próximo passo | 1 | IMPLEMENTADO (2026-10-07) |
| REQ-UX-2 | Selos de estado únicos (Em dia, Atrasada, Erro, Experimental, Sem dado) e formatadores numéricos pt-BR compartilhados | 1 | IMPLEMENTADO (2026-10-07) |
| REQ-UX-3 | Corrigir textos de periodicidade desatualizados (Monitorados, Favoritos) | 1 | IMPLEMENTADO (2026-10-07) |
| REQ-UX-4 | Fatores com barra de percentil (cor + texto, nunca só cor); proventos com gráfico de colunas empilhadas JCP/dividendos | 2 | IMPLEMENTADO (2026-10-07) |
| REQ-UX-5 | Tabelas com cabeçalho fixo ao rolar e modo cartão em tela estreita (`data-label`) | 2 | IMPLEMENTADO (2026-10-07), aplicado em Base, Saúde dos dados, Fatores, Proventos, Favoritos e Monitorados (verificado em 375 px) |
| REQ-UX-6 | Menu em 5 grupos (Início, Ativos, Mercado, Avaliação, Estudos) a partir de uma única definição, no topo e na barra inferior | 5 | IMPLEMENTADO (2026-10-07) |
| REQ-UX-7 | Página Início: saúde dos dados, comunicados da semana, favoritos com variação e fontes fora do prazo; cada bloco falha sozinho | 5 | IMPLEMENTADO (2026-10-07) |
| REQ-UX-8 | Tabela única de ativos (Base + Favoritos + Setores + Monitorados) com chips de filtro, sparkline, sinal e último comunicado | 3 | IMPLEMENTADO (2026-10-07, TASK-UX-6): `#/ativos` com uma chamada por página a `GET /painel/ativos`; linha com fechamento oficial, variação, sparkline de 20 pregões, sinal (rótulo da ficha + aviso de regra experimental e versão), último comunicado, selos e favoritar/remover; filtros no link (`analise/filtrosBase.js`); BasePage, FavoritosPage, AtivosMonitoradosPage e SetoresPage removidas; tests/listagemAtivos.test.mjs. Validado no navegador com dados reais via gestor de teste; falta reimplantar o gestor |
| REQ-UX-9 | Ficha do ativo em abas (Resumo, Fundamentos, Fatores e proventos, Comunicados), aba no link (`?aba=`), teclado (setas/Home/End) e barra de abas fixa | 4 | IMPLEMENTADO (2026-10-07). O gráfico de preço fica no cabeçalho da ficha, com link para Velas e padrões; comunicados marcados no gráfico seguem só na tela de Velas (embutir a tela de Velas na ficha fica PLANEJADO) |
| REQ-UX-10 | Tema escuro (Bootstrap 5.3 `data-bs-theme`) | — | IMPLEMENTADO (2026-10-07: `data-bs-theme` no `<html>`, alternador no topo e na barra inferior, preferência local `b3.tema.v1`; tests/tema.test.mjs) |

### Tarefas

| ID | Tarefa | Depende | Estado |
|---|---|---|---|
| TASK-UX-1 | `httpClient` com tempo limite; `<loading-spinner>` com aviso; `<estado-vazio>`; `<selo-estado>`; `utils/numero.js` | — | IMPLEMENTADO |
| TASK-UX-2 | Barras de percentil, gráfico de proventos (`analise/graficoProventos.js`), CSS de tabela fixa/cartões | TASK-UX-1 | IMPLEMENTADO |
| TASK-UX-3 | `navegacao.js` (definição única) + `AppHeader`/`BottomNav` em grupos | — | IMPLEMENTADO |
| TASK-UX-4 | `InicioPage` (`#/inicio`, nova rota padrão) | TASK-UX-1, TASK-UX-3 | IMPLEMENTADO |
| TASK-UX-5 | Endpoint de listagem de ativos no gestor (preço, variação, sinal, último comunicado, favorito, setor, selos) | — | IMPLEMENTADO (2026-10-07 no gestor, commit `bef0ab0`: `GET /painel/ativos`, paginado e sem efeito colateral; contrato registrado no hub do gestor) |
| TASK-UX-6 | Tabela única de ativos e remoção das listas redundantes | TASK-UX-5 | IMPLEMENTADO (2026-10-07; ver REQ-UX-8) |
| TASK-UX-7 | Ficha em abas (`analise/abasFicha.js`, `ComunicadosDoAtivo`, painéis lazy) | — | IMPLEMENTADO |
| TASK-UX-8 | Filtros da Base no link (`analise/filtrosBase.js`) | — | IMPLEMENTADO |
| TASK-OPI-1 | Cartão "Opinião por horizonte" na aba Resumo da ficha (`components/ficha/OpiniaoHorizontes.js`, `GET /ativos/{s}/opiniao`): curto/médio/longo lado a lado; rótulos neutros com cor e texto sempre juntos (positivo verde, negativo vermelho, neutro âmbar, sem base cinza; risco verde/âmbar/vermelho); selo Experimental e aviso sempre; justificativa cita o dado, "o que invalida", dados ausentes, pregão e origem (modelo local x regra); estado vazio explica que a geração roda após os insights diários; tests/componentes.test.mjs | gestor TASK-OPI-1 | IMPLEMENTADO (2026-10-07) |

### Aceite

- Gestor fora do ar: nenhuma tela fica em spinner indefinido; em até 12 s aparece a causa provável e o caminho para Saúde dos dados.
- Cada cor de estado tem texto equivalente; datas por `utils/dataHora.js`, números por `utils/numero.js`.
- Menu: nenhuma página deixa de ser alcançável; as rotas antigas (`#/base`, `#/favoritos` etc.) continuam válidas.
- Em largura de 375 px nenhuma tabela das fases 1–2 exige rolagem horizontal.
- `npm test` cobre os formatadores, o gráfico de proventos, a definição de navegação e a renderização dos blocos do Início.

---

## Melhorias com dados do ETL (proposta de 2026-10-07)

Origem: tasks E10–E17 do `etl-fundamentos-cvm` entregaram campos e tabelas que ainda não aparecem no painel. As melhorias abaixo consomem esses dados via gestor. **Regra de coordenação:** nenhuma feature deste bloco vai ao ar antes de o gestor expor o campo/endpoint correspondente; se o campo não aparecer na resposta, o componente renderiza "—" sem erro.

### Dependências no gestor

Algumas destas melhorias exigem que o gestor exponha campos ainda não declarados nos contratos atuais. As tarefas correspondentes devem ser abertas no hub (`infra-b3-ecossytem/SPEC.md` seção 1A) antes de começar a implementação do front.

| Campo ETL novo | Tabela de origem | Endpoint gestor sugerido | Situação |
|---|---|---|---|
| `situacao_registro`, `uf_municipio` | `cvm_empresa` | Existente: `/analises/{s}/fundamentos-cvm` (ampliar DTO) | PLANEJADO no gestor |
| `numero_negocios` | `cotacao_b3_diaria` | Existente: `/ativos/{s}/pregoes` (verificar se já exposto) | A verificar |
| `fco_bruto` | `indicador_fundamentalista` | Existente: `/analises/{s}/fundamentos-cvm` (verificar se já exposto) | A verificar |
| `qt_acao_ordinaria`, `qt_acao_preferencial` | `cvm_composicao_capital` | Existente ou novo: `/ativos/{s}/composicao-capital` | PLANEJADO no gestor |
| BDI, `data_vencimento`, `preco_exercicio` | `opcao_b3_diaria` | Novo: `/ativos/{s}/opcoes?vencimento=YYYYMM` | PLANEJADO no gestor |

### Requisitos

| ID | Requisito | Fase | Estado |
|---|---|---|---|
| REQ-ETL-1 | Exibir badge de status CVM (`situacao_registro`) no card e na ficha do ativo; empresa com registro cancelado ou suspenso recebe alerta visual; `uf_municipio` alimenta filtro de estado em Base | 1 | IMPLEMENTADO (2026-10-08): selo "CVM: ativo/suspenso/cancelado" e faixa de alerta (suspenso e cancelado) na ficha, selo na tabela de ativos e filtro de UF; `analise/statusCvm.js`, `tests/etlFicha.test.mjs`. Pendência do gestor: `GET /painel/ativos` ignora o parâmetro `uf` (a tabela de ativos retorna 264 com ou sem UF; `/base/ativos?uf=SP` filtra: 137) |
| REQ-ETL-2 | Exibir ticket médio diário (= `volume_financeiro ÷ numero_negocios`) na série histórica e no resumo da ficha; valor ausente quando `numero_negocios = 0`; tooltip explica a métrica | 1 | IMPLEMENTADO (2026-10-08): cartão "Últimos pregões e ticket médio" no Resumo da ficha (tabela dos 10 últimos, média ponderada do período e sparkline), "—" sem negócios, tooltip da métrica. Enquanto o gestor não expõe `volumeFinanceiro` em `/pregoes` o ticket diário é estimado por quantidade × fechamento e marcado com "≈"; semana/mês sem volume financeiro ficam em "—" |
| REQ-ETL-3 | Exibir FCO bruto × FCO líquido lado a lado na aba Fundamentos da ficha; disponível apenas para empresas com DFC método direto; campo ausente mostra "—" sem ocultar o FCO líquido | 2 | IMPLEMENTADO (2026-10-08): FCO bruto × líquido na aba Fundamentos (bruto em laranja, líquido em verde), delta em R$ e em % da receita líquida quando há os dois, "—" no que faltar sem esconder o líquido, nota de que o bruto só existe com DFC método direto; `analise/fluxoCaixa.js`. Verificado ao vivo (WEGE3 e OMGE3 só têm o líquido no período mais recente) |
| REQ-ETL-4 | Exibir composição ON × PN na ficha do ativo (gráfico de rosca ou barras empilhadas); zero aceitável para empresa sem PN; fonte e competência exibidas abaixo do gráfico | 2 | IMPLEMENTADO (2026-10-08) |
| REQ-ETL-5 | Tela de opções por ativo (`#/candles` ou nova rota `#/opcoes`): cadeia calls × puts agrupada por data de vencimento, último preço, volume e strike; linha ATM destacada; filtro por série de vencimento; reprocessar o mesmo arquivo não duplica registros | 3 | IMPLEMENTADO (2026-10-08; ver TASK-ETL-5) |

### Tarefas

| ID | Tarefa | Depende | Estado |
|---|---|---|---|
| TASK-ETL-1 | **Badge status CVM:** `<selo-status-cvm>` que lê `situacao_registro` do DTO de fundamentos-cvm; variantes ATIVO (verde), SUSPENSO (amarelo), CANCELADO (vermelho) e desconhecido (neutro); CSS via variáveis de `<selo-estado>` já existente; filtro de `uf_municipio` em Base | Gestor expor campo no DTO | IMPLEMENTADO (2026-10-08) |
| TASK-ETL-2 | **Ticket médio:** `calcularTicketMedio(vf, nn)` em `analise/pregoes.js` (retorna null quando nn ≤ 0); coluna `Ticket médio` na tabela de pregões; sparkline no resumo da ficha; teste unitário puro | Gestor expor `numero_negocios` em `/pregoes` | IMPLEMENTADO (2026-10-08; falta `volumeFinanceiro` no gestor para sair do "≈") |
| TASK-ETL-3 | **FCO bruto × líquido:** par de barras horizontais em `components/ficha/FluxoCaixa.js`; `fco_bruto` e `fluxo_caixa_operacional` do DTO fundamentos-cvm; barra laranja (bruto) + verde (líquido); delta em R$ e % da receita líquida abaixo; exibido só quando ao menos um dos dois for não nulo | Gestor expor `fco_bruto` no DTO | IMPLEMENTADO (2026-10-08) |
| TASK-ETL-4 | **Composição ON × PN:** gráfico de rosca em `components/ficha/ComposicaoCapital.js` (Canvas API ou SVG inline); legenda com `qt_acao_ordinaria`, `qt_acao_preferencial` e total ex-tesouraria; competência da referência exibida; teste de renderização com dados mockados | Gestor expor campos em `/composicao-capital` ou fundamentos-cvm | IMPLEMENTADO (2026-10-08; rosca SVG em ComposicaoCapital.js, testada em etlFicha.test.mjs) |
| TASK-ETL-5 | **Painel de opções:** nova rota `#/opcoes?simbolo=PETR4&vencimento=202512`; `components/OpcoesPainel.js` com tabela calls/puts pela chain do vencimento selecionado; células coloridas por moneyness (ITM/ATM/OTM); seletor de série de vencimento disponível; modo cartão em 375 px; `<estado-vazio>` quando o ativo não tem opções | Gestor novo endpoint `/ativos/{s}/opcoes` | VERIFICADO (2026-10-08: `pages/OpcaoPage.js` em `#/opcoes/{ativo}`; `components/OpcoesPainel.js` com tabela CALL/PUT e badge ITM/ATM/OTM; seletor de vencimento; item "Opções" no grupo Mercado de `navegacao.js`; rota `#/opcoes` e subrotas `#/opcoes/*` em `router.js`; gestor `OpcaoController` + `RepositorioOpcoes` em `feature-teste`; commits `be8f3a0` (frontend) e `fea7349` (gestor)) |

### Plano de execução

**Fase 1 — Enriquecer o que já está na tela (baixo risco)**

TASK-ETL-1 e TASK-ETL-2. Nenhuma nova rota no frontend. O badge entra no card de Monitorados e na ficha; o ticket médio entra na tabela de pregões existente. Custo estimado: 1 dia cada, após o gestor expor os campos.

**Fase 2 — Novas seções na ficha do ativo**

TASK-ETL-3 e TASK-ETL-4. Dois componentes novos adicionados à aba Fundamentos da ficha. Dependem de dois campos que o gestor precisa ampliar no DTO. Custo estimado: 1–2 dias cada.

**Fase 3 — Nova superfície de dados**

TASK-ETL-5. Única tarefa que cria uma rota nova. Requer endpoint dedicado no gestor. Custo estimado: 2–3 dias (frontend) + gestor.

### Aceite

- `REQ-ETL-1`: empresa com `situacao_registro = 'CANCELADO'` exibe badge vermelho na ficha; empresa sem o campo não exibe badge.
- `REQ-ETL-2`: PETR4 com `numero_negocios > 0` exibe ticket médio formatado em R$; linha com `numero_negocios = 0` exibe "—".
- `REQ-ETL-3`: empresa com DFC direta exibe as duas barras; empresa com DFC indireta exibe apenas FCO líquido.
- `REQ-ETL-4`: ITUB4 exibe rosca ON × PN com dois setores distintos; WEGE3 exibe rosca com PN = 0 (empresa sem ações preferenciais).
- `REQ-ETL-5`: PETRD... (call de PETR4) aparece na cadeia com `data_vencimento` e `preco_exercicio` não nulos; linha ATM destacada; recarregar a tela não duplica linhas.
- `npm test` cobre `calcularTicketMedio` e a renderização dos novos componentes com dados mockados.

---

## Gráfico de proventos legível e ligado à tabela (2026-10-07)

**Motivo.** Com o backfill histórico da DVA (ETL, 2010–2026), a ficha passou a ter ~60 períodos por empresa (ALOS3: 63 linhas). O gráfico de REQ-UX-4 desenhava uma coluna por período com o valor em cima e o rótulo embaixo em 520 px: os textos se atropelavam, "R$ 0,00" aparecia em cada trimestre sem provento, trimestres e anos ficavam lado a lado como se fossem comparáveis, e o hover era só o `<title>` nativo, sem relação com a tabela.

| ID | Requisito | Estado |
|---|---|---|
| REQ-UX-11 | Proventos por período: visão **Anual** (padrão, um exercício por coluna) e **Trimestral** (últimos 12 períodos); eixo Y com grade em 0, metade e teto "redondo"; sem valor escrito por coluna; rótulos do eixo X espaçados para não encostar (sempre o último); ano sem DFP marcado `*` (parcial); ano sem nenhum valor como lacuna tracejada (ausente, não zero). Passar o mouse ou focar uma coluna destaca a coluna (as outras esmaecem, linha-guia), mostra a dica (JCP, dividendos, total; no trimestral também por ação e entrega) e destaca e rola **só a tabela** até as linhas do período (no anual, todas as do exercício); passar o mouse numa linha destaca a coluna; clique/toque fixa o destaque (celular); setas ←/→ navegam entre colunas (roving tabindex, `aria-live` na dica), Esc solta | IMPLEMENTADO (2026-10-07) |

| ID | Tarefa | Estado |
|---|---|---|
| TASK-UX-9 | `analise/graficoProventos.js` (puro): `pontosAnuais`, `pontosDoModo`, `chaveDaLinha`, `tetoDoEixo`, `indicesDosRotulos`, `svgProventos(proventos, modo)` com `data-chave` e alvo invisível da altura toda por coluna; `components/ficha/ProventosContabeis.js`: seletor Anual/Trimestral, legenda fora do SVG, dica posicionada no cartão, um listener delegado (mouseover/focusin/click/keydown) que alterna `.ativo` no gráfico e nas linhas (`tr[data-ano][data-fim]`); CSS em `app.css` (seção REQ-UX-11) com variáveis do Bootstrap (claro e escuro); `tests/graficoProventos.test.mjs` (10 casos) no `npm test` | IMPLEMENTADO (2026-10-07) |

**Decisões.**
- O SVG passa a ter `role="list"` (antes `img`): `img` esconde os filhos da acessibilidade e impediria navegar pelas colunas pelo teclado. O teste antigo em `tests/componentes.test.mjs` foi ajustado.
- Agregação anual pelo ano civil do fim do período. Os períodos já chegam isolados do ETL (o 4º trimestre é DFP − 3º ITR), então a soma não conta nada duas vezes. Quem fecha o exercício fora de dezembro (RAIZ4, CAML3) só tem DFP na DVA e aparece com um valor por ano.
- A rolagem da tabela ajusta o `scrollTop` do contêiner `.tabela-rolavel`, sem `scrollIntoView`, para nunca mover a página; ela só acontece quando o destaque vem do gráfico (passar o mouse na tabela não a faz pular).

**Aceite (verificado em 2026-10-07 no navegador, ALOS3, tema escuro, com o gestor real).**
- Anual com 17 colunas (2010–2026), rótulos legíveis e lacunas visíveis; passar o mouse em 2013 destaca as 4 linhas do exercício e a tabela rola até elas.
- Trimestral mostra exatamente 12 colunas (2023-09 a 2026-06); passar o mouse na linha de 03/2026 destaca a coluna 2026-03-31 e a dica mostra "Por ação: R$ 0,2896 · Entregue em 07-05-2026".
- Com o foco na coluna mais recente, a seta ← leva o foco ao período anterior.
- `npm test` verde.

---

## Plano GEM: manchetes dos favoritos, assistente e card IA (2026-10-08)

**Status:** PLANEJADO · **Contexto e decisões:** `insider-ia-b3-ecossytem/SPEC.md` seção 13 (DEC-IA-06..09) · **Coordenação:** hub, linhas `GEM-*`.

**Escopo deste repositório (grupo C).** Só `server.js`, `proxy/**`, `public/**`, `tests/**`, `package.json` (lista do `npm test`) e este SPEC. Não editar `insider-ia`, gestor, worker nem infra (a entrada do painel na rede `ia` e a variável `IA_URL` são do `compose.ia.yml` do insider-ia, TASK-IA-27). Os contratos consumidos são o **CTR-IA-02/03/04** e `POST /ia/manchetes/resumo` (insider-ia 13.3 e TASK-IA-38); até o serviço publicar, os testes usam fixtures desses contratos.

**Duas trilhas paralelas dentro do grupo C.** Trilha **NOT** (manchetes, não depende do serviço de IA) e trilha **CHAT** (assistente e card). Arquivos compartilhados pelas duas — `server.js` (uma linha de registro de rota cada), `package.json` (uma entrada no `npm test` cada) e `public/css/app.css` (seção própria marcada com o ID da tarefa) — recebem mudanças mínimas, e quem commitar depois faz rebase antes do push.

### Contrato próprio: `GET /noticias/favoritos` (CTR-PAI-NOT-01, servido pelo `server.js`)

Entrada: `?simbolos=PETR4,WEGE3` (1 a 12 tickers, `^[A-Z]{4}[0-9]{1,2}$`; acima de 12 usa os 12 primeiros; inválido ⇒ 400). Opcional `&nomes=Petrobras,WEG` na mesma ordem, para refinar a busca.

Saída 200:
```json
{ "geradoEm": "2026-10-08T09:00:00-03:00", "desatualizado": false,
  "manchetes": [ { "titulo": "...", "link": "https://...", "fonte": "Valor", "publicadoEm": "2026-10-08T08:10:00-03:00",
                   "simbolos": ["PETR4", "PRIO3"] } ],
  "falhas": ["WEGE3"] }
```
- No máximo 30 manchetes, só dos últimos 7 dias, da mais nova para a mais antiga.
- Mesma matéria em vários tickers aparece uma vez, com todos os `simbolos`.
- `falhas` lista os tickers cuja busca falhou e não tinham cache. `desatualizado = true` quando alguma manchete veio de cache vencido por erro do Google.

### Trilha NOT — manchetes dos favoritos na tela inicial

| ID | Tarefa | Arquivos | Depende | Aceite | Status |
|---|---|---|---|---|---|
| TASK-NOT-1 | **Agregador** `noticiasFavoritos(simbolos, {buscar, agora})` com `buscar` injetável: no máximo 3 buscas em paralelo; cache em memória por ticker de 15 min; após erro, 30 min sem tentar de novo aquele ticker (devolve o cache vencido marcado `desatualizado`); duplicata = mesmo link **ou** títulos normalizados (minúsculas, sem acento/pontuação, sem " - Fonte" no fim) com similaridade de Jaccard por palavras ≥ 0,85; ordena por `publicadoEm` desc; corta 7 dias e 30 itens. Rota `GET /noticias/favoritos` no `server.js` (CTR-PAI-NOT-01) | `proxy/noticiasFavoritos.js`, `server.js` | — | Testes com `buscar` e relógio falsos: paralelismo ≤ 3, cache 15 min, pausa de 30 min após erro, junção de tickers, duplicata por título, corte de 7 dias/30 itens, 400 para ticker inválido | PLANEJADO |
| TASK-NOT-2 | **Busca mais precisa:** `buscarNoticias(ticker, { nome })` pesquisa `"TICKER"` entre aspas e, com nome, `"TICKER" OR "Nome"`; `publicadoEm` convertido para ISO; `/noticias/:ticker` continua igual para a `NoticiasPage` | `proxy/noticiasApi.js` | — | Teste da URL montada (com e sem nome, nome com acento codificado) e da conversão de data do `pubDate` | PLANEJADO |
| TASK-NOT-3 | **Card "Manchetes dos favoritos"** no topo da `InicioPage` (antes de "Saúde dos dados", largura total): lista favoritos via `listarFavoritos()`, chama `buscarManchetesFavoritos(simbolos, nomes)`; cada item com selo do ticker, título como link (`target="_blank" rel="noopener noreferrer"`), veículo e "há X h"; chips de filtro por ticker; 8 itens visíveis e botão "mais"; estados: carregando, sem favoritos ("Marque ativos com ★ para ver as manchetes aqui" + link `#/ativos?visao=favoritos`), tudo falhou ("Fontes de notícias indisponíveis agora"), `desatualizado` (selo "pode estar desatualizado") | `public/js/api/noticiasApi.js`, `public/js/components/inicio/ManchetesFavoritos.js`, `public/js/pages/InicioPage.js` | NOT-1 | Teste da função de renderização pura (`htmlManchetes(dados, filtro)`): escape de título/fonte (`<script>` vira texto), filtro por ticker, "mais N", cada estado | PLANEJADO |
| TASK-NOT-4 | **Comunicado oficial em destaque:** no mesmo card, acima das manchetes, comunicados da CVM do dia útil mais recente dos favoritos (já carregados pela newsletter da `InicioPage`), com selo "Oficial – CVM"; nunca misturados com a mídia | `public/js/components/inicio/ManchetesFavoritos.js` | NOT-3 | Teste: comunicado aparece separado e com o selo; sem comunicado, a faixa some | PLANEJADO |
| TASK-NOT-5 | **Resumo do dia por IA (opcional):** botão "Resumir com IA" no card chama `POST /ia/manchetes/resumo` (TASK-IA-38) com as manchetes já exibidas; mostra 3 tópicos com os links citados; sem serviço ou cota ⇒ "Resumo indisponível agora" e o card segue funcionando | `public/js/api/iaApi.js`, `public/js/components/inicio/ManchetesFavoritos.js` | NOT-3, CHAT-1, IA-38 | Teste com fixture do contrato: tópicos renderizados com links; link fora da lista enviada é descartado no front também | PLANEJADO |
| TASK-NOT-6 | **Testes no `npm test`:** `tests/noticiasFavoritos.test.mjs` (NOT-1/2) e `tests/manchetesFavoritos.test.mjs` (NOT-3..5) | `tests/*.test.mjs`, `package.json` | NOT-1..5 | `npm test` verde | PLANEJADO |

### Trilha CHAT — assistente conversacional e card IA na ficha

| ID | Tarefa | Arquivos | Depende | Aceite | Status |
|---|---|---|---|---|---|
| TASK-CHAT-1 | **Proxy `/ia/*`** para `IA_URL` (padrão `http://ia-opiniao:8000`) com `http-proxy-middleware`: sem buffer de resposta (SSE passa em tempo real), timeout 120 s, remove `Origin`; prefixo `/ia/*` com o `/ia` removido ao encaminhar (`/ia/chat` → `/chat`, `/ia/ativo/WEGE3` → `/ativo/WEGE3`; insider-ia 13.3); `/ia/opiniao*` e `/ia/indexar` bloqueados (403: o painel não gera opinião nem reindexa); serviço fora ⇒ 503 `{ "erro": "IA_INDISPONIVEL" }`. Registro no `server.js` | `proxy/iaProxy.js`, `server.js` | — | Teste no estilo de `tests/proxyFluxos.test.mjs`: reescrita de caminho, 403 em `/ia/opiniao/ativo`, cabeçalho `Origin` removido, 503 com destino fora, `text/event-stream` repassado sem acumular | IMPLEMENTADO (Sessão 01, 2026-10-08): `proxy/iaProxy.js` + `tests/iaProxy.test.mjs` no `npm test`; falta ver com o serviço real (depende de TASK-IA-27 pôr o painel na rede `ia`) |
| TASK-CHAT-2 | **Cliente de IA:** `lerEventosSSE(texto)` puro (buffer parcial entre pedaços, `event:`/`data:`, linhas em branco) e `conversar({sessaoId, mensagem, simbolo}, {aoEvento, signal})` via `fetch` + `ReadableStream`; `buscarPacoteAtivo(s)` (`GET /ia/ativo/{s}`, CTR-IA-03), `gerarLeitura(s)` (`POST /ia/ativo/{s}/leitura`, CTR-IA-04), `resumirManchetes(lista)` (`POST /ia/manchetes/resumo`); `conversar` usa `POST /ia/chat` | `public/js/analise/sse.js`, `public/js/api/iaApi.js` | — | Testes do parser: evento partido em dois pedaços, vários eventos num pedaço, `data` JSON inválido vira evento `erro` local | IMPLEMENTADO (Sessão 01, 2026-10-08): `analise/sse.js` (`criarLeitorSSE`, `lerEventosSSE`) e `api/iaApi.js`; testes adiados por decisão do usuário |
| TASK-CHAT-3 | **Componente `<chat-ia simbolo? contexto?>`:** balões do usuário (direita) e da IA (esquerda); texto da IA inserido como **texto** (nunca `innerHTML` do conteúdo do modelo); indicador "digitando"; botão "Parar" (aborta o `fetch`); etiquetas de `fontes`; `aviso` em nota pequena sob o balão; erros por código do CTR-IA-02 (`INDISPONIVEL` ⇒ "Assistente indisponível até HH:MM" com `tentar_apos`; `LIMITE`; `FORA_DO_TEMA`); sugestões de perguntas como chips; rodapé com aviso experimental e o modelo do evento `inicio`; `Enter` envia, `Shift+Enter` quebra linha; `aria-live="polite"` na lista; `sessao_id` (UUID) e histórico em `sessionStorage` por chave `chat:<simbolo|geral>`, protegidos por try/catch; CSS dos balões (claro e escuro) em `app.css`, seção "CHAT-3" | `public/js/components/ia/ChatIa.js`, `public/css/app.css` | CHAT-2 | Testes: `<script>` na resposta aparece como texto; sequência `inicio→token→fim` monta um balão; `erro INDISPONIVEL` mostra horário; sem `sessionStorage` o componente funciona | IMPLEMENTADO (Sessão 01, 2026-10-08): `components/ia/ChatIa.js` + CSS "CHAT-3" em `app.css`; testes adiados por decisão do usuário; falta ver com o serviço real |
| TASK-CHAT-4 | **Tela "Assistente"** `#/assistente`: item no menu, `<chat-ia>` sem símbolo, sugestões gerais ("O que é P/L?", "Como ler o score de confiança?", "O que mudou na WEGE3 esta semana?"), texto explicando o que o assistente faz e não faz (não recomenda compra/venda; usa só dados públicos) | `public/js/pages/AssistentePage.js`, `public/js/router.js`, `public/js/navegacao.js`, `public/js/main.js` | CHAT-3 | Rota abre a página; item de menu ativo; teste de rota no estilo de `tests/fluxosInterface.test.mjs` | IMPLEMENTADO (Sessão 03, 2026-10-08): `AssistentePage.js`, grupo "Assistente" no menu (6 grupos), `<chat-ia>` geral com as 3 sugestões e o quadro do que faz/não faz; tests/assistente.test.mjs; verificado no navegador (rota, menu ativo, pergunta → "Assistente indisponível agora" sem o backend) |
| TASK-CHAT-5 | **Card "IA" na ficha** `<ativo-ia simbolo>` na aba Resumo da `ConsultaPage`, logo abaixo de `<opiniao-horizontes>`: (1) **pacote** (CTR-IA-03) com 3 horizontes compactos (reusa `OPINIOES`/`RISCOS` de `OpiniaoHorizontes.js`), 3 sinais mais fortes, 3 últimas manchetes; (2) **leitura**: botão "Ler com IA" chama CTR-IA-04 e mostra o parágrafo com origem e "em cache"; (3) **conversa**: `<details>` "Conversar sobre {simbolo}" com `<chat-ia simbolo>` e sugestões ("Por que o sinal está neutro?", "O que mudou desde ontem?", "Quais riscos aparecem nos números?"). Estados: carregando; serviço fora ("IA indisponível; a opinião por regra continua acima"); só opinião por regra no pregão ⇒ nota "Leitura do modelo ainda não gerada para este pregão; favoritos entram no próximo lote" (o painel não gera opinião: TASK-IA-37 descartada) | `public/js/components/ficha/AtivoIa.js`, `public/js/pages/ConsultaPage.js` | CHAT-2, CHAT-3 | Testes da renderização pura `htmlPacote(dados)` e dos estados; valor `null` aparece como "sem dado", nunca 0; a troca de ativo cancela a busca anterior (mesmo padrão de `OpiniaoHorizontes`) | IMPLEMENTADO (Sessão 03, 2026-10-08): `AtivoIa.js` abaixo de `<opiniao-horizontes>`; `htmlPacote`/`htmlLeitura` puros (null = "sem dado", só regra ⇒ nota, link só http(s), texto escapado), chat montado só ao abrir o `<details>`; qualquer falha do pacote ⇒ "IA indisponível; a opinião por regra continua acima" (404 incluso enquanto a rota `/ativo` não existe no serviço, TASK-IA-35); tests/ativoIa.test.mjs; verificado no navegador com o serviço fora e com o pacote de exemplo do CTR-IA-03 |
| TASK-CHAT-6 | **Testes no `npm test`:** `tests/sse.test.mjs`, `tests/chatIa.test.mjs`, `tests/ativoIa.test.mjs`, `tests/iaProxy.test.mjs` | `tests/*.test.mjs`, `package.json` | CHAT-1..5 | `npm test` verde | IMPLEMENTADO (Sessão 01, 2026-10-08): `tests/sse.test.mjs` (8 casos, inclui `conversar` com fetch em fluxo) e `tests/chatIa.test.mjs` (6 casos, DOM mínimo simulado); `iaProxy`, `ativoIa` e `assistente` já estavam no `npm test` |
| TASK-CHAT-7 | **Documentação:** seção 5 deste SPEC ("Contratos consumidos") com `/ia/*` e `/noticias/favoritos`; seção 2.1 (navegação) com `#/assistente`; nota no `README.md` sobre `IA_URL` | `SPEC.md`, `README.md` | CHAT-1..5, NOT-1 | Seções coerentes com o código | IMPLEMENTADO (2026-10-08): seção 2.1 (``#/assistente``), seção 5 (``/ia/*``, ``/noticias/favoritos`` e o proxy de IA) e nota de ``IA_URL`` no README |

**Aceite do plano GEM no painel (depois das imagens no Hub).**
- Tela inicial mostra manchetes dos favoritos sem duplicatas, com filtro por ticker; sem favoritos, mostra o convite.
- `#/assistente` responde em streaming; com o Gemini fora, mostra "Assistente indisponível até HH:MM" e não trava.
- Na ficha da WEGE3, o card IA mostra o pacote, gera a leitura ao clicar e conversa com o ativo fixado.
- `npm test` verde.
