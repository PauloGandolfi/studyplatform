package com.paulogandolfi.studyplatform.goals.service;

import com.paulogandolfi.studyplatform.goals.dto.GoalPillarRequest;
import com.paulogandolfi.studyplatform.goals.dto.GoalPillarResponse;
import com.paulogandolfi.studyplatform.goals.dto.GoalProgressSnapshotResponse;
import com.paulogandolfi.studyplatform.goals.dto.GoalReplanApplyRequest;
import com.paulogandolfi.studyplatform.goals.dto.GoalReplanHistoryResponse;
import com.paulogandolfi.studyplatform.goals.dto.GoalReplanProposalResponse;
import com.paulogandolfi.studyplatform.goals.dto.GoalReplanRequest;
import com.paulogandolfi.studyplatform.goals.dto.GoalRequest;
import com.paulogandolfi.studyplatform.goals.dto.GoalReviewSummaryResponse;
import com.paulogandolfi.studyplatform.goals.dto.GoalResponse;
import com.paulogandolfi.studyplatform.goals.dto.GoalSubjectSummaryResponse;
import com.paulogandolfi.studyplatform.goals.dto.GoalTaskSummaryResponse;
import com.paulogandolfi.studyplatform.goals.dto.GoalWeeklyMissionRequest;
import com.paulogandolfi.studyplatform.goals.dto.GoalWeeklyMissionResponse;
import com.paulogandolfi.studyplatform.goals.entity.Goal;
import com.paulogandolfi.studyplatform.goals.entity.GoalPillar;
import com.paulogandolfi.studyplatform.goals.entity.GoalReplanHistory;
import com.paulogandolfi.studyplatform.goals.entity.GoalStatus;
import com.paulogandolfi.studyplatform.goals.entity.GoalWeekPlan;
import com.paulogandolfi.studyplatform.goals.repository.GoalRepository;
import com.paulogandolfi.studyplatform.flashcards.repository.FlashcardRepository;
import com.paulogandolfi.studyplatform.mentor.dto.GoalReplanMentorResponse;
import com.paulogandolfi.studyplatform.mentor.service.MentorGuidanceService;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import com.paulogandolfi.studyplatform.tasks.repository.StudyTaskRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class GoalService {

    private static final int DEFAULT_NO_DEADLINE_WEEKS = 12;

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final SubjectRepository subjectRepository;
    private final FlashcardRepository flashcardRepository;
    private final GoalProgressService goalProgressService;
    private final MentorGuidanceService mentorGuidanceService;

    public GoalService(
            GoalRepository goalRepository,
            UserRepository userRepository,
            StudyTaskRepository studyTaskRepository,
            SubjectRepository subjectRepository,
            FlashcardRepository flashcardRepository,
            GoalProgressService goalProgressService,
            MentorGuidanceService mentorGuidanceService
    ) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.studyTaskRepository = studyTaskRepository;
        this.subjectRepository = subjectRepository;
        this.flashcardRepository = flashcardRepository;
        this.goalProgressService = goalProgressService;
        this.mentorGuidanceService = mentorGuidanceService;
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> list(UUID userId) {
        return goalRepository.findAllByUser_IdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(goal -> toResponse(userId, goal))
                .toList();
    }

    @Transactional(readOnly = true)
    public GoalResponse detail(UUID userId, UUID goalId) {
        return toResponse(userId, findGoal(userId, goalId));
    }

    @Transactional
    public GoalResponse create(UUID userId, GoalRequest request) {
        User user = findUser(userId);
        int estimatedStudyHours = resolveEstimatedStudyHours(request, null);
        Goal goal = new Goal(
                user,
                request.title().trim(),
                normalizeOptionalText(request.description()),
                request.currentLevel().trim(),
                request.priority(),
                request.status() == null ? GoalStatus.ACTIVE : request.status(),
                request.targetDate(),
                request.weeklyStudyHours(),
                estimatedStudyHours,
                resolveMentorSummary(request.mentorSummary(), request.title(), request.targetDate(), 0)
        );
        goal.replacePillars(buildPillars(goal, request.pillars(), estimatedStudyHours));
        goal.replaceWeekPlans(buildWeekPlans(request.weeklyMissions(), goal.getPillars()));

        return toResponse(userId, goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse update(UUID userId, UUID goalId, GoalRequest request) {
        Goal goal = findGoal(userId, goalId);
        int estimatedStudyHours = resolveEstimatedStudyHours(request, goal);
        GoalProgressSnapshotResponse progressSnapshot = goalProgressService.snapshot(
                userId,
                goal.getId(),
                estimatedStudyHours,
                goal.getPillars().size()
        );

        goal.setTitle(request.title().trim());
        goal.setDescription(normalizeOptionalText(request.description()));
        goal.setCurrentLevel(request.currentLevel().trim());
        goal.setPriority(request.priority());
        goal.setStatus(request.status() == null ? goal.getStatus() : request.status());
        goal.setTargetDate(request.targetDate());
        goal.setWeeklyStudyHours(request.weeklyStudyHours());
        goal.setEstimatedStudyHours(estimatedStudyHours);
        goal.replacePillars(buildPillars(goal, request.pillars(), estimatedStudyHours));
        goal.replaceWeekPlans(buildWeekPlans(request.weeklyMissions(), goal.getPillars()));
        goal.setMentorSummary(resolveMentorSummary(
                request.mentorSummary(),
                goal.getTitle(),
                goal.getTargetDate(),
                progressSnapshot.hoursProgressPercentage()
        ));

        return toResponse(userId, goal);
    }

    @Transactional(readOnly = true)
    public GoalReplanProposalResponse generateReplanProposal(UUID userId, UUID goalId, GoalReplanRequest request) {
        Goal goal = findGoal(userId, goalId);
        GoalProgressSnapshotResponse progressSnapshot = goalProgressService.snapshot(
                userId,
                goal.getId(),
                goal.getEstimatedStudyHours(),
                goal.getPillars().size()
        );
        GoalReplanMentorResponse proposal = mentorGuidanceService.generateGoalReplan(goal, progressSnapshot, request);

        return toProposalResponse(goalId, goal.getTitle(), proposal);
    }

    @Transactional
    public GoalResponse applyReplan(UUID userId, UUID goalId, GoalReplanApplyRequest request) {
        Goal goal = findGoal(userId, goalId);

        GoalReplanHistory history = new GoalReplanHistory(
                normalizeOptionalText(request.reason()),
                goal.getTargetDate(),
                request.targetDate(),
                goal.getWeeklyStudyHours(),
                request.weeklyStudyHours(),
                goal.getEstimatedStudyHours(),
                request.estimatedStudyHours(),
                normalizeOptionalText(request.mentorSummary())
        );

        goal.setTargetDate(request.targetDate());
        goal.setWeeklyStudyHours(request.weeklyStudyHours());
        goal.setEstimatedStudyHours(request.estimatedStudyHours());
        goal.setMentorSummary(resolveMentorSummary(
                request.mentorSummary(),
                goal.getTitle(),
                request.targetDate(),
                goalProgressService.calculateHoursProgress(request.estimatedStudyHours(), trackedStudySeconds(userId, goal.getId()))
        ));
        goal.replacePillars(buildPillars(goal, request.pillars(), request.estimatedStudyHours()));
        goal.replaceWeekPlans(buildWeekPlans(request.weeklyMissions(), goal.getPillars()));
        goal.addReplanHistory(history);

        return toResponse(userId, goalRepository.save(goal));
    }

    @Transactional
    public void delete(UUID userId, UUID goalId) {
        goalRepository.delete(findGoal(userId, goalId));
    }

    @Transactional(readOnly = true)
    public Goal findOwnedGoal(UUID userId, UUID goalId) {
        return findGoal(userId, goalId);
    }

    @Transactional(readOnly = true)
    public String buildMentorSummary(String title, LocalDate targetDate, int progress) {
        if (targetDate == null) {
            return "Mentor: acompanhe este objetivo com constancia semanal. Seu progresso atual esta em %d%% com base nas horas registradas."
                    .formatted(progress);
        }

        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), targetDate);
        if (daysRemaining < 0) {
            return "Mentor: este objetivo passou do prazo original. Priorize retomada, replaneje a trilha e proteja blocos fixos de estudo.";
        }

        return "Mentor: faltam %d dia(s) para concluir \"%s\". O progresso atual esta em %d%% com base nas horas estudadas."
                .formatted(daysRemaining, title, progress);
    }

    private GoalResponse toResponse(UUID userId, Goal goal) {
        GoalProgressSnapshotResponse progressSnapshot = goalProgressService.snapshot(
                userId,
                goal.getId(),
                goal.getEstimatedStudyHours(),
                goal.getPillars().size()
        );
        long trackedStudySeconds = progressSnapshot.trackedStudySeconds();
        int progressPercentage = progressSnapshot.hoursProgressPercentage();
        List<GoalPillarResponse> pillarResponses = buildPillarResponses(goal.getPillars(), trackedStudySeconds);
        List<GoalWeeklyMissionResponse> weeklyMissionResponses = goal.getWeekPlans()
                .stream()
                .map(weekPlan -> new GoalWeeklyMissionResponse(
                        weekPlan.getId(),
                        weekPlan.getWeekOrder(),
                        weekPlan.getTitle(),
                        weekPlan.getFocus()
                ))
                .toList();
        List<GoalTaskSummaryResponse> linkedTasks = studyTaskRepository
                .findAllByUser_IdAndGoal_IdOrderByPrimaryTaskDescCreatedAtAsc(userId, goal.getId())
                .stream()
                .map(task -> new GoalTaskSummaryResponse(task.getId(), task.getTitle(), task.getStatus(), task.isPrimaryTask()))
                .toList();
        List<GoalSubjectSummaryResponse> linkedSubjects = subjectRepository
                .findAllByUser_IdAndGoal_IdOrderByUpdatedAtDesc(userId, goal.getId())
                .stream()
                .map(subject -> new GoalSubjectSummaryResponse(subject.getId(), subject.getName(), subject.getDifficulty()))
                .toList();
        List<GoalReviewSummaryResponse> pendingReviews = flashcardRepository
                .findAllBySubject_User_IdAndSubject_Goal_IdAndNextReviewDateLessThanEqualOrderByNextReviewDateAscCreatedAtAsc(
                        userId,
                        goal.getId(),
                        LocalDate.now()
                )
                .stream()
                .limit(5)
                .map(flashcard -> new GoalReviewSummaryResponse(
                        flashcard.getId(),
                        flashcard.getSubject().getId(),
                        flashcard.getSubject().getName(),
                        flashcard.getQuestion(),
                        flashcard.getNextReviewDate(),
                        flashcard.getReviewInterval()
                ))
                .toList();
        List<GoalReplanHistoryResponse> replanHistory = goal.getReplanHistory()
                .stream()
                .map(history -> new GoalReplanHistoryResponse(
                        history.getId(),
                        history.getReason(),
                        history.getPreviousTargetDate(),
                        history.getNewTargetDate(),
                        history.getPreviousWeeklyStudyHours(),
                        history.getNewWeeklyStudyHours(),
                        history.getPreviousEstimatedStudyHours(),
                        history.getNewEstimatedStudyHours(),
                        history.getMentorSummary(),
                        history.getCreatedAt()
                ))
                .toList();

        return new GoalResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getCurrentLevel(),
                goal.getPriority(),
                goal.getStatus(),
                goal.getTargetDate(),
                goal.getWeeklyStudyHours(),
                goal.getEstimatedStudyHours(),
                trackedStudySeconds,
                progressPercentage,
                riskLevel(goal, progressPercentage),
                resolveMentorSummary(goal.getMentorSummary(), goal.getTitle(), goal.getTargetDate(), progressPercentage),
                progressSnapshot,
                pillarResponses,
                weeklyMissionResponses,
                linkedTasks,
                linkedSubjects,
                pendingReviews,
                replanHistory,
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }

    private List<GoalPillarResponse> buildPillarResponses(List<GoalPillar> pillars, long trackedStudySeconds) {
        long remainingSeconds = trackedStudySeconds;
        List<GoalPillarResponse> responses = new ArrayList<>();

        for (GoalPillar pillar : pillars.stream().sorted(Comparator.comparingInt(GoalPillar::getDisplayOrder)).toList()) {
            long pillarTargetSeconds = Math.max(1L, pillar.getTargetHours()) * 3600L;
            long consumedSeconds = Math.min(remainingSeconds, pillarTargetSeconds);
            int progress = (int) Math.min(100, Math.round((consumedSeconds * 100.0) / pillarTargetSeconds));
            remainingSeconds = Math.max(0, remainingSeconds - pillarTargetSeconds);

            responses.add(new GoalPillarResponse(
                    pillar.getId(),
                    pillar.getTitle(),
                    pillar.getDescription(),
                    pillar.getTargetHours(),
                    progress,
                    pillar.getDisplayOrder()
            ));
        }

        return responses;
    }

    private String riskLevel(Goal goal, int progressPercentage) {
        if (goal.getStatus() == GoalStatus.COMPLETED || progressPercentage >= 100) {
            return "COMPLETED";
        }

        if (goal.getTargetDate() == null) {
            return "NO_DEADLINE";
        }

        long totalDays = Math.max(1, ChronoUnit.DAYS.between(goal.getCreatedAt().toLocalDate(), goal.getTargetDate()));
        long elapsedDays = Math.max(0, ChronoUnit.DAYS.between(goal.getCreatedAt().toLocalDate(), LocalDate.now()));
        int expectedProgress = (int) Math.min(100, Math.round((elapsedDays * 100.0) / totalDays));

        return progressPercentage + 15 < expectedProgress ? "AT_RISK" : "ON_TRACK";
    }

    private List<GoalPillar> buildPillars(Goal goal, List<GoalPillarRequest> pillarRequests, int estimatedStudyHours) {
        List<GoalPillarRequest> source = (pillarRequests == null || pillarRequests.isEmpty())
                ? defaultPillars(goal.getTitle(), estimatedStudyHours)
                : pillarRequests;

        int remainingHours = Math.max(1, estimatedStudyHours);
        int defaultPerPillar = Math.max(1, Math.round(remainingHours / (float) source.size()));
        List<GoalPillar> pillars = new ArrayList<>();

        for (int index = 0; index < source.size(); index++) {
            GoalPillarRequest pillarRequest = source.get(index);
            int targetHours = pillarRequest.targetHours() == null
                    ? (index == source.size() - 1 ? remainingHours : defaultPerPillar)
                    : pillarRequest.targetHours();

            if (index == source.size() - 1) {
                targetHours = Math.max(1, remainingHours);
            } else {
                targetHours = Math.max(1, Math.min(targetHours, remainingHours - Math.max(0, source.size() - index - 1)));
                remainingHours -= targetHours;
            }

            pillars.add(new GoalPillar(
                    pillarRequest.title().trim(),
                    normalizeOptionalText(pillarRequest.description()),
                    targetHours,
                    index
            ));
        }

        return pillars;
    }

    private List<GoalWeekPlan> buildWeekPlans(List<GoalWeeklyMissionRequest> weekPlanRequests, List<GoalPillar> pillars) {
        List<GoalWeeklyMissionRequest> source = (weekPlanRequests == null || weekPlanRequests.isEmpty())
                ? defaultWeekPlans(pillars)
                : weekPlanRequests;

        return source.stream()
                .filter(weekPlan -> StringUtils.hasText(weekPlan.title()) && StringUtils.hasText(weekPlan.focus()))
                .sorted(Comparator.comparingInt(weekPlan -> weekPlan.weekOrder() == null ? Integer.MAX_VALUE : weekPlan.weekOrder()))
                .map(weekPlan -> new GoalWeekPlan(
                        weekPlan.weekOrder() == null ? 1 : weekPlan.weekOrder(),
                        weekPlan.title().trim(),
                        weekPlan.focus().trim()
                ))
                .toList();
    }

    private List<GoalPillarRequest> defaultPillars(String title, int estimatedStudyHours) {
        int first = Math.max(1, Math.round(estimatedStudyHours * 0.35f));
        int second = Math.max(1, Math.round(estimatedStudyHours * 0.30f));
        int third = Math.max(1, estimatedStudyHours - first - second);

        return List.of(
                new GoalPillarRequest("Fundamentos de " + title, "Construa a base conceitual e elimine lacunas principais.", first),
                new GoalPillarRequest("Pratica guiada", "Aplique o conteudo em exercicios, labs e pequenos desafios.", second),
                new GoalPillarRequest("Projeto aplicado", "Consolide o objetivo com entregas reais e revisao final.", third)
        );
    }

    private List<GoalWeeklyMissionRequest> defaultWeekPlans(List<GoalPillar> pillars) {
        List<GoalWeeklyMissionRequest> defaultPlans = new ArrayList<>();

        for (int index = 0; index < pillars.size(); index++) {
            GoalPillar pillar = pillars.get(index);
            defaultPlans.add(new GoalWeeklyMissionRequest(
                    index + 1,
                    "Semana " + (index + 1),
                    "Avance no pilar \"" + pillar.getTitle() + "\" com foco em estudo, pratica e revisao."
            ));
        }

        return defaultPlans;
    }

    private int resolveEstimatedStudyHours(GoalRequest request, Goal existingGoal) {
        if (request.estimatedStudyHours() != null) {
            return request.estimatedStudyHours();
        }

        if (request.targetDate() != null) {
            LocalDate baseDate = existingGoal == null ? LocalDate.now() : existingGoal.getCreatedAt().toLocalDate();
            long weeks = Math.max(1, ChronoUnit.WEEKS.between(baseDate, request.targetDate()));
            return Math.max(1, Math.toIntExact(weeks * request.weeklyStudyHours()));
        }

        return Math.max(1, request.weeklyStudyHours() * DEFAULT_NO_DEADLINE_WEEKS);
    }

    private Goal findGoal(UUID userId, UUID goalId) {
        return goalRepository.findByIdAndUser_Id(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
    }

    private long trackedStudySeconds(UUID userId, UUID goalId) {
        return goalProgressService.trackedStudySeconds(userId, goalId);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String resolveMentorSummary(
            String providedSummary,
            String title,
            LocalDate targetDate,
            int progress
    ) {
        if (StringUtils.hasText(providedSummary)) {
            return providedSummary.trim();
        }

        return buildMentorSummary(title, targetDate, progress);
    }

    private static String normalizeOptionalText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }

    private GoalReplanProposalResponse toProposalResponse(UUID goalId, String title, GoalReplanMentorResponse proposal) {
        return new GoalReplanProposalResponse(
                goalId,
                title,
                proposal.reason(),
                proposal.targetDate(),
                proposal.weeklyStudyHours(),
                proposal.estimatedStudyHours(),
                proposal.mentorSummary(),
                proposal.pillars().stream()
                        .map(pillar -> new GoalPillarResponse(
                                null,
                                pillar.title(),
                                pillar.description(),
                                pillar.targetHours(),
                                0,
                                proposal.pillars().indexOf(pillar)
                        ))
                        .toList(),
                proposal.weeklyMissions().stream()
                        .map(mission -> new GoalWeeklyMissionResponse(
                                null,
                                mission.weekOrder(),
                                mission.title(),
                                mission.focus()
                        ))
                        .toList(),
                proposal.nextActions(),
                proposal.notice()
        );
    }
}
