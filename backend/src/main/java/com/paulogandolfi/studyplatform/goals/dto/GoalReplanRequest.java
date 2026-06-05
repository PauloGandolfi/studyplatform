package com.paulogandolfi.studyplatform.goals.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record GoalReplanRequest(
        @Size(max = 2000)
        String context,

        LocalDate preferredTargetDate,

        @Min(1)
        @Max(80)
        Integer preferredWeeklyStudyHours
) {
}
