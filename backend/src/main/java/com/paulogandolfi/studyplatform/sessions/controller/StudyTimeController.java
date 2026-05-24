package com.paulogandolfi.studyplatform.sessions.controller;

import com.paulogandolfi.studyplatform.sessions.dto.StudyTimeRequest;
import com.paulogandolfi.studyplatform.sessions.dto.StudyTimeResponse;
import com.paulogandolfi.studyplatform.sessions.service.StudyTimeService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/study-time")
public class StudyTimeController {

    private final StudyTimeService studyTimeService;

    public StudyTimeController(StudyTimeService studyTimeService) {
        this.studyTimeService = studyTimeService;
    }

    @PostMapping
    public StudyTimeResponse registerTime(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody StudyTimeRequest request
    ) {
        return studyTimeService.registerTime(currentUserId(jwt), request);
    }

    private static UUID currentUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }
}
