package com.paulogandolfi.studyplatform.flashcards.dto;

import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record FlashcardRequest(
        @NotNull
        UUID subjectId,

        @NotBlank
        @Size(max = 1000)
        String question,

        @NotBlank
        @Size(max = 5000)
        String answer,

        @NotNull
        Difficulty difficulty
) {
}
