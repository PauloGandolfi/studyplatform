package com.paulogandolfi.studyplatform.subjects.dto;

import com.paulogandolfi.studyplatform.subjects.entity.Subject;

import java.time.LocalDateTime;
import java.util.UUID;

public record SubjectResponse(
        UUID id,
        String name,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static SubjectResponse from(Subject subject) {
        return new SubjectResponse(
                subject.getId(),
                subject.getName(),
                subject.getCreatedAt(),
                subject.getUpdatedAt()
        );
    }
}
