package com.paulogandolfi.studyplatform.goals.dto;

import com.paulogandolfi.studyplatform.goals.entity.GoalPriority;
import com.paulogandolfi.studyplatform.goals.entity.GoalStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record GoalRequest(
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

        GoalStatus status,

        LocalDate targetDate,

        @NotNull
        @Min(1)
        @Max(80)
        Integer weeklyStudyHours,

        @Min(1)
        @Max(2000)
        Integer estimatedStudyHours,

        @Valid
        List<GoalPillarRequest> pillars,

        @Valid
        List<GoalWeeklyMissionRequest> weeklyMissions,

        @Size(max = 1000)
        String mentorSummary
) {
}
