package com.paulogandolfi.studyplatform.ai.dto;

import java.util.List;

public record GenerateFlashcardsResponse(
        List<AiFlashcardSuggestion> flashcards
) {
}
