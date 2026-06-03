package com.paulogandolfi.studyplatform.goals.dto;

import java.util.UUID;

public record GoalPillarResponse(
        UUID id,
        String title,
        String description,
        int targetHours,
        int progressPercentage,
        int displayOrder
) {
}
