package com.paulogandolfi.studyplatform.notes.dto;

import com.paulogandolfi.studyplatform.notes.entity.Note;

import java.time.LocalDateTime;
import java.util.UUID;

public record NoteResponse(
        UUID id,
        UUID subjectId,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static NoteResponse from(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getSubject().getId(),
                note.getTitle(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
