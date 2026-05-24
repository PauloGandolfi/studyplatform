package com.paulogandolfi.studyplatform.metrics.service;

import com.paulogandolfi.studyplatform.flashcards.repository.FlashcardRepository;
import com.paulogandolfi.studyplatform.metrics.dto.DashboardMetricsResponse;
import com.paulogandolfi.studyplatform.metrics.dto.RecentActivityResponse;
import com.paulogandolfi.studyplatform.metrics.dto.WeeklyReviewResponse;
import com.paulogandolfi.studyplatform.notes.repository.NoteRepository;
import com.paulogandolfi.studyplatform.sessions.entity.StudySession;
import com.paulogandolfi.studyplatform.sessions.repository.StudySessionRepository;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class MetricsService {

    private static final int DAILY_GOAL = 12;
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

    private final SubjectRepository subjectRepository;
    private final NoteRepository noteRepository;
    private final FlashcardRepository flashcardRepository;
    private final StudySessionRepository studySessionRepository;

    public MetricsService(
            SubjectRepository subjectRepository,
            NoteRepository noteRepository,
            FlashcardRepository flashcardRepository,
            StudySessionRepository studySessionRepository
    ) {
        this.subjectRepository = subjectRepository;
        this.noteRepository = noteRepository;
        this.flashcardRepository = flashcardRepository;
        this.studySessionRepository = studySessionRepository;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse dashboard(UUID userId) {
        LocalDate today = LocalDate.now();
        long reviewsToday = studySessionRepository.sumCardsReviewedByUserIdAndSessionDate(userId, today);
        long totalReviewed = studySessionRepository.sumCardsReviewedByUserId(userId);
        long totalCorrect = studySessionRepository.sumCorrectAnswersByUserId(userId);
        int accuracyRate = totalReviewed == 0 ? 0 : (int) Math.round((totalCorrect * 100.0) / totalReviewed);
        int dailyProgress = (int) Math.min(100, Math.round((reviewsToday * 100.0) / DAILY_GOAL));

        return new DashboardMetricsResponse(
                subjectRepository.countByUser_Id(userId),
                noteRepository.countBySubject_User_Id(userId),
                flashcardRepository.countBySubject_User_Id(userId),
                reviewsToday,
                studySessionRepository.sumDurationSecondsByUserId(userId),
                accuracyRate,
                calculateStreak(userId, today),
                DAILY_GOAL,
                dailyProgress,
                weeklyReviews(userId, today),
                recentActivities(userId)
        );
    }

    private int calculateStreak(UUID userId, LocalDate today) {
        List<LocalDate> reviewedDates = studySessionRepository.findReviewedDatesByUserId(userId);
        int streak = 0;
        LocalDate expectedDate = today;

        for (LocalDate reviewedDate : reviewedDates) {
            if (reviewedDate.isAfter(expectedDate)) {
                continue;
            }

            if (reviewedDate.equals(expectedDate)) {
                streak++;
                expectedDate = expectedDate.minusDays(1);
                continue;
            }

            break;
        }

        return streak;
    }

    private List<WeeklyReviewResponse> weeklyReviews(UUID userId, LocalDate today) {
        LocalDate startDate = today.minusDays(6);
        Map<LocalDate, Long> reviewsByDate = new LinkedHashMap<>();

        for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
            reviewsByDate.put(date, 0L);
        }

        studySessionRepository.sumCardsReviewedByDateBetween(userId, startDate, today)
                .forEach(row -> reviewsByDate.put((LocalDate) row[0], ((Number) row[1]).longValue()));

        return reviewsByDate.entrySet()
                .stream()
                .map(entry -> new WeeklyReviewResponse(entry.getKey(), dayLabel(entry.getKey()), entry.getValue()))
                .toList();
    }

    private List<RecentActivityResponse> recentActivities(UUID userId) {
        return studySessionRepository.findTop5ByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toRecentActivity)
                .toList();
    }

    private RecentActivityResponse toRecentActivity(StudySession session) {
        if (session.getDurationSeconds() > 0 && session.getCardsReviewed() == 0) {
            return new RecentActivityResponse(
                    "Sessao de estudo registrada",
                    formatStudyDuration(session.getDurationSeconds()),
                    "study",
                    session.getSessionDate(),
                    session.getCreatedAt()
            );
        }

        String title = session.getCardsReviewed() == 1
                ? "1 flashcard revisado"
                : "%d flashcards revisados".formatted(session.getCardsReviewed());
        String subject = session.getCorrectAnswers() == 1
                ? "1 acerto"
                : "%d acertos".formatted(session.getCorrectAnswers());

        return new RecentActivityResponse(
                title,
                subject,
                "review",
                session.getSessionDate(),
                session.getCreatedAt()
        );
    }

    private static String dayLabel(LocalDate date) {
        String label = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, PT_BR).replace(".", "");
        return label.substring(0, 1).toUpperCase(PT_BR) + label.substring(1);
    }

    private static String formatStudyDuration(int seconds) {
        int hours = seconds / 3600;
        int minutes = (seconds % 3600) / 60;

        if (hours > 0 && minutes > 0) {
            return "%dh %02dmin".formatted(hours, minutes);
        }

        if (hours > 0) {
            return "%dh".formatted(hours);
        }

        return "%dmin".formatted(Math.max(1, minutes));
    }
}
