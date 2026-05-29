package com.paulogandolfi.studyplatform.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record GenerateFlashcardsRequest(
        @NotNull
        UUID subjectId,

        @NotBlank
        @Size(max = 20000)
        String content,

        @Min(1)
        @Max(20)
        Integer maxCards
) {
}
