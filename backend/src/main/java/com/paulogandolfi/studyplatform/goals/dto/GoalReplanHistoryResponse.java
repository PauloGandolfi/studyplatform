package com.paulogandolfi.studyplatform.goals.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record GoalReplanHistoryResponse(
        UUID id,
        String reason,
        LocalDate previousTargetDate,
        LocalDate newTargetDate,
        int previousWeeklyStudyHours,
        int newWeeklyStudyHours,
        int previousEstimatedStudyHours,
        int newEstimatedStudyHours,
        String mentorSummary,
        LocalDateTime createdAt
) {
}
