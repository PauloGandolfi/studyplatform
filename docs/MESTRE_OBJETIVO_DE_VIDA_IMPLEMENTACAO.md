# Mestre como Treinador Pessoal

## Visao

Hoje o Mestre ja ajuda com assuntos, chat e flashcards. A evolucao proposta e transformar o Mestre em um treinador pessoal de aprendizagem, capaz de receber um objetivo concreto do usuario, quebrar esse objetivo em trilhas executaveis e acompanhar a evolucao ao longo do tempo.

Exemplo de entrada do usuario:

> Quero aprender Spring Boot em 3 meses.

Com isso, a plataforma deve criar automaticamente:

- trilha de estudo
- missoes semanais
- revisoes
- flashcards
- metas
- acompanhamento de evolucao

O comportamento desejado e mais proximo de um coach de estudo do que de um chat simples.

---

## Ideia central

O Mestre deixa de responder apenas pedidos isolados e passa a operar em cima de um objetivo maior, com plano, execucao, acompanhamento e adaptacao.

Fluxo esperado:

1. O usuario cadastra um objetivo.
2. O Mestre interpreta prazo, contexto e nivel atual.
3. A plataforma quebra o objetivo em areas menores.
4. O sistema gera um plano estruturado por semanas.
5. O sistema cria tarefas, revisoes e flashcards relacionados.
6. O progresso do usuario alimenta um percentual real de conclusao.
7. O Mestre acompanha, cobra, incentiva e reajusta a trilha.

---

## Exemplo 1: Objetivo com prazo

Entrada:

> Quero aprender Spring Boot em 3 meses.

Saida esperada:

- objetivo principal: Aprender Spring Boot
- prazo: 3 meses
- trilha sugerida:
  - Fundamentos de Java para Spring
  - Spring Core
  - Spring Boot
  - APIs REST
  - JPA e banco de dados
  - Seguranca com Spring Security
  - Testes
  - Deploy
- missoes semanais:
  - semana 1: revisar Java, orientacao a objetos, Maven
  - semana 2: IoC, DI, beans, configuracao
  - semana 3: criar primeira API com Spring Boot
  - semana 4: persistencia com JPA
- revisoes:
  - checkpoints semanais
  - revisoes automáticas com base em dificuldades
- flashcards:
  - gerados por modulo ou por conteudo estudado
- metas:
  - concluir 2 modulos por quinzena
  - estudar 5 dias por semana
  - finalizar 1 mini projeto por mes

---

## Exemplo 2: Modo Objetivo de Vida

Entrada:

> Virar Desenvolvedor Java Pleno

A plataforma quebra o objetivo em grandes pilares:

- Java
- Spring
- Testes
- Docker
- SQL
- Ingles

E apresenta algo como:

> Objetivo: 35% concluido

Com isso, o usuario nao enxerga apenas topicos soltos. Ele enxerga uma jornada, com progresso consolidado em direcao a uma meta maior.

---

## Exemplo 3: Recomendacao estruturada de estudo

Outra ideia importante e fazer a IA responder buscas de estudo com estrutura de dados, e nao apenas com texto solto.

Exemplo de entrada:

> Quero estudar sobre Spring Boot

Ou de forma mais especifica:

> Quero estudar Spring Security para aprender autenticacao JWT

Em vez de responder apenas:

> Estude Spring Boot.

A IA poderia retornar algo em formato estruturado, por exemplo:

```json
{
  "assunto": "Spring Security",
  "nivel": "iniciante",
  "objetivo": "aprender autenticacao JWT",
  "recomendacoes": [
    {
      "tipo": "curso",
      "titulo": "Spring Security - Alura",
      "plataforma": "Alura",
      "link": "...",
      "motivo": "bom para aprender fluxo de autenticacao"
    },
    {
      "tipo": "video",
      "titulo": "Spring Security JWT",
      "plataforma": "YouTube",
      "link": "...",
      "motivo": "conteudo gratuito e direto ao ponto"
    },
    {
      "tipo": "documentacao",
      "titulo": "Spring Security Docs",
      "plataforma": "Spring",
      "link": "...",
      "motivo": "fonte oficial"
    }
  ]
}
```

