CREATE TABLE studyplatform.goals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES studyplatform.users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(2000),
    current_level VARCHAR(80) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    target_date DATE,
    weekly_study_hours INTEGER NOT NULL,
    estimated_study_hours INTEGER NOT NULL,
    mentor_summary VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_goals_weekly_study_hours_positive CHECK (weekly_study_hours > 0),
    CONSTRAINT chk_goals_estimated_study_hours_positive CHECK (estimated_study_hours > 0)
);

CREATE INDEX idx_goals_user_updated_at ON studyplatform.goals(user_id, updated_at DESC);

CREATE TABLE studyplatform.goal_pillars (
    id UUID PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES studyplatform.goals(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(1000),
    target_hours INTEGER NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_goal_pillars_target_hours_positive CHECK (target_hours > 0),
    CONSTRAINT chk_goal_pillars_display_order_non_negative CHECK (display_order >= 0)
);

CREATE INDEX idx_goal_pillars_goal_order ON studyplatform.goal_pillars(goal_id, display_order);

ALTER TABLE studyplatform.study_tasks
    ADD COLUMN goal_id UUID REFERENCES studyplatform.goals(id) ON DELETE SET NULL;

CREATE INDEX idx_study_tasks_goal_id ON studyplatform.study_tasks(goal_id);

ALTER TABLE studyplatform.study_sessions
    ADD COLUMN goal_id UUID REFERENCES studyplatform.goals(id) ON DELETE SET NULL;

CREATE INDEX idx_study_sessions_goal_id ON studyplatform.study_sessions(goal_id);
