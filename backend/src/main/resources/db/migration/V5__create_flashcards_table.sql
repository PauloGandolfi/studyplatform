CREATE TABLE studyplatform.flashcards (
    id UUID PRIMARY KEY,
    subject_id UUID NOT NULL REFERENCES studyplatform.subjects(id) ON DELETE CASCADE,
    question VARCHAR(1000) NOT NULL,
    answer VARCHAR(5000) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flashcards_subject_id ON studyplatform.flashcards(subject_id);
