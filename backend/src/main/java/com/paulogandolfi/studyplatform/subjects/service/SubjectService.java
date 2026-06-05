package com.paulogandolfi.studyplatform.subjects.service;

import com.paulogandolfi.studyplatform.goals.entity.Goal;
import com.paulogandolfi.studyplatform.goals.repository.GoalRepository;
import com.paulogandolfi.studyplatform.subjects.dto.SubjectRequest;
import com.paulogandolfi.studyplatform.subjects.dto.SubjectResponse;
import com.paulogandolfi.studyplatform.subjects.entity.Subject;
import com.paulogandolfi.studyplatform.subjects.entity.SubjectDifficulty;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;

    public SubjectService(
            SubjectRepository subjectRepository,
            UserRepository userRepository,
            GoalRepository goalRepository
    ) {
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
    }

    @Transactional
    public SubjectResponse create(UUID userId, SubjectRequest request) {
        User user = findUser(userId);
        Subject subject = new Subject(user, findGoal(userId, request.goalId()), normalizeName(request), normalizeDifficulty(request));

        return SubjectResponse.from(subjectRepository.save(subject));
    }

    @Transactional(readOnly = true)
    public List<SubjectResponse> list(UUID userId) {
        return subjectRepository.findAllByUser_IdOrderByCreatedAtAsc(userId)
                .stream()
                .map(SubjectResponse::from)
                .toList();
    }

    @Transactional
    public SubjectResponse update(UUID userId, UUID subjectId, SubjectRequest request) {
        Subject subject = findSubject(subjectId, userId);
        subject.setName(normalizeName(request));
        subject.setDifficulty(normalizeDifficulty(request));
        subject.setGoal(findGoal(userId, request.goalId()));

        return SubjectResponse.from(subject);
    }

    @Transactional
    public void delete(UUID userId, UUID subjectId) {
        Subject subject = findSubject(subjectId, userId);
        subjectRepository.delete(subject);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private Subject findSubject(UUID subjectId, UUID userId) {
        return subjectRepository.findByIdAndUser_Id(subjectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
    }

    private Goal findGoal(UUID userId, UUID goalId) {
        if (goalId == null) {
            return null;
        }

        return goalRepository.findByIdAndUser_Id(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
    }

    private static String normalizeName(SubjectRequest request) {
        return request.name().trim();
    }

    private static SubjectDifficulty normalizeDifficulty(SubjectRequest request) {
        return request.difficulty() == null ? SubjectDifficulty.MEDIUM : request.difficulty();
    }
}
