package com.paulogandolfi.studyplatform.mentor.dto;

import com.paulogandolfi.studyplatform.goals.entity.GoalPriority;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record GoalPlanRequest(
        @NotBlank
        @Size(max = 160)
        String title,

        @Size(max = 2000)
        String description,

        @NotBlank
        @Size(max = 80)
        String currentLevel,

        @NotNull
        GoalPriority priority,

        LocalDate targetDate,

        @NotNull
        @Min(1)
        @Max(80)
        Integer weeklyStudyHours
) {
}
