package com.paulogandolfi.studyplatform.ai.service;

import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsResponse;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanResponse;
import com.paulogandolfi.studyplatform.mentor.dto.GoalReplanMentorResponse;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationsResponse;

public interface AiModelClient {

    GenerateFlashcardsResponse generateFlashcards(String prompt, int maxCards);

    String generateText(String prompt);

    GoalPlanResponse generateGoalPlan(String prompt);

    GoalReplanMentorResponse generateGoalReplan(String prompt);

    StudyRecommendationsResponse generateStudyRecommendations(String prompt);
}
