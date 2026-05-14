package com.paulogandolfi.studyplatform.flashcards.service;

import com.paulogandolfi.studyplatform.flashcards.dto.FlashcardRequest;
import com.paulogandolfi.studyplatform.flashcards.dto.FlashcardResponse;
import com.paulogandolfi.studyplatform.flashcards.entity.Flashcard;
import com.paulogandolfi.studyplatform.flashcards.repository.FlashcardRepository;
import com.paulogandolfi.studyplatform.subjects.entity.Subject;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final SubjectRepository subjectRepository;

    public FlashcardService(FlashcardRepository flashcardRepository, SubjectRepository subjectRepository) {
        this.flashcardRepository = flashcardRepository;
        this.subjectRepository = subjectRepository;
    }

    @Transactional
    public FlashcardResponse create(UUID userId, FlashcardRequest request) {
        Subject subject = findSubject(request.subjectId(), userId);
        Flashcard flashcard = new Flashcard(
                subject,
                normalizeQuestion(request),
                normalizeAnswer(request),
                request.difficulty()
        );

        return FlashcardResponse.from(flashcardRepository.save(flashcard));
    }

    @Transactional(readOnly = true)
    public List<FlashcardResponse> list(UUID userId) {
        return flashcardRepository.findAllBySubject_User_IdOrderByCreatedAtAsc(userId)
                .stream()
                .map(FlashcardResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FlashcardResponse> listBySubject(UUID userId, UUID subjectId) {
        findSubject(subjectId, userId);

        return flashcardRepository.findAllBySubject_IdAndSubject_User_IdOrderByCreatedAtAsc(subjectId, userId)
                .stream()
                .map(FlashcardResponse::from)
                .toList();
    }

    @Transactional
    public FlashcardResponse update(UUID userId, UUID flashcardId, FlashcardRequest request) {
        Flashcard flashcard = findFlashcard(flashcardId, userId);
        Subject subject = findSubject(request.subjectId(), userId);

        flashcard.setSubject(subject);
        flashcard.setQuestion(normalizeQuestion(request));
        flashcard.setAnswer(normalizeAnswer(request));
        flashcard.setDifficulty(request.difficulty());

        return FlashcardResponse.from(flashcard);
    }

    @Transactional
    public void delete(UUID userId, UUID flashcardId) {
        Flashcard flashcard = findFlashcard(flashcardId, userId);
        flashcardRepository.delete(flashcard);
    }

    private Subject findSubject(UUID subjectId, UUID userId) {
        return subjectRepository.findByIdAndUser_Id(subjectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
    }

    private Flashcard findFlashcard(UUID flashcardId, UUID userId) {
        return flashcardRepository.findByIdAndSubject_User_Id(flashcardId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flashcard not found"));
    }

    private static String normalizeQuestion(FlashcardRequest request) {
        return request.question().trim();
    }

    private static String normalizeAnswer(FlashcardRequest request) {
        return request.answer().trim();
    }
}
