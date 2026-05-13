package com.paulogandolfi.studyplatform.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record NoteRequest(
        @NotNull
        UUID subjectId,

        @NotBlank
        @Size(max = 160)
        String title,

        @NotBlank
        @Size(max = 10000)
        String content
) {
}
