package com.paulogandolfi.studyplatform.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudyRecommendationsRequest(
        @NotBlank
        @Size(max = 160)
        String topic,

        @Size(max = 160)
        String learningGoal,

        @Size(max = 80)
        String currentLevel
) {
}
