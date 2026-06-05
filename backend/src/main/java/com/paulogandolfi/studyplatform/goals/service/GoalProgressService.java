package com.paulogandolfi.studyplatform.goals.service;

import com.paulogandolfi.studyplatform.flashcards.repository.FlashcardRepository;
import com.paulogandolfi.studyplatform.goals.dto.GoalProgressSnapshotResponse;
import com.paulogandolfi.studyplatform.sessions.repository.StudySessionRepository;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import com.paulogandolfi.studyplatform.tasks.entity.TaskStatus;
import com.paulogandolfi.studyplatform.tasks.repository.StudyTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class GoalProgressService {

    private final StudySessionRepository studySessionRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final SubjectRepository subjectRepository;
    private final FlashcardRepository flashcardRepository;

    public GoalProgressService(
            StudySessionRepository studySessionRepository,
            StudyTaskRepository studyTaskRepository,
            SubjectRepository subjectRepository,
            FlashcardRepository flashcardRepository
    ) {
        this.studySessionRepository = studySessionRepository;
        this.studyTaskRepository = studyTaskRepository;
        this.subjectRepository = subjectRepository;
        this.flashcardRepository = flashcardRepository;
    }

    @Transactional(readOnly = true)
    public GoalProgressSnapshotResponse snapshot(UUID userId, UUID goalId, int estimatedStudyHours, int totalPillars) {
        long trackedStudySeconds = studySessionRepository.sumDurationSecondsByUserIdAndGoal_Id(userId, goalId);
        long totalTasks = studyTaskRepository.countByUser_IdAndGoal_Id(userId, goalId);
        long completedTasks = studyTaskRepository.countByUser_IdAndGoal_IdAndStatus(userId, goalId, TaskStatus.DONE);
        long linkedSubjects = subjectRepository.countByUser_IdAndGoal_Id(userId, goalId);
        long totalFlashcards = flashcardRepository.countBySubject_User_IdAndSubject_Goal_Id(userId, goalId);
        long pendingReviews = flashcardRepository.countBySubject_User_IdAndSubject_Goal_IdAndNextReviewDateLessThanEqual(
                userId,
                goalId,
                LocalDate.now()
        );

        return new GoalProgressSnapshotResponse(
                trackedStudySeconds,
                calculateHoursProgress(estimatedStudyHours, trackedStudySeconds),
                Math.toIntExact(completedTasks),
                Math.toIntExact(totalTasks),
                Math.toIntExact(linkedSubjects),
                totalPillars,
                Math.toIntExact(pendingReviews),
                Math.toIntExact(totalFlashcards)
        );
    }

    public int calculateHoursProgress(int estimatedStudyHours, long trackedStudySeconds) {
        if (estimatedStudyHours <= 0) {
            return 0;
        }

        return (int) Math.min(100, Math.round((trackedStudySeconds * 100.0) / (estimatedStudyHours * 3600.0)));
    }
}
