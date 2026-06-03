package com.paulogandolfi.studyplatform.goals.dto;

import com.paulogandolfi.studyplatform.tasks.entity.TaskStatus;

import java.util.UUID;

public record GoalTaskSummaryResponse(
        UUID id,
        String title,
        TaskStatus status,
        boolean primaryTask
) {
}
