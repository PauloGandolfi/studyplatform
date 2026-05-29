package com.paulogandolfi.studyplatform.ai.service;

import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsRequest;
import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsResponse;
import com.paulogandolfi.studyplatform.subjects.entity.Subject;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AiFlashcardService {

    private static final int DEFAULT_MAX_CARDS = 8;

    private final SubjectRepository subjectRepository;
    private final AiModelClient aiModelClient;

    public AiFlashcardService(SubjectRepository subjectRepository, AiModelClient aiModelClient) {
        this.subjectRepository = subjectRepository;
        this.aiModelClient = aiModelClient;
    }

    @Transactional(readOnly = true)
    public GenerateFlashcardsResponse generate(UUID userId, GenerateFlashcardsRequest request) {
        Subject subject = subjectRepository.findByIdAndUser_Id(request.subjectId(), userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));

        int maxCards = request.maxCards() == null ? DEFAULT_MAX_CARDS : request.maxCards();
        String prompt = buildPrompt(subject, request.content().trim(), maxCards);

        return aiModelClient.generateFlashcards(prompt, maxCards);
    }

    private static String buildPrompt(Subject subject, String content, int maxCards) {
        return """
                Voce e um assistente de estudos dentro de uma plataforma de revisao espacada.

                Materia: %s

                Gere ate %d flashcards a partir do conteudo abaixo.
                Regras:
                - escreva perguntas objetivas;
                - escreva respostas corretas, curtas e claras;
                - nao invente informacoes fora do conteudo;
                - use dificuldade EASY, MEDIUM ou HARD;
                - prefira MEDIUM quando a dificuldade nao estiver clara.

                Conteudo:
                %s
                """.formatted(subject.getName(), maxCards, content);
    }
}
