package com.paulogandolfi.studyplatform.mentor.dto;

public record WeeklyMissionResponse(
        int weekOrder,
        String title,
        String focus
) {
}
