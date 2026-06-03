package com.paulogandolfi.studyplatform.goals.controller;

import com.paulogandolfi.studyplatform.goals.dto.GoalRequest;
import com.paulogandolfi.studyplatform.goals.dto.GoalResponse;
import com.paulogandolfi.studyplatform.goals.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public List<GoalResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return goalService.list(currentUserId(jwt));
    }

    @GetMapping("/{id}")
    public GoalResponse detail(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return goalService.detail(currentUserId(jwt), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody GoalRequest request) {
        return goalService.create(currentUserId(jwt), request);
    }

    @PutMapping("/{id}")
    public GoalResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody GoalRequest request
    ) {
        return goalService.update(currentUserId(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        goalService.delete(currentUserId(jwt), id);
    }

    private static UUID currentUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }
}
