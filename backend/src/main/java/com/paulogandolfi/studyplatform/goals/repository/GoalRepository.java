package com.paulogandolfi.studyplatform.goals.repository;

import com.paulogandolfi.studyplatform.goals.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {

    List<Goal> findAllByUser_IdOrderByUpdatedAtDesc(UUID userId);

    Optional<Goal> findByIdAndUser_Id(UUID id, UUID userId);
}
