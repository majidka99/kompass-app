-- Add column for skills completion status
ALTER TABLE user_skills ADD COLUMN IF NOT EXISTS encrypted_skills_completed TEXT;

-- Update the encryption/decryption functions to handle the new column
-- No changes needed to functions as they're generic