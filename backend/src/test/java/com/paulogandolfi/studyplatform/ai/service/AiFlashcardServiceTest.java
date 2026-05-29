package com.paulogandolfi.studyplatform.ai.service;

import com.paulogandolfi.studyplatform.ai.dto.AiFlashcardSuggestion;
import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsRequest;
import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsResponse;
import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import com.paulogandolfi.studyplatform.subjects.entity.Subject;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiFlashcardServiceTest {

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private AiModelClient aiModelClient;

    @InjectMocks
    private AiFlashcardService aiFlashcardService;

    @Test
    void generateFlashcardsWithSubjectContext() {
        UUID userId = UUID.randomUUID();
        UUID subjectId = UUID.randomUUID();
        Subject subject = new Subject(new User("AI User", "ai-user@example.com", "password"), "Java");
        GenerateFlashcardsRequest request = new GenerateFlashcardsRequest(subjectId, "  polimorfismo em Java  ", 3);
        GenerateFlashcardsResponse expectedResponse = new GenerateFlashcardsResponse(List.of(
                new AiFlashcardSuggestion("O que e polimorfismo?", "E a capacidade de um objeto assumir diferentes formas.", Difficulty.MEDIUM)
        ));

        when(subjectRepository.findByIdAndUser_Id(subjectId, userId)).thenReturn(Optional.of(subject));
        when(aiModelClient.generateFlashcards(anyString(), org.mockito.ArgumentMatchers.eq(3))).thenReturn(expectedResponse);

        GenerateFlashcardsResponse response = aiFlashcardService.generate(userId, request);

        assertThat(response).isEqualTo(expectedResponse);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiModelClient).generateFlashcards(promptCaptor.capture(), org.mockito.ArgumentMatchers.eq(3));
        assertThat(promptCaptor.getValue()).contains("Java", "polimorfismo em Java");
    }

    @Test
    void rejectGeneratingFlashcardsForUnknownSubject() {
        UUID userId = UUID.randomUUID();
        UUID subjectId = UUID.randomUUID();
        GenerateFlashcardsRequest request = new GenerateFlashcardsRequest(subjectId, "decorators", 3);

        when(subjectRepository.findByIdAndUser_Id(subjectId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> aiFlashcardService.generate(userId, request))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex ->
                        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));

        verify(aiModelClient, never()).generateFlashcards(anyString(), org.mockito.ArgumentMatchers.anyInt());
    }
}
