package com.paulogandolfi.studyplatform.subjects;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubjectRequest(
        @NotBlank
        @Size(max = 120)
        String name
) {
}
