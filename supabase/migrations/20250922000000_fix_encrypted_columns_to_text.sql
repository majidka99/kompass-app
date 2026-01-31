-- =====================================================
-- FIX ENCRYPTED COLUMNS TYPE MIGRATION
-- =====================================================
-- Changes encrypted data columns from JSONB to TEXT for proper encryption storage
--
-- Issue: Encrypted data columns were defined as JSONB but should be TEXT
-- since encrypted data is stored as strings, not JSON objects
--
-- Date: 2025-09-22
-- =====================================================

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fix user_goals table
ALTER TABLE user_goals
ALTER COLUMN encrypted_goal_data TYPE TEXT;

-- Fix user_achievements table
ALTER TABLE user_achievements
ALTER COLUMN encrypted_achievement_data TYPE TEXT;

-- Fix user_skills table
ALTER TABLE user_skills
ALTER COLUMN encrypted_skills_data TYPE TEXT;

-- Fix user_calendar_notes table
ALTER TABLE user_calendar_notes
ALTER COLUMN encrypted_note_data TYPE TEXT;

-- Fix user_symptoms table
ALTER TABLE user_symptoms
ALTER COLUMN encrypted_symptom_data TYPE TEXT;

-- Fix user_profiles table - encrypted_preferences should also be TEXT if encrypted
-- Note: Check if this field stores encrypted data or plain JSONB
ALTER TABLE user_profiles
ALTER COLUMN encrypted_preferences TYPE TEXT;

-- Add server-side encryption/decryption functions for proper pgcrypto support
-- These functions will be used by the encryptionService

-- Function to encrypt data server-side
CREATE OR REPLACE FUNCTION encrypt_data(data_to_encrypt TEXT, user_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use pgcrypto to encrypt data with user-specific key
    RETURN encode(
        pgp_sym_encrypt(
            data_to_encrypt,
            user_key,
            'compress-algo=1, cipher-algo=aes256'
        ),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt data server-side
CREATE OR REPLACE FUNCTION decrypt_data(encrypted_data TEXT, user_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use pgcrypto to decrypt data with user-specific key
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        user_key
    );
EXCEPTION WHEN OTHERS THEN
    -- Return NULL if decryption fails (wrong key, corrupted data, etc.)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION encrypt_data(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_data(TEXT, TEXT) TO authenticated;

-- Update table comments to reflect the schema fix
COMMENT ON COLUMN user_goals.encrypted_goal_data IS 'AES encrypted goal data as TEXT (fixed from JSONB 2025-09-22)';
COMMENT ON COLUMN user_achievements.encrypted_achievement_data IS 'AES encrypted achievement data as TEXT (fixed from JSONB 2025-09-22)';
COMMENT ON COLUMN user_skills.encrypted_skills_data IS 'AES encrypted skills data as TEXT (fixed from JSONB 2025-09-22)';
COMMENT ON COLUMN user_calendar_notes.encrypted_note_data IS 'AES encrypted note data as TEXT (fixed from JSONB 2025-09-22)';
COMMENT ON COLUMN user_symptoms.encrypted_symptom_data IS 'AES encrypted symptom data as TEXT (fixed from JSONB 2025-09-22)';

-- Log the schema fix completion
INSERT INTO audit_logs (action, table_name, metadata)
VALUES (
    'SCHEMA_FIX',
    'encrypted_columns',
    '{"fix_date": "2025-09-22", "issue": "encrypted_columns_wrong_type", "fix": "changed_jsonb_to_text", "tables_fixed": ["user_goals", "user_achievements", "user_skills", "user_calendar_notes", "user_symptoms", "user_profiles"], "functions_added": ["encrypt_data", "decrypt_data"]}'::jsonb
);