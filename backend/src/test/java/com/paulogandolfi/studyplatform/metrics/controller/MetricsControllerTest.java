package com.paulogandolfi.studyplatform.metrics.controller;

import com.paulogandolfi.studyplatform.auth.service.JwtService;
import com.paulogandolfi.studyplatform.flashcards.entity.Difficulty;
import com.paulogandolfi.studyplatform.flashcards.entity.Flashcard;
import com.paulogandolfi.studyplatform.flashcards.repository.FlashcardRepository;
import com.paulogandolfi.studyplatform.notes.entity.Note;
import com.paulogandolfi.studyplatform.notes.repository.NoteRepository;
import com.paulogandolfi.studyplatform.sessions.entity.StudySession;
import com.paulogandolfi.studyplatform.sessions.repository.StudySessionRepository;
import com.paulogandolfi.studyplatform.subjects.entity.Subject;
import com.paulogandolfi.studyplatform.subjects.repository.SubjectRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MetricsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void dashboardRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/metrics/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void dashboardReturnsUserMetricsFromStudySessions() throws Exception {
        User user = createUser("Metrics User", "metrics-user@example.com");
        User otherUser = createUser("Other Metrics User", "other-metrics-user@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Java"));
        Subject otherSubject = subjectRepository.save(new Subject(otherUser, "Python"));

        noteRepository.save(new Note(subject, "Streams", "Pipeline operations"));
        flashcardRepository.save(new Flashcard(subject, "Stream?", "Pipeline", Difficulty.MEDIUM));
        flashcardRepository.save(new Flashcard(subject, "Record?", "DTO", Difficulty.EASY));
        noteRepository.save(new Note(otherSubject, "Decorators", "Functions"));
        flashcardRepository.save(new Flashcard(otherSubject, "Django?", "ORM", Difficulty.HARD));

        LocalDate today = LocalDate.now();
        studySessionRepository.save(new StudySession(user, 3, 2, today));
        studySessionRepository.save(new StudySession(user, 2, 2, today.minusDays(1)));
        studySessionRepository.save(new StudySession(user, 1, 0, today.minusDays(2)));
        studySessionRepository.save(new StudySession(user, 4, 4, today.minusDays(4)));
        studySessionRepository.save(new StudySession(otherUser, 10, 10, today));

        mockMvc.perform(get("/metrics/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjects").value(1))
                .andExpect(jsonPath("$.notes").value(1))
                .andExpect(jsonPath("$.flashcards").value(2))
                .andExpect(jsonPath("$.reviewsToday").value(3))
                .andExpect(jsonPath("$.accuracyRate").value(80))
                .andExpect(jsonPath("$.streak").value(3))
                .andExpect(jsonPath("$.dailyGoal").value(12))
                .andExpect(jsonPath("$.dailyProgress").value(25))
                .andExpect(jsonPath("$.weeklyReviews.length()").value(7))
                .andExpect(jsonPath("$.weeklyReviews[4].reviews").value(1))
                .andExpect(jsonPath("$.weeklyReviews[5].reviews").value(2))
                .andExpect(jsonPath("$.weeklyReviews[6].reviews").value(3))
                .andExpect(jsonPath("$.recentActivities.length()").value(4));
    }

    private User createUser(String name, String email) {
        return userRepository.save(new User(name, email, passwordEncoder.encode("password123")));
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.createToken(user);
    }
}
