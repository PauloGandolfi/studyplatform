package com.paulogandolfi.studyplatform.tasks.controller;

import com.paulogandolfi.studyplatform.tasks.dto.TaskRequest;
import com.paulogandolfi.studyplatform.tasks.dto.TaskResponse;
import com.paulogandolfi.studyplatform.tasks.service.StudyTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/tasks")
public class StudyTaskController {

    private final StudyTaskService studyTaskService;

    public StudyTaskController(StudyTaskService studyTaskService) {
        this.studyTaskService = studyTaskService;
    }

    @GetMapping
    public List<TaskResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return studyTaskService.list(currentUserId(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TaskRequest request) {
        return studyTaskService.create(currentUserId(jwt), request);
    }

    @PutMapping("/{id}")
    public TaskResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest request
    ) {
        return studyTaskService.update(currentUserId(jwt), id, request);
    }

    @PatchMapping("/{id}/done")
    public TaskResponse markDone(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return studyTaskService.markDone(currentUserId(jwt), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        studyTaskService.delete(currentUserId(jwt), id);
    }

    private static UUID currentUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }
}
