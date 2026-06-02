package com.paulogandolfi.studyplatform.ai.service;

import com.paulogandolfi.studyplatform.ai.dto.GenerateFlashcardsResponse;

public interface AiModelClient {

    GenerateFlashcardsResponse generateFlashcards(String prompt, int maxCards);

    String generateText(String prompt);
}

