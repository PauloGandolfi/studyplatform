package com.paulogandolfi.studyplatform.auth;

import com.paulogandolfi.studyplatform.users.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record LoginUserResponse(
        UUID id,
        String name,
        String email,
        LocalDateTime createdAt
) {

    public static LoginUserResponse from(User user) {
        return new LoginUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt()
        );
    }
}
