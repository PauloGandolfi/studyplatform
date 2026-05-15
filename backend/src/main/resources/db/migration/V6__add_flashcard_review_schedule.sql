ALTER TABLE studyplatform.flashcards
    ADD COLUMN review_interval INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN next_review_date DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE INDEX idx_flashcards_next_review_date ON studyplatform.flashcards(next_review_date);
