CREATE TABLE studyplatform.goal_replan_history (
    id UUID PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES studyplatform.goals(id) ON DELETE CASCADE,
    reason VARCHAR(2000),
    previous_target_date DATE,
    new_target_date DATE,
    previous_weekly_study_hours INTEGER NOT NULL,
    new_weekly_study_hours INTEGER NOT NULL,
    previous_estimated_study_hours INTEGER NOT NULL,
    new_estimated_study_hours INTEGER NOT NULL,
    mentor_summary VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_replan_history_goal_created_at
    ON studyplatform.goal_replan_history(goal_id, created_at DESC);
