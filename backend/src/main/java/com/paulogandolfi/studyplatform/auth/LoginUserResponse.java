package com.paulogandolfi.studyplatform.auth;

import com.paulogandolfi.studyplatform.users.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record LoginUserResponse(
        UUID id,
        String name,
        String email,
        LocalDateTime createdAt,
        String accessToken,
        String tokenType
) {

    public static LoginUserResponse from(User user, String accessToken) {
        return new LoginUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt(),
                accessToken,
                "Bearer"
        );
    }
}
