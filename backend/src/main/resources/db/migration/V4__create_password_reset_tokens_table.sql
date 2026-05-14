CREATE TABLE studyplatform.password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES studyplatform.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_user_id ON studyplatform.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON studyplatform.password_reset_tokens(token_hash);
