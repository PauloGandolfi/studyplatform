package com.paulogandolfi.studyplatform.metrics.dto;

import java.time.LocalDate;

public record WeeklyReviewResponse(
        LocalDate date,
        String label,
        long reviews
) {
}
