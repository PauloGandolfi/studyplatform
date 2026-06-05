package com.paulogandolfi.studyplatform.subjects.repository;

import com.paulogandolfi.studyplatform.subjects.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubjectRepository extends JpaRepository<Subject, UUID> {

    List<Subject> findAllByUser_IdOrderByCreatedAtAsc(UUID userId);

    List<Subject> findAllByUser_IdAndGoal_IdOrderByUpdatedAtDesc(UUID userId, UUID goalId);

    long countByUser_Id(UUID userId);

    long countByUser_IdAndGoal_Id(UUID userId, UUID goalId);

    Optional<Subject> findByIdAndUser_Id(UUID id, UUID userId);
}
