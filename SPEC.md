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
| #/ativo, #/ativo/{TICKER}?secao={id} | Ficha do ativo centralizada (Plano F360): cabeçalho fixo e seções do manifesto C5. Sem ticker, mostra o seletor e o último ativo visto. `#/gestao/X` e `#/ficha/X` redirecionam para cá (a antiga `?aba=` vira `?secao=`); `#/ficha` vai para `#/ativo`; `#/candles` vem para a seção Gráfico do último ativo visto quando essa seção existir |
| #/gestao | Ficha clássica (`<consulta-page>`), sem a aba Cadastro, removida em 2026-10-14 (F360-PAI-12): favoritar é a estrela da ficha |
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

Rotas desconhecidas exibem Início. As antigas #/consulta, #/cadastro e #/metodologia não estão mais no mapa; `CadastroPage` foi removida.

### 2.2 Consulta e monitoramento

Consulta e detalhes de Monitorados combinam cotação, histórico, decisão e fundamentos. Falha na decisão não deve impedir exibir os demais dados. SeletorDeAtivos consulta /ativos/registrados e mantém busca manual como alternativa.

Cadastro envia POST /ativos/registrar/{ativo}. Confirmação significa registro aceito para monitoramento; não significa que o worker já produziu insight. Periodicidade e processamento pertencem ao backend e não são fixados pelo cliente em 30 segundos.

GETs são consultas: a revisão do gestor de 2026-09-27 removeu gravação e publicação dos fallbacks de cotação, histórico e perfil. Este contrato depende da publicação dessa versão do backend; inspecionar o cliente não demonstra que o container em execução a utiliza.

### 2.3 Velas e avaliação

Até três meses, o gráfico usa o endpoint de histórico e permite base ajustada ou bruta. O ajuste depende de adjustedClose disponível. Períodos de seis meses até desde 2016 usam /ativos/{simbolo}/pregoes, com base bruta e intervalos dia/semana/mês; o seletor de preço ajustado não é oferecido nesse ramo.

Padrões e comparação com taxa-base são calculados no navegador. Comunicados são associados por data de entrega; associação temporal não prova causalidade nem horário intradiário.

Avaliação foi refatorada em 2026-10-11 como cockpit de evidências: veredito executivo, notas por pilar, critérios de promoção de regra, Saúde dos dados, Backtest walk-forward, Ranking/LAC, Diário de sinais e link direto para Operabilidade. A página não recalcula recomendação nem promove regra; ela só organiza evidências vivas e mantém aviso experimental.

## 3. Estudos, cursos e PDFs

### 3.1 Formações unifica planos e biblioteca

EstudosPage oferece duas visões dentro de **Formações**: **Planos de estudo** e **Biblioteca de cursos**. Não existem duas rotas independentes para cursos e planos.

Os planos incluem formação progressiva (iniciante, essencial, básico, intermediário, avançado e especialização) e percurso APIMEC (diagnóstico, CB, CG1, CT1, conduta e simulados). São orientações pedagógicas locais, sem promessa de certificação.

O material didático também inclui uma trilha operacional de opções inspirada nos conceitos reconhecidos no playbook visual analisado: fundamentos acadêmicos, execução, payoff, liquidez, custos, bloqueios de uso e laboratório de assertividade. As imagens foram tratadas como insumo de conteúdo, não como fonte normativa nem instrução de produto.

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

GlossarioPage combina verbetes gerais, **149 verbetes acadêmicos** em glossarioAcademico.js e padrões detalhados em glossarioPadroes.js. A busca inclui termo, sigla, definição, exemplo, aplicação e ressalva quando presentes. O grupo de derivativos contextualiza opções com call, put, titular, lançador, prêmio, strike, vencimento, estilo de exercício, moneyness, payoff, breakeven, travas, lançamento coberto, estruturas de volatilidade, gregas, liquidez e métricas de assertividade.

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
| REQ-17 | Glossário acadêmico e reconciliação integral com PDFs | EM ANDAMENTO — 149 verbetes; completude não demonstrada |
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
| ISS-07 | Média | Texto de Avaliação desatualizado sobre IC e tarefas; reconciliar afirmações, mantendo notas justificadas por evidência | IMPLEMENTADO (2026-10-11: página refatorada como cockpit de evidências, com operabilidade, IA, confiança não calibrada e sinal técnico separado; teste em tests/componentes.test.mjs impede regressão sobre IC pendente) |
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

Em 2026-10-08, após a inclusão da trilha e do glossário de opções, nova execução de **npm test** passou integralmente.

Inspeção adicional por importação dos dados confirmou 29 cursos, 71 módulos, 97 aulas, cinco valores atuais de dificuldade, dois valores de escopo e 149 verbetes acadêmicos. Estes números descrevem o catálogo atual e devem ser atualizados quando ele mudar.

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

## Plano integrado OPDB/CARTDB — escopo frontend (2026-10-17)

| ID | Tarefa | Escopo | Dependências | Aceite | Status |
|---|---|---|---|---|---|
| OPDB-PAI-1 | Tornar opções legíveis e confiáveis | Exibir `tipo_opcao` do backend (CALL/PUT), pregão/data de referência e estados carregando, vazio, erro e desatualizado; remover classificação derivada de BDI | OPDB-GES-1 | Tipo exibido coincide com resposta; cadeia ausente/vencida é explicada sem sugerir que não existem opções; testes cobrem estados e tipo | PLANEJADO |
| CARTDB-PAI-1 | Migração assistida da carteira local | Importar `b3-carteiras` para a instância compartilhada com operação idempotente; alocações antigas ficam como legado, sem inferir compra/quantidade/preço; manter cópia até confirmação do servidor | CARTDB-GES-1, CARTDB-GES-6 | Repetição não duplica; falha preserva local; V42 não gera transações implicitamente | IMPLEMENTADO (develop) |
| CARTDB-PAI-2 | CRUD persistente de Carteiras | Criar/editar/arquivar via API, com estados de carregamento/erro/vazio; sem fluxo de login ou promessa de privacidade por usuário | CARTDB-GES-1 | Recarregar mantém dados; arquivamento explicado; erro não perde estado local | IMPLEMENTADO (develop) |
| CARTDB-PAI-3 | Registrar operações | Formulário de compra/venda com quantidade, preço executado informado, custos e data; deixar claro que é registro do usuário, não execução da ordem | CARTDB-GES-2 | Valores validados, confirmação antes de salvar, histórico auditável e posição consolidada coerente | PLANEJADO |
| CARTDB-PAI-4 | Registrar proventos recebidos | Informar tipo, ativo, data, quantidade elegível, valor bruto/retenção/líquido e referência; separar anúncio de recebimento | CARTDB-GES-3 | Totais e deduplicação visíveis; correções geram lançamento compensatório, sem editar/apagar histórico | PLANEJADO |
| CARTDB-PAI-5 | Mostrar posição e custo | Exibir quantidade líquida, preço médio/custo, valor de mercado e data da cotação, diferenciando campos ausentes/legados | CARTDB-GES-2, CARTDB-GES-4 | Sem quantidade/preço não rotular alocação antiga como posição comprada | PLANEJADO |
| CARTDB-PAI-6 | Retorno e proventos no tempo | Exibir patrimônio, retorno total (realizado/não realizado), proventos líquidos e metodologia/data de corte da série persistida | CARTDB-GES-4..5 | Lacunas identificadas; não usar zero como dado ausente; números reconciliam com operações e recebimentos | PLANEJADO |
| CARTDB-PAI-7 | Estados de sincronização e aviso de compartilhamento | Tratar erro de rede, vazio e sincronização; deixar claro que dados são compartilhados pela instância | CARTDB-PAI-1..6 | UI não sugere isolamento por usuário; falha de rede não relata gravação bem-sucedida | PLANEJADO |

Implementação sequencial: concluir V43+ e API compartilhada do gestor antes da interface; depois importar legado e implementar CRUD, ledger, proventos e retorno. Não executar em paralelo com `OPT-PAI-3` ou `OPCX-PAI-3`, nem dividir os arquivos compartilhados de Carteiras. A ordem global e os contratos estão no hub `infra-b3-ecossytem/SPEC.md`.

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
| TASK-NOT-1 | **Agregador** `noticiasFavoritos(simbolos, {buscar, agora})` com `buscar` injetável: no máximo 3 buscas em paralelo; cache em memória por ticker de 15 min; após erro, 30 min sem tentar de novo aquele ticker (devolve o cache vencido marcado `desatualizado`); duplicata = mesmo link **ou** títulos normalizados (minúsculas, sem acento/pontuação, sem " - Fonte" no fim) com similaridade de Jaccard por palavras ≥ 0,85; ordena por `publicadoEm` desc; corta 7 dias e 30 itens. Rota `GET /noticias/favoritos` no `server.js` (CTR-PAI-NOT-01) | `proxy/noticiasFavoritos.js`, `server.js` | — | Testes com `buscar` e relógio falsos: paralelismo ≤ 3, cache 15 min, pausa de 30 min após erro, junção de tickers, duplicata por título, corte de 7 dias/30 itens, 400 para ticker inválido | IMPLEMENTADO (f2285b8, 2026-10-08): `proxy/noticiasFavoritos.js` com Jaccard, cache 15 min, pausa 30 min, paralelo ≤ 3, dedup por link e título; rota `GET /noticias/favoritos` no `server.js`; `tests/noticiasFavoritos.test.mjs` (13 casos ok) |
| TASK-NOT-2 | **Busca mais precisa:** `buscarNoticias(ticker, { nome })` pesquisa `"TICKER"` entre aspas e, com nome, `"TICKER" OR "Nome"`; `publicadoEm` convertido para ISO; `/noticias/:ticker` continua igual para a `NoticiasPage` | `proxy/noticiasApi.js` | — | Teste da URL montada (com e sem nome, nome com acento codificado) e da conversão de data do `pubDate` | IMPLEMENTADO (f2285b8, 2026-10-08): `proxy/noticiasApi.js` com aspas no ticker, `OR "Nome"` com nome, `pubDateParaIso` ISO; `tests/noticiasFavoritos.test.mjs` cobre URL e data |
| TASK-NOT-3 | **Card "Manchetes dos favoritos"** no topo da `InicioPage` (antes de "Saúde dos dados", largura total): lista favoritos via `listarFavoritos()`, chama `buscarManchetesFavoritos(simbolos, nomes)`; cada item com selo do ticker, título como link (`target="_blank" rel="noopener noreferrer"`), veículo e "há X h"; chips de filtro por ticker; 8 itens visíveis e botão "mais"; estados: carregando, sem favoritos ("Marque ativos com ★ para ver as manchetes aqui" + link `#/ativos?visao=favoritos`), tudo falhou ("Fontes de notícias indisponíveis agora"), `desatualizado` (selo "pode estar desatualizado") | `public/js/api/noticiasApi.js`, `public/js/components/inicio/ManchetesFavoritos.js`, `public/js/pages/InicioPage.js` | NOT-1 | Teste da função de renderização pura (`htmlManchetes(dados, filtro)`): escape de título/fonte (`<script>` vira texto), filtro por ticker, "mais N", cada estado | IMPLEMENTADO (6ae67c3, 2026-10-08): `buscarManchetesFavoritos` em `noticiasApi.js`, card na `InicioPage` antes de "Saúde dos dados", escape XSS, chips de filtro, "8 visíveis + mais N", todos os estados; testes em `manchetesFavoritos.test.mjs` |
| TASK-NOT-4 | **Comunicado oficial em destaque:** no mesmo card, acima das manchetes, comunicados da CVM do dia útil mais recente dos favoritos (já carregados pela newsletter da `InicioPage`), com selo "Oficial – CVM"; nunca misturados com a mídia | `public/js/components/inicio/ManchetesFavoritos.js` | NOT-3 | Teste: comunicado aparece separado e com o selo; sem comunicado, a faixa some | IMPLEMENTADO (6ae67c3, 2026-10-08): destaque `FATO_RELEVANTE` com selo "Oficial – CVM" acima das manchetes; sem comunicado a faixa some; testes: 4 casos ok |
| TASK-NOT-5 | **Resumo do dia por IA (opcional):** botão "Resumir com IA" no card chama `POST /ia/manchetes/resumo` (TASK-IA-38) com as manchetes já exibidas; mostra 3 tópicos com os links citados; sem serviço ou cota ⇒ "Resumo indisponível agora" e o card segue funcionando | `public/js/api/iaApi.js`, `public/js/components/inicio/ManchetesFavoritos.js` | NOT-3, CHAT-1, IA-38 | Teste com fixture do contrato: tópicos renderizados com links; link fora da lista enviada é descartado no front também | IMPLEMENTADO (7ff585d, 2026-10-08): botão "Resumir com IA" aparece só com manchetes; `htmlResumo` renderiza 3 tópicos, descarta links fora da lista, corta em 3, "indisponível" sem tópicos; testes em `manchetesFavoritos.test.mjs` (5 casos ok) |
| TASK-NOT-6 | **Testes no `npm test`:** `tests/noticiasFavoritos.test.mjs` (NOT-1/2) e `tests/manchetesFavoritos.test.mjs` (NOT-3..5) | `tests/*.test.mjs`, `package.json` | NOT-1..5 | `npm test` verde | IMPLEMENTADO (7ff585d, 2026-10-08): `tests/noticiasFavoritos.test.mjs` (13 casos) e `tests/manchetesFavoritos.test.mjs` (19 casos); `npm test` verde em todos os 38 arquivos de teste |

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

