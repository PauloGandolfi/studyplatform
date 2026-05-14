package com.paulogandolfi.studyplatform.subjects.controller;

import com.paulogandolfi.studyplatform.flashcards.dto.FlashcardResponse;
import com.paulogandolfi.studyplatform.flashcards.service.FlashcardService;
import com.paulogandolfi.studyplatform.notes.dto.NoteResponse;
import com.paulogandolfi.studyplatform.notes.service.NoteService;
import com.paulogandolfi.studyplatform.subjects.dto.SubjectRequest;
import com.paulogandolfi.studyplatform.subjects.dto.SubjectResponse;
import com.paulogandolfi.studyplatform.subjects.service.SubjectService;
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
@RequestMapping("/subjects")
public class SubjectController {

    private final SubjectService subjectService;
    private final NoteService noteService;
    private final FlashcardService flashcardService;

    public SubjectController(
            SubjectService subjectService,
            NoteService noteService,
            FlashcardService flashcardService
    ) {
        this.subjectService = subjectService;
        this.noteService = noteService;
        this.flashcardService = flashcardService;
    }

    @GetMapping
    public List<SubjectResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return subjectService.list(currentUserId(jwt));
    }

    @GetMapping("/{id}/notes")
    public List<NoteResponse> listNotes(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return noteService.listBySubject(currentUserId(jwt), id);
    }

    @GetMapping("/{id}/flashcards")
    public List<FlashcardResponse> listFlashcards(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return flashcardService.listBySubject(currentUserId(jwt), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubjectResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SubjectRequest request) {
        return subjectService.create(currentUserId(jwt), request);
    }

    @PutMapping("/{id}")
    public SubjectResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody SubjectRequest request
    ) {
        return subjectService.update(currentUserId(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        subjectService.delete(currentUserId(jwt), id);
    }

    private static UUID currentUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }
}
