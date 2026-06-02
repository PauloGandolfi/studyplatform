package com.paulogandolfi.studyplatform.ai.controller;

import com.paulogandolfi.studyplatform.ai.dto.AiChatRequest;
import com.paulogandolfi.studyplatform.ai.dto.AiChatResponse;
import com.paulogandolfi.studyplatform.ai.service.AiModelClient;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai/chat")
public class AiChatController {

    private final AiModelClient aiModelClient;

    public AiChatController(AiModelClient aiModelClient) {
        this.aiModelClient = aiModelClient;
    }

    @PostMapping
    public AiChatResponse chat(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AiChatRequest request
    ) {
        String response = aiModelClient.generateText(request.message());
        return new AiChatResponse(response);
    }
}