---

## Plano OPR: aba Operabilidade e paper trading (2026-10-08)

**Status:** IMPLEMENTADO no painel (2026-10-11; dados reais dependem do OPR-GES) · **Contexto:** `infra-b3-ecossytem/SPEC.md`, Plano OPR. O painel não decide operação; ele mostra, com linguagem conservadora, se o sistema simulado já tem evidência mínima para ser considerado operável em paper trading.

**Meta de UX.** Responder visualmente: o sistema venceu o CDI líquido de custos? por quantos pregões? com qual drawdown? quais operações estão abertas/fechadas? quais sinais foram bloqueados por liquidez, dados ou risco?

### Navegação proposta

Adicionar seção `#/operabilidade` ou subtela dentro de `#/avaliacao` com:

- card de status: `Não operável`, `Em observação`, `Paper trading elegível` ou `Bloqueado`;
- retorno líquido vs CDI;
- drawdown máximo;
- dias de diário avaliados;
- operações abertas e encerradas;
- bloqueios por liquidez/dados/risco;
- tabela de diário e linha do tempo das operações simuladas.

### Contrato `/operacional/*` (CTR-OPR-PAI, fixado em 2026-10-11)

O que a tela consome do gestor (OPR-GES-2..4 implementam contra isto). JSON em camelCase, nomes das colunas da V23; frações (`0.0052` = 0,52%), valores em R$; ausente é `null`, nunca 0. Só leitura.

| Rota | Corpo |
|---|---|
| `GET /operacional/resumo` | `{ versaoRegra, statusSistema, motivosStatus: [{codigo, descricao}], dataInicio, ultimoPregao, pregoesAvaliados, pregoesMinimos, capitalInicial, patrimonio, retornoLiquidoAcumulado, cdiAcumulado, cdiLiquidoIrAcumulado, excessoSobreCdiLiquido, drawdown, drawdownMaximo, posicoesAbertas, operacoesFechadas, impostoEstimadoMes }`. Sem diário: `statusSistema = NAO_OPERAVEL`, `pregoesAvaliados = 0`, `ultimoPregao = null` |
| `GET /operacional/diario?inicio=&fim=` | `{ itens: [{ dataPregao, patrimonio, caixa, exposicao, posicoesAbertas, retornoBrutoDia, retornoLiquidoDia, retornoLiquidoAcumulado, cdiAcumulado, cdiLiquidoIrAcumulado, excessoSobreCdiLiquido, drawdown, drawdownMaximo, impostoEstimadoMes, statusSistema }] }` |
| `GET /operacional/operacoes?status=&simbolo=` | `{ itens: [{ id, simbolo, setorGrupo, horizontePregoes, status, dataDecisaoEntrada, dataEntrada, precoEntrada, quantidade, valorEntrada, stopInicial, stopAtual, faixaLiquidezEntrada, custosEntrada, dataSaida, precoSaida, motivoSaida, custosSaida, resultadoBruto, resultadoPosCustos, impostoEstimado, resultadoPosImpostoEstimado, motivoEntrada: {…}, motivoSaidaDetalhe: {…} }] }` (`motivo*` = os JSON gravados) |
| `GET /operacional/bloqueios?data=` | `{ dataPregao, itens: [{ simbolo, faixa, motivos: [{codigo, detalhe, valor, limite}] }] }` (códigos da elegibilidade OPR-INS-1 e do sizing OPR-INS-2; fonte: `evento_operacional` BLOQUEIO_*) |
| `GET /operacional/saude` | `{ status, ultimaExecucao, dadosDoDiaCompletos, violacoes: [{codigo, descricao}] }` |

Rota inexistente responde 404: a tela mostra "dados operacionais indisponíveis" em vez de quebrar.

### Tarefas desta aplicação

| ID | Tarefa | Arquivos | Depende | Aceite | Status |
|---|---|---|---|---|---|
| OPR-PAI-1 | Criar cliente `operacionalApi.js` para consumir `/operacional/resumo`, `/operacional/diario`, `/operacional/operacoes`, `/operacional/bloqueios` e `/operacional/saude` | `public/js/api/operacionalApi.js` | gestor#OPR-GES-2..4 | Testes com `fetch` falso cobrem sucesso, vazio, erro 503 e datas | IMPLEMENTADO (Sessão 03, 2026-10-11): `public/js/api/operacionalApi.js` (resumo, diario, operacoes, bloqueios, saude) pelo `httpClient`; filtros na query; 404 = gestor sem a rota ⇒ `{indisponivel: true}`; 503/rede sobem como erro; `/operacional` incluído no proxy do gestor (`proxy/apiProxy.js`) |
| OPR-PAI-2 | Criar página/aba `OperabilidadePage` com status, retorno líquido, CDI, excesso, drawdown, dias avaliados e alerta de que ainda é simulação | `public/js/pages/OperabilidadePage.js`, `router.js`, `navegacao.js` | OPR-PAI-1 | Estado vazio mostra “diário ainda não iniciado”; status nunca usa linguagem de recomendação de compra/venda | IMPLEMENTADO (Sessão 03, 2026-10-11): `pages/OperabilidadePage.js` em `#/operabilidade`, item do grupo Avaliação (com "Saúde e placar"); status com rótulo e descrição conservadores (`analise/operabilidade.js`, enum `contracts/statusOperacional.js`), progresso rumo aos 63 pregões, retorno líquido, CDI líquido, excesso, drawdown máximo, patrimônio, posições, IR estimado do mês e motivos do status; aviso de simulação fixo; estados carregando, indisponível (OPR-GES pendente), erro e "diário ainda não iniciado" |
| OPR-PAI-3 | Criar componentes de carteira simulada: operações abertas, operações fechadas, motivo de entrada/saída, tamanho de posição e custos | `public/js/components/operacional/**` | OPR-PAI-1 | Operação fechada exibe retorno bruto, custos, retorno líquido e motivo de saída; valores `null` aparecem como “sem dado” | IMPLEMENTADO (Sessão 03, 2026-10-11): `components/operacional/CarteiraSimulada.js`: abertas (com PENDENTE "entra na próxima abertura") e encerradas com entrada → saída, bruto, custos, pós-custos, IR estimado, líquido e motivo de saída (gatilhos no title); null como "sem dado" |
| OPR-PAI-4 | Criar gráfico simples de retorno líquido acumulado vs CDI e drawdown, com tabela acessível de diário | `public/js/components/operacional/GraficoOperabilidade.js` | OPR-PAI-1 | Gráfico funciona em claro/escuro; tabela permite auditar cada pregão; sem dado não desenha zero falso | IMPLEMENTADO (Sessão 03, 2026-10-11): `components/operacional/GraficoOperabilidade.js`: SVG retorno líquido acumulado × CDI líquido de IR e faixa de drawdown, cores do Bootstrap (claro/escuro conferidos no navegador); ponto null quebra a linha; tabela do diário (mais recente primeiro) num `<details>` |
| OPR-PAI-5 | Criar painel de bloqueios por liquidez, dado ausente, evento, fundamento futuro e limite de risco | `public/js/components/operacional/BloqueiosOperacionais.js` | OPR-PAI-1 | Usuário entende por que um sinal não virou operação simulada; filtros por motivo e símbolo | IMPLEMENTADO (Sessão 03, 2026-10-11): `components/operacional/BloqueiosOperacionais.js`: motivos agrupados (liquidez, dado, evento, fundamento, risco, outro) com contagem, filtro por motivo e por ativo. Depende de o gerar-insights gravar os bloqueios em `evento_operacional` (BLOQUEIO_LIQUIDEZ/BLOQUEIO_DADO) para o gestor ler |
| OPR-PAI-6 | Testes no `npm test` para API, renderização dos estados, escape de texto e cálculo visual de status | `tests/operabilidade*.test.mjs`, `package.json` | OPR-PAI-2..5 | `npm test` verde; conteúdo vindo da API é escapado | IMPLEMENTADO (Sessão 03, 2026-10-11): `tests/operabilidade.test.mjs` no `npm test` (13 casos: API com fetch falso para sucesso, vazio, 404 e 503; status sem linguagem de recomendação; resumo vazio sem zero falso; carteira; gráfico com lacuna; bloqueios com escape e filtros; rota, menu e proxy). Conferido no navegador (painel local na 8093): estado indisponível com o gestor atual, tela completa com dados de teste, tema escuro e 375 px sem rolagem lateral |

### Textos obrigatórios

- “Simulação/paper trading; não é recomendação de investimento.”
- “Elegível” significa que os critérios internos foram cumpridos no diário, não garantia de retorno futuro.
- Mostrar sempre a janela avaliada e se ela ainda é menor que 3 ou 6 meses.

### Aceite local

- A tela distingue claramente sistema sem diário, diário em observação, sistema bloqueado e paper trading elegível.
- Retorno líquido, CDI e excesso aparecem juntos; nunca mostrar retorno bruto isolado como sucesso.
- O usuário consegue abrir uma operação e ver qual regra entrou, qual regra saiu, custo estimado e impacto no resultado.

---

## Plano OPERABILIDADE V2: experiência por ticker e cockpit de mercado (2026-10-11)

**Status:** IMPLEMENTADO NO PAINEL (2026-10-11; contratos e rotas V2 alinhados em código local) · **Contexto:** `infra-b3-ecossytem/SPEC.md`, Plano OPERABILIDADE V2. O painel transforma os dados OPR em uma experiência de decisão auditável: o usuário entende rapidamente se o ativo é operável, por quê, quais sinais concordam/divergem e o que invalida a tese. Em ambientes sem as migrations/rotas implantadas, os componentes continuam exibindo estado indisponível sem quebrar as telas OPR existentes.

