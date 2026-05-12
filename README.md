# Study Platform

A **Study Platform** é uma aplicação web fullstack voltada para organização, revisão e acompanhamento de estudos. O objetivo é centralizar conteúdos, flashcards, tarefas e métricas em uma única plataforma, combinando conceitos de ferramentas como Notion, Anki e Trello.

## Overview

A plataforma será construída com foco em arquitetura limpa, boas práticas de backend, segurança, versionamento de banco de dados e evolução incremental de produto.

O projeto utiliza:

- **Java 21**
- **Spring Boot**
- **Spring Data JPA**
- **Flyway**
- **Supabase** como banco de dados gerenciado
- **React** no frontend
- **JWT** para autenticação futura

## Objetivos

### Objetivos Técnicos

- Consolidar conhecimentos em Spring Boot
- Aplicar arquitetura em camadas
- Evoluir para uma arquitetura limpa ou hexagonal leve
- Trabalhar com DDD básico
- Implementar autenticação segura com JWT
- Criar APIs REST escaláveis e bem estruturadas
- Versionar o banco de dados com Flyway

### Objetivos de Produto

- Centralizar materiais de estudo
- Melhorar a retenção de conhecimento
- Aplicar revisão espaçada
- Acompanhar progresso e métricas
- Reduzir dispersão entre várias ferramentas

## Arquitetura Geral

### Backend

Arquitetura inicial em camadas:

```text
Controller -> Service -> Domain/Entity -> Repository
```

Responsabilidades:

- **Controller**: entrada HTTP e exposição da API
- **Service**: regras de negócio
- **Entity/Domain**: representação do domínio
- **Repository**: acesso aos dados
- **DTO**: entrada e saída de dados
- **Mapper**: conversão entre DTOs e entidades
- **Security**: autenticação e autorização

### Estrutura Esperada do Backend

```text
com.paulogandolfi.studyplatform
|
├── config
├── users
│   ├── User.java
│   └── UserRepository.java
├── controller
├── service
├── dto
│   ├── request
│   └── response
├── mapper
├── security
├── exception
└── util
```

## Banco de Dados

O projeto utiliza **Supabase** como banco gerenciado compatível com PostgreSQL.

A conexão é feita através do **Supabase Shared Pooler**, recomendado para redes IPv4:

```text
jdbc:postgresql://aws-1-us-west-2.pooler.supabase.com:6543/postgres
```

Configuração recomendada via variáveis de ambiente:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
```

Exemplo local:

```bash
export DATABASE_URL="jdbc:postgresql://aws-1-us-west-2.pooler.supabase.com:6543/postgres"
export DATABASE_USERNAME="postgres.PROJECT_ID"
export DATABASE_PASSWORD="your-password"
```

> Nunca commitar senhas, tokens ou strings sensíveis no repositório.

## Versionamento do Banco

O projeto utiliza **Flyway** para versionamento do banco de dados.

As migrations ficam em:

```text
backend/src/main/resources/db/migration
```

Migration inicial criada:

```text
V1__create_users_table.sql
```

Ela cria o schema da aplicação e a tabela de usuários:

```sql
CREATE SCHEMA IF NOT EXISTS studyplatform;

