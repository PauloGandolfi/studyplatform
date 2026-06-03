package com.paulogandolfi.studyplatform.tasks.service;

import com.paulogandolfi.studyplatform.goals.entity.Goal;
import com.paulogandolfi.studyplatform.goals.repository.GoalRepository;
import com.paulogandolfi.studyplatform.tasks.dto.TaskRequest;
import com.paulogandolfi.studyplatform.tasks.dto.TaskResponse;
import com.paulogandolfi.studyplatform.tasks.entity.StudyTask;
import com.paulogandolfi.studyplatform.tasks.entity.TaskStatus;
import com.paulogandolfi.studyplatform.tasks.repository.StudyTaskRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class StudyTaskService {

    private final StudyTaskRepository studyTaskRepository;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;

    public StudyTaskService(
            StudyTaskRepository studyTaskRepository,
            UserRepository userRepository,
            GoalRepository goalRepository
    ) {
        this.studyTaskRepository = studyTaskRepository;
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
    }

    @Transactional
    public TaskResponse create(UUID userId, TaskRequest request) {
        User user = findUser(userId);
        demoteCurrentPrimaryTask(userId, null, isPrimaryTask(request));
        Goal goal = findGoal(userId, request.goalId());
        StudyTask task = new StudyTask(
                user,
                goal,
                normalizeTitle(request),
                normalizeDescription(request),
                request.status(),
                isPrimaryTask(request)
        );

        return TaskResponse.from(studyTaskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(UUID userId) {
        return studyTaskRepository.findAllByUser_IdOrderByPrimaryTaskDescCreatedAtAsc(userId)
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    @Transactional
    public TaskResponse update(UUID userId, UUID taskId, TaskRequest request) {
        StudyTask task = findTask(taskId, userId);
        demoteCurrentPrimaryTask(userId, taskId, isPrimaryTask(request));

        task.setTitle(normalizeTitle(request));
        task.setDescription(normalizeDescription(request));
        task.setStatus(request.status());
        task.setPrimaryTask(isPrimaryTask(request));
        task.setGoal(findGoal(userId, request.goalId()));

        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse markDone(UUID userId, UUID taskId) {
        StudyTask task = findTask(taskId, userId);
        task.setStatus(TaskStatus.DONE);

        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(UUID userId, UUID taskId) {
        StudyTask task = findTask(taskId, userId);
        studyTaskRepository.delete(task);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private StudyTask findTask(UUID taskId, UUID userId) {
        return studyTaskRepository.findByIdAndUser_Id(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private Goal findGoal(UUID userId, UUID goalId) {
        if (goalId == null) {
            return null;
        }

        return goalRepository.findByIdAndUser_Id(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
    }

    private void demoteCurrentPrimaryTask(UUID userId, UUID taskId, boolean nextPrimaryTask) {
        if (!nextPrimaryTask) {
            return;
        }

        studyTaskRepository.findAllByUser_IdAndPrimaryTaskTrue(userId)
                .stream()
                .filter(task -> !task.getId().equals(taskId))
                .forEach(task -> task.setPrimaryTask(false));
    }

    private static String normalizeTitle(TaskRequest request) {
        return request.title().trim();
    }

    private static String normalizeDescription(TaskRequest request) {
        if (request.description() == null) {
            return null;
        }

        String description = request.description().trim();
        return description.isEmpty() ? null : description;
    }

    private static boolean isPrimaryTask(TaskRequest request) {
        return Boolean.TRUE.equals(request.primaryTask());
    }
}
