CREATE TABLE studyplatform.study_tasks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES studyplatform.users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    primary_task BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_tasks_user_id ON studyplatform.study_tasks(user_id);
CREATE INDEX idx_study_tasks_user_status ON studyplatform.study_tasks(user_id, status);