CREATE TABLE studyplatform.users (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Domínio Inicial

### User

Representa o usuário principal da plataforma.

Campos:

```text
id          UUID
name        VARCHAR(120)
email       VARCHAR(180)
password    VARCHAR(255)
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

Regras:

- Email deve ser único
- Senha deverá ser criptografada com BCrypt
- Usuário será dono dos conteúdos, tarefas, sessões e flashcards

## Entidade Implementada

Entidade JPA criada:

```text
backend/src/main/java/com/paulogandolfi/studyplatform/users/User.java
```

Repository criado:

```text
backend/src/main/java/com/paulogandolfi/studyplatform/users/UserRepository.java
```

O repository possui suporte inicial para:

```java
Optional<User> findByEmail(String email);

boolean existsByEmail(String email);
```

## Configuração da Aplicação

Arquivo principal:

```text
backend/src/main/resources/application.yaml
```

Estrutura recomendada:

```yaml
server:
  port: 8081

spring:
  application:
    name: studyplatform-api

  docker:
    compose:
      enabled: false

  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true

  flyway:
    enabled: true
```

## Como Rodar o Backend

Acesse a pasta do backend:

```bash
cd backend
```

Configure as variáveis de ambiente:

```bash
export DATABASE_URL="jdbc:postgresql://aws-1-us-west-2.pooler.supabase.com:6543/postgres"
export DATABASE_USERNAME="postgres.PROJECT_ID"
export DATABASE_PASSWORD="your-password"
```

Execute o projeto:

```bash
./mvnw spring-boot:run
```

A aplicação ficará disponível em:

```text
http://localhost:8081
```

## Validação do Banco no Supabase

Para confirmar se a tabela foi criada:

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'users'
ORDER BY table_schema;
```

Resultado esperado:

```text
studyplatform | users
```

## Modelagem Planejada

### Subject

```text
id
name
description
user_id
```

### Note

```text
id
title
content
subject_id
created_at
updated_at
```

### Flashcard

```text
id
question
answer
difficulty
next_review_date
review_interval
subject_id
```

### StudySession

```text
id
user_id
date
cards_reviewed
correct_answers
```

### StudyTask

```text
id
title
description
status
due_date
user_id
```

## Relacionamentos

```text
User 1:N Subject
Subject 1:N Note
Subject 1:N Flashcard
User 1:N StudyTask
User 1:N StudySession
```

## Sistema de Revisão

Regra inicial de revisão espaçada:

```text
Se acertar:
  reviewInterval = reviewInterval * 2
  nextReviewDate = hoje + reviewInterval

Se errar:
  reviewInterval = 1
  nextReviewDate = amanhã
```

Consulta base para cards pendentes:

```sql
SELECT *
FROM studyplatform.flashcards
WHERE next_review_date <= CURRENT_DATE;
```

## Endpoints Planejados

### Auth

```text
POST /auth/register
POST /auth/login
```

### Users

```text
GET /users/me
PUT /users/me
```

### Subjects

```text
GET /subjects
POST /subjects
PUT /subjects/{id}
DELETE /subjects/{id}
```

### Notes

```text
GET /notes
POST /notes
PUT /notes/{id}
DELETE /notes/{id}
```

### Flashcards

```text
GET /flashcards
POST /flashcards
PUT /flashcards/{id}
DELETE /flashcards/{id}
GET /flashcards/review
POST /flashcards/{id}/review
```

### Tasks

```text
GET /tasks
POST /tasks
PUT /tasks/{id}
DELETE /tasks/{id}
```

### Metrics

```text
GET /metrics/dashboard
```

## Frontend

O frontend será desenvolvido em React, com organização baseada em features.

Estrutura planejada:

```text
src/
├── components
├── pages
├── services
├── hooks
├── store
├── routes
└── utils
```

Páginas previstas:

- Login
- Register
- Dashboard
- Subjects
- Notes
- Flashcards
- Review Session
- Tasks
- Metrics

## Segurança

Planejamento de segurança:

- Autenticação stateless com JWT
- Senhas criptografadas com BCrypt
- Proteção de endpoints por usuário autenticado
- Bloqueio de acesso a dados de outros usuários
- Validação de entrada com Bean Validation

## Testes

### Backend

- Testes unitários para services
- Testes de integração para controllers
- Testes de repository
- Validação de migrations com Flyway

### Frontend

- Testes de componentes
- Testes de fluxo de autenticação
- Testes de fluxo de revisão

## Roadmap

### Fase 1 — Fundação

- Setup Spring Boot
- Configuração Supabase
- Configuração Flyway
- Migration inicial
- Entidade User
- UserRepository

### Fase 2 — Autenticação

- Register
- Login
- BCrypt
- JWT
- SecurityConfig

### Fase 3 — Organização

- Subject CRUD
- Note CRUD
- Relacionamento com usuário

### Fase 4 — Revisão

- Flashcard CRUD
- Revisão espaçada
- Endpoint de revisão
- Atualização de intervalo

### Fase 5 — Frontend

- Setup React
- Login/Register
- Dashboard
- CRUDs principais

### Fase 6 — Métricas

- StudySession
- Cards revisados por dia
- Taxa de acerto
- Streak de estudos

### Fase 7 — Avançado

- Algoritmo SM-2
- Editor rich text
- Upload de PDF
- Geração de flashcards com IA
- Deploy
- CI/CD com GitHub Actions

## Status Atual

Implementado até o momento:

- Backend Spring Boot configurado
- Supabase conectado via shared pooler
- Flyway habilitado
- Migration inicial criada
- Schema `studyplatform` criado
- Tabela `users` criada
- Entidade `User` criada
- Repository `UserRepository` criado
- Testes executando com sucesso

## Conclusão

A Study Platform foi planejada para evoluir como um produto real, combinando organização, memorização e acompanhamento de progresso. O projeto serve como base prática para consolidar habilidades de desenvolvimento fullstack, arquitetura backend, segurança, banco de dados e experiência de usuário.
