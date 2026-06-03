package com.paulogandolfi.studyplatform.tasks.dto;

import com.paulogandolfi.studyplatform.tasks.entity.StudyTask;
import com.paulogandolfi.studyplatform.tasks.entity.TaskStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        UUID userId,
        UUID goalId,
        String title,
        String description,
        TaskStatus status,
        boolean primaryTask,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static TaskResponse from(StudyTask task) {
        return new TaskResponse(
                task.getId(),
                task.getUser().getId(),
                task.getGoal() == null ? null : task.getGoal().getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.isPrimaryTask(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