Ponto importante:

- a ideia inicial e retornar recomendacoes sem navegar na internet em tempo real
- o sistema responde com base em conhecimento previamente conhecido pelo modelo
- essas recomendacoes devem ser tratadas como sugestoes do Mentor, nao como busca atualizada

Isso abre espaco para uma experiencia de "guia de estudo" muito mais rica, porque o usuario nao recebe apenas uma explicacao, mas um mini plano de consumo de conteudo.

---

## Proposta de experiencia

### 1. Cadastro de objetivo

O usuario informa:

- nome do objetivo
- prazo desejado
- nivel atual
- tempo disponivel por semana
- prioridade
- contexto opcional

Exemplos:

- Aprender Spring Boot em 3 meses
- Virar Desenvolvedor Java Pleno
- Melhorar meu ingles tecnico para entrevistas

### 2. Interpretacao pelo Mestre

O Mestre identifica:

- tipo do objetivo
- prazo
- complexidade
- competencias envolvidas
- ordem sugerida de aprendizagem
- entregas praticas esperadas

### 3. Quebra automatica em pilares

Cada objetivo vira uma estrutura com:

- objetivo principal
- pilares
- modulos
- missoes
- revisoes
- evidencias de conclusao

### 4. Plano executavel

O sistema cria:

- trilha geral
- plano semanal
- tarefas diarias ou semanais
- revisoes programadas
- flashcards recomendados
- metas mensuraveis

### 5. Acompanhamento

O Mestre passa a acompanhar:

- progresso por objetivo
- progresso por pilar
- consistencia semanal
- revisoes concluidas
- tempo investido
- gargalos e atraso

### 6. Adaptacao

Se o usuario atrasar, acelerar ou mudar de foco, o Mestre pode:

- replanejar semanas
- reduzir ou aumentar carga
- sugerir reforco em pilares fracos
- gerar novos flashcards
- atualizar o percentual do objetivo

---

## Diferencial do produto

O valor aqui nao e apenas "estudar assuntos".

O valor real passa a ser:

- estudar com direcao
- enxergar progresso de carreira
- ter um plano vivo
- transformar estudo em execucao continua
- conectar conteudo, tarefas, revisoes e metas em torno de um objetivo real

Isso deixa a plataforma mais interessante, mais inteligente e mais proxima de um treinador pessoal.

---

## Recomendacoes inteligentes sem navegacao

Essa ideia de recomendacao estruturada pode funcionar como um segundo modo complementar ao modo de objetivos.

### Comportamento desejado

Quando o usuario pedir algo como:

- Quero estudar Spring Boot
- Quero aprender Spring Security
- Quero entender Docker para Java

O Mentor pode retornar:

- assunto sugerido
- nivel estimado
- objetivo de aprendizagem
- recomendacoes de conteudo
- ordem sugerida de consumo
- sugestao de pratica
- sugestao de flashcards e revisoes

### Exemplo de estrutura expandida

```json
{
  "assunto": "Spring Boot",
  "nivel": "iniciante",
  "objetivo": "criar a primeira API REST com Java e Spring Boot",
  "ordem_sugerida": [
    "entender o papel do Spring Boot",
    "criar projeto inicial",
    "criar endpoints REST",
    "conectar com banco de dados",
    "testar a aplicacao"
  ],
  "recomendacoes": [
    {
      "tipo": "curso",
      "titulo": "Curso de Spring Boot",
      "plataforma": "Plataforma sugerida",
      "link": "...",
      "motivo": "bom para iniciar com passo a passo"
    }
  ],
  "pratica_sugerida": "criar uma API de tarefas com CRUD",
  "flashcards_sugeridos": 10,
  "revisao_em_dias": [1, 3, 7]
}
```

