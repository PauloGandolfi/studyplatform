package com.paulogandolfi.studyplatform.notes.service;

import com.paulogandolfi.studyplatform.notes.dto.NoteRequest;
import com.paulogandolfi.studyplatform.notes.dto.NoteResponse;
import com.paulogandolfi.studyplatform.notes.entity.Note;
import com.paulogandolfi.studyplatform.notes.repository.NoteRepository;
import com.paulogandolfi.studyplatform.subjects.entity.Subject;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final SubjectRepository subjectRepository;

    public NoteService(NoteRepository noteRepository, SubjectRepository subjectRepository) {
        this.noteRepository = noteRepository;
        this.subjectRepository = subjectRepository;
    }

    @Transactional
    public NoteResponse create(UUID userId, NoteRequest request) {
        Subject subject = findSubject(request.subjectId(), userId);
        Note note = new Note(subject, normalizeTitle(request), normalizeContent(request));

        return NoteResponse.from(noteRepository.save(note));
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> list(UUID userId) {
        return noteRepository.findAllBySubject_User_IdOrderByCreatedAtAsc(userId)
                .stream()
                .map(NoteResponse::from)
                .toList();
    }

    @Transactional
    public NoteResponse update(UUID userId, UUID noteId, NoteRequest request) {
        Note note = findNote(noteId, userId);
        Subject subject = findSubject(request.subjectId(), userId);

        note.setSubject(subject);
        note.setTitle(normalizeTitle(request));
        note.setContent(normalizeContent(request));

        return NoteResponse.from(note);
    }

    @Transactional
    public void delete(UUID userId, UUID noteId) {
        Note note = findNote(noteId, userId);
        noteRepository.delete(note);
    }

    private Subject findSubject(UUID subjectId, UUID userId) {
        return subjectRepository.findByIdAndUser_Id(subjectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
    }

    private Note findNote(UUID noteId, UUID userId) {
        return noteRepository.findByIdAndSubject_User_Id(noteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));
    }

    private static String normalizeTitle(NoteRequest request) {
        return request.title().trim();
    }

    private static String normalizeContent(NoteRequest request) {
        return request.content().trim();
    }
}
