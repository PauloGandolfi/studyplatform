package com.paulogandolfi.studyplatform.auth.dto;

import com.paulogandolfi.studyplatform.users.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record RegisterUserResponse(
        UUID id,
        String name,
        String email,
        LocalDateTime createdAt
) {

    public static RegisterUserResponse from(User user) {
        return new RegisterUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt()
        );
    }
}
