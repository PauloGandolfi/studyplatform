package com.paulogandolfi.studyplatform.goals.dto;

import com.paulogandolfi.studyplatform.subjects.entity.SubjectDifficulty;

import java.util.UUID;

public record GoalSubjectSummaryResponse(
        UUID id,
        String name,
        SubjectDifficulty difficulty
) {
}
