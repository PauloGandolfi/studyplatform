package com.paulogandolfi.studyplatform.goals.entity;

import com.paulogandolfi.studyplatform.users.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "goals", schema = "studyplatform")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "current_level", nullable = false, length = 80)
    private String currentLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GoalPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GoalStatus status;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "weekly_study_hours", nullable = false)
    private Integer weeklyStudyHours;

    @Column(name = "estimated_study_hours", nullable = false)
    private Integer estimatedStudyHours;

    @Column(name = "mentor_summary", length = 1000)
    private String mentorSummary;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalPillar> pillars = new ArrayList<>();

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalWeekPlan> weekPlans = new ArrayList<>();

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalReplanHistory> replanHistory = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Goal() {
    }

    public Goal(
            User user,
            String title,
            String description,
            String currentLevel,
            GoalPriority priority,
            GoalStatus status,
            LocalDate targetDate,
            Integer weeklyStudyHours,
            Integer estimatedStudyHours,
            String mentorSummary
    ) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.currentLevel = currentLevel;
        this.priority = priority;
        this.status = status;
        this.targetDate = targetDate;
        this.weeklyStudyHours = weeklyStudyHours;
        this.estimatedStudyHours = estimatedStudyHours;
        this.mentorSummary = mentorSummary;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(String currentLevel) {
        this.currentLevel = currentLevel;
    }

    public GoalPriority getPriority() {
        return priority;
    }

    public void setPriority(GoalPriority priority) {
        this.priority = priority;
    }

    public GoalStatus getStatus() {
        return status;
    }

    public void setStatus(GoalStatus status) {
        this.status = status;
    }

    public LocalDate getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(LocalDate targetDate) {
        this.targetDate = targetDate;
    }

    public Integer getWeeklyStudyHours() {
        return weeklyStudyHours;
    }

    public void setWeeklyStudyHours(Integer weeklyStudyHours) {
        this.weeklyStudyHours = weeklyStudyHours;
    }

    public Integer getEstimatedStudyHours() {
        return estimatedStudyHours;
    }

    public void setEstimatedStudyHours(Integer estimatedStudyHours) {
        this.estimatedStudyHours = estimatedStudyHours;
    }

    public String getMentorSummary() {
        return mentorSummary;
    }

    public void setMentorSummary(String mentorSummary) {
        this.mentorSummary = mentorSummary;
    }

    public List<GoalPillar> getPillars() {
        return pillars.stream()
                .sorted(Comparator.comparingInt(GoalPillar::getDisplayOrder))
                .toList();
    }

    public void replacePillars(List<GoalPillar> nextPillars) {
        pillars.clear();
        nextPillars.forEach(this::addPillar);
    }

    public void addPillar(GoalPillar pillar) {
        pillar.setGoal(this);
        pillars.add(pillar);
    }

    public List<GoalWeekPlan> getWeekPlans() {
        return weekPlans.stream()
                .sorted(Comparator.comparingInt(GoalWeekPlan::getWeekOrder))
                .toList();
    }

    public void replaceWeekPlans(List<GoalWeekPlan> nextWeekPlans) {
        weekPlans.clear();
        nextWeekPlans.forEach(this::addWeekPlan);
    }

    public void addWeekPlan(GoalWeekPlan weekPlan) {
        weekPlan.setGoal(this);
        weekPlans.add(weekPlan);
    }

    public List<GoalReplanHistory> getReplanHistory() {
        return replanHistory.stream()
                .sorted(Comparator.comparing(GoalReplanHistory::getCreatedAt).reversed())
                .toList();
    }

    public void addReplanHistory(GoalReplanHistory history) {
        history.setGoal(this);
        replanHistory.add(history);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
