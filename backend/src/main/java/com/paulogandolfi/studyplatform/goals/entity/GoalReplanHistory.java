package com.paulogandolfi.studyplatform.goals.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "goal_replan_history", schema = "studyplatform")
public class GoalReplanHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @Column(length = 2000)
    private String reason;

    @Column(name = "previous_target_date")
    private LocalDate previousTargetDate;

    @Column(name = "new_target_date")
    private LocalDate newTargetDate;

    @Column(name = "previous_weekly_study_hours", nullable = false)
    private Integer previousWeeklyStudyHours;

    @Column(name = "new_weekly_study_hours", nullable = false)
    private Integer newWeeklyStudyHours;

    @Column(name = "previous_estimated_study_hours", nullable = false)
    private Integer previousEstimatedStudyHours;

    @Column(name = "new_estimated_study_hours", nullable = false)
    private Integer newEstimatedStudyHours;

    @Column(name = "mentor_summary", length = 1000)
    private String mentorSummary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected GoalReplanHistory() {
    }

    public GoalReplanHistory(
            String reason,
            LocalDate previousTargetDate,
            LocalDate newTargetDate,
            Integer previousWeeklyStudyHours,
            Integer newWeeklyStudyHours,
            Integer previousEstimatedStudyHours,
            Integer newEstimatedStudyHours,
            String mentorSummary
    ) {
        this.reason = reason;
        this.previousTargetDate = previousTargetDate;
        this.newTargetDate = newTargetDate;
        this.previousWeeklyStudyHours = previousWeeklyStudyHours;
        this.newWeeklyStudyHours = newWeeklyStudyHours;
        this.previousEstimatedStudyHours = previousEstimatedStudyHours;
        this.newEstimatedStudyHours = newEstimatedStudyHours;
        this.mentorSummary = mentorSummary;
    }

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public Goal getGoal() {
        return goal;
    }

    public void setGoal(Goal goal) {
        this.goal = goal;
    }

    public String getReason() {
        return reason;
    }

    public LocalDate getPreviousTargetDate() {
        return previousTargetDate;
    }

    public LocalDate getNewTargetDate() {
        return newTargetDate;
    }

    public Integer getPreviousWeeklyStudyHours() {
        return previousWeeklyStudyHours;
    }

    public Integer getNewWeeklyStudyHours() {
        return newWeeklyStudyHours;
    }

    public Integer getPreviousEstimatedStudyHours() {
        return previousEstimatedStudyHours;
    }

    public Integer getNewEstimatedStudyHours() {
        return newEstimatedStudyHours;
    }

    public String getMentorSummary() {
        return mentorSummary;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
