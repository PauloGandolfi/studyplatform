package com.paulogandolfi.studyplatform.mentor.controller;

import com.paulogandolfi.studyplatform.config.SecurityConfig;
import com.paulogandolfi.studyplatform.goals.entity.GoalPriority;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanPillarResponse;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanResponse;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationItemResponse;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationsResponse;
import com.paulogandolfi.studyplatform.mentor.dto.WeeklyMissionResponse;
import com.paulogandolfi.studyplatform.mentor.service.MentorGuidanceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MentorController.class)
@Import(SecurityConfig.class)
class MentorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MentorGuidanceService mentorGuidanceService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void goalPlanRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/mentor/goal-plan"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void generatesGoalPlanForAuthenticatedUser() throws Exception {
        when(mentorGuidanceService.generateGoalPlan(any())).thenReturn(new GoalPlanResponse(
                "Aprender Spring Boot",
                "Plano inicial",
                "iniciante",
                LocalDate.parse("2026-09-01"),
                8,
                96,
                "Mentor: foque em consistencia e construa uma API completa.",
                List.of(new GoalPlanPillarResponse("Fundamentos", "Base", 32)),
                List.of(new WeeklyMissionResponse(1, "Semana 1", "Revisar Java e Maven")),
                "Plano sugerido pelo Mentor."
        ));

        mockMvc.perform(post("/mentor/goal-plan")
                        .with(jwt().jwt(jwt -> jwt.claim("userId", "1f338858-8d7c-4b99-95e2-c3fe3c8a7912")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Aprender Spring Boot",
                                  "description": "Virar produtivo em backend Java",
                                  "currentLevel": "iniciante",
                                  "priority": "%s",
                                  "targetDate": "2026-09-01",
                                  "weeklyStudyHours": 8
                                }
                                """.formatted(GoalPriority.HIGH)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Aprender Spring Boot"))
                .andExpect(jsonPath("$.pillars[0].title").value("Fundamentos"))
                .andExpect(jsonPath("$.weeklyMissions[0].focus").value("Revisar Java e Maven"));
    }

    @Test
    void generatesStudyRecommendationsForAuthenticatedUser() throws Exception {
        when(mentorGuidanceService.generateStudyRecommendations(any())).thenReturn(new StudyRecommendationsResponse(
                "Spring Security",
                "iniciante",
                "aprender autenticacao JWT",
                List.of("Curso gratuito", "Pratica", "Curso pago"),
                List.of(
                        new StudyRecommendationItemResponse("Curso gratis", "YouTube", "https://youtube.com/abc", "FREE", "Introducao rapida"),
                        new StudyRecommendationItemResponse("Curso aprofundado", "Alura", "https://alura.com.br/curso", "PAID", "Aprofundamento")
                ),
                "Crie uma API simples com login.",
                "Curadoria do Mentor."
        ));

        mockMvc.perform(post("/mentor/recommendations")
                        .with(jwt().jwt(jwt -> jwt.claim("userId", "1f338858-8d7c-4b99-95e2-c3fe3c8a7912")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "topic": "Spring Security",
                                  "learningGoal": "aprender autenticacao JWT",
                                  "currentLevel": "iniciante"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject").value("Spring Security"))
                .andExpect(jsonPath("$.recommendations[0].pricing").value("FREE"))
                .andExpect(jsonPath("$.recommendations[1].pricing").value("PAID"));
    }
}
