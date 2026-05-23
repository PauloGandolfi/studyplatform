ALTER TABLE studyplatform.users
ADD COLUMN username VARCHAR(60);

WITH generated_usernames AS (
    SELECT
        id,
        LOWER(SPLIT_PART(email, '@', 1)) AS base_username,
        ROW_NUMBER() OVER (PARTITION BY LOWER(SPLIT_PART(email, '@', 1)) ORDER BY created_at, id) AS duplicate_index
    FROM studyplatform.users
)
UPDATE studyplatform.users users
SET username = CASE
    WHEN generated_usernames.duplicate_index = 1 THEN generated_usernames.base_username
    ELSE LEFT(generated_usernames.base_username, 51) || '-' || LEFT(users.id::TEXT, 8)
END
FROM generated_usernames
WHERE users.id = generated_usernames.id
  AND users.username IS NULL;

ALTER TABLE studyplatform.users
ALTER COLUMN username SET NOT NULL;

ALTER TABLE studyplatform.users
ADD CONSTRAINT uk_users_username UNIQUE (username);