### Princípios de UX

- Separar sempre `sinal analítico` de `operabilidade`.
- Nunca mostrar retorno bruto isolado como sucesso; sempre junto de CDI líquido, custos e drawdown.
- `confiança` sem curva real aparece como `não calibrada`.
- Todo dado ausente aparece como `sem dado` com motivo quando disponível, nunca como zero.
- Toda tela contém aviso: “Simulação/paper trading; não é recomendação de investimento.”

### Tarefas desta aplicação

| ID | Tarefa | Arquivos | Depende | Aceite | Status |
|---|---|---|---|---|---|
| OPRV2-PAI-1 | Criar cliente V2 `operacionalV2Api.js` para cards, snapshot, consenso, tese, timeline, filtros e alertas | `public/js/api/operacionalV2Api.js` | gestor#OPRV2-GES-1..5 | Testes com fetch falso cobrem sucesso, vazio, 404 e erro de rede | IMPLEMENTADO (2026-10-11): sete leituras GET; 404 vira estado indisponível e demais erros permanecem visíveis |
| OPRV2-PAI-2 | Enriquecer cards/listagem de ativos com status operacional, faixa de liquidez, confiança, sinal principal, sinal técnico, IA, último evento e bloqueio | `components/ativos/**`, `analise/operabilidade.js` | OPRV2-PAI-1, gestor#OPRV2-GES-1 | Usuário vê “sinal bom, mas bloqueado” sem abrir a ficha | IMPLEMENTADO (2026-10-11): coluna consome faixa de confiança, sinais estruturados, opinião IA, último evento e motivos de bloqueio do DTO real |
| OPRV2-PAI-3 | Criar aba “Operabilidade” na ficha do ticker: elegibilidade, motivo de bloqueio, tamanho teórico, stop, custos, regra de saída e operações simuladas do ativo | `pages/ConsultaPage.js`, `components/ficha/OperabilidadeAtivo.js` | OPRV2-PAI-1, OPR-PAI-3 | Ativo bloqueado explica causas; ativo elegível mostra sizing/risco sem linguagem de ordem | IMPLEMENTADO (2026-10-11): quinta aba lazy na ficha, combinando snapshot V2 e operações OPR v1 |
| OPRV2-PAI-4 | Criar componente “Consenso de sinais”: regra principal, técnico momentum, técnico reversão, IA, v2/ranking sombra e operacionalidade | `components/operacional/ConsensoSinais.js` | gestor#OPRV2-GES-2, gerar-insights#OPRV2-INS-2 | Divergências aparecem visualmente e com texto explicativo | IMPLEMENTADO (2026-10-11): fontes separadas, confiança calibrada/não calibrada e divergências explícitas |
| OPRV2-PAI-5 | Criar bloco “Por que esse sinal existe?” com fatores positivos, negativos, riscos, dados ausentes e invalidadores | `components/operacional/TeseExplicada.js` | gestor#OPRV2-GES-2, gerar-insights#OPRV2-INS-3 | Conteúdo é escapado; cada item tem código, descrição e severidade | IMPLEMENTADO (2026-10-11): cinco grupos auditáveis, conteúdo externo escapado |
| OPRV2-PAI-6 | Criar timeline do ticker com preço/sinal/comunicados/proventos/operações/bloqueios/mudança de recomendação | `components/operacional/TimelineAtivo.js` | gestor#OPRV2-GES-3, etl#OPRV2-ETL-2 | Timeline ordena por data, permite filtro por tipo e linka comunicados/documentos quando houver | IMPLEMENTADO (2026-10-11): ordenação decrescente, filtros tipo/severidade e links restritos a HTTP(S) |
| OPRV2-PAI-7 | Criar filtros avançados globais por operabilidade, liquidez, risco, setor, evento recente, operação aberta/fechada, bloqueio, score não calibrado e evidência | `components/ativos/FiltrosOperacionais.js` | gestor#OPRV2-GES-4 | Filtros preservam URL/query string e funcionam em mobile | IMPLEMENTADO (2026-10-11): opções e contagens da API; nomes de filtro traduzidos para os parâmetros do gestor e aplicados aos snapshots atuais |
| OPRV2-PAI-8 | Criar central de alertas operacional na Home e em `#/operabilidade`, refletindo estado atual do ticker/sistema | `components/inicio/AlertasOperacionais.js`, `pages/OperabilidadePage.js` | gestor#OPRV2-GES-5, infra#OPRV2-INFRA-4 | Alertas têm severidade, categoria, ticker, data e CTA para ficha/timeline; evento passado não é exibido como ativo | IMPLEMENTADO (2026-10-11): Home e cockpit, ordenação por severidade, contrato exige `ativo=true` e CTA para ficha/timeline |
| OPRV2-PAI-9 | Melhorar visualização global de `#/operabilidade`: cockpit com retorno líquido vs CDI, drawdown, operações, bloqueios, status de maturidade 63/126 pregões e timeline resumida | `pages/OperabilidadePage.js`, `components/operacional/**` | OPR-PAI-1..6, OPRV2-PAI-1 | Tela responde: venceu CDI líquido? por quanto tempo? com qual risco? o que bloqueou? | IMPLEMENTADO (2026-10-11): preserva cockpit OPR e adiciona maturidade 63/126 e alertas/eventos recentes |
| OPRV2-PAI-10 | Testes de UX e contrato: cards, consenso, tese, timeline, filtros, alertas, estados vazios e XSS | `tests/operabilidadeV2*.test.mjs`, `package.json` | OPRV2-PAI-1..9 | `npm test` verde; valores `null` não viram zero; texto da API é escapado | IMPLEMENTADO (2026-10-11): 11 casos V2 no `npm test`; suíte completa verde |

### Evolução visual desejada

| Área | Evolução |
|---|---|
| Card do ticker | status operacional, liquidez, confiança, sinal principal/técnico/IA, último evento |
| Ficha do ticker | aba Operabilidade, consenso, tese explicada e timeline |
| Operabilidade global | cockpit de maturidade, retorno líquido vs CDI, drawdown, operações e bloqueios |
| Home | alertas operacionais e mudanças relevantes do dia |
| Filtros | risco, liquidez, operável/bloqueado, evento recente, score não calibrado |

### Dependências externas ao painel

| Dependência | Necessária para |
|---|---|
| `gestor#OPRV2-GES-1` | cards enriquecidos |
| `gestor#OPRV2-GES-2` | consenso e tese |
| `gestor#OPRV2-GES-3` | timeline |
| `gestor#OPRV2-GES-4` | filtros globais |
| `gestor#OPRV2-GES-5` | central de alertas |
| `gerar-insights#OPRV2-INS-5` | mostrar confiança calibrada em vez de “não calibrada” |

---

## Plano OPT: experiência de opções com dados confiáveis (2026-10-12)

**Status:** PLANEJADO · **Contexto comum:** ver `infra-b3-ecossytem/SPEC.md`, Plano OPT. A rota `#/opcoes/{ativo}` funciona e o backend recebe o clique, mas `B3SA3/BVMF3` retornam `opcoes: []` porque a base de opções está suspeita/contaminada. O painel deve explicar o vazio e só enriquecer a cadeia depois que o gestor expuser dados validados.

### Regras para agentes

- Painel não infere opção por prefixo, BDI ou ticker. Só renderiza o contrato do gestor.
- Estado vazio é parte do produto: vazio sem motivo é bug.
- IDs `OPT-PAI-*` são reservados; não renomear.
- Qualquer texto deve manter linguagem de estudo/simulação; não sugerir operação real.

### Tarefas desta aplicação

| ID | Tarefa | Arquivos | Depende | Aceite | Status |
|---|---|---|---|---|---|
| OPT-PAI-1 | Melhorar estado vazio da tela de opções | `pages/OpcaoPage.js`, `components/OpcoesPainel.js` | gestor#OPT-GES-2 | Para `SEM_CADEIA_VALIDA`, `CARGA_OPCOES_AUSENTE`, `BASE_OPCOES_CONTAMINADA` e `TICKER_NORMALIZADO`, a tela mostra causa, ticker canônico e próximo passo; não fica “em branco” | IMPLEMENTADO (2026-10-12): `OpcoesPainel` renderiza alertas por status, mostra solicitado/canônico e próximo passo; `OpcaoPage` exibe ticker canônico/alias; `tests/opcoes.test.mjs` cobre vazio explicado, ticker normalizado, base contaminada com escape e cadeia válida |
| OPT-PAI-2 | Criar bloco de saúde/qualidade da cadeia de opções | nova seção em `#/opcoes` e/ou `#/avaliacao` | gestor#OPT-GES-3 | Mostra totais válidos/invalidos, vencimento 9999, ativos monitorados com/sem cadeia, prefixos suspeitos e último pregão válido | IMPLEMENTADO NO PAINEL (2026-10-12): `#/opcoes` consulta `GET /opcoes/saude`, renderiza todas as métricas obrigatórias, preserva `null` como “sem dado” e trata 404 como diagnóstico ainda indisponível até o gestor concluir OPT-GES-3 |
| OPT-PAI-3 | Filtros da cadeia válida | `OpcoesPainel.js` | gestor#OPT-GES-1 | Filtros por vencimento, tipo, negócios, volume, liquidez e distância do strike; null aparece como “sem dado” | PLANEJADO |
| OPT-PAI-4 | Avisos pedagógicos de risco e qualidade | `OpcoesPainel.js`, glossário/ajuda contextual | OPT-PAI-1 | Tela informa que opções exigem liquidez, vencimento, strike, custo, spread e payoff; cadeia incompleta bloqueia leitura de assertividade | IMPLEMENTADO (2026-10-12): aviso persistente bloqueia assertividade quando a cadeia está incompleta e ajuda contextual explica os seis fatores de risco |
| OPT-PAI-5 | Testes de UX para opções | `tests/*opcoes*.test.mjs` | OPT-PAI-1..4 | Testes cobrem vazio explicado, ticker normalizado, dados suspeitos, escape de texto e renderização de calls/puts válidas | IMPLEMENTADO (2026-10-12): `tests/opcoes.test.mjs` cobre estados, saúde, filtros previstos, escaping, avisos pedagógicos e renderização de CALL/PUT; 29 casos passam |

### Estados de UX obrigatórios

| Status da API | Mensagem esperada |
|---|---|
| `SEM_CADEIA_VALIDA` | “Não há cadeia de opções válida carregada para este ativo no último pregão.” |
| `CARGA_OPCOES_AUSENTE` | “A carga de opções ainda não rodou ou não publicou dados válidos.” |
| `BASE_OPCOES_CONTAMINADA` | “A base contém registros suspeitos e foi bloqueada para evitar leitura enganosa.” |
| `TICKER_NORMALIZADO` | “O ticker solicitado foi normalizado para o código atual antes da consulta.” |

---

## Plano SIM: Simulador de Operações (2026-10-12)

**Status:** PLANEJADO · **Contexto comum:** ver `infra-b3-ecossytem/SPEC.md` Plano SIM. Nova aba "Simulador de operações" com quatro sub-views: (1) tabela de 7+1 estratégias por ativo, (2) cenário pontual what-if com data/capital/janela, (3) retroativo histórico por estratégia, (4) lista de operações manuais com acompanhamento dia a dia. Dados vêm do gestor; IA_LIVRE é sob demanda via clique.

### Princípios de UX

