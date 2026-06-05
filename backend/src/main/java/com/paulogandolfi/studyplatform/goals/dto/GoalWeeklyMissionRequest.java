package com.paulogandolfi.studyplatform.goals.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoalWeeklyMissionRequest(
        @Min(1)
        @Max(104)
        Integer weekOrder,

        @NotBlank
        @Size(max = 160)
        String title,

        @NotBlank
        @Size(max = 1000)
        String focus
) {
}