### Beneficio para o produto

Isso aproxima a experiencia de:

- recomendacao personalizada
- curadoria automatica
- inicio rapido de estudo
- integracao com plano, tarefa e revisao

### Observacao importante

Como a proposta e nao navegar na internet em tempo real:

- os links e referencias podem ser genericos no MVP
- a IA pode devolver sugestoes conhecidas, mas sem garantia de atualizacao
- o frontend deve exibir isso como recomendacao do Mentor, nao como resultado de busca em tempo real

No futuro, se desejado, isso pode evoluir para dois modos:

- modo offline com conhecimento do modelo
- modo online com busca e validacao externa

---

## Como isso conversa com o que ja existe

O projeto ja possui bases importantes:

- assuntos
- tarefas
- notas
- flashcards
- revisoes
- metricas
- Mestre no frontend
- endpoints de IA para geracao

Essa nova ideia pode aproveitar a estrutura atual em vez de nascer do zero.

Mapeamento inicial:

- `subjects` podem representar pilares ou modulos
- `tasks` podem representar missoes semanais
- `flashcards` continuam como instrumento de revisao
- `metrics` podem alimentar progresso do objetivo
- `Mestre` passa a ser o orquestrador dessa jornada

---

## Proposta funcional

### Entidades novas ou evoluidas

Possiveis novas entidades:

- `goals`
- `goal_pillars`
- `goal_milestones`
- `goal_weeks`
- `goal_progress_events`

Entidades atuais que podem ser vinculadas:

- `subjects`
- `study_tasks`
- `flashcards`
- `study_sessions`

### Relacoes desejadas

Um objetivo pode ter:

- varios pilares
- varios marcos
- varias semanas planejadas
- varias tarefas associadas
- varios assuntos relacionados

Cada pilar pode ter:

- percentual proprio
- lista de assuntos
- tarefas obrigatorias
- revisoes

---

## Logica de progresso

O percentual do objetivo nao deve ser apenas manual. Ele pode ser calculado a partir de sinais reais.

Exemplo de composicao:

- 30% pela conclusao de missoes
- 20% pela execucao de revisoes
- 20% por consistencia semanal
- 20% por conclusao dos pilares
- 10% por evidencias praticas, como projeto concluido

Observacao:

Essa formula pode comecar simples no MVP e ficar mais sofisticada depois.

---

## Fluxos principais do MVP

### Fluxo 1: Criar objetivo

1. Usuario descreve um objetivo.
2. Mestre interpreta e gera uma proposta.
3. Usuario aprova o plano.
4. Sistema salva objetivo, pilares e plano inicial.

### Fluxo 2: Gerar plano automatico

1. Sistema recebe objetivo, prazo e nivel.
2. IA devolve pilares, modulos, semanas e metas.
3. Plataforma converte isso em dados estruturados.

### Fluxo 3: Acompanhar progresso

1. Usuario conclui tarefas e revisoes.
2. Sistema recalcula progresso por pilar.
3. Dashboard mostra percentual consolidado.
4. Mestre comenta avancos e proximos passos.

### Fluxo 4: Replanejar

1. Usuario informa atraso ou mudanca de contexto.
2. Mestre sugere ajuste de cronograma.
3. Usuario aprova replanejamento.
4. Sistema atualiza semanas e metas futuras.

---

## Telas ou areas necessarias

### 1. Tela de objetivos

Deve permitir:

- criar objetivo
- listar objetivos
- ver status geral
- abrir detalhes do objetivo

### 2. Detalhe do objetivo

Deve mostrar:

- nome do objetivo
- percentual concluido
- prazo
- pilares
- modulos
- missoes da semana
- revisoes pendentes
- proximos passos sugeridos pelo Mestre

### 3. Mestre contextualizado por objetivo

Quando o usuario conversa com o Mestre dentro de um objetivo, o chat deve conhecer:

