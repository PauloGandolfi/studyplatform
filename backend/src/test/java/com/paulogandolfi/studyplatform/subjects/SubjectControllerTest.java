package com.paulogandolfi.studyplatform.subjects;

import com.paulogandolfi.studyplatform.auth.JwtService;
import com.paulogandolfi.studyplatform.users.User;
import com.paulogandolfi.studyplatform.users.UserRepository;
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
class SubjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void subjectsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/subjects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createAndListSubjectsForAuthenticatedUser() throws Exception {
        User user = createUser("Subject User", "subject-user@example.com");
        User otherUser = createUser("Other User", "other-subject-user@example.com");
        subjectRepository.save(new Subject(otherUser, "Other subject"));

        mockMvc.perform(post("/subjects")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "  Mathematics  "
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Mathematics"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        mockMvc.perform(get("/subjects")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Mathematics"));
    }

    @Test
    void updateSubjectOnlyWhenOwnedByAuthenticatedUser() throws Exception {
        User user = createUser("Owner User", "owner@example.com");
        User otherUser = createUser("Other Owner", "other-owner@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "Physics"));
        Subject otherSubject = subjectRepository.save(new Subject(otherUser, "Chemistry"));

        mockMvc.perform(put("/subjects/{id}", subject.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Advanced Physics"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Advanced Physics"));

        mockMvc.perform(put("/subjects/{id}", otherSubject.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Changed"
                                }
                                """))
                .andExpect(status().isNotFound());

        assertThat(subjectRepository.findById(otherSubject.getId()).orElseThrow().getName()).isEqualTo("Chemistry");
    }

    @Test
    void deleteSubjectOnlyWhenOwnedByAuthenticatedUser() throws Exception {
        User user = createUser("Delete User", "delete@example.com");
        User otherUser = createUser("Other Delete User", "other-delete@example.com");
        Subject subject = subjectRepository.save(new Subject(user, "History"));
        Subject otherSubject = subjectRepository.save(new Subject(otherUser, "Geography"));

        mockMvc.perform(delete("/subjects/{id}", otherSubject.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNotFound());

        assertThat(subjectRepository.existsById(otherSubject.getId())).isTrue();

        mockMvc.perform(delete("/subjects/{id}", subject.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNoContent());

        assertThat(subjectRepository.existsById(subject.getId())).isFalse();
    }

    @Test
    void rejectBlankSubjectName() throws Exception {
        User user = createUser("Validation User", "validation@example.com");

        mockMvc.perform(post("/subjects")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": " "
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    private User createUser(String name, String email) {
        return userRepository.save(new User(name, email, passwordEncoder.encode("password123")));
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtService.createToken(user);
    }
}
