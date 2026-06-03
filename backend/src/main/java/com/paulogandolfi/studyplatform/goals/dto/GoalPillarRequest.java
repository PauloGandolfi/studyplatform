package com.paulogandolfi.studyplatform.goals.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoalPillarRequest(
        @NotBlank
        @Size(max = 160)
        String title,

        @Size(max = 1000)
        String description,

        @Min(1)
        @Max(1000)
        Integer targetHours
) {
}
