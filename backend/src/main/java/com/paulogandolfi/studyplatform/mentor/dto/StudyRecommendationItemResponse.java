package com.paulogandolfi.studyplatform.mentor.dto;

public record StudyRecommendationItemResponse(
        String title,
        String platform,
        String link,
        String pricing,
        String reason
) {
}
