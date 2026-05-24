ALTER TABLE studyplatform.study_sessions
    ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 0;

ALTER TABLE studyplatform.study_sessions
    ADD CONSTRAINT chk_study_sessions_duration_seconds_non_negative CHECK (duration_seconds >= 0);
