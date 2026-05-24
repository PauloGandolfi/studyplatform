# Study Platform

A **Study Platform** is a fullstack web application focused on study organization, review, and progress tracking. The goal is to centralize content, flashcards, tasks, and metrics into a single platform, combining concepts from tools such as Notion, Anki, and Trello.

## Overview

The platform will be built with a strong focus on clean architecture, backend best practices, database versioning, security, and incremental product evolution.

The project uses:

- **Java 21**
- **Spring Boot**
- **Spring Data JPA**
- **Flyway**
- **Supabase** as a managed database
- **React** on the frontend
- **JWT** for future authentication

## Goals

### Technical Goals

- Consolidate Spring Boot knowledge
- Apply layered architecture
- Evolve into a clean or lightweight hexagonal architecture
- Work with basic DDD concepts
- Implement secure JWT authentication
- Build scalable and well-structured REST APIs
- Version the database using Flyway

### Product Goals

- Centralize study materials
- Improve knowledge retention
- Apply spaced repetition
- Track progress and metrics
- Reduce fragmentation across multiple tools

## General Architecture

### Backend

Initial layered architecture:

```text
Controller -> Service -> Domain/Entity -> Repository
```

Responsibilities:

- **Controller**: HTTP entry point and API exposure
- **Service**: business rules
- **Entity/Domain**: domain representation
- **Repository**: data access layer
- **DTO**: input and output data
- **Mapper**: conversion between DTOs and entities
- **Security**: authentication and authorization

### Expected Backend Structure

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

## Database

The project uses **Supabase** as a managed PostgreSQL-compatible database.

The connection is established through the **Supabase Shared Pooler**, recommended for IPv4 networks:

```text
jdbc:postgresql://aws-1-us-west-2.pooler.supabase.com:6543/postgres
```

Recommended configuration using environment variables:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
```

Local example:

```bash
export DATABASE_URL="jdbc:postgresql://aws-1-us-west-2.pooler.supabase.com:6543/postgres"
export DATABASE_USERNAME="postgres.PROJECT_ID"
export DATABASE_PASSWORD="your-password"
```

> Never commit passwords, tokens, or sensitive strings to the repository.

## Database Versioning

The project uses **Flyway** for database versioning.

Migrations are located at:

```text
backend/src/main/resources/db/migration
```

Initial migration created:

```text
V1__create_users_table.sql
```

It creates the application schema and the users table:

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

## Initial Domain

### User

Represents the main platform user.

Fields:

```text
id          UUID
name        VARCHAR(120)
email       VARCHAR(180)
password    VARCHAR(255)
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

Rules:

- Email must be unique
- Password must be encrypted using BCrypt
- The user will own content, tasks, sessions, and flashcards

## Implemented Entity

Created JPA entity:

```text
backend/src/main/java/com/paulogandolfi/studyplatform/users/User.java
```

Created repository:

```text
backend/src/main/java/com/paulogandolfi/studyplatform/users/UserRepository.java
```

The repository currently supports:

```java
Optional<User> findByEmail(String email);

boolean existsByEmail(String email);
```

## Application Configuration

Main file:

```text
backend/src/main/resources/application.yaml
```

Recommended structure:

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

## Running the Backend

Access the backend folder:

```bash
cd backend
```

Configure the environment variables:

```bash
export DATABASE_URL="jdbc:postgresql://aws-1-us-west-2.pooler.supabase.com:6543/postgres"
export DATABASE_USERNAME="postgres.PROJECT_ID"
export DATABASE_PASSWORD="your-password"
```

Run the project:

```bash
./mvnw spring-boot:run
```

The application will be available at:

```text
http://localhost:8081
```

## Database Validation on Supabase

To confirm the table was created:

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'users'
ORDER BY table_schema;
```

Expected result:

```text
studyplatform | users
```

## Planned Modeling

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

## Relationships

```text
User 1:N Subject
Subject 1:N Note
Subject 1:N Flashcard
User 1:N StudyTask
User 1:N StudySession
```

## Review System

Initial spaced repetition rule:

```text
If correct:
  reviewInterval = reviewInterval * 2
  nextReviewDate = today + reviewInterval

If incorrect:
  reviewInterval = 1
  nextReviewDate = tomorrow
```

Base query for pending cards:

```sql
SELECT *
FROM studyplatform.flashcards
WHERE next_review_date <= CURRENT_DATE;
```

## Planned Endpoints

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

The frontend will be developed using React, organized by features.

Planned structure:

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

Planned pages:

- Login
- Register
- Dashboard
- Subjects
- Notes
- Flashcards
- Review Session
- Tasks
- Metrics

## Security

Security planning:

- Stateless authentication using JWT
- Password encryption with BCrypt
- Endpoint protection by authenticated user
- Access blocking to other users' data
- Input validation using Bean Validation

## Tests

### Backend

- Unit tests for services
- Integration tests for controllers
- Repository tests
- Migration validation with Flyway

### Frontend

- Component tests
- Authentication flow tests
- Review flow tests

## Roadmap

### Phase 1 — Foundation

- Spring Boot setup
- Supabase configuration
- Flyway configuration
- Initial migration
- User entity
- UserRepository

### Phase 2 — Authentication

- Register
- Login
- BCrypt
- JWT
- SecurityConfig

### Phase 3 — Organization

- Subject CRUD
- Note CRUD
- User relationship

### Phase 4 — Review

- Flashcard CRUD
- Spaced repetition
- Review endpoint
- Interval update

### Phase 5 — Frontend

- React setup
- Login/Register
- Dashboard
- Main CRUDs

### Phase 6 — Metrics

- StudySession
- Reviewed cards per day
- Accuracy rate
- Study streak

### Phase 7 — Advanced

- SM-2 algorithm
- Rich text editor
- PDF upload
- AI flashcard generation
- Deploy
- CI/CD with GitHub Actions

## Current Status

Implemented so far:

- Spring Boot backend configured
- Supabase connected via shared pooler
- Flyway enabled
- Initial migration created
- `studyplatform` schema created
- `users` table created
- `User` entity created
- `UserRepository` created
- Tests running successfully

## Conclusion

The Study Platform was designed to evolve as a real product, combining organization, memorization, and progress tracking. The project serves as a practical foundation for consolidating fullstack development skills, backend architecture, security, databases, and user experience.
