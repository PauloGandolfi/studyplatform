package com.paulogandolfi.studyplatform.tasks.dto;

import com.paulogandolfi.studyplatform.tasks.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TaskRequest(
        @NotBlank
        @Size(max = 160)
        String title,

        @Size(max = 1000)
        String description,

        @NotNull
        TaskStatus status,

        Boolean primaryTask
) {
}
