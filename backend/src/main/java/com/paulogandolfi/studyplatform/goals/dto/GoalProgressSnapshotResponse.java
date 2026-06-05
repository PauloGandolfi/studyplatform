package com.paulogandolfi.studyplatform.goals.dto;

public record GoalProgressSnapshotResponse(
        long trackedStudySeconds,
        int hoursProgressPercentage,
        int completedTasks,
        int totalTasks,
        int linkedSubjects,
        int totalPillars,
        int pendingReviews,
        int totalFlashcards
) {
}
