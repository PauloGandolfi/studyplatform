package com.paulogandolfi.studyplatform.flashcards.repository;

import com.paulogandolfi.studyplatform.flashcards.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {

    List<Flashcard> findAllBySubject_User_IdOrderByCreatedAtAsc(UUID userId);

    List<Flashcard> findAllBySubject_IdAndSubject_User_IdOrderByCreatedAtAsc(UUID subjectId, UUID userId);

    List<Flashcard> findAllBySubject_User_IdAndNextReviewDateLessThanEqualOrderByNextReviewDateAscCreatedAtAsc(
            UUID userId,
            LocalDate today
    );

    Optional<Flashcard> findByIdAndSubject_User_Id(UUID id, UUID userId);
}