- Todas as telas mantêm aviso de simulação; nunca linguagem de recomendação ou ordem real.
- IA_LIVRE é resultado analítico, não autorização de operação real.
- Dado ausente aparece como `—`, nunca como zero.
- Operações com `status=PENDENTE` mostram countdown até a data de entrada.

### Tarefas desta aplicação

| ID | Tarefa | Arquivos | Depende | Aceite | Status |
|---|---|---|---|---|---|
| SIM-PAI-1 | Criar `SimuladorPage.js` com rota `#/simulador`, navegação entre as quatro abas internas e widget de ativos monitorados (CRUD da classe `simulador_ativo`) | `pages/SimuladorPage.js`, `api/simuladorApi.js` | gestor#SIM-GES-1 | Ativo inexistente no cadastro não pode ser adicionado; remoção marca `ativo=false`; aba mostra estado vazio com CTA de adição | PLANEJADO |
| SIM-PAI-2 | Aba "Estratégias": tabela 7+1 por ativo com quintil, retorno e coluna IA_LIVRE clicável | `components/simulador/TabelaEstrategias.js` | gestor#SIM-GES-2, SIM-PAI-1 | Clicar em IA_LIVRE chama `POST /simulador/ia/{simbolo}` com os 7 resultados da linha; exibe spinner durante chamada; mostra painel expandido com texto + "salvo às HH:MM" | IMPLEMENTADO (2026-10-12): `TabelaEstrategias.js` renderiza sete estratégias + IA_LIVRE, monta payload com sete resultados, aplica cache por ativo e escapa texto retornado pela IA; `SimuladorPage.js` carrega resultados por ativo e liga ação com spinner |
| SIM-PAI-3 | Aba "Cenário": controles de ativo, data de entrada, janela (1–63 pregões) e capital; cards de resultado por estratégia; gráfico de linha vs CDI | `components/simulador/CenarioSimulador.js` | gestor#SIM-GES-7, SIM-PAI-1 | Resultado exibe R$ ganho/perdido, %, posição vs CDI e frase-resumo; data futura bloqueada (apenas datas com cotação real) | IMPLEMENTADO (2026-10-12): componente de cenário valida ativo/data/janela/capital, bloqueia data futura e janela fora de 1–63 pregões, renderiza cards por estratégia e SVG simples de comparação vs CDI |
| SIM-PAI-4 | Aba "Retroativo": seleciona estratégia + janela + período histórico e exibe taxa de acerto, retorno médio, melhor/pior entrada e distribuição de resultados | `components/simulador/Retroativo.js` | gestor#SIM-GES-6, SIM-PAI-1 | Aviso de limitação in-sample visível; sem dados no período mostra estado vazio explicado | IMPLEMENTADO (2026-10-12): `Retroativo.js` exibe aviso in-sample, controles de ativo/estratégia/janela/início, taxa de acerto, retorno médio, melhor/pior entrada, distribuição e vazio explicado quando não há dados |
| SIM-PAI-5 | Aba "Operações": lista de operações manuais com status, P&L do dia e acumulado; expansível para histórico pregão a pregão | `components/simulador/OperacoesManuais.js` | gestor#SIM-GES-3, SIM-GES-4, SIM-PAI-1 | PENDENTE mostra data de abertura estimada; ABERTA mostra linha por pregão ao expandir; FECHADA mostra resumo com retorno vs CDI | IMPLEMENTADO (2026-10-12): lista em accordion diferencia PENDENTE, ABERTA e FECHADA; mostra P&L diário/acumulado, abertura estimada, histórico pregão a pregão e retorno vs CDI |
| SIM-PAI-6 | Painel lateral de operabilidade paralela: mini-resumo do paper trading real (status, retorno vs CDI, pregões avaliados) exibido junto ao simulador para comparação direta | `components/simulador/OperabilidadeParalela.js` | OPR-PAI-1, SIM-PAI-1 | Reusa dados já carregados da OperabilidadePage; não faz chamada extra | IMPLEMENTADO (2026-10-12): painel lateral mostra status, retorno vs CDI e pregões avaliados; a página busca o resumo operacional uma vez e o repassa ao componente, com estado educativo quando ausente |
| SIM-PAI-7 | Testes | `tests/simulador.test.mjs` | SIM-PAI-1..6 | Cobre: ativo inválido rejeitado, IA_LIVRE cache reutilizado (sem segunda chamada), data futura bloqueada, valor `null` nunca vira zero, XSS no texto IA escapado | IMPLEMENTADO (2026-10-12): `tests/simulador.test.mjs` cobre rejeição de ativo inválido, payload/cache IA_LIVRE, bloqueio de data futura, preservação de `null` como “sem dado”, escape XSS, vazio retroativo, status de operações e operabilidade paralela |

---

## Plano F360: ficha do ativo centralizada (2026-10-14)

**Status:** PLANEJADO · **Rótulo das tarefas:** `F360-PAI-*` (este repositório) e `F360-GES-*` (`gestor-ativos-brutos/SPEC.md`, Plano F360). IDs reservados; não renomear nem reaproveitar.

**Objetivo:** uma única página por ativo (`#/ativo/{TICKER}`) que reúne cotação, decisão objetiva, gráfico de velas com as ferramentas de análise, valuation, fundamentos com histórico, proventos, opções, eventos, operação simulada e IA. A aba "Cadastro" sai: todos os ativos já estão no banco, e o único efeito do cadastro (favoritar para receber cotação intradiária) já existe no `FavoritoToggle`.

### DEC-F360-1: sinal objetivo, sem filtro regulatório

Decisão do usuário (2026-10-14). A ferramenta é de uso próprio e não vai a mercado. A ficha mostra **COMPRAR / VENDER / MANTER** com entrada, alvo, stop e relação risco/retorno, sem disclaimer, rótulo "educacional" ou "estudo/simulação". A calibração aparece como dado (taxa de acerto do backtest ao lado do sinal), não como aviso. Esta decisão revoga, para o painel, as regras de texto "linguagem de estudo/simulação" e "nunca linguagem de recomendação" dos planos OPT e SIM, e substitui o ISS-F6 do `gerar-insights`. Textos já existentes nessas telas só mudam se uma tarefa própria pedir. O Plano F360 não toca esses arquivos.

### Regras de execução paralela (valem para todo agente: Codex, Devin, Copilot, Claude)

1. **Nenhuma tarefa F360 depende de outra.** Cada uma programa contra os contratos C1–C7 abaixo, e não contra o código de outra tarefa. Se o outro lado ainda não existir, a tela mostra o estado vazio previsto (`—`, "sem dado ainda" ou "seção em construção") e nunca quebra.
2. **Posse exclusiva de arquivos.** Cada tarefa só cria ou edita os arquivos listados na sua linha. Reaproveitar um componente existente é permitido apenas por import/uso, sem editar o arquivo dele. Precisou mexer num arquivo de outra tarefa ou de fora da lista? Pare e registre no arquivo de status. Não edite.
3. **Branch própria:** `feature-f360-pai-N` ou `feature-f360-ges-N`, criada a partir da `develop` (destino dos PRs automáticos; a `main` está defasada). Commit por pathspec, nunca `git add -A`. O PR abre automaticamente pela esteira.
4. **Status fora da SPEC.** Para não colidir em linhas vizinhas desta tabela, ao terminar a tarefa o agente cria `docs/f360/F360-PAI-N.md` com estado (`IMPLEMENTADO`/`BLOQUEADO`), evidência (testes que passam) e desvios. Esta SPEC não é editada pelas tarefas, exceto pela F360-PAI-12 na seção 2.1.
5. **Testes isolados:** cada tarefa cria `tests/ficha360/<nome>.test.mjs`, executável sozinho com `node`, usando um contexto falso (C2) em vez de rede. Só a F360-PAI-1 edita `package.json`.
6. **Estilo:** só Bootstrap mais os tokens C4. CSS específico de um componente vai num `<style>` dentro do próprio template, com prefixo de classe `f360-<secao>-`. Só a F360-PAI-11 edita `public/css/app.css`.
7. **Start único** (DEC-AGT-1): nada de comando, flag ou script novo. Tudo roda pelo `node server.js` existente.

### Contratos (fonte da verdade para todas as tarefas)

**C1 — Seção da ficha.** Cada seção é um custom element `secao-<id>` em `public/js/components/ficha360/secoes/Secao<Id>.js` e estende `BaseComponent`. A página cria o elemento e atribui `elemento.contexto = ctx` (C2). O setter de `contexto` dispara a carga. A seção é responsável pelo próprio esqueleto de carregamento (pode usar `components/ficha/esqueleto.js`), pelo estado vazio (`EstadoVazio`) e pelo erro. Ela nunca lança exceção por campo `null` e nunca transforma `null` em zero. Os ids e a ordem ficam fixos em C5.

**C2 — `FichaContexto`.** Objeto com `simbolo: string` e `obter(chave): Promise<objeto | null>`. Cada chave é buscada no máximo uma vez por ficha (cache). 404 ou erro de rede resolve `null`, e não rejeita. Chaves:

| Chave | Origem |
|---|---|
| `ativo` | `GET /ativos/{s}` |
| `analise` | `GET /analises/{s}/analise` |
| `fundamentosCvm` | `GET /analises/{s}/fundamentos-cvm` (campos novos em C6) |
| `fundamentosHistorico` | `GET /analises/{s}/fundamentos-cvm/historico?anos=5` (C6) |
| `base` | linha exata do símbolo em `GET /base/ativos?q={s}` (`nome`, `setor`, `situacaoRegistro`, `ufMunicipio`, `ultimoFechamento`) |
| `identidade` | `GET /ativos/{s}/identidade` (C6) |
| `opiniao` | `GET /ativos/{s}/opiniao` |
| `fatores` | `GET /ativos/{s}/fatores` |
| `proventos` | `GET /ativos/{s}/proventos-contabeis` |
| `composicao` | `GET /ativos/{s}/composicao-capital` |
| `comunicados` | `GET /empresas/{s}/comunicados?desde=<hoje − 1 ano>` |
| `noticias` | `GET /noticias/{s}` |
| `opcoes` | `GET /ativos/{s}/opcoes` |
| `operacional` | `GET /operacional/tickers/{s}` |
| `backtest` | `GET /validacao/backtest` |
| `diario` | `GET /validacao/diario?simbolo={s}&limite=60` |
| `pregoes` | `GET /ativos/{s}/pregoes?intervalo=dia&de=<hoje − 1 ano>` |

Nos testes, um contexto falso é `{ simbolo: 'PETR4', obter: async (k) => fixtures[k] ?? null }`.

**C3 — Eventos entre seções.** São disparados em `document` como `CustomEvent`, com `detail.simbolo` sempre presente. Quem escuta ignora eventos de outro símbolo.

| Evento | Emissor | `detail` |
|---|---|---|
| `f360:plano` | `secao-decisao` | `{ simbolo, acao: 'COMPRAR'\|'VENDER'\|'MANTER', forca: 0\|1\|2, entrada: {min, max}, alvo, stop, rr }` (números ou `null`) |
| `f360:destacar-data` | `secao-eventos` | `{ simbolo, dataIso }` |
| `f360:ir-para` | qualquer seção | `{ simbolo, secao: '<id de C5>' }` |

`secao-cabecalho` escuta `f360:plano`, `secao-grafico` escuta `f360:destacar-data` e a página escuta `f360:ir-para`. Sem emissor, o ouvinte segue funcionando sem o dado.

Método novo do `CandleChart`: `focarData(dataIso)` centraliza a vela da data e a destaca por 2 s. Quem implementa é a F360-PAI-11, dona do arquivo. Quem chama verifica `typeof grafico.focarData === 'function'` antes; se o método não existir, a chamada simplesmente não acontece.

