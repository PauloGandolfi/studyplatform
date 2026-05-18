CREATE TABLE studyplatform.study_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES studyplatform.users(id) ON DELETE CASCADE,
    cards_reviewed INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    session_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_study_sessions_cards_reviewed_non_negative CHECK (cards_reviewed >= 0),
    CONSTRAINT chk_study_sessions_correct_answers_non_negative CHECK (correct_answers >= 0),
    CONSTRAINT chk_study_sessions_correct_answers_lte_cards CHECK (correct_answers <= cards_reviewed)
);

CREATE INDEX idx_study_sessions_user_date ON studyplatform.study_sessions(user_id, session_date);
