package com.paulogandolfi.studyplatform.flashcards.dto;

import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import com.paulogandolfi.studyplatform.flashcards.entity.Flashcard;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record FlashcardResponse(
        UUID id,
        UUID subjectId,
        String question,
        String answer,
        Difficulty difficulty,
        Integer reviewInterval,
        LocalDate nextReviewDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static FlashcardResponse from(Flashcard flashcard) {
        return new FlashcardResponse(
                flashcard.getId(),
                flashcard.getSubject().getId(),
                flashcard.getQuestion(),
                flashcard.getAnswer(),
                flashcard.getDifficulty(),
                flashcard.getReviewInterval(),
                flashcard.getNextReviewDate(),
                flashcard.getCreatedAt(),
                flashcard.getUpdatedAt()
        );
    }
}
