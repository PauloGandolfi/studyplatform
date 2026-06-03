package com.paulogandolfi.studyplatform.mentor.dto;

import java.time.LocalDate;
import java.util.List;

public record GoalPlanResponse(
        String title,
        String description,
        String currentLevel,
        LocalDate targetDate,
        int weeklyStudyHours,
        int estimatedStudyHours,
        String mentorSummary,
        List<GoalPlanPillarResponse> pillars,
        List<WeeklyMissionResponse> weeklyMissions,
        String notice
) {
}
