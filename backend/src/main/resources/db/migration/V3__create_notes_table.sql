CREATE TABLE studyplatform.notes (
    id UUID PRIMARY KEY,
    subject_id UUID NOT NULL REFERENCES studyplatform.subjects(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    content VARCHAR(10000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_subject_id ON studyplatform.notes(subject_id);
