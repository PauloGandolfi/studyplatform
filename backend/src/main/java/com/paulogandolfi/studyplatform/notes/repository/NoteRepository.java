package com.paulogandolfi.studyplatform.notes.repository;

import com.paulogandolfi.studyplatform.notes.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    List<Note> findAllBySubject_User_IdOrderByCreatedAtAsc(UUID userId);

    List<Note> findAllBySubject_IdAndSubject_User_IdOrderByCreatedAtAsc(UUID subjectId, UUID userId);

    Optional<Note> findByIdAndSubject_User_Id(UUID id, UUID userId);
}
