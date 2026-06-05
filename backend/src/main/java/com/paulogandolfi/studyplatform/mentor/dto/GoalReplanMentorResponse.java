package com.paulogandolfi.studyplatform.mentor.dto;

import java.time.LocalDate;
import java.util.List;

public record GoalReplanMentorResponse(
        String reason,
        LocalDate targetDate,
        int weeklyStudyHours,
        int estimatedStudyHours,
        String mentorSummary,
        List<GoalPlanPillarResponse> pillars,
        List<WeeklyMissionResponse> weeklyMissions,
        List<String> nextActions,
        String notice
) {
}
