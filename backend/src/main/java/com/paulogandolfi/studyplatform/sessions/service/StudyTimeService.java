package com.paulogandolfi.studyplatform.sessions.service;

import com.paulogandolfi.studyplatform.sessions.dto.StudyTimeRequest;
import com.paulogandolfi.studyplatform.sessions.dto.StudyTimeResponse;
import com.paulogandolfi.studyplatform.sessions.entity.StudySession;
import com.paulogandolfi.studyplatform.sessions.repository.StudySessionRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class StudyTimeService {

    private final UserRepository userRepository;
    private final StudySessionRepository studySessionRepository;

    public StudyTimeService(UserRepository userRepository, StudySessionRepository studySessionRepository) {
        this.userRepository = userRepository;
        this.studySessionRepository = studySessionRepository;
    }

    @Transactional
    public StudyTimeResponse registerTime(UUID userId, StudyTimeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        studySessionRepository.save(new StudySession(user, 0, 0, request.durationSeconds(), LocalDate.now()));

        return new StudyTimeResponse(studySessionRepository.sumDurationSecondsByUserId(userId));
    }
}
