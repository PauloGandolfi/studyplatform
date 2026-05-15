ALTER TABLE studyplatform.flashcards
    ADD COLUMN IF NOT EXISTS review_interval INTEGER NOT NULL DEFAULT 1;

ALTER TABLE studyplatform.flashcards
    ADD COLUMN IF NOT EXISTS next_review_date DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_flashcards_next_review_date ON studyplatform.flashcards(next_review_date);
