package com.paulogandolfi.studyplatform.tasks.repository;

import com.paulogandolfi.studyplatform.tasks.entity.StudyTask;
import com.paulogandolfi.studyplatform.tasks.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyTaskRepository extends JpaRepository<StudyTask, UUID> {

    List<StudyTask> findAllByUser_IdOrderByPrimaryTaskDescCreatedAtAsc(UUID userId);

    List<StudyTask> findAllByUser_IdAndGoal_IdOrderByPrimaryTaskDescCreatedAtAsc(UUID userId, UUID goalId);

    List<StudyTask> findAllByUser_IdAndPrimaryTaskTrue(UUID userId);

    long countByUser_IdAndGoal_Id(UUID userId, UUID goalId);

    long countByUser_IdAndGoal_IdAndStatus(UUID userId, UUID goalId, TaskStatus status);

    Optional<StudyTask> findByIdAndUser_Id(UUID id, UUID userId);
}