- objetivo atual
- prazo
- pilares
- progresso
- tarefas pendentes
- revisoes atrasadas

### 4. Dashboard com progresso de jornada

Deve destacar:

- objetivo principal
- percentual concluido
- sequencia de estudo
- tarefas da semana
- gargalos

---

## Papel da IA

O Mentor pode atuar em quatro niveis:

### 1. Planejador

Cria trilha, semanas, metas e prioridades.

### 2. Tutor

Explica conceitos, responde duvidas e recomenda materiais.

### 3. Avaliador

Identifica atraso, dificuldade e baixa consistencia.

### 4. Motivador

Faz follow-up, resume progresso e sugere o proximo passo.

---

## Resposta estruturada da IA

Para essa visao funcionar bem, a IA deve retornar estruturas previsiveis, e nao apenas texto livre.

Tipos de resposta desejados:

- plano de objetivo
- quebra por pilares
- missoes semanais
- recomendacoes de conteudo
- sugestoes de revisao
- sugestoes de flashcards
- resumo de progresso

Exemplos de contratos uteis:

- `GoalPlanResponse`
- `GoalProgressResponse`
- `StudyRecommendationsResponse`
- `WeeklyMissionPlanResponse`

Isso ajuda o backend a validar, persistir e transformar a resposta da IA em elementos reais da plataforma.

---

## MVP recomendado

Para evitar escopo grande demais, o primeiro corte pode focar em:

- cadastro de objetivo
- geracao automatica de pilares
- geracao de missoes semanais
- vinculacao com tarefas
- percentual simples de progresso
- tela de detalhe do objetivo
- resumo do Mentor com base no objetivo
- recomendacao estruturada de estudo sem navegacao externa

Fica para depois:

- replanejamento automatico completo
- formula avancada de progresso
- multiplos objetivos ativos com priorizacao inteligente
- recomendacao de materiais externos
- notificacoes proativas mais sofisticadas

---

## Checklist de implementacao

### Descoberta e definicao

- [ ] Definir o nome oficial da feature: `Objetivos`, `Jornadas` ou `Modo Objetivo de Vida`
- [ ] Definir o rename oficial de `Mestre` para `Mentor`
- [ ] Definir se o objetivo pode ter prazo obrigatorio ou opcional
- [ ] Definir se o usuario pode ter mais de um objetivo ativo
- [ ] Definir a regra inicial de calculo de progresso
- [ ] Definir se pilares serao entidades novas ou assunto reutilizado
- [ ] Definir quais partes serao geradas por IA e quais serao deterministicas
- [ ] Definir ate onde a recomendacao de conteudo pode ir sem navegacao externa
- [ ] Definir o aviso de produto para deixar claro que as recomendacoes nao sao resultados em tempo real

### Modelagem de dados

- [ ] Criar entidade `Goal`
- [ ] Criar entidade para pilares do objetivo
- [ ] Criar entidade para semanas ou milestones
- [ ] Definir relacionamento com `StudyTask`
- [ ] Definir relacionamento com `Subject`
- [ ] Definir se flashcards terao vinculacao opcional com objetivo/pilar
- [ ] Criar migrations SQL

### Backend

- [ ] Criar endpoints para CRUD de objetivos
- [ ] Criar endpoint para gerar plano inicial com IA
- [ ] Criar endpoint para recomendacao estruturada de estudo
- [ ] Criar endpoint para detalhar objetivo com pilares, metas e progresso
- [ ] Criar endpoint para replanejamento
- [ ] Implementar servico de calculo de progresso
- [ ] Implementar vinculacao entre objetivo e tarefas existentes
- [ ] Cobrir regras com testes de controller e service

### IA