**C4 — Tokens de cor.** São sempre usados com o fallback do tema claro, por exemplo `var(--f360-compra, #16a34a)`.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--f360-compra-forte` | `#15803d` | `#22c55e` | COMPRAR força 2, vela de alta |
| `--f360-compra` | `#16a34a` | `#4ade80` | COMPRAR força 1 |
| `--f360-manter` | `#b45309` | `#f59e0b` | MANTER, alerta |
| `--f360-venda` | `#be123c` | `#f43f5e` | VENDER, vela de baixa |
| `--f360-info` | `#0369a1` | `#38bdf8` | comunicados, overlays neutros |
| `--f360-superficie` | `#ffffff` | `#0f172a` | fundo da ficha |
| `--f360-superficie-2` | `#f1f5f9` | `#1e293b` | cartões |
| `--f360-texto-mudo` | `#64748b` | `#94a3b8` | rótulos, procedência |

Cor nunca vai sozinha: COMPRAR leva ▲, VENDER leva ▼ e MANTER leva ■.

**C5 — Manifesto de seções.** A ordem é fixa: `cabecalho`, `decisao`, `grafico`, `valuation`, `fundamentos`, `proventos`, `opcoes`, `eventos`, `operacao`, `ia`. Cada id corresponde ao caminho `components/ficha360/secoes/Secao<Id>.js` (com inicial maiúscula: `SecaoCabecalho.js`, `SecaoIa.js`...) e à tag `secao-<id>`. Cada seção é carregada pela página com `import()` dinâmico individual. Se a importação falhar, a página mostra "seção em construção" no lugar e as demais seguem. A âncora de cada seção é `#/ativo/{TICKER}?secao=<id>`.

**C6 — Campos e rotas novos do gestor** (detalhe em `gestor#F360-GES-*`). Todos em snake_case e podem vir `null`.
- `fundamentos-cvm` ganha `ebitda`, `ativo_circulante`, `passivo_circulante`, `cobertura_juros`, `liquidez_corrente`, `liquidez_seca`, `dso`, `graham_number`, `pl`, `ev_ebitda` e `pl_setorial_mediana`.
- `GET /analises/{s}/fundamentos-cvm/historico?anos=5` retorna `{ simbolo, pontos: [{ periodo, tipo_periodo, roe, roic, margem_liquida, divida_liquida, ebitda, liquidez_corrente, lpa, vpa, receita_liquida, lucro_liquido }] }`, em ordem crescente de período e só com períodos ANUAL e TTM.
- `GET /ativos/{s}/identidade` retorna `{ simbolo, cnpj, razao_social, isin, cnae, grupo_economico, situacao_registro, data_constituicao, uf_municipio, free_float }`.

**C7 — Regra do plano de operação** (implementada só em `analise/ficha360/planoDeOperacao.js`, função pura `montarPlano({ analise, fundamentosCvm, pregoes, backtest, opiniao })`):
- **Ação base:** `COMPRA_FORTE` vira COMPRAR com força 2. `COMPRA_MODERADA` vira COMPRAR com força 1. `ALERTA_RISCO` vira VENDER com força 2. `VENDA_VALUATION` vira VENDER com força 1. Qualquer outro valor vira MANTER com força 0.
- **ATR:** média de 14 pregões de `max(máx − mín, |máx − fech_ant|, |mín − fech_ant|)`. Com menos de 15 pregões, entrada, stop e R/R ficam `null` e a ação é mantida.
- **COMPRAR:**
  - suporte = menor mínima dos últimos 20 pregões;
  - stop = `max(suporte, preço − 2·ATR)`;
  - entrada = `[max(suporte, preço − ATR), preço]`;
  - alvo = média entre o valor justo base (Graham, da `analise`) e `lpa × pl_setorial_mediana`, ou só o que existir.
- **VENDER:**
  - resistência = maior máxima dos últimos 20 pregões;
  - stop = `min(resistência, preço + 2·ATR)`;
  - entrada = `[preço, min(resistência, preço + ATR)]`;
  - alvo = o mesmo valor justo da regra de compra.
- **R/R:** `|alvo − preço| / |preço − stop|`. Se `rr < 1,5` ou se o alvo estiver do lado errado do preço, a ação vira MANTER com força 0. O motivo vai em `motivos[]`.
- **Retorno:** `{ acao, forca, entrada, alvo, stop, rr, upside_pct, horizonte (da opiniao, ou null), taxa_acerto (do backtest para a recomendação de origem, ou null), motivos[] }`.

### Tarefas desta aplicação

| ID | Tarefa | Arquivos (posse exclusiva) | Aceite |
|---|---|---|---|
| F360-PAI-1 | Esqueleto da ficha: página `ficha-ativo-page`, `FichaContexto` (C2), manifesto (C5), rotas e executor de testes da pasta | novos: `pages/FichaAtivoPage.js`, `components/ficha360/FichaContexto.js`, `components/ficha360/manifesto.js`, `api/ficha360Api.js`, `tests/ficha360/executar.mjs`, `tests/ficha360/pagina.test.mjs`; editados: `router.js`, `main.js`, `navegacao.js` (item "Ficha do ativo" aponta para `#/ativo` e `#/ativo` entra no grupo Ativos), `tests/fluxosInterface.test.mjs` (espera o redirecionamento de `#/gestao/X`), `package.json` (só acrescenta `node tests/ficha360/executar.mjs`); novo auxiliar `components/ficha360/rotaFicha.js` | `#/ativo/X` abre a ficha. `#/gestao/X` e `#/ficha/X` redirecionam para `#/ativo/X`. `#/candles` sem símbolo abre o último ativo visto (`localStorage` `b3.ficha.ultimo.v1`, com leitura e escrita em try/catch) na seção `grafico`, ou `#/ativos` se não houver. As seções carregam por `import()`; seção ausente vira "em construção" sem quebrar as outras. Contexto com cache: duas seções pedindo a mesma chave geram uma só requisição. Faixa de âncoras (C5) fixa no topo. O executor roda todo `tests/ficha360/*.test.mjs` |
| F360-PAI-2 | Cabeçalho fixo | novos: `components/ficha360/secoes/SecaoCabecalho.js`, `tests/ficha360/cabecalho.test.mjs` | Mostra ticker, razão social, setor, preço, variação (▲/▼ com C4), data e fonte do preço, ISIN, CNPJ, situação na CVM, free float e a estrela (`<favorito-toggle>` reaproveitado). Ao receber `f360:plano`, mostra o selo da ação; sem o evento, não mostra selo. Campo `null` vira `—` |
| F360-PAI-3 | Plano de operação e faixa de decisão | novos: `analise/ficha360/planoDeOperacao.js`, `components/ficha360/secoes/SecaoDecisao.js`, `tests/ficha360/planoDeOperacao.test.mjs` | Implementa C7 como função pura com testes de: COMPRAR válido, VENDER válido, R/R < 1,5 rebaixado para MANTER, alvo do lado errado, menos de 15 pregões, P/L setorial ausente e `null` preservado. A faixa mostra ação, força, entrada, alvo (+%), stop (−%), R/R, horizonte e taxa de acerto em linguagem direta (DEC-F360-1). Emite `f360:plano` |
| F360-PAI-4 | Painel de velas reutilizável e seção Gráfico | novos: `components/painelCandles/PainelCandles.js`, `components/ficha360/secoes/SecaoGrafico.js`, `tests/ficha360/painelCandles.test.mjs`; editado: `pages/CandlesPage.js` | `<painel-candles simbolo="X">` reúne `candle-chart`, `painel-padroes`, `painel-tecnico` e as notícias do candle, usando as APIs públicas atuais sem editar esses componentes. Seletor de período e intervalo como hoje. `CandlesPage` passa a ser só seletor de ativo mais `<painel-candles>`, com comportamento igual. `SecaoGrafico` usa `<painel-candles>` e, ao receber `f360:destacar-data`, chama `focarData` no gráfico quando o método existir (C3) |
| F360-PAI-5 | Registro de overlays técnicos (aberto/fechado) | novos: `analise/overlays/registro.js`, `analise/overlays/*.js` (um por indicador), `tests/ficha360/overlays.test.mjs`; editado: `components/PainelTecnico.js` | Cada um dos 14 overlays vira `{ id, rotulo, horizonte, calcular(candles) → { linhas, marcadores } }` em arquivo próprio. O `PainelTecnico` só percorre o registro. Eventos e atributos públicos do `PainelTecnico` não mudam. Teste prova que um overlay novo entra apenas criando um arquivo e registrando-o, e que os 14 atuais produzem a mesma saída de antes para um conjunto fixo de velas |
| F360-PAI-6 | Seção Valuation | novos: `analise/ficha360/valuation.js`, `components/ficha360/secoes/SecaoValuation.js`, `tests/ficha360/valuation.test.mjs` | Reaproveita `ValorJustoRegua` (sem editá-lo). Acrescenta Graham Number, P/L atual × P/L setorial (mediana) com o preço implícito `lpa × pl_setorial_mediana`, EV/EBITDA e P/VP. Cada múltiplo vem colorido por faixa (C4) e com a fonte e a defasagem do balanço |
| F360-PAI-7 | Seção Fundamentos com sparklines | novos: `components/ficha360/Sparkline.js` (`<f360-sparkline>` genérico: valores, rótulos, formato), `analise/ficha360/seriesFundamentos.js`, `components/ficha360/secoes/SecaoFundamentos.js`, `tests/ficha360/fundamentos.test.mjs` | Blocos Rentabilidade (ROE, ROIC, margem), Endividamento (dívida líquida/EBITDA, cobertura de juros), Liquidez (corrente, seca, DSO) e Resultado (receita, EBITDA, lucro), cada um com valor atual, tendência de 5 anos (sparkline) e seta de direção. Sem `fundamentosHistorico`, mostra só o valor atual com "histórico indisponível" |
| F360-PAI-8 | Seções Proventos e Opções | novos: `components/ficha360/secoes/SecaoProventos.js`, `components/ficha360/secoes/SecaoOpcoes.js`, `tests/ficha360/proventosOpcoes.test.mjs` | Proventos reaproveita `ProventosContabeis` e acrescenta dividend yield dos últimos 12 meses e payout do último exercício. Opções mostra um resumo (vencimentos, nº de CALL/PUT válidas, strike mais negociado e status da cadeia) e link para `#/opcoes/X`, sem editar `OpcoesPainel` |
| F360-PAI-9 | Seção Eventos (linha do tempo única) | novos: `analise/ficha360/linhaDoTempo.js`, `components/ficha360/secoes/SecaoEventos.js`, `tests/ficha360/linhaDoTempo.test.mjs` | Junta comunicados CVM e notícias em ordem decrescente, com filtro por tipo e ícone por categoria. Clicar num item emite `f360:destacar-data`. Texto externo sempre escapado (`escaparHtml`) |
| F360-PAI-10 | Seções Operação e IA | novos: `components/ficha360/secoes/SecaoOperacao.js`, `components/ficha360/secoes/SecaoIa.js`, `tests/ficha360/operacaoIa.test.mjs` | Operação reaproveita `OperabilidadeAtivo` e tem link "simular este ativo" para `#/simulador`. IA reaproveita `AtivoIa`. Nenhum dos dois componentes reaproveitados é editado |
| F360-PAI-11 | Paleta e tema | editados: `public/css/app.css`, `components/CandleChart.js`; novo: `tests/ficha360/paleta.test.mjs` | Tokens C4 definidos em `:root` e `[data-bs-theme="dark"]`. O `CandleChart` lê `--f360-compra-forte`/`--f360-venda` via `getComputedStyle` (fallback para as cores atuais) e redesenha ao trocar o tema. Acrescenta `focarData(dataIso)` (C3). O resto da API pública do `CandleChart` fica inalterado |
| F360-PAI-12 | Remoção da aba Cadastro e documentação de rotas | editados: `pages/GestaoPage.js`, `README.md`, seção 2.1 desta SPEC; removido: `pages/CadastroPage.js`; novo: `tests/ficha360/semCadastro.test.mjs` | `GestaoPage` sem a aba Cadastro e sem importar `CadastroPage`. README e seção 2.1 descrevem `#/ativo/X` como ficha e os redirecionamentos. `tests/proxyFluxos.test.mjs` continua passando (a rota `POST /ativos/registrar` do proxy não é tocada) |

