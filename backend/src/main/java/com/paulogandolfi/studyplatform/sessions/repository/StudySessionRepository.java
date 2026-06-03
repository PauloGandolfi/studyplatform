package com.paulogandolfi.studyplatform.sessions.repository;

import com.paulogandolfi.studyplatform.sessions.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {

    @Query("""
            select coalesce(sum(session.cardsReviewed), 0)
            from StudySession session
            where session.user.id = :userId
                and session.sessionDate = :sessionDate
            """)
    long sumCardsReviewedByUserIdAndSessionDate(
            @Param("userId") UUID userId,
            @Param("sessionDate") LocalDate sessionDate
    );

    @Query("""
            select coalesce(sum(session.cardsReviewed), 0)
            from StudySession session
            where session.user.id = :userId
            """)
    long sumCardsReviewedByUserId(@Param("userId") UUID userId);

    @Query("""
            select coalesce(sum(session.correctAnswers), 0)
            from StudySession session
            where session.user.id = :userId
            """)
    long sumCorrectAnswersByUserId(@Param("userId") UUID userId);

    @Query("""
            select coalesce(sum(session.durationSeconds), 0)
            from StudySession session
            where session.user.id = :userId
            """)
    long sumDurationSecondsByUserId(@Param("userId") UUID userId);

    @Query("""
            select coalesce(sum(session.durationSeconds), 0)
            from StudySession session
            where session.user.id = :userId
                and session.goal.id = :goalId
            """)
    long sumDurationSecondsByUserIdAndGoal_Id(
            @Param("userId") UUID userId,
            @Param("goalId") UUID goalId
    );

    @Query("""
            select distinct session.sessionDate
            from StudySession session
            where session.user.id = :userId
                and session.cardsReviewed > 0
            order by session.sessionDate desc
            """)
    List<LocalDate> findReviewedDatesByUserId(@Param("userId") UUID userId);

    @Query("""
            select session.sessionDate, coalesce(sum(session.cardsReviewed), 0)
            from StudySession session
            where session.user.id = :userId
                and session.sessionDate between :startDate and :endDate
            group by session.sessionDate
            order by session.sessionDate asc
            """)
    List<Object[]> sumCardsReviewedByDateBetween(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<StudySession> findTop5ByUser_IdOrderByCreatedAtDesc(UUID userId);
}
