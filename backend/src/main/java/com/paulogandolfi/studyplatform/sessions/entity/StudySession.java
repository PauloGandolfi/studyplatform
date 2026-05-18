package com.paulogandolfi.studyplatform.sessions.entity;

import com.paulogandolfi.studyplatform.users.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "study_sessions", schema = "studyplatform")
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "cards_reviewed", nullable = false)
    private Integer cardsReviewed;

    @Column(name = "correct_answers", nullable = false)
    private Integer correctAnswers;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected StudySession() {
    }

    public StudySession(User user, Integer cardsReviewed, Integer correctAnswers, LocalDate sessionDate) {
        this.user = user;
        this.cardsReviewed = cardsReviewed;
        this.correctAnswers = correctAnswers;
        this.sessionDate = sessionDate;
    }

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Integer getCardsReviewed() {
        return cardsReviewed;
    }

    public Integer getCorrectAnswers() {
        return correctAnswers;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
