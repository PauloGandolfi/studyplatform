package com.paulogandolfi.studyplatform.metrics.dto;

import java.util.List;

public record DashboardMetricsResponse(
        long subjects,
        long notes,
        long flashcards,
        long reviewsToday,
        int accuracyRate,
        int streak,
        int dailyGoal,
        int dailyProgress,
        List<WeeklyReviewResponse> weeklyReviews,
        List<RecentActivityResponse> recentActivities
) {
}
