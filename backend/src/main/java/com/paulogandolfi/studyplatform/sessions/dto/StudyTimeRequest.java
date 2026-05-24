package com.paulogandolfi.studyplatform.sessions.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StudyTimeRequest(
        @NotNull
        @Min(1)
        @Max(54000)
        Integer durationSeconds
) {
}
