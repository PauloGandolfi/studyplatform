package com.paulogandolfi.studyplatform.sessions.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StudyTimeRequest(
        @NotNull
        @Min(1)
        @Max(54000)
        Integer durationSeconds,

        UUID goalId
) {
}
