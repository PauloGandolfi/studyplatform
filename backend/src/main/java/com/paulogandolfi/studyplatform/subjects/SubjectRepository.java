package com.paulogandolfi.studyplatform.subjects;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubjectRepository extends JpaRepository<Subject, UUID> {

    List<Subject> findAllByUser_IdOrderByCreatedAtAsc(UUID userId);

    Optional<Subject> findByIdAndUser_Id(UUID id, UUID userId);
}
