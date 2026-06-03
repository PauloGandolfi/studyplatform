package com.paulogandolfi.studyplatform.mentor.service;

import com.paulogandolfi.studyplatform.ai.service.AiModelClient;
import com.paulogandolfi.studyplatform.goals.entity.GoalPriority;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanPillarResponse;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanRequest;
import com.paulogandolfi.studyplatform.mentor.dto.GoalPlanResponse;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationItemResponse;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationsRequest;
import com.paulogandolfi.studyplatform.mentor.dto.StudyRecommendationsResponse;
import com.paulogandolfi.studyplatform.mentor.dto.WeeklyMissionResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class MentorGuidanceService {

    private final AiModelClient aiModelClient;

    public MentorGuidanceService(AiModelClient aiModelClient) {
        this.aiModelClient = aiModelClient;
    }

    @Transactional(readOnly = true)
    public GoalPlanResponse generateGoalPlan(GoalPlanRequest request) {
        String prompt = buildGoalPlanPrompt(request);

        try {
            GoalPlanResponse response = aiModelClient.generateGoalPlan(prompt);
            return normalizeGoalPlan(request, response);
        } catch (ResponseStatusException ex) {
            return fallbackGoalPlan(request);
        }
    }

    @Transactional(readOnly = true)
    public StudyRecommendationsResponse generateStudyRecommendations(StudyRecommendationsRequest request) {
        String prompt = buildStudyRecommendationsPrompt(request);

        try {
            StudyRecommendationsResponse response = aiModelClient.generateStudyRecommendations(prompt);
            return normalizeRecommendations(request, response);
        } catch (ResponseStatusException ex) {
            return fallbackRecommendations(request);
        }
    }

    private GoalPlanResponse normalizeGoalPlan(GoalPlanRequest request, GoalPlanResponse response) {
        if (response == null || response.pillars() == null || response.pillars().isEmpty()) {
            return fallbackGoalPlan(request);
        }

        int estimatedStudyHours = response.estimatedStudyHours() > 0
                ? response.estimatedStudyHours()
                : deriveEstimatedStudyHours(request.weeklyStudyHours(), request.targetDate());
        List<GoalPlanPillarResponse> pillars = normalizePillars(response.pillars(), estimatedStudyHours);
        List<WeeklyMissionResponse> missions = response.weeklyMissions() == null
                ? fallbackWeeklyMissions(pillars)
                : response.weeklyMissions();

        return new GoalPlanResponse(
                request.title().trim(),
                normalizeOptionalText(request.description()),
                request.currentLevel().trim(),
                request.targetDate(),
                request.weeklyStudyHours(),
                estimatedStudyHours,
                StringUtils.hasText(response.mentorSummary())
                        ? response.mentorSummary().trim()
                        : defaultGoalPlanSummary(request.title(), request.targetDate(), estimatedStudyHours),
                pillars,
                missions,
                "Plano sugerido pelo Mentor com base no conhecimento do modelo. Revise antes de salvar."
        );
    }

    private StudyRecommendationsResponse normalizeRecommendations(
            StudyRecommendationsRequest request,
            StudyRecommendationsResponse response
    ) {
        if (response == null || response.recommendations() == null || response.recommendations().isEmpty()) {
            return fallbackRecommendations(request);
        }

        List<StudyRecommendationItemResponse> recommendations = response.recommendations()
                .stream()
                .filter(item -> StringUtils.hasText(item.title()) && StringUtils.hasText(item.platform()) && StringUtils.hasText(item.link()))
                .sorted(Comparator.comparingInt(item -> pricingOrder(item.pricing())))
                .limit(6)
                .toList();

        if (recommendations.isEmpty()) {
            return fallbackRecommendations(request);
        }

        return new StudyRecommendationsResponse(
                StringUtils.hasText(response.subject()) ? response.subject().trim() : request.topic().trim(),
                StringUtils.hasText(response.level()) ? response.level().trim() : defaultLevel(request.currentLevel()),
                StringUtils.hasText(response.learningGoal()) ? response.learningGoal().trim() : defaultLearningGoal(request),
                response.suggestedOrder() == null || response.suggestedOrder().isEmpty()
                        ? List.of("Comece por um curso introdutorio gratuito.", "Avance para pratica guiada.", "Feche com um curso pago somente se precisar aprofundar.")
                        : response.suggestedOrder(),
                recommendations,
                StringUtils.hasText(response.practiceSuggestion())
                        ? response.practiceSuggestion().trim()
                        : "Construa um mini projeto simples ligado ao assunto para consolidar o estudo.",
                "Recomendacoes do Mentor baseadas no conhecimento do modelo. Nao sao resultados de busca em tempo real."
        );
    }

    private GoalPlanResponse fallbackGoalPlan(GoalPlanRequest request) {
        int estimatedStudyHours = deriveEstimatedStudyHours(request.weeklyStudyHours(), request.targetDate());
        List<GoalPlanPillarResponse> pillars = normalizePillars(List.of(
                new GoalPlanPillarResponse("Fundamentos", "Base teorica e conceitos essenciais do objetivo.", Math.max(1, Math.round(estimatedStudyHours * 0.35f))),
                new GoalPlanPillarResponse("Pratica guiada", "Exercicios, labs e repeticao deliberada.", Math.max(1, Math.round(estimatedStudyHours * 0.30f))),
                new GoalPlanPillarResponse("Projeto aplicado", "Entrega final para consolidar o conhecimento.", Math.max(1, estimatedStudyHours - Math.max(1, Math.round(estimatedStudyHours * 0.35f)) - Math.max(1, Math.round(estimatedStudyHours * 0.30f))))
        ), estimatedStudyHours);

        return new GoalPlanResponse(
                request.title().trim(),
                normalizeOptionalText(request.description()),
                request.currentLevel().trim(),
                request.targetDate(),
                request.weeklyStudyHours(),
                estimatedStudyHours,
                defaultGoalPlanSummary(request.title(), request.targetDate(), estimatedStudyHours),
                pillars,
                fallbackWeeklyMissions(pillars),
                "Plano fallback gerado sem apoio confiavel da IA. Revise e ajuste antes de salvar."
        );
    }

    private StudyRecommendationsResponse fallbackRecommendations(StudyRecommendationsRequest request) {
        String topic = request.topic().trim();
        return new StudyRecommendationsResponse(
                topic,
                defaultLevel(request.currentLevel()),
                defaultLearningGoal(request),
                List.of(
                        "Comece por um curso gratuito para formar repertorio.",
                        "Registre as duvidas e pratique em um mini projeto.",
                        "Considere um curso pago apenas depois de validar a base."
                ),
                List.of(
                        new StudyRecommendationItemResponse(
                                "Busca guiada no YouTube sobre " + topic,
                                "YouTube",
                                "https://www.youtube.com/results?search_query=" + slugify(topic + " curso gratis"),
                                "FREE",
                                "Entrada rapida e gratuita para mapear o assunto."
                        ),
                        new StudyRecommendationItemResponse(
                                "Trilha introdutoria em freeCodeCamp",
                                "freeCodeCamp",
                                "https://www.freecodecamp.org/news/search/?query=" + slugify(topic),
                                "FREE",
                                "Bom ponto de partida para estudar com exemplos praticos."
                        ),
                        new StudyRecommendationItemResponse(
                                "Curso aprofundado em Alura",
                                "Alura",
                                "https://www.alura.com.br/busca?query=" + slugify(topic),
                                "PAID",
                                "Opcao paga para aprofundar com uma trilha mais estruturada."
                        )
                ),
                "Monte um projeto simples aplicando o topico principal e registre aprendizados em anotacoes ou flashcards.",
                "Recomendacoes do Mentor baseadas no conhecimento do modelo. Nao sao resultados de busca em tempo real."
        );
    }

    private List<GoalPlanPillarResponse> normalizePillars(List<GoalPlanPillarResponse> rawPillars, int estimatedStudyHours) {
        List<GoalPlanPillarResponse> pillars = rawPillars.stream()
                .filter(pillar -> StringUtils.hasText(pillar.title()))
                .limit(6)
                .toList();

        if (pillars.isEmpty()) {
            return List.of(new GoalPlanPillarResponse("Execucao principal", "Pilar central do objetivo.", estimatedStudyHours));
        }

        int providedHours = pillars.stream().mapToInt(GoalPlanPillarResponse::targetHours).filter(value -> value > 0).sum();
        int fallbackHours = Math.max(1, Math.round(estimatedStudyHours / (float) pillars.size()));

        return pillars.stream()
                .map(pillar -> new GoalPlanPillarResponse(
                        pillar.title().trim(),
                        normalizeOptionalText(pillar.description()),
                        pillar.targetHours() > 0
                                ? pillar.targetHours()
                                : (providedHours == 0 ? fallbackHours : Math.max(1, estimatedStudyHours - providedHours))
                ))
                .toList();
    }

    private List<WeeklyMissionResponse> fallbackWeeklyMissions(List<GoalPlanPillarResponse> pillars) {
        return pillars.stream()
                .limit(4)
                .map(pillar -> new WeeklyMissionResponse(
                        pillars.indexOf(pillar) + 1,
                        "Semana " + (pillars.indexOf(pillar) + 1),
                        "Avance no pilar \"" + pillar.title() + "\" com foco em teoria, pratica e revisao."
                ))
                .toList();
    }

    private String buildGoalPlanPrompt(GoalPlanRequest request) {
        return """
                Voce e o Mentor de uma plataforma de estudos.

                Monte um plano inicial estruturado para o objetivo abaixo.
                Regras:
                - responda com pilares praticos e executaveis;
                - estime horas de estudo realistas;
                - pense em multiplos objetivos ativos, entao o plano deve ser enxuto e priorizado;
                - se houver prazo, distribua a carga para caber no tempo;
                - o texto do resumo deve ser em portugues do Brasil;
                - nao fale sobre navegacao na internet.

                Objetivo: %s
                Contexto opcional: %s
                Nivel atual: %s
                Prioridade: %s
                Horas por semana: %d
                Prazo final: %s
                """.formatted(
                request.title().trim(),
                StringUtils.hasText(request.description()) ? request.description().trim() : "nao informado",
                request.currentLevel().trim(),
                request.priority().name(),
                request.weeklyStudyHours(),
                request.targetDate() == null ? "sem prazo fechado" : request.targetDate()
        );
    }

    private String buildStudyRecommendationsPrompt(StudyRecommendationsRequest request) {
        return """
                Voce e o Mentor de uma plataforma de estudos.

                Gere uma recomendacao estruturada de cursos para o assunto pedido.
                Regras obrigatorias:
                - retorne apenas cursos ou trilhas com link de acesso;
                - liste primeiro recomendacoes gratuitas e depois algumas pagas de boa qualidade;
                - nao afirme que voce pesquisou na internet;
                - trate as recomendacoes como curadoria do modelo;
                - explique em poucas palavras por que cada curso vale a pena;
                - responda em portugues do Brasil.

                Assunto: %s
                Objetivo de aprendizagem: %s
                Nivel atual: %s
                """.formatted(
                request.topic().trim(),
                defaultLearningGoal(request),
                defaultLevel(request.currentLevel())
        );
    }

    private int deriveEstimatedStudyHours(int weeklyStudyHours, LocalDate targetDate) {
        if (targetDate == null) {
            return Math.max(1, weeklyStudyHours * 12);
        }

        long weeks = Math.max(1, ChronoUnit.WEEKS.between(LocalDate.now(), targetDate));
        return Math.max(1, Math.toIntExact(weeks * weeklyStudyHours));
    }

    private static int pricingOrder(String pricing) {
        return "FREE".equalsIgnoreCase(pricing) ? 0 : 1;
    }

    private static String defaultGoalPlanSummary(String title, LocalDate targetDate, int estimatedStudyHours) {
        if (targetDate == null) {
            return "Mentor: foque em constancia semanal para avancar em \"%s\". A estimativa inicial e de %d hora(s) de estudo distribuida em pilares progressivos."
                    .formatted(title, estimatedStudyHours);
        }

        return "Mentor: o plano para \"%s\" foi montado para caber no prazo ate %s, com estimativa inicial de %d hora(s) de estudo."
                .formatted(title, targetDate, estimatedStudyHours);
    }

    private static String defaultLevel(String currentLevel) {
        return StringUtils.hasText(currentLevel) ? currentLevel.trim() : "iniciante";
    }

    private static String defaultLearningGoal(StudyRecommendationsRequest request) {
        return StringUtils.hasText(request.learningGoal())
                ? request.learningGoal().trim()
                : "aprender " + request.topic().trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeOptionalText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static String slugify(String value) {
        return value.trim().replace(' ', '+');
    }
}
