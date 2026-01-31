-- =====================================================
-- FIX SCHEMA ISSUES MIGRATION
-- =====================================================
-- Fixes missing columns and schema mismatches identified in dataService.ts
-- 
-- Issues addressed:
-- 1. user_skills table missing is_deleted, deleted_at, deletion_reason columns
-- 2. Ensure all tables have proper soft delete columns for consistency
-- 3. Add any missing columns for dataService compatibility
--
-- Date: 2025-08-17
-- =====================================================

-- Fix user_skills table - add missing soft delete columns
ALTER TABLE user_skills 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Ensure all tables have consistent soft delete behavior
-- (These should already exist from the main migration, but just in case)

-- user_goals - should already have these
ALTER TABLE user_goals 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- user_achievements - should already have these  
ALTER TABLE user_achievements
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- user_calendar_notes - should already have these
ALTER TABLE user_calendar_notes
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- user_symptoms - should already have these
ALTER TABLE user_symptoms
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- user_word_files - should already have these
ALTER TABLE user_word_files
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add indexes for performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id_not_deleted 
ON user_skills (user_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id_not_deleted 
ON user_goals (user_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id_not_deleted 
ON user_achievements (user_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_calendar_notes_user_id_not_deleted 
ON user_calendar_notes (user_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_symptoms_user_id_not_deleted 
ON user_symptoms (user_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_word_files_user_id_not_deleted 
ON user_word_files (user_id) WHERE is_deleted = FALSE;

-- Update RLS policies to handle the updated schema
-- Refresh all policies to ensure they work with new columns

-- user_skills policies
DROP POLICY IF EXISTS "user_skills_isolation" ON user_skills;
CREATE POLICY "user_skills_isolation" ON user_skills
    FOR ALL USING (auth.uid() = user_id);

-- Enable RLS on all tables (should already be enabled, but ensuring)
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_calendar_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_symptoms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_word_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add comment to track this fix
COMMENT ON TABLE user_skills IS 'Healthcare-compliant skills data with soft delete support (fixed 2025-08-17)';

-- Log the schema fix completion
INSERT INTO audit_logs (action, table_name, metadata)
VALUES (
    'SCHEMA_FIX', 
    'multiple_tables', 
    '{"fix_date": "2025-08-17", "issue": "missing_is_deleted_columns", "tables_fixed": ["user_skills"], "indexes_added": 6, "policies_updated": true}'::jsonb
) ON CONFLICT DO NOTHING;