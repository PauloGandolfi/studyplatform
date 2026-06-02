# Possiveis Falhas Atuais - Frontend e Backend

Este checklist foi montado a partir do codigo atual do projeto para registrar falhas provaveis, pontos de atencao e riscos operacionais que podem aparecer hoje.

## Frontend

- [ ] Integracao com a API pode quebrar fora do ambiente de desenvolvimento
  Evidencia: [frontend/vite.config.ts](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/vite.config.ts) usa proxy apenas no dev para `/auth`, `/notes`, `/subjects`, `/tasks`, `/flashcards`, `/metrics`, `/study-time` e `/ai`, enquanto o frontend faz requisicoes relativas em [frontend/src/shared/api/client.ts](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/src/shared/api/client.ts) e [frontend/src/App.tsx](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/src/App.tsx).
  Risco: em deploy separado, as chamadas podem cair no host errado ou serem bloqueadas por CORS.

- [ ] Sessao autenticada depende de `localStorage`
  Evidencia: [frontend/src/shared/lib/auth-storage.ts](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/src/shared/lib/auth-storage.ts) persiste token e usuario no navegador.
  Risco: qualquer vulnerabilidade de XSS no frontend pode expor o JWT e permitir sequestro de sessao.

- [ ] Fluxo de autenticacao tem tratamento de erro duplicado e inconsistente
  Evidencia: [frontend/src/shared/api/client.ts](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/src/shared/api/client.ts) centraliza requests, mas o login e os fluxos de auth usam `fetch` direto em [frontend/src/App.tsx](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/src/App.tsx).
  Risco: mensagens, expiracao de sessao e manutencao podem ficar desalinhadas entre telas.

- [ ] O frontend esta muito concentrado em um unico arquivo
  Evidencia: [frontend/src/App.tsx](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/src/App.tsx) tem 3261 linhas e concentra autenticacao, dashboard, CRUDs, revisao, timer e UI.
  Risco: aumento de regressao, dificuldade para testar, onboarding mais lento e manutencao cara.

- [ ] Confirmacoes criticas dependem de `window.confirm`
  Evidencia: [frontend/src/App.tsx](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/src/App.tsx) usa confirmacao nativa para exclusoes.
  Risco: UX inconsistente, pouca acessibilidade e menor controle de estados durante a exclusao.

- [ ] Nao existe automacao de testes do frontend no `package.json`
  Evidencia: [frontend/package.json](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/package.json) possui apenas `dev`, `build` e `preview`.
  Risco: fluxos sensiveis como login, CRUDs e revisao podem quebrar sem cobertura automatizada.

## Backend

- [ ] O backend nao mostra configuracao explicita de CORS
  Evidencia: o frontend depende do proxy local em [frontend/vite.config.ts](C:/Users/paulo gandolfi/Desktop/studyplatform/frontend/vite.config.ts) e nao foi encontrada configuracao `cors`, `CrossOrigin` ou `CorsConfiguration` no backend.
  Risco: frontend e backend em dominios diferentes podem falhar no navegador mesmo com a API funcionando.

- [ ] Existe um segredo JWT padrao para fallback
  Evidencia: [backend/src/main/resources/application.yaml](C:/Users/paulo gandolfi/Desktop/studyplatform/backend/src/main/resources/application.yaml) define `JWT_SECRET` com fallback local.
  Risco: se a variavel nao for configurada em ambiente real, os tokens ficam previsiveis e o sistema perde seguranca.

- [ ] Link de reset de senha pode vazar em log quando SMTP nao estiver configurado
  Evidencia: [backend/src/main/java/com/paulogandolfi/studyplatform/auth/service/PasswordResetEmailService.java](C:/Users/paulo gandolfi/Desktop/studyplatform/backend/src/main/java/com/paulogandolfi/studyplatform/auth/service/PasswordResetEmailService.java) faz `LOGGER.warn(...)` com o `resetLink`.
  Risco: quem tiver acesso aos logs pode reutilizar um token valido de recuperacao.

- [ ] Integracao com IA depende de servico externo sem timeout explicito nem estrategia de degradacao
  Evidencia: [backend/src/main/java/com/paulogandolfi/studyplatform/ai/service/GeminiAiModelClient.java](C:/Users/paulo gandolfi/Desktop/studyplatform/backend/src/main/java/com/paulogandolfi/studyplatform/ai/service/GeminiAiModelClient.java) chama o Gemini diretamente e converte falhas em `502` ou `503`.
  Risco: lentidao, indisponibilidade externa ou limite de quota podem travar a feature de IA e piorar a experiencia.

- [ ] Registro de tempo de estudo pode contar tempo em duplicidade
  Evidencia: [backend/src/main/java/com/paulogandolfi/studyplatform/sessions/service/StudyTimeService.java](C:/Users/paulo gandolfi/Desktop/studyplatform/backend/src/main/java/com/paulogandolfi/studyplatform/sessions/service/StudyTimeService.java) salva uma nova `StudySession` a cada envio.
  Risco: reenvio da mesma requisicao, clique duplo ou retry no cliente pode inflar metricas.

- [ ] Revisao de flashcards tambem pode gerar contagem duplicada de sessoes
  Evidencia: [backend/src/main/java/com/paulogandolfi/studyplatform/flashcards/service/FlashcardService.java](C:/Users/paulo gandolfi/Desktop/studyplatform/backend/src/main/java/com/paulogandolfi/studyplatform/flashcards/service/FlashcardService.java) cria uma `StudySession` para cada review recebido.
  Risco: repeticao acidental da chamada pode distorcer revisoes, acertos e dashboard.

- [ ] As respostas de erro parecem descentralizadas
  Evidencia: nao foi encontrado `@ControllerAdvice` ou `@RestControllerAdvice`; os services retornam muitos `ResponseStatusException`.
  Risco: payloads de erro inconsistentes podem quebrar mensagens no frontend e dificultar observabilidade.

- [ ] O backend expone SQL nos logs por padrao
  Evidencia: [backend/src/main/resources/application.yaml](C:/Users/paulo gandolfi/Desktop/studyplatform/backend/src/main/resources/application.yaml) esta com `show-sql: true`.
  Risco: ruido em log, possivel exposicao de estrutura interna e dificuldade de operar em ambiente produtivo.

## Observacoes

- [ ] O backend ja possui testes automatizados, mas o frontend ainda nao mostra cobertura equivalente.
- [ ] Parte dos riscos acima nao significa bug confirmado em producao; significa ponto com chance real de falha dado o codigo atual.
