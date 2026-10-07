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
- **Fila local:** LAC-FE-1..4 `PLANEJADO` (seção final). Sem V16 as telas mostram "sem dado ainda". Regra experimental sempre visível. Datas por `utils/dataHora.js`.
- **Divergência conhecida:** ISS-07 (texto de Avaliação ainda diz que IC está pendente) — fechar junto com LAC-FE-1.
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
| #/monitorados | Carteira monitorada, decisões e detalhes expansíveis |
| #/candles | Velas, padrões, notícias e comunicados relacionados |
| #/comunicados | Newsletter por semana e linha do tempo por ativo |
| #/noticias | Notícias |
| #/setores | Ativos agrupados por setor |
| #/indices | Séries macroeconômicas |
| #/avaliacao | Avaliação editorial, saúde de dados, backtest e diário de sinais |
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

Valores atuais de nivel: Introdutório, Básico, Intermediário, Avançado, Especialização e Formação completa. “Formação completa” descreve abrangência, não dificuldade: inconsistência editorial registrada em ISS-08.

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

O proxy cobre oito prefixos: /ativos, /analises, /api, /setores, /indices-macro, /empresas, /comunicados e /validacao. Notícias têm tratamento próprio em server.js. Chamadas usam a mesma origem do front.

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
| REQ-15 | Busca combinada com dificuldade e tipo | IMPLEMENTADO — teste atual verifica atributos HTML, não interação |
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
| ISS-02 | Média | Bootstrap e gráficos dependem de CDN; validar alternativa offline antes de prometer suporte offline | PLANEJADO |
| ISS-03 | Média | Testes de componentes/proxy e fluxos reais ainda parciais; adicionar cenários de navegação, filtros, PDF e armazenamento indisponível | EM ANDAMENTO |
| ISS-04 | Histórico | Recomposição de prefixo no proxy implementada | IMPLEMENTADO |
| ISS-05 | Histórico | Remoção de Origin no proxy implementada | IMPLEMENTADO |
| ISS-06 | Média | SPEC não representava o produto; revisão confrontada com código e suíte em 27/09 | VERIFICADO |
| ISS-07 | Média | Texto de Avaliação desatualizado sobre IC e tarefas; reconciliar afirmações, mantendo notas justificadas por evidência | PLANEJADO |
| ISS-08 | Baixa | Formação completa mistura abrangência e dificuldade; separar os atributos e rever curadoria | PLANEJADO |
| ISS-09 | Média | Não há matriz PDF/página/termo/verbetes que comprove todos os termos técnicos; concluir reconciliação documental | EM ANDAMENTO |
| ISS-10 | Média | backendConfig usa http.get e aceita HTTP 2xx–4xx como saúde; HTTPS não suportado por esse cliente e 404 pode escolher destino inadequado; verificar com servidor local controlado | PLANEJADO |
| ISS-11 | Baixa | Curso aberto e filtros não têm URL compartilhável/restauração; evolução opcional, não regressão de requisito atual | PLANEJADO |

| ID | Tarefa preservada / adicional | Estado |
|---|---|---|
| TASK-01 | Endpoint e tela de monitorados | IMPLEMENTADO |
| TASK-02 | Vendorizar dependências de interface para uso offline | PLANEJADO |
| TASK-03 | Ampliar testes de componentes, progresso e proxy | EM ANDAMENTO |
| TASK-04 | Serviço front-end no compose da infraestrutura | IMPLEMENTADO |
| TASK-05 | Pausar/desativar monitoramento pela interface | PLANEJADO |
| TASK-06 | Reescrever SPEC com cursos, PDFs, glossário, filtros e planos | VERIFICADO |
| TASK-07 | Atualizar narrativa da Avaliação com evidências atuais | PLANEJADO |
| TASK-08 | Auditar completude e proveniência dos termos de todos os PDFs | EM ANDAMENTO |
| TASK-09 | Corrigir seleção/healthcheck do backend e cobrir HTTP/HTTPS e erros | PLANEJADO |

## 9. Verificação de 2026-09-27

Executado **npm test**, com sucesso: detector de padrões, nove casos de associação de comunicados, dez casos de diário, convenções de português e integridade do catálogo de cursos.

Inspeção adicional por importação dos dados confirmou 29 cursos, 71 módulos, 97 aulas, seis valores atuais de nível e 118 verbetes acadêmicos. Estes números descrevem o catálogo nesta data e devem ser atualizados quando ele mudar.

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