### Grupos para dividir entre agentes

As tarefas são independentes (regra 1) e não compartilham arquivos (regra 2), então qualquer divisão funciona. Os três grupos abaixo equilibram volume de trabalho e mantêm afinidade de assunto dentro de cada agente.

| Grupo | Tarefas | Foco | Perfil sugerido |
|---|---|---|---|
| **A — Estrutura e visual** | F360-PAI-1, F360-PAI-2, F360-PAI-10, F360-PAI-11, F360-PAI-12 | página, rotas, contexto, cabeçalho, paleta, limpeza | agente com bom contexto do repositório (ex.: Codex) |
| **B — Gráfico e decisão** | F360-PAI-3, F360-PAI-4, F360-PAI-5, F360-PAI-9 | regra de trading pura, velas, overlays, linha do tempo | agente forte em lógica e testes (ex.: Devin) |
| **C — Dados e conteúdo** | gestor#F360-GES-1, gestor#F360-GES-2, gestor#F360-GES-3, F360-PAI-6, F360-PAI-7, F360-PAI-8 | endpoints Java e as seções que os consomem | agente que atua nos dois repositórios (ex.: Copilot no gestor + painel) |

Os grupos podem rodar ao mesmo tempo e em qualquer ordem. A ordem de merge também é livre: cada PR é seguro sozinho porque o que falta aparece como estado vazio.

### Aceite do plano

- `npm test` passa em cada branch isolada e depois de todas mescladas.
- `#/ativo/PETR4` mostra as dez seções, com cabeçalho e faixa de decisão visíveis sem rolar em 1366×768 e em 375 px de largura sem rolagem horizontal.
- Tema claro e escuro legíveis. Nenhum `null` aparece como zero.
- Nenhum texto de disclaimer regulatório na ficha (DEC-F360-1).

---

## Plano AJUDA: ícones de contexto na aba Operabilidade (2026-10-17)

**Status:** IMPLEMENTADO (2026-10-17) · **Rótulo das tarefas:** `AJUDA-PAI-*`. IDs reservados; não renomear.

**Objetivo:** adicionar um botão `?` no canto superior direito de cada card da aba Operabilidade. Ao clicar, um popover inline (sem dependência externa) exibe título e descrição do card e fecha ao clicar fora. Nenhuma rota nova no backend.

### Regras de execução paralela

Mesmas do Plano F360 (regras 1–7, seção acima). Cada tarefa possui posse exclusiva dos arquivos listados. A AJUDA-PAI-1 cria o utilitário; as demais só o importam e não o editam. Branch `feature-ajuda-pai-N` a partir de `develop`.

### Tarefas desta aplicação

| ID | Tarefa | Arquivos (posse exclusiva) | Depende | Aceite | Status |
|---|---|---|---|---|---|
| AJUDA-PAI-1 | **Utilitário `htmlAjuda`:** `htmlAjuda(id, titulo, texto)` retorna botão `?` com popover `role="tooltip"` absolutamente posicionado; fecha via `mousedown` no `document` com `closest`; `aria-expanded` e `aria-describedby`; CSS próprio na seção `/* === AJUDA POPOVER === */` de `app.css` (`.btn-ajuda`, `.ajuda-popover`, `.ajuda-popover.visivel`); `tests/ajuda.test.mjs` cobre: abre, fecha ao clicar fora, escapa título e texto | novos: `public/js/utils/ajuda.js`; editado: `public/css/app.css` | — | Função exportada; popover responsivo sem quebrar layout; `npm test` verde | IMPLEMENTADO (2026-10-17) |
| AJUDA-PAI-2 | **Integração em `OperabilidadePage.js`:** importa `htmlAjuda` e insere `${htmlAjuda(...)}` em `htmlResumo` (status/badge, pregões avaliados), `htmlMaturidade` (barras 63/126) e `htmlOperabilidade` (alertas) com textos contextuais | editado: `public/js/pages/OperabilidadePage.js` | AJUDA-PAI-1 | Cards com botão `?` visível; conteúdo do popover não vazio; layout intacto | IMPLEMENTADO (2026-10-17) |
| AJUDA-PAI-3 | **Integração em `GraficoOperabilidade.js`:** importa `htmlAjuda` e insere botão na legenda/cabeçalho do gráfico retorno × CDI | editado: `public/js/components/operacional/GraficoOperabilidade.js` | AJUDA-PAI-1 | Card do gráfico com botão `?`; popover descreve o eixo e a comparação com CDI líquido | IMPLEMENTADO (2026-10-17) |
| AJUDA-PAI-4 | **Integração em `CarteiraSimulada.js`:** botão `?` no cabeçalho do card carteira com texto "Posições abertas pela regra de entrada vigente. Sem execução real." | editado: `public/js/components/operacional/CarteiraSimulada.js` | AJUDA-PAI-1 | Card com botão `?`; popover correto | IMPLEMENTADO (2026-10-17) |
| AJUDA-PAI-5 | **Integração em `BloqueiosOperacionais.js`:** botão `?` com texto "Lista os motivos que impedem a regra de abrir novas posições: liquidez, dado ausente, drawdown." | editado: `public/js/components/operacional/BloqueiosOperacionais.js` | AJUDA-PAI-1 | Card com botão `?`; popover correto | IMPLEMENTADO (2026-10-17) |

### Grupos para agentes paralelos

| Grupo | Tarefas | Pode iniciar em |
|---|---|---|
| **A — Base** | AJUDA-PAI-1 | imediato |
| **B — Integrações** | AJUDA-PAI-2, AJUDA-PAI-3, AJUDA-PAI-4, AJUDA-PAI-5 | após AJUDA-PAI-1 merged |

### Aceite do plano

- Cada card da aba Operabilidade exibe botão `?` discreto (18×18 px, `border-radius: 50%`, `text-muted`).
- Clicar abre o popover; clicar fora ou no `×` fecha.
- Nenhum layout quebra em 375 px.
- `npm test` verde.

---

## Plano CART: feature Carteiras (revisado 2026-10-18)

**Status:** PLANEJADO — o store local atual não atende persistência financeira · IDs `CART-PAI-*` preservados como plano de interface/legado.

**Objetivo:** `#/carteiras` persistida no backend e compartilhada na instância single-user. Registrar operações informadas pelo usuário (quantidade comprada/vendida, preço, custos e data), recebimentos de proventos e snapshots históricos de patrimônio/retorno. Cotações oficiais vêm do COTAHIST; a aplicação não executa ordens nem declara custódia. `localStorage` é apenas origem de importação legada e cache transitório, nunca fonte de verdade. Não há entidade de dono; nome é apenas rótulo descritivo.

### Regras de execução paralela

Pré-requisitos: schema V43+ e API compartilhada do gestor. Mudanças de banco somente em Infra; operações e proventos persistidos no gestor; interface consome contrato estabilizado. Sem importar silenciosamente dados órfãos V42.

### Tarefas desta aplicação

| ID | Tarefa | Arquivos (posse exclusiva) | Depende | Aceite | Status |
|---|---|---|---|---|---|
| CART-PAI-1 | **Store/API compartilhada e importação legado:** migrar `b3-carteiras` idempotentemente; fonte de verdade é API, cache local só transitório; preservar registros e alocações V42 sem criar transações inferidas | `public/js/utils/carteirasStore.js` | CARTDB-GES-1/6 | Sem owner/autenticação; falha mantém cópia e mostra erro | PLANEJADO |
| CART-PAI-2 | **Formulários de operação:** compra/venda com ticker, quantidade, preço unitário, custos e data; confirmação explícita de registro informado, não ordem executada | componentes Carteiras | CARTDB-GES-2 | Dados completos persistidos; correções via estorno referenciado, sem editar/apagar o ledger | PLANEJADO |
| CART-PAI-3 | **Proventos recebidos:** registrar dividendos/JCP/rendimentos, datas, quantidade elegível, bruto, retenção, líquido e referência | componentes Carteiras | CARTDB-GES-3 | Recebimento distinto de anúncio; deduplicação/ajustes explícitos | PLANEJADO |
| CART-PAI-4 | **Preço de custo e posição:** derivar quantidade líquida e custo das operações; preço de mercado vem do serviço oficial e traz pregão/fonte | componentes Carteiras | CARTDB-GES-2/4 | Alocações antigas não aparecem como compras; sem dado usar estado indisponível | PLANEJADO |
| CART-PAI-5 | **Retorno histórico:** consumir snapshots versionados, decompor realizado/não realizado/proventos e mostrar método/data de corte | `CarteirasPage.js` e gráfico | CARTDB-GES-4/5 | Reconciliável; ausência não vira zero; fluxo externo tratado conforme metodologia | PLANEJADO |
| CART-PAI-6 | **Estados de sincronização e compartilhamento:** erro de rede, arquivamento, sincronização e aviso de dados compartilhados na instância | store/page | CARTDB-PAI-1 | UI nunca indica privacidade por usuário nem confirma persistência antes da resposta | PLANEJADO |
| CART-PAI-7 | **Página e navegação:** integrar CRUD, operações, proventos, posição e retorno em `#/carteiras`, com estados vazios/legado/erro | `CarteirasPage.js`, router, navegação | CART-PAI-1..6 | Fluxos acessíveis, dados persistem após reload e critérios financeiros reconciliam com API | PLANEJADO |

### Grupos para agentes paralelos

| Grupo | Tarefas | Pode iniciar em |
|---|---|---|
| **A — fundação** | V43+, CARTDB-GES-1..6 | antes de qualquer tela financeira |
| **B — persistência frontend** | CART-PAI-1..3, 6 | após API compartilhada estabilizada |
| **C — posição e desempenho** | CART-PAI-4..5, 7 | após ledger, eventos e snapshots disponíveis |

### Aceite do plano

- `#/carteiras` carrega sem erro de console; link de navegação ativo.
- Operações (quantidade/preço), proventos recebidos e retorno histórico persistem no servidor; a aplicação informa que os dados são compartilhados na instância.
- A importação local é idempotente e nunca transforma capital alocado em execução real.
- Adicionar e remover ativo persiste.
- Retorno e patrimônio vêm dos snapshots versionados; alocações simuladas V42 não entram como posições compradas nem como retorno realizado.
- `npm test` verde.

---

## Plano OPCX: opções orientadas ao ativo (2026-10-17)

**Status:** PLANEJADO · **Rótulo das tarefas:** `OPCX-PAI-*`. IDs reservados; não renomear. (Prefixo diferenciado de `OPT-PAI-*` do plano anterior.)

