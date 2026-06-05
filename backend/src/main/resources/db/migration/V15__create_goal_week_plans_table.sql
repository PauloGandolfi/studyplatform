CREATE TABLE studyplatform.goal_week_plans (
    id UUID PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES studyplatform.goals(id) ON DELETE CASCADE,
    week_order INTEGER NOT NULL,
    title VARCHAR(160) NOT NULL,
    focus VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_goal_week_plans_week_order_positive CHECK (week_order > 0)
);

CREATE INDEX idx_goal_week_plans_goal_order ON studyplatform.goal_week_plans(goal_id, week_order);
