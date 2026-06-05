package com.paulogandolfi.studyplatform.goals.dto;

import com.paulogandolfi.studyplatform.goals.entity.GoalPriority;
import com.paulogandolfi.studyplatform.goals.entity.GoalStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        String title,
        String description,
        String currentLevel,
        GoalPriority priority,
        GoalStatus status,
        LocalDate targetDate,
        int weeklyStudyHours,
        int estimatedStudyHours,
        long trackedStudySeconds,
        int progressPercentage,
        String riskLevel,
        String mentorSummary,
        GoalProgressSnapshotResponse progressSnapshot,
        List<GoalPillarResponse> pillars,
        List<GoalWeeklyMissionResponse> weeklyMissions,
        List<GoalTaskSummaryResponse> linkedTasks,
        List<GoalSubjectSummaryResponse> linkedSubjects,
        List<GoalReviewSummaryResponse> pendingReviews,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
