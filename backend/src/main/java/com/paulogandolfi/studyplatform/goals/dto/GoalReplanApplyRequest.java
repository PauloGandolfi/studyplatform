package com.paulogandolfi.studyplatform.goals.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record GoalReplanApplyRequest(
        @Size(max = 2000)
        String reason,

        LocalDate targetDate,

        @NotNull
        @Min(1)
        @Max(80)
        Integer weeklyStudyHours,

        @NotNull
        @Min(1)
        @Max(2000)
        Integer estimatedStudyHours,

        @Size(max = 1000)
        String mentorSummary,

        @Valid
        List<GoalPillarRequest> pillars,

        @Valid
        List<GoalWeeklyMissionRequest> weeklyMissions
) {
}
