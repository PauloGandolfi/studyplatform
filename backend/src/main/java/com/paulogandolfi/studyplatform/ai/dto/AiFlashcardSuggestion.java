package com.paulogandolfi.studyplatform.ai.dto;

import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;

public record AiFlashcardSuggestion(
        String question,
        String answer,
        Difficulty difficulty
) {
}
