# 📚 Study Platform

> Fullstack study platform built with Spring Boot and React, inspired by Notion and Anki, featuring spaced repetition, flashcards, and progress tracking.

---

## 🚀 Overview

Study Platform is a fullstack web application designed to centralize the learning process, helping users:

- Organize study content
- Improve knowledge retention
- Track study performance
- Maintain consistency over time

The platform combines concepts from:

- **Notion** → content organization  
- **Anki** → spaced repetition  
- **Trello** → task management  

---

## 🎯 Goals

### 🧠 Product Goals

- Improve long-term knowledge retention
- Encourage consistent study habits
- Provide a centralized learning environment

### ⚙️ Technical Goals

- Apply **Clean Architecture**
- Practice **DDD (Domain-Driven Design)**
- Build scalable **REST APIs**
- Implement secure authentication (**JWT**)
- Develop a real-world fullstack system

---

## 🏗️ Architecture

### Backend (Spring Boot)

Layered architecture:
Controller → Service → Domain → Repository

Responsibilities:

- **Controller** → HTTP layer
- **Service** → business rules
- **Domain** → core entities
- **Repository** → data access

---

### Frontend (React and shadcn)

Feature-based structure:
src/
├── components/
├── pages/
├── services/
├── hooks/
├── store/
├── routes/
└── utils/
---

## 🧱 Domain Model

### 👤 User
- id
- name
- email
- password
- createdAt

---

### 📚 Subject
- id
- name
- description
- userId

---

### 📝 Note
- id
- title
- content
- subjectId
- timestamps

---

### 🧠 Flashcard
- id
- question
- answer
- difficulty
- nextReviewDate
- reviewInterval

---

### 📊 StudySession
- cardsReviewed
- correctAnswers
- date

---

### ✅ StudyTask
- title
- description
- status
- dueDate

---

## 🔐 Authentication & Security

- JWT-based authentication (stateless)
- Password hashing with BCrypt
- Route protection
- User data isolation

---

## 🎨 Features

- 📚 Subject organization
- 📝 Notes management
- 🧠 Flashcards with spaced repetition
- 📊 Study metrics dashboard
- ✅ Task management (TODO / DOING / DONE)
- 🔐 Secure authentication
- ⚡ Fast and simple UI

---

## 🧪 Testing

### Backend
- Unit tests (Services)
- Integration tests (Controllers)

### Frontend
- Component testing
- User flow testing

---

## 🐳 DevOps

- Docker support
- Docker Compose
- CI/CD with GitHub Actions
- Deployment ready (Render / Railway)

---

## 🚀 Getting Started

### Backend e Frontend

```bash
# Clone repository
git clone https://github.com/your-username/study-platform

cd study-platform/backend

# Run application
./mvnw spring-boot:run

cd study-platform/frontend

npm install
npm run dev
