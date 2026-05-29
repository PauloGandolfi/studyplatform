package com.paulogandolfi.studyplatform.ai.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paulogandolfi.studyplatform.ai.dto.AiFlashcardSuggestion;
import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsResponse;
import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class GeminiAiModelClient implements AiModelClient {

    private final String apiKey;
    private final String model;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiAiModelClient(
            @Value("${app.ai.gemini.api-key}") String apiKey,
            @Value("${app.ai.gemini.model}") String model,
            @Value("${app.ai.gemini.base-url}") String baseUrl,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-goog-api-key", apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.objectMapper = objectMapper;
    }

    @Override
    public GenerateFlashcardsResponse generateFlashcards(String prompt, int maxCards) {
        if (!StringUtils.hasText(apiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }

        GeminiGenerateContentRequest request = new GeminiGenerateContentRequest(
                List.of(new GeminiContent(List.of(new GeminiPart(prompt)))),
                new GeminiGenerationConfig("application/json", flashcardsSchema(maxCards))
        );

        try {
            GeminiGenerateContentResponse response = restClient.post()
                    .uri("/{model}:generateContent", model)
                    .body(request)
                    .retrieve()
                    .body(GeminiGenerateContentResponse.class);

            return sanitize(objectMapper.readValue(extractText(response), GenerateFlashcardsResponse.class), maxCards);
        } catch (JsonProcessingException | RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to generate flashcards with Gemini", ex);
        }
    }

    private static GenerateFlashcardsResponse sanitize(GenerateFlashcardsResponse response, int maxCards) {
        if (response.flashcards() == null) {
            return new GenerateFlashcardsResponse(List.of());
        }

        List<AiFlashcardSuggestion> flashcards = response.flashcards()
                .stream()
                .filter(Objects::nonNull)
                .filter(flashcard -> StringUtils.hasText(flashcard.question()) && StringUtils.hasText(flashcard.answer()))
                .limit(maxCards)
                .map(flashcard -> new AiFlashcardSuggestion(
                        flashcard.question().trim(),
                        flashcard.answer().trim(),
                        flashcard.difficulty() == null ? Difficulty.MEDIUM : flashcard.difficulty()
                ))
                .toList();

        return new GenerateFlashcardsResponse(flashcards);
    }

    private static String extractText(GeminiGenerateContentResponse response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini returned no candidates");
        }

        GeminiContent content = response.candidates().get(0).content();
        if (content == null || content.parts() == null || content.parts().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini returned no content");
        }

        String text = content.parts().get(0).text();
        if (!StringUtils.hasText(text)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini returned empty content");
        }

        return text;
    }

    private static Map<String, Object> flashcardsSchema(int maxCards) {
        Map<String, Object> flashcardSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "question", Map.of(
                                "type", "STRING",
                                "description", "Pergunta objetiva para revisar um conceito."
                        ),
                        "answer", Map.of(
                                "type", "STRING",
                                "description", "Resposta curta, correta e clara."
                        ),
                        "difficulty", Map.of(
                                "type", "STRING",
                                "description", "Dificuldade estimada do flashcard.",
                                "enum", List.of("EASY", "MEDIUM", "HARD")
                        )
                ),
                "required", List.of("question", "answer", "difficulty"),
                "propertyOrdering", List.of("question", "answer", "difficulty")
        );

        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "flashcards", Map.of(
                                "type", "ARRAY",
                                "description", "Lista de flashcards gerados a partir do conteudo enviado.",
                                "minItems", 0,
                                "maxItems", maxCards,
                                "items", flashcardSchema
                        )
                ),
                "required", List.of("flashcards"),
                "propertyOrdering", List.of("flashcards")
        );
    }

    private record GeminiGenerateContentRequest(
            List<GeminiContent> contents,
            GeminiGenerationConfig generationConfig
    ) {
    }

    private record GeminiGenerationConfig(
            String responseMimeType,
            Map<String, Object> responseSchema
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiGenerateContentResponse(List<GeminiCandidate> candidates) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiCandidate(GeminiContent content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiContent(List<GeminiPart> parts) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiPart(String text) {
    }
}
