package com.paulogandolfi.studyplatform.ai.controller;

import com.paulogandolfi.studyplatform.ai.dto.AiFlashcardSuggestion;
import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsResponse;
import com.paulogandolfi.studyplatform.ai.service.AiFlashcardService;
import com.paulogandolfi.studyplatform.config.SecurityConfig;
import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiFlashcardController.class)
@Import(SecurityConfig.class)
class AiFlashcardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AiFlashcardService aiFlashcardService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void generateFlashcardsRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/ai/flashcards/generate"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void generateFlashcardsForAuthenticatedUser() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID subjectId = UUID.randomUUID();

        when(aiFlashcardService.generate(
                argThat(id -> id.equals(userId)),
                argThat(request -> request.subjectId().equals(subjectId)
                        && request.content().equals("polimorfismo em Java")
                        && request.maxCards() == 3)
        )).thenReturn(new GenerateFlashcardsResponse(List.of(
                new AiFlashcardSuggestion("O que e polimorfismo?", "E a capacidade de um objeto assumir diferentes formas.", Difficulty.MEDIUM)
        )));

        mockMvc.perform(post("/ai/flashcards/generate")
                        .with(jwt().jwt(jwt -> jwt.claim("userId", userId.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "content": "polimorfismo em Java",
                                  "maxCards": 3
                                }
                                """.formatted(subjectId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flashcards.length()").value(1))
                .andExpect(jsonPath("$.flashcards[0].question").value("O que e polimorfismo?"))
                .andExpect(jsonPath("$.flashcards[0].answer").value("E a capacidade de um objeto assumir diferentes formas."))
                .andExpect(jsonPath("$.flashcards[0].difficulty").value("MEDIUM"));
    }
}
