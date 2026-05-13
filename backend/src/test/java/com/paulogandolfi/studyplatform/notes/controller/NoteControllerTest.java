package com.paulogandolfi.studyplatform.notes.controller;

import com.paulogandolfi.studyplatform.auth.service.JwtService;
import com.paulogandolfi.studyplatform.notes.entity.Note;
import com.paulogandolfi.studyplatform.notes.repository.NoteRepository;
import com.paulogandolfi.studyplatform.subjects.entity.Subject;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void notesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/notes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createAndListNotesForAuthenticatedUser() throws Exception {
        User user = createUser("Note User", "note-user@example.com");
        User otherUser = createUser("Other Note User", "other-note-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        noteRepository.save(new Note(otherSubject, "Other note", "Other content"));

        mockMvc.perform(post("/notes")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "title": "  Streams  ",
                                  "content": "  Study map/filter/reduce.  "
                                }
                                """.formatted(subject.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.subjectId").value(subject.getId().toString()))
                .andExpect(jsonPath("$.title").value("Streams"))
                .andExpect(jsonPath("$.content").value("Study map/filter/reduce."))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        mockMvc.perform(get("/notes")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].subjectId").value(subject.getId().toString()))
                .andExpect(jsonPath("$[0].title").value("Streams"));
    }

    @Test
    void rejectCreatingNoteInSubjectOwnedByAnotherUser() throws Exception {
        User user = createUser("Owner Note User", "owner-note-user@example.com");
        User otherUser = createUser("Other Subject Owner", "other-subject-owner@example.com");
        Subject otherSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        long notesBefore = noteRepository.count();

        mockMvc.perform(post("/notes")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "title": "Invalid note",
                                  "content": "This should not be created."
                                }
                                """.formatted(otherSubject.getId())))
                .andExpect(status().isNotFound());

        assertThat(noteRepository.count()).isEqualTo(notesBefore);
    }

    @Test
    void updateNoteOnlyWhenItsSubjectBelongsToAuthenticatedUser() throws Exception {
        User user = createUser("Update Note User", "update-note-user@example.com");
        User otherUser = createUser("Other Update Note User", "other-update-note-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherOwnedSubject = subjectRepository.save(new Subject(user, "Spring"));
        Subject otherUserSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        Note note = noteRepository.save(new Note(subject, "Collections", "List and Set"));
        Note otherNote = noteRepository.save(new Note(otherUserSubject, "Decorators", "Python decorators"));

        mockMvc.perform(put("/notes/{id}", note.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "title": "Spring Security",
                                  "content": "JWT resource server"
                                }
                                """.formatted(otherOwnedSubject.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjectId").value(otherOwnedSubject.getId().toString()))
                .andExpect(jsonPath("$.title").value("Spring Security"))
                .andExpect(jsonPath("$.content").value("JWT resource server"));

        mockMvc.perform(put("/notes/{id}", otherNote.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "title": "Changed",
                                  "content": "Changed"
                                }
                                """.formatted(subject.getId())))
                .andExpect(status().isNotFound());

        assertThat(noteRepository.findById(otherNote.getId()).orElseThrow().getTitle()).isEqualTo("Decorators");
    }

    @Test
    void rejectMovingNoteToSubjectOwnedByAnotherUser() throws Exception {
        User user = createUser("Move Note User", "move-note-user@example.com");
        User otherUser = createUser("Other Move Note User", "other-move-note-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherUserSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        Note note = noteRepository.save(new Note(subject, "Generics", "Type bounds"));

        mockMvc.perform(put("/notes/{id}", note.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "title": "Changed",
                                  "content": "Changed"
                                }
                                """.formatted(otherUserSubject.getId())))
                .andExpect(status().isNotFound());

        Note unchanged = noteRepository.findById(note.getId()).orElseThrow();
        assertThat(unchanged.getSubject().getId()).isEqualTo(subject.getId());
        assertThat(unchanged.getTitle()).isEqualTo("Generics");
    }

    @Test
    void deleteNoteOnlyWhenOwnedByAuthenticatedUser() throws Exception {
        User user = createUser("Delete Note User", "delete-note-user@example.com");
        User otherUser = createUser("Other Delete Note User", "other-delete-note-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherUserSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        Note note = noteRepository.save(new Note(subject, "Records", "DTOs"));
        Note otherNote = noteRepository.save(new Note(otherUserSubject, "Django", "ORM"));

        mockMvc.perform(delete("/notes/{id}", otherNote.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNotFound());

        assertThat(noteRepository.existsById(otherNote.getId())).isTrue();

        mockMvc.perform(delete("/notes/{id}", note.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNoContent());

        assertThat(noteRepository.existsById(note.getId())).isFalse();
    }

    @Test
    void rejectBlankNoteFields() throws Exception {
        User user = createUser("Validation Note User", "validation-note-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));

        mockMvc.perform(post("/notes")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "title": " ",
                                  "content": " "
                                }
                                """.formatted(subject.getId())))
                .andExpect(status().isBadRequest());
    }

    private User createUser(String name, String email) {
        return userRepository.save(new User(name, email, passwordEncoder.encode("password123")));
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.createToken(user);
    }
}
