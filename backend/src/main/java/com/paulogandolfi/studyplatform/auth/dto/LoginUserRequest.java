package com.paulogandolfi.studyplatform.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginUserRequest(
        @NotBlank
        @Size(min = 3, max = 60)
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$")
        String username,

        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {
}
