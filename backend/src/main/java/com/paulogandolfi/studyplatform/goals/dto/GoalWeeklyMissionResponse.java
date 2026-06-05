package com.paulogandolfi.studyplatform.goals.dto;

import java.util.UUID;

public record GoalWeeklyMissionResponse(
        UUID id,
        int weekOrder,
        String title,
        String focus
) {
}