**Objetivo:** reorganizar `#/opcoes` para colocar o contexto do ativo em primeiro plano. Hoje a tela exibe a saúde da cadeia antes mesmo de o usuário selecionar um ativo. A proposta: sidebar com os dados de contexto do ativo (preço, range, Graham, vol, ex-dividendos) ao lado da tabela de opções; saúde da cadeia move para `<details>` colapsável no rodapé.

### Regras de execução paralela

Mesmas do Plano F360 (regras 1–7). Branch `feature-opcx-pai-N` a partir de `develop`. OPCX-PAI-1 (sidebar) e OPCX-PAI-2 (CSS) podem rodar em paralelo; OPCX-PAI-3 (integração) depende de ambas.

### Tarefas desta aplicação

| ID | Tarefa | Arquivos (posse exclusiva) | Depende | Aceite | Status |
|---|---|---|---|---|---|
| OPCX-PAI-1 | **Sidebar de contexto** `<ativo-contexto-opcoes>`: recebe `contexto` (resultado de `_montarContexto` em `OpcaoPage.js`) via `setContexto(obj)`; bloco 1 — preço atual, variação do dia, máx/mín 63d, barra de posição no range, variação no período; bloco 2 — Graham Number, recomendação (badge), margem de segurança, vol21d, ATR14, volume relativo, ex-dividendos; `null` vira `—`; `tests/opcx.test.mjs` cobre render com contexto completo e com tudo `null` | novo: `public/js/components/opcoes/AtivoContextoOpcoes.js` | — | Ambos os blocos renderizam; `null` universal produz `—` em todos os campos; sem erro de console | IMPLEMENTADO (develop) |
| OPCX-PAI-2 | **CSS layout duas colunas:** seção `/* === OPCOES LAYOUT === */` ao final de `app.css`; `.opcoes-layout { display:flex; gap:1rem; align-items:flex-start }`, `.opcoes-sidebar { width:260px; flex-shrink:0; position:sticky; top:1rem }`, `.opcoes-principal { flex:1; min-width:0 }`; breakpoint `max-width:767px` empilha sidebar acima do principal | editado: `public/css/app.css` | — | Layout visível em 1280 px (lado a lado) e em 375 px (empilhado); sem rolagem horizontal | IMPLEMENTADO (develop) |
| OPCX-PAI-3 | **Refatoração de `OpcaoPage.js`:** importa `AtivoContextoOpcoes`; move `<saude-cadeia-opcoes>` para `<details open>` no rodapé; em `_renderizar` envolve painel + seletor em `.opcoes-layout` com `<aside class="opcoes-sidebar"><ativo-contexto-opcoes></ativo-contexto-opcoes></aside>`; após `painel.setDados(dados)`, chama `contextoEl.setContexto(this._contexto)`; mantém toda a lógica e imports existentes | editado: `public/js/pages/OpcaoPage.js` | OPCX-PAI-1, OPCX-PAI-2 | Tela sem ativo: só seletor + saúde colapsada. Com ativo: sidebar ao lado da tabela. Mobile: sidebar empilhada acima. `npm test` verde | IMPLEMENTADO (develop) |

### Grupos para agentes paralelos

| Grupo | Tarefas | Pode iniciar em |
|---|---|---|
| **A — Sidebar e CSS** | OPCX-PAI-1, OPCX-PAI-2 | imediato (paralelo entre si) |
| **B — Integração** | OPCX-PAI-3 | após OPCX-PAI-1 e OPCX-PAI-2 merged |

### Aceite do plano

- Entrar em `#/opcoes` sem ativo: seletor + saúde em `<details>` (aberto). Sem bloco de contexto visível.
- Selecionar ativo: sidebar com contexto ao lado da tabela de opções.
- Em 375 px: sidebar empilha acima da tabela; sem rolagem horizontal.
- `npm test` verde.

---

## Plano CARGA: página de controle das cargas (2026-10-18)

**Status:** PLANEJADO · **Contexto, contrato e ordem:** `infra-b3-ecossytem/SPEC.md`, Plano CARGA. Rótulo `CARGA-PAI-*`, reservado. O painel só fala com o gestor (`/cargas`), nunca com o ETL nem com o banco.

### Página `#/cargas` — "Cargas de dados" (grupo Avaliação no menu)

Ordem na tela, de cima para baixo:

1. **Cabeçalho:** título, carga em andamento (se houver: tipo, há quanto tempo, etapa atual) e o botão **Rodar carga**.
2. **Estado por etapa:** uma grade de cartões, um por etapa do catálogo (COTAHIST, LIQUIDEZ, PRONTIDAO, QUALIDADE_OPCOES, DFP, TTM, IPE, DVA, EVENTOS, CHECAGENS). Cada cartão mostra:
   - nome legível da etapa e da fonte (ex.: "Preço oficial B3 · COTAHIST");
   - **última tentativa**: data/hora e selo de status;
   - **último sucesso**: data e "há N dias";
   - destaque de **defasagem** quando o último sucesso passou do esperado (COTAHIST e LIQUIDEZ > 1 pregão; DFP/TTM/DVA > 120 dias; IPE > 2 dias);
   - clique leva ao detalhe da execução da última tentativa.
3. **Histórico de execuções:** tabela com início, tipo (Rotina/Completa/Parcial), quem pediu (Rotina da manhã/Painel/API), duração, status e contagem `ok · alerta · falha`. Filtros por status e período; paginação. A linha abre o detalhe.
4. **Detalhe da execução** (painel lateral ou página `#/cargas/{id}`):
   - parâmetros usados (anos, símbolos, etapas, forçar);
   - linha do tempo das etapas, com duração e status;
   - por etapa, **o que foi carregado** (`metricas`: anos processados, anos sem mudança, lidos, gravados, rejeitados e rejeitados por motivo), **alertas** e **erros**, com o texto completo copiável;
   - **arquivos baixados** (`etl_execucao`): fonte, competência, arquivo, ETag, linhas e status.

**Selos de status** (cor + ícone, nunca só cor; tokens C4 do Plano F360): Sucesso ✔ verde · Sem mudança ＝ cinza · Alerta ▲ âmbar · Falha ✖ vermelho · Em execução ⟳ azul · Interrompida ⏸ cinza escuro · Pulada – cinza claro. O status da execução usa os mesmos selos (Sucesso com alerta = âmbar; Sucesso parcial = laranja).

**Rodar carga:** modal com tipo (Rotina/Completa/Parcial), anos (só na Parcial/Completa), símbolos (reaproveita `<busca-ativos modo="multiplo">`), etapas (caixas de seleção, na Parcial) e "forçar reprocessamento". Mostra um resumo do que será feito e pede confirmação. Fica desabilitado enquanto há carga em andamento; 409 do gestor vira "já existe uma carga rodando" com link para ela.

**Acompanhamento ao vivo:** com uma execução `PENDENTE`/`EXECUTANDO`, a página consulta `GET /cargas/{id}` a cada 5 s, atualiza a etapa atual e os cartões, e para ao terminar ou ao sair da página (sem polling em segundo plano).

**Estados vazios e de erro:** sem nenhuma carga registrada ("Nenhuma carga registrada ainda — a primeira rotina da manhã preenche esta tela"); gestor sem a V44 (503: "o banco ainda não tem o controle de cargas"); falha de rede (mensagem + "Tentar de novo"). `null` vira "—", nunca zero.

### Tarefas desta aplicação

| ID | Tarefa | Arquivos | Depende | Aceite | Status |
|---|---|---|---|---|---|
| CARGA-PAI-1 | Rota, API e estado por etapa | `api/cargasApi.js`, `pages/CargasPage.js`, `components/cargas/EstadoEtapas.js`, `analise/cargas.js` (rótulos, selos, defasagem — puro), `router.js`, `navegacao.js`, `proxy/apiProxy.js` (`/cargas`); `tests/cargas.test.mjs` | CARGA-GES-1 (contrato) | `#/cargas` no grupo Avaliação; cartões com última tentativa, último sucesso e defasagem; estados vazio/503/erro; testes da lógica pura (status, defasagem, rótulos) | IMPLEMENTADO (develop) |
| CARGA-PAI-2 | Histórico e detalhe da execução | `components/cargas/HistoricoCargas.js`, `components/cargas/DetalheCarga.js`; `tests/cargasDetalhe.test.mjs` | CARGA-PAI-1 | Tabela com filtros e paginação; detalhe com parâmetros, linha do tempo, métricas, alertas, erros e arquivos; texto externo escapado; erro longo copiável | IMPLEMENTADO (develop) |
| CARGA-PAI-3 | Disparo pelo painel | `components/cargas/RodarCarga.js` (modal); `tests/cargasDisparo.test.mjs` | CARGA-PAI-2, CARGA-GES-2, DEC-CARGA-1 | Modal valida e resume antes de confirmar; 202 abre a execução; 409 aponta a carga em andamento; 503 explica que o ETL está fora | IMPLEMENTADO (develop) |
| CARGA-PAI-4 | Acompanhamento ao vivo | `pages/CargasPage.js`, `components/cargas/DetalheCarga.js` | CARGA-PAI-3 | Polling de 5 s só com execução ativa e página aberta; para ao terminar; cartões e detalhe atualizam sem recarregar a página | IMPLEMENTADO (develop) |
| CARGA-PAI-5 | Avisos de defasagem fora da página | `pages/InicioPage.js`, `components/SaudeDosDados.js` | CARGA-PAI-1, CARGA-GES-3 | Início e Saúde dos dados mostram "carga atrasada" com link para `#/cargas` quando alguma etapa passa do limite de defasagem | IMPLEMENTADO (develop) |

---

## Plano MACRO: `#/indices` como painel de custo de oportunidade (2026-10-20)

**Status:** PLANEJADO · **Rótulo das tarefas:** `MACRO-PAI-*`; o gestor tem `MACRO-GES-*` na SPEC dele. Hoje `pages/IndicesMacroPage.js` mostra 8 cartões com o valor atual e 6 pontos, sem gráfico, acumulado, tendência, expectativa nem ligação com os ativos. O objetivo é que a tela responda: "com os juros de hoje, quais ações compensam?".

### Tarefas desta aplicação

| ID | Tarefa | Arquivos (posse exclusiva) | Depende | Aceite | Status |
|---|---|---|---|---|---|
| MACRO-PAI-1 | Cabeçalho de decisão | `pages/IndicesMacroPage.js` (topo); `api/indicesMacroApi.js` (`buscarPainelMacro`) | MACRO-GES-3 | Mostra juro real, ciclo da Selic, Focus de Selic e IPCA e a barreira de compra (earnings yield mínimo), cada um com a leitura do gestor; sem o `/painel`, o bloco some e os cartões continuam | PLANEJADO |
| MACRO-PAI-2 | Cartões com gráfico e agrupados | `pages/IndicesMacroPage.js` (cartões); novo `analise/macro/series.js` (variações e acumulado, puro) | — (MACRO-GES-4 opcional) | Sparkline de 12 meses com `<f360-sparkline>`; variação em 1, 3 e 12 meses; acumulado em 12 meses para IPCA e IGP-M; tabela de pontos vira detalhe ao clicar; grupos **Juros**, **Inflação**, **Câmbio** e **Atividade**; funciona com o endpoint atual | PLANEJADO |
| MACRO-PAI-3 | Ligação com os ativos | `pages/IndicesMacroPage.js` (bloco "Ativos acima da barreira"); `components/ficha360/secoes/SecaoValuation.js` (linha earnings yield × Selic) | MACRO-GES-3 | Lista de ativos com earnings yield acima da Selic e do juro real, em cartões de ticker (reaproveitando os da busca de ativos) que levam a `#/ativo/{T}`; na ficha, uma linha compara o earnings yield do ativo com a Selic atual, no padrão de `FundamentosCard` | PLANEJADO |
| MACRO-PAI-4 | Glossário, fórmulas e testes | `pages/GlossarioPage.js`, `pages/FormulasPage.js`; novo `tests/indicesMacro.test.mjs` (no `npm test`) | MACRO-PAI-2 | Verbetes de juro real, Focus, barreira de earnings yield e IPCA em 12 meses; testes da lógica pura de `analise/macro/series.js` e da renderização dos cartões | PLANEJADO |

