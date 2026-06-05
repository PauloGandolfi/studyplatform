package com.paulogandolfi.studyplatform.goals.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GoalReplanProposalResponse(
        UUID goalId,
        String title,
        String reason,
        LocalDate targetDate,
        int weeklyStudyHours,
        int estimatedStudyHours,
        String mentorSummary,
        List<GoalPillarResponse> pillars,
        List<GoalWeeklyMissionResponse> weeklyMissions,
        List<String> nextActions,
        String notice
) {
}
