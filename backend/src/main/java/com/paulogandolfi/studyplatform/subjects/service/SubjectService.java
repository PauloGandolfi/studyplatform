package com.paulogandolfi.studyplatform.subjects.service;

import com.paulogandolfi.studyplatform.subjects.dto.SubjectRequest;
import com.paulogandolfi.studyplatform.subjects.dto.SubjectResponse;
import com.paulogandolfi.studyplatform.subjects.entity.Subject;
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

    public SubjectService(SubjectRepository subjectRepository, UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SubjectResponse create(UUID userId, SubjectRequest request) {
        User user = findUser(userId);
        Subject subject = new Subject(user, normalizeName(request));

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

    private static String normalizeName(SubjectRequest request) {
        return request.name().trim();
    }
}