### Grupos para agentes paralelos

| Onda | Tarefas | Observação |
|---|---|---|
| 0 | MACRO-PAI-2 | Já roda com o endpoint atual |
| 1 | MACRO-PAI-4 | |
| 2 | MACRO-PAI-1, MACRO-PAI-3 | Dependem do `/indices-macro/painel`; os dois mexem em `IndicesMacroPage.js`, então rodam em sequência ou com seções delimitadas |

### Aceite do plano
`http://127.0.0.1:8082/#/indices` mostra o cabeçalho de decisão, os cartões agrupados com sparkline e a lista de ativos acima da barreira, cada um levando à ficha; `npm test` passa.

---

## Plano consolidado CONS: MACRO + FONTES + MICRO enxuto, migration única (2026-10-20)

**Status:** PLANEJADO · **Rótulos:** `FONTES-PAI-*`, `MICRO-PAI-*`, `CONS-PAI-*`, `MACRO-PAI-*` · **Contrato, ondas e dependências entre serviços:** `infra-b3-ecossytem/SPEC.md`, Plano consolidado CONS. Escopo painel. As tarefas `MACRO-PAI-*` estão no Plano MACRO acima e fazem parte deste plano; aqui ficam os donos de arquivo. Fontes públicas sem cadastro nem chave. Uma única migration nova (V45, CONS-INFRA-1). Regra de independência: cada tarefa tem posse exclusiva dos arquivos listados; arquivos compartilhados têm um único dono.

### Tarefas desta aplicação
| ID | Tarefa | Arquivos (posse) | Depende | Aceite |
|---|---|---|---|---|
| **MACRO-PAI-2** | Cartões com gráfico em `#/indices` | `IndicesMacroPage.js` (dono das tarefas MACRO-PAI-1, 2 e 3 e de FONTES-PAI-5), `analise/macro/series.js` | — **independente** | Funciona com o endpoint atual |
| **MICRO-PAI-1** | Gráfico: marca ex e preço médio; padrões ignoram o gap do dia ex | `painelCandles/`, `analise/overlays/`, detector de padrões | MICRO-GES-1 | Sem sinal falso no dia ex |
| **MICRO-PAI-2** | Opções: preço justo pelo meio do spread e spread % | `SecaoOpcoes`, `OpcaoPage` (opcoes-painel) | MICRO-GES-1 | Séries sem oferta marcadas |
| **CONS-PAI-1** | Proxy: `/opcoes`, `/proventos` e rotas novas | `proxy/apiProxy.js` | — **independente** | `/opcoes/saude` deixa de dar 404 |
| **MACRO-PAI-1/3, FONTES-PAI-5** | Cabeçalho de decisão, ativos acima da barreira, curva NTN-B (feitas em sequência, mesmo dono) | `IndicesMacroPage.js` | MACRO-GES-3, FONTES-GES-1 | |
| **FONTES-PAI-1** | Valuation: prêmio de risco, Graham com juros e linha earnings yield × Selic (dono de `SecaoValuation`, absorve parte de MACRO-PAI-3) | `SecaoValuation.js` | FONTES-GES-1, MACRO-GES-3 | |
| **FONTES-PAI-2** | Ficha de banco | `SecaoFundamentos.js` | FONTES-GES-2 | |
| **FONTES-PAI-3** | Seção "Quem está dentro" | nova `SecaoInsiders.js` | FONTES-GES-3 | |
| **FONTES-PAI-4** | Selos de confiabilidade e filtro | `SecaoCabecalho.js`, tabela de ativos | FONTES-GES-4 | |
| **MICRO-PAI-3** | Renda: calendário ex e custo do spread no plano | `SecaoProventos.js`, `planoDeOperacao.js` | MICRO-GES-2 | |
| **MACRO-PAI-4** | Glossário e Fórmulas (dono único) | `GlossarioPage.js`, `FormulasPage.js` | todas as tarefas PAI acima | Verbetes de todos os planos |

### Ondas de execução
| Onda | Tarefas em paralelo, sem colisão | Por que podem rodar juntas |
|---|---|---|
| **0** | CONS-SPEC-1, FONTES-ETL-1, 2, 5, 6, MICRO-ETL-1, 2, MACRO-GES-1, 2, 4, MICRO-GES-1, MACRO-PAI-2, CONS-PAI-1 | Não tocam no banco nem em arquivo compartilhado |
| **1** | **CONS-INFRA-1 (V45, execução única)**, FONTES-ETL-3, 4, 7, MACRO-GES-3, MICRO-PAI-1, MICRO-PAI-2 | A V45 só espera o inventário. Os leitores da onda 1 são arquivos próprios |
| **2** | FONTES-ETL-8, CONS-INFRA-2 | O ETL-8 é o único que mexe no catálogo |
| **3** | CONS-INFRA-3 (backfill), FONTES-GES-1..4, MICRO-GES-2 | Precisam das tabelas com dados |
| **4** | MACRO-PAI-1/3 + FONTES-PAI-5, FONTES-PAI-1..4, MICRO-PAI-3 | Uma tarefa por arquivo |
| **5** | MACRO-PAI-4 | Textos por último. O score pelo backtest saiu daqui: ver `SINAIS-INS-*` no gerar-insights |

### Status de execução (2026-10-21)

Resultado de cada tarefa executada: estado, branch e observação. As entregas foram integradas em `feature-consolidacao-painel`, preservando todos os commits originais e resolvendo os conflitos de código e testes. Regra permanente: uma feature, uma branch e vários commits; não criar branches por tarefa. Evidência em `docs/cons/CONSOLIDACAO-PAINEL.md`.

| ID | Estado | Branch | Observação |
|---|---|---|---|
| MACRO-PAI-1 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| MACRO-PAI-2 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| MACRO-PAI-3 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| MACRO-PAI-4 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` | 34 verbetes e 24 fórmulas; links da seção `insiders` dependem da integração de FONTES-PAI-3 |
| FONTES-PAI-1 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| FONTES-PAI-2 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| FONTES-PAI-3 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| FONTES-PAI-4 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` | filtro da tabela só pelo cadastro CVM, na página carregada |
| FONTES-PAI-5 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| MICRO-PAI-1 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| MICRO-PAI-2 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` |  |
| MICRO-PAI-3 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` | inclui a correção do plano de operação com a resposta real de /pregoes |
| CONS-PAI-1 | IMPLEMENTADO (2026-10-21) | `feature-consolidacao-painel` | /opcoes e /proventos no proxy |

## Plano MERC: carrossel "Panorama do mercado" na Início (2026-10-20)

**Status:** PLANEJADO · **Contexto, regras de cálculo, contrato JSON e ordem:** `infra-b3-ecossytem/SPEC.md`, Plano MERC. Rótulo `MERC-PAI-*`, reservado. O painel só fala com o gestor (`GET /mercado/panorama`); não recalcula nada, só ordena para exibir, formata e desenha.

### Onde e como aparece

- No topo da `InicioPage`, logo abaixo do `<aviso-defasagem-cargas>` e antes dos alertas operacionais.
- Seletor de período compartilhado pelos cards que dependem dele: **1 dia · 5 dias (padrão) · 21 dias · no ano**. O card de liquidez não muda com o seletor e diz isso.
- Cada card mostra no rodapé a data do pregão e o universo considerado (ex.: "196 ações líquidas · pregão de 19-10-2026").

### Componentes

| Componente | Responsabilidade |
|---|---|
| `<carrossel-mercado>` | Recebe uma lista de cards. Troca sozinho a cada 10 s e para com mouse em cima ou foco dentro; setas, bolinhas, teclado (←/→) e swipe no celular; respeita `prefers-reduced-motion` (sem rotação automática); `aria-roledescription="carrossel"`, cada card com `aria-label` e anúncio "card N de M". Cada card carrega e falha sozinho. |
| `<ranking-tickers>` | Reutilizado em todos os cards com ranking: duas colunas, "Maiores" e "Menores", 10 linhas cada, com posição, ticker clicável (`#/ativo/XXXX`), setor, valor formatado e barra proporcional. No celular as colunas viram abas "Maiores \| Menores". Valor com sinal e texto, nunca só cor (tokens C4 do Plano F360). |
| `analise/panoramaMercado.js` | Puro e testável: formatação, ordem de exibição, texto dos selos de coesão (`JUNTO` "andou junto", `MISTO` "misto", `DISPERSO` "disperso"), escala das barras, estado vazio por bloco de `indisponivel`. |
| `api/mercadoApi.js` | `buscarPanorama(janela)`, no padrão dos outros clientes de API. |

### Tarefas desta aplicação

| ID | Tarefa | Arquivos | Depende | Aceite | Status |
|---|---|---|---|---|---|
| MERC-PAI-1 | Carrossel e ranking reutilizáveis | `components/inicio/CarrosselMercado.js`, `components/inicio/RankingTickers.js`, `api/mercadoApi.js`, `InicioPage.js` (só o encaixe) | contrato do hub | Rotação, pausa, teclado, swipe, reduced-motion e ARIA conforme a tabela acima; `<ranking-tickers>` com 10+10, abas no celular e ticker clicável; carrossel com card de exemplo enquanto o gestor não responde; um card com erro não afeta os outros nem a Início; testes node (`tests/merc*.test.mjs`, no `npm test`) | PLANEJADO |
| MERC-PAI-2 | Card setores × empresas | `components/inicio/cards/CardSetoresEmpresas.js`, `analise/panoramaMercado.js` | MERC-PAI-1, MERC-GES-1 | Lista de setores pela mediana, com barra divergente, nº de empresas, selo de coesão e chips "melhor"/"pior"; ao clicar no setor expande os 10 melhores e 10 piores (por desvio da mediana), com variação e desvio; "Outros" sempre por último; segue o seletor de período; estado vazio quando `setores` está em `indisponivel`; testes | PLANEJADO |
| MERC-PAI-3 | Cards de altas/quedas, liquidez, negociação e amplitude | `components/inicio/cards/CardAltasQuedas.js`, `CardLiquidez.js`, `CardNegociacao.js`, `CardAmplitude.js` | MERC-PAI-1, MERC-GES-1 | Altas/quedas, liquidez (volume médio 63d, presença e spread; selos "boa para operar" e "liquidez baixa: cuidado com spread") e negociação (volume financeiro e nº de negócios no período) com `<ranking-tickers>` 10+10; liquidez avisa que não depende do período; amplitude com subiram/caíram/estáveis e % acima da média 21; testes | PLANEJADO |
| MERC-PAI-4 | Cards de volume fora do normal, macro e eventos | `components/inicio/cards/CardVolumeAnormal.js`, `CardMacro.js`, `CardEventos.js` | MERC-PAI-1, MERC-GES-2 | Volume anormal top 10 (razão sobre a média 21d), macro sem ranking, eventos (10 mais recentes, com link para a ficha); estado vazio por bloco; testes | PLANEJADO |

MERC-PAI-2 e MERC-PAI-3 podem rodar em paralelo depois da MERC-PAI-1 (arquivos distintos). Status em `docs/merc/<ID>.md`.
