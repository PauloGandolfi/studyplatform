package com.paulogandolfi.studyplatform.tasks.controller;

import com.paulogandolfi.studyplatform.auth.service.JwtService;
import com.paulogandolfi.studyplatform.tasks.entity.StudyTask;
import com.paulogandolfi.studyplatform.tasks.entity.TaskStatus;
import com.paulogandolfi.studyplatform.tasks.repository.StudyTaskRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StudyTaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudyTaskRepository studyTaskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void tasksRequireAuthentication() throws Exception {
        mockMvc.perform(get("/tasks"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createAndListTasksForAuthenticatedUser() throws Exception {
        User user = createUser("Task User", "task-user@example.com");
        User otherUser = createUser("Other Task User", "other-task-user@example.com");
        studyTaskRepository.save(new StudyTask(otherUser, "Other mission", null, TaskStatus.TODO, true));

        mockMvc.perform(post("/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "  Finalizar modulo de Algebra  ",
                                  "description": "  Resolver lista 3  ",
                                  "status": "DOING",
                                  "primaryTask": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.userId").value(user.getId().toString()))
                .andExpect(jsonPath("$.title").value("Finalizar modulo de Algebra"))
                .andExpect(jsonPath("$.description").value("Resolver lista 3"))
                .andExpect(jsonPath("$.status").value("DOING"))
                .andExpect(jsonPath("$.primaryTask").value(true))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        mockMvc.perform(get("/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Finalizar modulo de Algebra"));
    }

    @Test
    void updateAndMarkDoneTaskOnlyWhenOwnedByAuthenticatedUser() throws Exception {
        User user = createUser("Owner Task User", "owner-task-user@example.com");
        User otherUser = createUser("Other Owner Task User", "other-owner-task-user@example.com");
        StudyTask task = studyTaskRepository.save(
                new StudyTask(user, "Ler capitulo", "Paginas 10-20", TaskStatus.TODO, false)
        );
        StudyTask otherTask = studyTaskRepository.save(
                new StudyTask(otherUser, "Missao secreta", null, TaskStatus.TODO, true)
        );

        mockMvc.perform(put("/tasks/{id}", task.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Ler capitulo revisado",
                                  "description": "Paginas 20-30",
                                  "status": "DOING",
                                  "primaryTask": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Ler capitulo revisado"))
                .andExpect(jsonPath("$.status").value("DOING"))
                .andExpect(jsonPath("$.primaryTask").value(true));

        mockMvc.perform(patch("/tasks/{id}/done", task.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"));

        mockMvc.perform(patch("/tasks/{id}/done", otherTask.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNotFound());

        assertThat(studyTaskRepository.findById(task.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(studyTaskRepository.findById(otherTask.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    void deleteTaskOnlyWhenOwnedByAuthenticatedUser() throws Exception {
        User user = createUser("Delete Task User", "delete-task-user@example.com");
        User otherUser = createUser("Other Delete Task User", "other-delete-task-user@example.com");
        StudyTask task = studyTaskRepository.save(new StudyTask(user, "Excluir", null, TaskStatus.TODO, false));
        StudyTask otherTask = studyTaskRepository.save(new StudyTask(otherUser, "Nao excluir", null, TaskStatus.TODO, false));

        mockMvc.perform(delete("/tasks/{id}", otherTask.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNotFound());

        assertThat(studyTaskRepository.existsById(otherTask.getId())).isTrue();

        mockMvc.perform(delete("/tasks/{id}", task.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user)))
                .andExpect(status().isNoContent());

        assertThat(studyTaskRepository.existsById(task.getId())).isFalse();
    }

    @Test
    void rejectBlankTaskTitle() throws Exception {
        User user = createUser("Validation Task User", "validation-task-user@example.com");

        mockMvc.perform(post("/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": " ",
                                  "description": "Sem titulo",
                                  "status": "TODO",
                                  "primaryTask": false
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
