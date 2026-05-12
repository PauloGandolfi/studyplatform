package com.paulogandolfi.studyplatform.auth;

import com.paulogandolfi.studyplatform.users.User;

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
