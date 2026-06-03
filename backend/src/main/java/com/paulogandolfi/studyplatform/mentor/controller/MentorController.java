package com.paulogandolfi.studyplatform.mentor.controller;

import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanRequest;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanResponse;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationsRequest;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationsResponse;
import com.paulogandolfi.studyplatform.mentor.service.MentorGuidanceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/mentor")
public class MentorController {

    private final MentorGuidanceService mentorGuidanceService;

    public MentorController(MentorGuidanceService mentorGuidanceService) {
        this.mentorGuidanceService = mentorGuidanceService;
    }

    @PostMapping("/goal-plan")
    public GoalPlanResponse generateGoalPlan(@Valid @RequestBody GoalPlanRequest request) {
        return mentorGuidanceService.generateGoalPlan(request);
    }

    @PostMapping("/recommendations")
    public StudyRecommendationsResponse generateRecommendations(@Valid @RequestBody StudyRecommendationsRequest request) {
        return mentorGuidanceService.generateStudyRecommendations(request);
    }
}
