package com.paulogandolfi.studyplatform.goals.dto;

import java.time.LocalDate;
import java.util.UUID;

public record GoalReviewSummaryResponse(
        UUID id,
        UUID subjectId,
        String subjectName,
        String question,
        LocalDate nextReviewDate,
        int reviewInterval
) {
}
