package com.paulogandolfi.studyplatform.ai.controller;

import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsRequest;
import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsResponse;
import com.paulogandolfi.studyplatform.ai.service.AiFlashcardService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/ai/flashcards")
public class AiFlashcardController {

    private final AiFlashcardService aiFlashcardService;

    public AiFlashcardController(AiFlashcardService aiFlashcardService) {
        this.aiFlashcardService = aiFlashcardService;
    }

    @PostMapping("/generate")
    public GenerateFlashcardsResponse generate(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody GenerateFlashcardsRequest request
    ) {
        return aiFlashcardService.generate(currentUserId(jwt), request);
    }

    private static UUID currentUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }
}
