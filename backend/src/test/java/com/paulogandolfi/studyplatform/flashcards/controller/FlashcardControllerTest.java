package com.paulogandolfi.studyplatform.flashcards.controller;

import com.paulogandolfi.studyplatform.auth.service.JwtService;
import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import com.paulogandolfi.studyplatform.flashcards.entity.Flashcard;
import com.paulogandolfi.studyplatform.flashcards.repository.FlashcardRepository;
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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FlashcardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void flashcardsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/flashcards"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createAndListFlashcardsForAuthenticatedUser() throws Exception {
        User user = createUser("Flashcard User", "flashcard-user@example.com");
        User otherUser = createUser("Other Flashcard User", "other-flashcard-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        flashcardRepository.save(new Flashcard(otherSubject, "Other question", "Other answer", Difficulty.HARD));

        mockMvc.perform(post("/flashcards")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "question": "  What is a stream?  ",
                                  "answer": "  A pipeline of data operations.  ",
                                  "difficulty": "MEDIUM"
                                }
                                """.formatted(subject.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.subjectId").value(subject.getId().toString()))
                .andExpect(jsonPath("$.question").value("What is a stream?"))
                .andExpect(jsonPath("$.answer").value("A pipeline of data operations."))
                .andExpect(jsonPath("$.difficulty").value("MEDIUM"))
                .andExpect(jsonPath("$.reviewInterval").value(1))
                .andExpect(jsonPath("$.nextReviewDate").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        mockMvc.perform(get("/flashcards")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].subjectId").value(subject.getId().toString()))
                .andExpect(jsonPath("$[0].question").value("What is a stream?"));
    }

    @Test
    void listPendingReviewsOnlyReturnsDueFlashcardsForAuthenticatedUser() throws Exception {
        User user = createUser("Review User", "review-user@example.com");
        User otherUser = createUser("Other Review User", "other-review-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherUserSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        Flashcard overdueFlashcard = new Flashcard(subject, "Overdue?", "Yes", Difficulty.MEDIUM);
        overdueFlashcard.setNextReviewDate(LocalDate.now().minusDays(1));
        Flashcard todayFlashcard = new Flashcard(subject, "Today?", "Yes", Difficulty.EASY);
        todayFlashcard.setNextReviewDate(LocalDate.now());
        Flashcard futureFlashcard = new Flashcard(subject, "Future?", "No", Difficulty.HARD);
        futureFlashcard.setNextReviewDate(LocalDate.now().plusDays(1));
        Flashcard otherUserFlashcard = new Flashcard(otherUserSubject, "Other?", "No", Difficulty.MEDIUM);
        otherUserFlashcard.setNextReviewDate(LocalDate.now().minusDays(1));

        flashcardRepository.save(overdueFlashcard);
        flashcardRepository.save(todayFlashcard);
        flashcardRepository.save(futureFlashcard);
        flashcardRepository.save(otherUserFlashcard);

        mockMvc.perform(get("/flashcards/review")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].question").value("Overdue?"))
                .andExpect(jsonPath("$[1].question").value("Today?"));
    }

    @Test
    void reviewFlashcardUpdatesScheduleWhenCorrect() throws Exception {
        User user = createUser("Correct Review User", "correct-review-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Flashcard flashcard = new Flashcard(subject, "Streams?", "Data operations", Difficulty.MEDIUM);
        flashcard.setReviewInterval(3);
        flashcard.setNextReviewDate(LocalDate.now().minusDays(1));
        flashcard = flashcardRepository.save(flashcard);

        mockMvc.perform(post("/flashcards/{id}/review", flashcard.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "correct": true,
                                  "difficulty": "EASY"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.difficulty").value("EASY"))
                .andExpect(jsonPath("$.reviewInterval").value(6))
                .andExpect(jsonPath("$.nextReviewDate").value(LocalDate.now().plusDays(6).toString()));

        Flashcard reviewedFlashcard = flashcardRepository.findById(flashcard.getId()).orElseThrow();
        assertThat(reviewedFlashcard.getReviewInterval()).isEqualTo(6);
        assertThat(reviewedFlashcard.getNextReviewDate()).isEqualTo(LocalDate.now().plusDays(6));
        assertThat(reviewedFlashcard.getDifficulty()).isEqualTo(Difficulty.EASY);
    }

    @Test
    void reviewFlashcardUpdatesScheduleWhenIncorrect() throws Exception {
        User user = createUser("Incorrect Review User", "incorrect-review-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Flashcard flashcard = new Flashcard(subject, "Records?", "DTOs", Difficulty.EASY);
        flashcard.setReviewInterval(8);
        flashcard.setNextReviewDate(LocalDate.now().minusDays(2));
        flashcard = flashcardRepository.save(flashcard);

        mockMvc.perform(post("/flashcards/{id}/review", flashcard.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "correct": false,
                                  "difficulty": "HARD"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.difficulty").value("HARD"))
                .andExpect(jsonPath("$.reviewInterval").value(1))
                .andExpect(jsonPath("$.nextReviewDate").value(LocalDate.now().plusDays(1).toString()));

        Flashcard reviewedFlashcard = flashcardRepository.findById(flashcard.getId()).orElseThrow();
        assertThat(reviewedFlashcard.getReviewInterval()).isEqualTo(1);
        assertThat(reviewedFlashcard.getNextReviewDate()).isEqualTo(LocalDate.now().plusDays(1));
        assertThat(reviewedFlashcard.getDifficulty()).isEqualTo(Difficulty.HARD);
    }

    @Test
    void listFlashcardsBySubjectOnlyWhenSubjectBelongsToAuthenticatedUser() throws Exception {
        User user = createUser("Subject Flashcard User", "subject-flashcard-user@example.com");
        User otherUser = createUser("Other Subject Flashcard User", "other-subject-flashcard-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherSubject = subjectRepository.save(new Subject(user, "Spring"));
        Subject otherUserSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        flashcardRepository.save(new Flashcard(subject, "Streams?", "Data operations", Difficulty.MEDIUM));
        flashcardRepository.save(new Flashcard(otherSubject, "Security?", "JWT", Difficulty.HARD));
        flashcardRepository.save(new Flashcard(otherUserSubject, "Decorators?", "Functions", Difficulty.EASY));

        mockMvc.perform(get("/subjects/{id}/flashcards", subject.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].subjectId").value(subject.getId().toString()))
                .andExpect(jsonPath("$[0].question").value("Streams?"));

        mockMvc.perform(get("/subjects/{id}/flashcards", otherUserSubject.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectCreatingFlashcardInSubjectOwnedByAnotherUser() throws Exception {
        User user = createUser("Owner Flashcard User", "owner-flashcard-user@example.com");
        User otherUser = createUser("Other Flashcard Subject Owner", "other-flashcard-subject-owner@example.com");
        Subject otherSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        long flashcardsBefore = flashcardRepository.count();

        mockMvc.perform(post("/flashcards")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "question": "Invalid",
                                  "answer": "This should not be created.",
                                  "difficulty": "EASY"
                                }
                                """.formatted(otherSubject.getId())))
                .andExpect(status().isNotFound());

        assertThat(flashcardRepository.count()).isEqualTo(flashcardsBefore);
    }

    @Test
    void updateFlashcardOnlyWhenOwnedByAuthenticatedUser() throws Exception {
        User user = createUser("Update Flashcard User", "update-flashcard-user@example.com");
        User otherUser = createUser("Other Update Flashcard User", "other-update-flashcard-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherOwnedSubject = subjectRepository.save(new Subject(user, "Spring"));
        Subject otherUserSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        Flashcard flashcard = flashcardRepository.save(new Flashcard(subject, "Collections?", "List and Set", Difficulty.EASY));
        Flashcard otherFlashcard = flashcardRepository.save(new Flashcard(otherUserSubject, "Decorators?", "Python decorators", Difficulty.HARD));

        mockMvc.perform(put("/flashcards/{id}", flashcard.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "question": "What is Spring Security?",
                                  "answer": "A security framework.",
                                  "difficulty": "HARD"
                                }
                                """.formatted(otherOwnedSubject.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjectId").value(otherOwnedSubject.getId().toString()))
                .andExpect(jsonPath("$.question").value("What is Spring Security?"))
                .andExpect(jsonPath("$.answer").value("A security framework."))
                .andExpect(jsonPath("$.difficulty").value("HARD"));

        mockMvc.perform(put("/flashcards/{id}", otherFlashcard.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "question": "Changed",
                                  "answer": "Changed",
                                  "difficulty": "MEDIUM"
                                }
                                """.formatted(subject.getId())))
                .andExpect(status().isNotFound());

        assertThat(flashcardRepository.findById(otherFlashcard.getId()).orElseThrow().getQuestion()).isEqualTo("Decorators?");
    }

    @Test
    void deleteFlashcardOnlyWhenOwnedByAuthenticatedUser() throws Exception {
        User user = createUser("Delete Flashcard User", "delete-flashcard-user@example.com");
        User otherUser = createUser("Other Delete Flashcard User", "other-delete-flashcard-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherUserSubject = subjectRepository.save(new Subject(otherUser, "Python"));
        Flashcard flashcard = flashcardRepository.save(new Flashcard(subject, "Records?", "DTOs", Difficulty.MEDIUM));
        Flashcard otherFlashcard = flashcardRepository.save(new Flashcard(otherUserSubject, "Django?", "ORM", Difficulty.EASY));

        mockMvc.perform(delete("/flashcards/{id}", otherFlashcard.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNotFound());

        assertThat(flashcardRepository.existsById(otherFlashcard.getId())).isTrue();

        mockMvc.perform(delete("/flashcards/{id}", flashcard.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNoContent());

        assertThat(flashcardRepository.existsById(flashcard.getId())).isFalse();
    }

    @Test
    void rejectBlankFlashcardFields() throws Exception {
        User user = createUser("Validation Flashcard User", "validation-flashcard-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));

        mockMvc.perform(post("/flashcards")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subjectId": "%s",
                                  "question": " ",
                                  "answer": " ",
                                  "difficulty": "MEDIUM"
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
