package com.paulogandolfi.studyplatform.flashcards.dto;

import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import jakarta.validation.constraints.NotNull;

public record FlashcardReviewRequest(
        @NotNull
        Boolean correct,

        @NotNull
        Difficulty difficulty
) {
}
