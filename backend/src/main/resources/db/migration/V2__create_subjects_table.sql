CREATE TABLE studyplatform.subjects (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES studyplatform.users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_user_id ON studyplatform.subjects(user_id);
