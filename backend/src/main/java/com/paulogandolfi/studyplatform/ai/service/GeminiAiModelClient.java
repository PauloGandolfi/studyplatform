package com.paulogandolfi.studyplatform.ai.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paulogandolfi.studyplatform.ai.dto.AiFlashcardSuggestion;
import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsResponse;
import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanPillarResponse;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanResponse;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationItemResponse;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationsResponse;
import com.paulogandolfi.studyplatform.mentor.dto.WeeklyMissionResponse;
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
            @Value("${app.ai.gemini.base-url}") String baseUrl
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-goog-api-key", apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.objectMapper = new ObjectMapper();
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

    @Override
    public String generateText(String prompt) {
        if (!StringUtils.hasText(apiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }

        GeminiGenerateContentRequest request = new GeminiGenerateContentRequest(
                List.of(new GeminiContent(List.of(new GeminiPart(prompt)))),
                null
        );

        try {
            GeminiGenerateContentResponse response = restClient.post()
                    .uri("/{model}:generateContent", model)
                    .body(request)
                    .retrieve()
                    .body(GeminiGenerateContentResponse.class);

            return extractText(response);
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to generate text with Gemini", ex);
        }
    }

    @Override
    public GoalPlanResponse generateGoalPlan(String prompt) {
        if (!StringUtils.hasText(apiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }

        GeminiGenerateContentRequest request = new GeminiGenerateContentRequest(
                List.of(new GeminiContent(List.of(new GeminiPart(prompt)))),
                new GeminiGenerationConfig("application/json", goalPlanSchema())
        );

        try {
            GeminiGenerateContentResponse response = restClient.post()
                    .uri("/{model}:generateContent", model)
                    .body(request)
                    .retrieve()
                    .body(GeminiGenerateContentResponse.class);

            return sanitizeGoalPlan(objectMapper.readValue(extractText(response), GoalPlanResponse.class));
        } catch (JsonProcessingException | RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to generate goal plan with Gemini", ex);
        }
    }

    @Override
    public StudyRecommendationsResponse generateStudyRecommendations(String prompt) {
        if (!StringUtils.hasText(apiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }

        GeminiGenerateContentRequest request = new GeminiGenerateContentRequest(
                List.of(new GeminiContent(List.of(new GeminiPart(prompt)))),
                new GeminiGenerationConfig("application/json", studyRecommendationsSchema())
        );

        try {
            GeminiGenerateContentResponse response = restClient.post()
                    .uri("/{model}:generateContent", model)
                    .body(request)
                    .retrieve()
                    .body(GeminiGenerateContentResponse.class);

            return sanitizeStudyRecommendations(objectMapper.readValue(extractText(response), StudyRecommendationsResponse.class));
        } catch (JsonProcessingException | RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to generate study recommendations with Gemini", ex);
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

    private static GoalPlanResponse sanitizeGoalPlan(GoalPlanResponse response) {
        if (response == null) {
            return null;
        }

        List<GoalPlanPillarResponse> pillars = response.pillars() == null
                ? List.of()
                : response.pillars().stream()
                .filter(Objects::nonNull)
                .filter(pillar -> StringUtils.hasText(pillar.title()))
                .limit(6)
                .map(pillar -> new GoalPlanPillarResponse(
                        pillar.title().trim(),
                        StringUtils.hasText(pillar.description()) ? pillar.description().trim() : null,
                        Math.max(1, pillar.targetHours())
                ))
                .toList();

        List<WeeklyMissionResponse> missions = response.weeklyMissions() == null
                ? List.of()
                : response.weeklyMissions().stream()
                .filter(Objects::nonNull)
                .filter(mission -> StringUtils.hasText(mission.title()) && StringUtils.hasText(mission.focus()))
                .limit(8)
                .map(mission -> new WeeklyMissionResponse(
                        Math.max(1, mission.weekOrder()),
                        mission.title().trim(),
                        mission.focus().trim()
                ))
                .toList();

        return new GoalPlanResponse(
                response.title(),
                response.description(),
                response.currentLevel(),
                response.targetDate(),
                response.weeklyStudyHours(),
                Math.max(1, response.estimatedStudyHours()),
                response.mentorSummary(),
                pillars,
                missions,
                response.notice()
        );
    }

    private static StudyRecommendationsResponse sanitizeStudyRecommendations(StudyRecommendationsResponse response) {
        if (response == null) {
            return null;
        }

        List<StudyRecommendationItemResponse> recommendations = response.recommendations() == null
                ? List.of()
                : response.recommendations().stream()
                .filter(Objects::nonNull)
                .filter(item -> StringUtils.hasText(item.title()) && StringUtils.hasText(item.platform()) && StringUtils.hasText(item.link()))
                .limit(6)
                .map(item -> new StudyRecommendationItemResponse(
                        item.title().trim(),
                        item.platform().trim(),
                        item.link().trim(),
                        StringUtils.hasText(item.pricing()) ? item.pricing().trim().toUpperCase() : "FREE",
                        StringUtils.hasText(item.reason()) ? item.reason().trim() : "Boa opcao para o proximo passo."
                ))
                .toList();

        return new StudyRecommendationsResponse(
                response.subject(),
                response.level(),
                response.learningGoal(),
                response.suggestedOrder() == null ? List.of() : response.suggestedOrder(),
                recommendations,
                response.practiceSuggestion(),
                response.mentorNotice()
        );
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

    private static Map<String, Object> goalPlanSchema() {
        Map<String, Object> pillarSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "title", Map.of("type", "STRING"),
                        "description", Map.of("type", "STRING"),
                        "targetHours", Map.of("type", "INTEGER")
                ),
                "required", List.of("title", "description", "targetHours"),
                "propertyOrdering", List.of("title", "description", "targetHours")
        );

        Map<String, Object> missionSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "weekOrder", Map.of("type", "INTEGER"),
                        "title", Map.of("type", "STRING"),
                        "focus", Map.of("type", "STRING")
                ),
                "required", List.of("weekOrder", "title", "focus"),
                "propertyOrdering", List.of("weekOrder", "title", "focus")
        );

        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "title", Map.of("type", "STRING"),
                        "description", Map.of("type", "STRING"),
                        "currentLevel", Map.of("type", "STRING"),
                        "weeklyStudyHours", Map.of("type", "INTEGER"),
                        "estimatedStudyHours", Map.of("type", "INTEGER"),
                        "mentorSummary", Map.of("type", "STRING"),
                        "pillars", Map.of("type", "ARRAY", "items", pillarSchema, "maxItems", 6),
                        "weeklyMissions", Map.of("type", "ARRAY", "items", missionSchema, "maxItems", 8),
                        "notice", Map.of("type", "STRING")
                ),
                "required", List.of("title", "currentLevel", "weeklyStudyHours", "estimatedStudyHours", "mentorSummary", "pillars", "weeklyMissions", "notice"),
                "propertyOrdering", List.of("title", "description", "currentLevel", "weeklyStudyHours", "estimatedStudyHours", "mentorSummary", "pillars", "weeklyMissions", "notice")
        );
    }

    private static Map<String, Object> studyRecommendationsSchema() {
        Map<String, Object> recommendationSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "title", Map.of("type", "STRING"),
                        "platform", Map.of("type", "STRING"),
                        "link", Map.of("type", "STRING"),
                        "pricing", Map.of("type", "STRING", "enum", List.of("FREE", "PAID")),
                        "reason", Map.of("type", "STRING")
                ),
                "required", List.of("title", "platform", "link", "pricing", "reason"),
                "propertyOrdering", List.of("title", "platform", "link", "pricing", "reason")
        );

        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "subject", Map.of("type", "STRING"),
                        "level", Map.of("type", "STRING"),
                        "learningGoal", Map.of("type", "STRING"),
                        "suggestedOrder", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"), "maxItems", 6),
                        "recommendations", Map.of("type", "ARRAY", "items", recommendationSchema, "maxItems", 6),
                        "practiceSuggestion", Map.of("type", "STRING"),
                        "mentorNotice", Map.of("type", "STRING")
                ),
                "required", List.of("subject", "level", "learningGoal", "suggestedOrder", "recommendations", "practiceSuggestion", "mentorNotice"),
                "propertyOrdering", List.of("subject", "level", "learningGoal", "suggestedOrder", "recommendations", "practiceSuggestion", "mentorNotice")
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
