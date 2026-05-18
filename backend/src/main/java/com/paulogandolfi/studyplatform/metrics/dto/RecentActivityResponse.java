package com.paulogandolfi.studyplatform.metrics.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecentActivityResponse(
        String title,
        String subject,
        String type,
        LocalDate sessionDate,
        LocalDateTime createdAt
) {
}
