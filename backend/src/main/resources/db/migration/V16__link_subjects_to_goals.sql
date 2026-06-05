ALTER TABLE studyplatform.subjects
    ADD COLUMN goal_id UUID REFERENCES studyplatform.goals(id) ON DELETE SET NULL;

CREATE INDEX idx_subjects_goal_id ON studyplatform.subjects(goal_id);