- [ ] Definir prompt estruturado para gerar trilha de estudo
- [ ] Definir prompt para quebrar objetivo em pilares
- [ ] Definir prompt para gerar missoes semanais
- [ ] Definir prompt para sugerir revisoes e flashcards
- [ ] Definir prompt para recomendacao estruturada de conteudo
- [ ] Garantir saida estruturada em JSON
- [ ] Tratar fallback quando a IA devolver estrutura invalida
- [ ] Definir schema para `StudyRecommendationsResponse`

### Frontend

- [ ] Atualizar nomenclatura visual de `Mestre` para `Mentor`
- [ ] Atualizar labels, componentes e textos internos ligados ao `Mestre`
- [ ] Criar secao de navegacao para objetivos
- [ ] Criar tela de listagem de objetivos
- [ ] Criar formulario de criacao de objetivo
- [ ] Criar tela de detalhe do objetivo
- [ ] Exibir percentual concluido por objetivo
- [ ] Exibir percentual por pilar
- [ ] Exibir missoes da semana
- [ ] Exibir revisoes pendentes ligadas ao objetivo
- [ ] Integrar o Mentor ao contexto do objetivo selecionado
- [ ] Criar visualizacao de recomendacoes estruturadas de estudo
- [ ] Permitir transformar uma recomendacao em tarefa, assunto ou plano

### Experiencia do usuario

- [ ] Permitir aprovar ou editar o plano gerado antes de salvar
- [ ] Mostrar claramente como o progresso foi calculado
- [ ] Exibir mensagens de acompanhamento do Mentor
- [ ] Destacar atrasos, risco de nao cumprir prazo e proximos passos
- [ ] Garantir que a feature faca sentido mesmo para objetivos sem prazo fechado
- [ ] Deixar claro quando uma recomendacao veio do conhecimento do modelo e nao de busca externa

### Observabilidade e qualidade

- [ ] Criar testes manuais da jornada completa
- [ ] Criar seeds ou dados de exemplo
- [ ] Validar comportamento com objetivo de 3 meses
- [ ] Validar comportamento com objetivo amplo de carreira
- [ ] Medir se o progresso exibido parece coerente
- [ ] Documentar limitacoes da primeira versao

---

## Ordem sugerida de implementacao

### Fase 1

- rename de `Mestre` para `Mentor`
- modelagem de objetivo
- CRUD basico
- tela simples de objetivos

### Fase 2

- geracao de pilares e plano inicial por IA
- recomendacao estruturada de estudo
- salvamento estruturado
- detalhe do objetivo

### Fase 3

- integracao com tarefas, assuntos e flashcards
- calculo de progresso
- dashboard de acompanhamento

### Fase 4

- replanejamento
- acompanhamento proativo do Mestre
- refinamento da experiencia

---

## Riscos e cuidados

- Evitar depender demais de resposta livre da IA sem validacao estrutural.
- Evitar mostrar percentual de progresso sem logica clara.
- Evitar criar um fluxo bonito, mas dificil de manter com os dados atuais.
- Evitar misturar objetivo, assunto e tarefa sem uma modelagem bem definida.
- Evitar comecar com escopo grande demais no frontend.

---

## Direcao recomendada

O melhor caminho parece ser:

1. Consolidar o rename de `Mestre` para `Mentor`.
2. Criar a camada de `objetivos`.
3. Fazer o Mentor gerar um plano inicial estruturado.
4. Adicionar recomendacoes estruturadas de estudo sem navegacao externa.
5. Transformar esse plano em entidades reais da plataforma.
6. Exibir progresso consolidado por objetivo.
7. Evoluir o Mentor para acompanhar a jornada, e nao apenas responder mensagens.

Esse caminho reaproveita a base atual e eleva bastante o valor percebido do produto.

---

## Proximo passo pratico

Depois deste documento, o ideal e quebrar a implementacao em um plano tecnico menor com:

- modelo de dados
- contratos de API
- estrutura de resposta da IA
- desenho da tela de objetivo
- primeira versao do calculo de progresso

Assim seguimos da ideia para uma implementacao incremental e segura.
