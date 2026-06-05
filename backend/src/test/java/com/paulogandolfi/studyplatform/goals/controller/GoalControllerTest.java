package com.paulogandolfi.studyplatform.goals.controller;

import com.paulogandolfi.studyplatform.auth.service.JwtService;
import com.paulogandolfi.studyplatform.goals.entity.Goal;
import com.paulogandolfi.studyplatform.goals.entity.GoalPriority;
import com.paulogandolfi.studyplatform.goals.entity.GoalStatus;
import com.paulogandolfi.studyplatform.goals.repository.GoalRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GoalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void goalsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/goals"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createListUpdateAndDeleteGoals() throws Exception {
        User user = createUser("Goal User", "goal-user@example.com");

        String body = """
                {
                  "title": "Virar backend Java pleno",
                  "description": "Quero consolidar Java, Spring e testes",
                  "currentLevel": "junior",
                  "priority": "HIGH",
                  "status": "ACTIVE",
                  "targetDate": "2026-10-01",
                  "weeklyStudyHours": 10,
                  "estimatedStudyHours": 120
                }
                """;

        mockMvc.perform(post("/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Virar backend Java pleno"))
                .andExpect(jsonPath("$.progressPercentage").value(0))
                .andExpect(jsonPath("$.pillars.length()").value(3))
                .andExpect(jsonPath("$.weeklyMissions.length()").value(3));

        Goal savedGoal = goalRepository.findAllByUser_IdOrderByUpdatedAtDesc(user.getId()).getFirst();

        mockMvc.perform(get("/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(savedGoal.getId().toString()));

        mockMvc.perform(get("/goals/{id}", savedGoal.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedGoal.getId().toString()))
                .andExpect(jsonPath("$.weeklyMissions.length()").value(3))
                .andExpect(jsonPath("$.mentorSummary").exists());

        mockMvc.perform(put("/goals/{id}", savedGoal.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Virar backend Java pleno revisado",
                                  "description": "Plano ajustado",
                                  "currentLevel": "junior",
                                  "priority": "MEDIUM",
                                  "status": "PAUSED",
                                  "targetDate": "2026-11-01",
                                  "weeklyStudyHours": 8,
                                  "estimatedStudyHours": 96
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Virar backend Java pleno revisado"))
                .andExpect(jsonPath("$.status").value("PAUSED"))
                .andExpect(jsonPath("$.priority").value("MEDIUM"));

        mockMvc.perform(delete("/goals/{id}", savedGoal.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNoContent());

        assertThat(goalRepository.findById(savedGoal.getId())).isEmpty();
    }

    @Test
    void returnsGoalDetailOnlyForOwner() throws Exception {
        User user = createUser("Owner Goal User", "owner-goal-user@example.com");
        User otherUser = createUser("Other Goal User", "other-goal-user@example.com");

        Goal goal = goalRepository.save(new Goal(
                otherUser,
                "Objetivo privado",
                "Nao deve aparecer",
                "iniciante",
                GoalPriority.HIGH,
                GoalStatus.ACTIVE,
                LocalDate.parse("2026-10-01"),
                6,
                60,
                "Resumo"
        ));

        mockMvc.perform(get("/goals/{id}", goal.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNotFound());
    }

    private User createUser(String name, String email) {
        return userRepository.save(new User(name, email, passwordEncoder.encode("password123")));
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.createToken(user);
    }
}
