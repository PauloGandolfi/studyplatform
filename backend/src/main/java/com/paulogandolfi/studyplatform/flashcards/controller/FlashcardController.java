package com.paulogandolfi.studyplatform.flashcards.controller;

import com.paulogandolfi.studyplatform.flashcards.dto.FlashcardRequest;
import com.paulogandolfi.studyplatform.flashcards.dto.FlashcardResponse;
import com.paulogandolfi.studyplatform.flashcards.service.FlashcardService;
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
@RequestMapping("/flashcards")
public class FlashcardController {

    private final FlashcardService flashcardService;

    public FlashcardController(FlashcardService flashcardService) {
        this.flashcardService = flashcardService;
    }

    @GetMapping
    public List<FlashcardResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return flashcardService.list(currentUserId(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FlashcardResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody FlashcardRequest request) {
        return flashcardService.create(currentUserId(jwt), request);
    }

    @PutMapping("/{id}")
    public FlashcardResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody FlashcardRequest request
    ) {
        return flashcardService.update(currentUserId(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        flashcardService.delete(currentUserId(jwt), id);
    }

    private static UUID currentUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }
}
