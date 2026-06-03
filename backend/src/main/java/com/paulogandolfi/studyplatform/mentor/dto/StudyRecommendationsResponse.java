package com.paulogandolfi.studyplatform.mentor.dto;

import java.util.List;

public record StudyRecommendationsResponse(
        String subject,
        String level,
        String learningGoal,
        List<String> suggestedOrder,
        List<StudyRecommendationItemResponse> recommendations,
        String practiceSuggestion,
        String mentorNotice
) {
}
