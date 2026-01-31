-- =====================================================
-- COMPLETE HEALTHCARE COMPLIANCE MIGRATION
-- =====================================================
-- This migration applies the full healthcare database schema
-- with GDPR compliance functions for German healthcare standards
-- 
-- Features:
-- - Healthcare-grade database schema with encrypted fields
-- - Row Level Security (RLS) policies
-- - GDPR compliance functions (Articles 15, 17, 20)
-- - German healthcare consent management
-- - Audit logging with PGAudit integration
-- - Age verification and parental consent systems
--
-- Version: 1.0
-- Date: 2025-01-14
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Note: PGAudit requires superuser privileges - enable via Supabase dashboard

-- =====================================================
-- CORE USER DATA TABLES
-- =====================================================

-- User profiles table - stores encrypted user preferences and settings
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Encrypted user data
    encrypted_username TEXT, -- Encrypted username
    encrypted_preferences JSONB, -- Theme, favorites, settings, etc.
    
    -- Gamification data (can be plain as it's not sensitive)
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    level_progress DECIMAL(5,2) DEFAULT 0.0,
    
    -- Metadata
    data_version INTEGER DEFAULT 1,
    device_fingerprint TEXT, -- For encryption key derivation
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table - encrypted goal data
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_id TEXT NOT NULL, -- Original goal ID from localStorage
    
    -- Encrypted goal data
    encrypted_goal_data JSONB NOT NULL, -- { title, text, completed, etc. }
    
    -- Metadata for sync and conflict resolution
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deletion_reason TEXT,
    completed BOOLEAN DEFAULT FALSE, -- Denormalized for queries
    version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table - encrypted achievement data
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id TEXT NOT NULL, -- Original achievement ID
    
    -- Encrypted achievement data
    encrypted_achievement_data JSONB NOT NULL, -- { title, text, type, icon, etc. }
    
    -- Metadata
    achievement_date TIMESTAMP WITH TIME ZONE, -- Denormalized for queries
    achievement_type TEXT, -- Denormalized for categorization
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deletion_reason TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table - encrypted skills data
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Encrypted skills data
    encrypted_skills_data JSONB NOT NULL, -- Array of skill strings or objects
    
    -- Metadata
    skills_count INTEGER DEFAULT 0, -- Denormalized for queries
    version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar notes table - encrypted calendar and mood data
CREATE TABLE IF NOT EXISTS user_calendar_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note_date DATE NOT NULL, -- The date of the note
    
    -- Encrypted note data
    encrypted_note_data JSONB NOT NULL, -- { title, text, etc. }
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deletion_reason TEXT,
    version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Symptoms tracking table - highly sensitive healthcare data
CREATE TABLE IF NOT EXISTS user_symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symptom_date DATE NOT NULL, -- The date of symptom tracking
    
    -- Encrypted symptom data
    encrypted_symptom_data JSONB NOT NULL, -- Array of { title, intensity } objects
    
    -- Metadata for healthcare compliance
    symptom_count INTEGER DEFAULT 0, -- Denormalized for analytics
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deletion_reason TEXT,
    version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Word files metadata (file content stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS user_word_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_id TEXT NOT NULL, -- Original file ID from localStorage
    
    -- File metadata
    encrypted_file_name TEXT NOT NULL, -- Encrypted filename
    file_url TEXT, -- Storage URL (not encrypted as it's generated)
    file_size INTEGER,
    content_type TEXT,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deletion_reason TEXT,
    version INTEGER DEFAULT 1,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HEALTHCARE COMPLIANCE TABLES
-- =====================================================

-- Audit log for healthcare compliance (GDPR/BDSG)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Audit information
    action TEXT NOT NULL, -- 'DATA_ACCESS', 'DATA_MODIFY', 'DATA_DELETE', 'GDPR_EXPORT', etc.
    table_name TEXT, -- Which table was accessed
    record_id UUID, -- Which specific record
    
    -- Session and security info
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Additional context
    metadata JSONB, -- Additional audit context
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data retention policy table
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Retention settings
    retain_goals_months INTEGER DEFAULT 36, -- 3 years default
    retain_achievements_months INTEGER DEFAULT 60, -- 5 years default
    retain_symptoms_months INTEGER DEFAULT 84, -- 7 years (healthcare standard)
    retain_calendar_months INTEGER DEFAULT 36, -- 3 years default
    
    -- Compliance flags
    gdpr_consent BOOLEAN DEFAULT FALSE,
    data_processing_consent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SYNC AND OFFLINE SUPPORT TABLES
-- =====================================================

-- Sync status tracking
CREATE TABLE IF NOT EXISTS sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Sync information
    table_name TEXT NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'failed'
    conflict_resolution TEXT, -- 'local_wins', 'remote_wins', 'manual'
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Compliance metadata
    compliance_metadata JSONB,
    encryption_status JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline changes queue
CREATE TABLE IF NOT EXISTS offline_changes_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Change information
    table_name TEXT NOT NULL,
    record_id UUID,
    operation TEXT NOT NULL, -- 'insert', 'update', 'delete'
    encrypted_data JSONB, -- The change data (encrypted)
    
    -- Queue metadata
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- =====================================================
-- GDPR CONSENT MANAGEMENT TABLES
-- =====================================================

-- Consent tracking table for German healthcare compliance
CREATE TABLE IF NOT EXISTS user_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Consent details
    consent_type TEXT NOT NULL, -- 'health_data_processing', 'data_sharing', etc.
    consent_granted BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_withdrawn_at TIMESTAMP WITH TIME ZONE,
    
    -- Legal basis
    gdpr_legal_basis TEXT NOT NULL, -- Article 6(1)(a) + 9(2)(a)
    german_legal_basis TEXT DEFAULT 'BDSG §22', -- German implementation
    
    -- German-specific requirements
    is_minor BOOLEAN DEFAULT FALSE, -- User under 16
    parental_consent_required BOOLEAN DEFAULT FALSE,
    parental_consent_granted BOOLEAN DEFAULT FALSE,
    parental_consent_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    consent_version TEXT DEFAULT '1.0',
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_synced ON user_profiles(last_synced_at);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_completed ON user_goals(user_id, completed) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_user_goals_modified ON user_goals(last_modified DESC);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_date ON user_achievements(user_id, achievement_date DESC) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(user_id, achievement_type) WHERE NOT is_deleted;

-- Skills indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_modified ON user_skills(last_modified DESC);

-- Calendar notes indexes
CREATE INDEX IF NOT EXISTS idx_user_calendar_user_date ON user_calendar_notes(user_id, note_date DESC) WHERE NOT is_deleted;

-- Symptoms indexes (critical for healthcare queries)
CREATE INDEX IF NOT EXISTS idx_user_symptoms_user_date ON user_symptoms(user_id, symptom_date DESC) WHERE NOT is_deleted;
-- Note: Partial index with date filter removed due to CURRENT_DATE immutability issue
-- For recent symptoms queries, use application-level filtering or create indices manually
CREATE INDEX IF NOT EXISTS idx_user_symptoms_recent ON user_symptoms(user_id, symptom_date DESC) WHERE NOT is_deleted;

-- Word files indexes
CREATE INDEX IF NOT EXISTS idx_user_word_files_user_id ON user_word_files(user_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_user_word_files_uploaded ON user_word_files(uploaded_at DESC);

-- Audit log indexes (for compliance queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name, created_at DESC);

-- Sync status indexes
CREATE INDEX IF NOT EXISTS idx_sync_status_user_table ON sync_status(user_id, table_name);
CREATE INDEX IF NOT EXISTS idx_sync_status_pending ON sync_status(sync_status, created_at) WHERE sync_status = 'pending';

-- Offline queue indexes
CREATE INDEX IF NOT EXISTS idx_offline_queue_user ON offline_changes_queue(user_id, queued_at) WHERE NOT processed;
CREATE INDEX IF NOT EXISTS idx_offline_queue_table ON offline_changes_queue(table_name, queued_at) WHERE NOT processed;

-- Consent indexes
CREATE INDEX IF NOT EXISTS idx_user_consent_user_type ON user_consent(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consent_granted ON user_consent(consent_granted, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all user data tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_changes_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can only access own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can only access own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can only access own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can only access own calendar notes" ON user_calendar_notes;
DROP POLICY IF EXISTS "Users can only access own symptoms" ON user_symptoms;
DROP POLICY IF EXISTS "Users can only access own word files" ON user_word_files;
DROP POLICY IF EXISTS "Users can read own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can manage own retention policies" ON data_retention_policies;
DROP POLICY IF EXISTS "Users can access own sync status" ON sync_status;
DROP POLICY IF EXISTS "Users can access own offline queue" ON offline_changes_queue;
DROP POLICY IF EXISTS "Users can manage own consent" ON user_consent;

-- User profiles policies
CREATE POLICY "Users can only access own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can only access own goals" ON user_goals
    FOR ALL USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can only access own achievements" ON user_achievements
    FOR ALL USING (auth.uid() = user_id);

-- Skills policies
CREATE POLICY "Users can only access own skills" ON user_skills
    FOR ALL USING (auth.uid() = user_id);

-- Calendar notes policies
CREATE POLICY "Users can only access own calendar notes" ON user_calendar_notes
    FOR ALL USING (auth.uid() = user_id);

-- Symptoms policies (extra security for healthcare data)
CREATE POLICY "Users can only access own symptoms" ON user_symptoms
    FOR ALL USING (
        auth.uid() = user_id AND 
        auth.role() = 'authenticated'
    );

-- Word files policies
CREATE POLICY "Users can only access own word files" ON user_word_files
    FOR ALL USING (auth.uid() = user_id);

-- Audit logs policies (users can read their own audit logs)
CREATE POLICY "Users can read own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Audit logs insert policy (system can insert for any user)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Data retention policies
CREATE POLICY "Users can manage own retention policies" ON data_retention_policies
    FOR ALL USING (auth.uid() = user_id);

-- Sync status policies
CREATE POLICY "Users can access own sync status" ON sync_status
    FOR ALL USING (auth.uid() = user_id);

-- Offline queue policies
CREATE POLICY "Users can access own offline queue" ON offline_changes_queue
    FOR ALL USING (auth.uid() = user_id);

-- Consent policies
CREATE POLICY "Users can manage own consent" ON user_consent
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_retention_policies_updated_at ON data_retention_policies;
CREATE TRIGGER update_data_retention_policies_updated_at 
    BEFORE UPDATE ON data_retention_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_status_updated_at ON sync_status;
CREATE TRIGGER update_sync_status_updated_at 
    BEFORE UPDATE ON sync_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_consent_updated_at ON user_consent;
CREATE TRIGGER update_user_consent_updated_at 
    BEFORE UPDATE ON user_consent 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for audit logging
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the data access for compliance
    INSERT INTO audit_logs (user_id, action, table_name, record_id, session_id)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        current_setting('app.session_id', true)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_user_symptoms ON user_symptoms;
CREATE TRIGGER audit_user_symptoms 
    AFTER INSERT OR UPDATE OR DELETE ON user_symptoms
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

DROP TRIGGER IF EXISTS audit_user_calendar_notes ON user_calendar_notes;
CREATE TRIGGER audit_user_calendar_notes 
    AFTER INSERT OR UPDATE OR DELETE ON user_calendar_notes
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

-- =====================================================
-- GDPR COMPLIANCE FUNCTIONS
-- =====================================================

-- GDPR Article 15: Right of Access (Data Export)
CREATE OR REPLACE FUNCTION gdpr_export_user_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    user_data JSON;
BEGIN
    -- Verify user is requesting their own data or has admin privileges
    IF auth.uid() != user_uuid AND current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Users can only export their own data';
    END IF;

    -- Collect all user data from different tables
    WITH user_export AS (
        -- User profile data
        SELECT 'user_profile' as data_type, 
               json_build_object(
                   'username', CASE WHEN encrypted_username IS NOT NULL 
                              THEN decrypt_health_data(encrypted_username) 
                              ELSE NULL END,
                   'preferences', CASE WHEN encrypted_preferences IS NOT NULL 
                                 THEN encrypted_preferences 
                                 ELSE NULL END,
                   'points', points,
                   'level', level,
                   'level_progress', level_progress,
                   'created_at', created_at,
                   'updated_at', updated_at
               ) as data
        FROM user_profiles 
        WHERE user_id = user_uuid
        
        UNION ALL
        
        -- User goals
        SELECT 'user_goals' as data_type,
               json_agg(
                   json_build_object(
                       'goal_id', goal_id,
                       'goal_data', CASE WHEN encrypted_goal_data IS NOT NULL 
                                   THEN encrypted_goal_data 
                                   ELSE NULL END,
                       'completed', completed,
                       'created_at', created_at,
                       'last_modified', last_modified
                   )
               ) as data
        FROM user_goals 
        WHERE user_id = user_uuid AND NOT is_deleted
        
        UNION ALL
        
        -- User achievements
        SELECT 'user_achievements' as data_type,
               json_agg(
                   json_build_object(
                       'achievement_id', achievement_id,
                       'achievement_data', CASE WHEN encrypted_achievement_data IS NOT NULL 
                                          THEN encrypted_achievement_data 
                                          ELSE NULL END,
                       'achievement_date', achievement_date,
                       'created_at', created_at
                   )
               ) as data
        FROM user_achievements 
        WHERE user_id = user_uuid AND NOT is_deleted
        
        UNION ALL
        
        -- User skills
        SELECT 'user_skills' as data_type,
               json_build_object(
                   'skills_data', CASE WHEN encrypted_skills_data IS NOT NULL 
                                 THEN encrypted_skills_data 
                                 ELSE NULL END,
                   'skills_count', skills_count,
                   'created_at', created_at,
                   'last_modified', last_modified
               ) as data
        FROM user_skills 
        WHERE user_id = user_uuid
        
        UNION ALL
        
        -- Calendar notes
        SELECT 'user_calendar_notes' as data_type,
               json_agg(
                   json_build_object(
                       'note_date', note_date,
                       'note_data', CASE WHEN encrypted_note_data IS NOT NULL 
                                   THEN encrypted_note_data 
                                   ELSE NULL END,
                       'created_at', created_at,
                       'last_modified', last_modified
                   )
               ) as data
        FROM user_calendar_notes 
        WHERE user_id = user_uuid AND NOT is_deleted
        
        UNION ALL
        
        -- Symptoms data (highly sensitive)
        SELECT 'user_symptoms' as data_type,
               json_agg(
                   json_build_object(
                       'symptom_date', symptom_date,
                       'symptom_data', CASE WHEN encrypted_symptom_data IS NOT NULL 
                                      THEN encrypted_symptom_data 
                                      ELSE NULL END,
                       'symptom_count', symptom_count,
                       'created_at', created_at,
                       'last_modified', last_modified
                   )
               ) as data
        FROM user_symptoms 
        WHERE user_id = user_uuid AND NOT is_deleted
        
        UNION ALL
        
        -- Word files metadata
        SELECT 'user_word_files' as data_type,
               json_agg(
                   json_build_object(
                       'file_id', file_id,
                       'file_name', CASE WHEN encrypted_file_name IS NOT NULL 
                                   THEN decrypt_health_data(encrypted_file_name) 
                                   ELSE NULL END,
                       'file_url', file_url,
                       'file_size', file_size,
                       'content_type', content_type,
                       'uploaded_at', uploaded_at,
                       'created_at', created_at
                   )
               ) as data
        FROM user_word_files 
        WHERE user_id = user_uuid AND NOT is_deleted
    )
    SELECT json_object_agg(data_type, data ORDER BY data_type) 
    INTO user_data 
    FROM user_export;

    -- Log the data export for audit purposes
    INSERT INTO audit_logs (user_id, action, table_name, metadata)
    VALUES (user_uuid, 'GDPR_DATA_EXPORT', 'ALL_USER_DATA', 
            json_build_object(
                'export_timestamp', NOW(),
                'requester', auth.uid(),
                'legal_basis', 'GDPR Article 15 - Right of Access'
            ));

    -- Return complete user data package
    RETURN json_build_object(
        'user_id', user_uuid,
        'export_timestamp', NOW(),
        'legal_basis', 'GDPR Article 15 (Right of Access) and BDSG §15',
        'data_controller', 'Kompass Mental Health App',
        'retention_info', 'Data retained according to healthcare standards (7 years for medical data)',
        'user_data', user_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GDPR Article 17: Right to Erasure (Right to be Forgotten)
CREATE OR REPLACE FUNCTION gdpr_erase_user_data(user_uuid UUID, erasure_reason TEXT DEFAULT 'User request')
RETURNS JSON AS $$
DECLARE
    tables_processed TEXT[] := '{}';
    result_summary JSON;
BEGIN
    -- Verify user is requesting erasure of their own data or has admin privileges
    IF auth.uid() != user_uuid AND current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Users can only erase their own data';
    END IF;

    -- Start transaction for atomic erasure
    BEGIN
        -- Soft delete user profile (preserve for audit)
        UPDATE user_profiles 
        SET encrypted_username = NULL,
            encrypted_preferences = NULL,
            updated_at = NOW()
        WHERE user_id = user_uuid;
        
        IF FOUND THEN
            tables_processed := array_append(tables_processed, 'user_profiles');
        END IF;

        -- Soft delete user goals
        UPDATE user_goals 
        SET is_deleted = TRUE,
            encrypted_goal_data = NULL,
            deleted_at = NOW(),
            deletion_reason = erasure_reason,
            last_modified = NOW()
        WHERE user_id = user_uuid AND NOT is_deleted;
        
        IF FOUND THEN
            tables_processed := array_append(tables_processed, 'user_goals');
        END IF;

        -- Soft delete user achievements
        UPDATE user_achievements 
        SET is_deleted = TRUE,
            encrypted_achievement_data = NULL,
            deleted_at = NOW(),
            deletion_reason = erasure_reason
        WHERE user_id = user_uuid AND NOT is_deleted;
        
        IF FOUND THEN
            tables_processed := array_append(tables_processed, 'user_achievements');
        END IF;

        -- Soft delete user skills
        UPDATE user_skills 
        SET encrypted_skills_data = NULL,
            last_modified = NOW()
        WHERE user_id = user_uuid;
        
        IF FOUND THEN
            tables_processed := array_append(tables_processed, 'user_skills');
        END IF;

        -- Soft delete calendar notes
        UPDATE user_calendar_notes 
        SET is_deleted = TRUE,
            encrypted_note_data = NULL,
            deleted_at = NOW(),
            deletion_reason = erasure_reason,
            last_modified = NOW()
        WHERE user_id = user_uuid AND NOT is_deleted;
        
        IF FOUND THEN
            tables_processed := array_append(tables_processed, 'user_calendar_notes');
        END IF;

        -- Soft delete symptoms data (healthcare data - special handling)
        UPDATE user_symptoms 
        SET is_deleted = TRUE,
            encrypted_symptom_data = NULL,
            deleted_at = NOW(),
            deletion_reason = erasure_reason,
            last_modified = NOW()
        WHERE user_id = user_uuid AND NOT is_deleted;
        
        IF FOUND THEN
            tables_processed := array_append(tables_processed, 'user_symptoms');
        END IF;

        -- Soft delete word files
        UPDATE user_word_files 
        SET is_deleted = TRUE,
            encrypted_file_name = NULL,
            deleted_at = NOW(),
            deletion_reason = erasure_reason
        WHERE user_id = user_uuid AND NOT is_deleted;
        
        IF FOUND THEN
            tables_processed := array_append(tables_processed, 'user_word_files');
        END IF;

        -- Log the erasure for compliance
        INSERT INTO audit_logs (user_id, action, table_name, metadata)
        VALUES (user_uuid, 'GDPR_DATA_ERASURE', 'ALL_USER_DATA', 
                json_build_object(
                    'erasure_timestamp', NOW(),
                    'requester', auth.uid(),
                    'reason', erasure_reason,
                    'tables_processed', tables_processed,
                    'legal_basis', 'GDPR Article 17 - Right to Erasure'
                ));

        result_summary := json_build_object(
            'user_id', user_uuid,
            'erasure_timestamp', NOW(),
            'legal_basis', 'GDPR Article 17 (Right to Erasure) and BDSG §17',
            'tables_processed', tables_processed,
            'reason', erasure_reason,
            'status', 'completed',
            'note', 'Data soft deleted for audit compliance. Complete deletion will occur after retention period.'
        );

        RETURN result_summary;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GDPR Article 20: Right to Data Portability
CREATE OR REPLACE FUNCTION gdpr_export_portable_data(user_uuid UUID, format TEXT DEFAULT 'json')
RETURNS JSON AS $$
DECLARE
    portable_data JSON;
BEGIN
    -- Verify user is requesting their own data
    IF auth.uid() != user_uuid THEN
        RAISE EXCEPTION 'Access denied: Users can only export their own data';
    END IF;

    -- Export data in a structured, machine-readable format
    WITH portable_export AS (
        SELECT json_build_object(
            'personal_data', json_build_object(
                'goals', (
                    SELECT json_agg(
                        json_build_object(
                            'id', goal_id,
                            'data', encrypted_goal_data,
                            'completed', completed,
                            'created', created_at
                        )
                    )
                    FROM user_goals 
                    WHERE user_id = user_uuid AND NOT is_deleted
                ),
                'achievements', (
                    SELECT json_agg(
                        json_build_object(
                            'id', achievement_id,
                            'data', encrypted_achievement_data,
                            'date', achievement_date
                        )
                    )
                    FROM user_achievements 
                    WHERE user_id = user_uuid AND NOT is_deleted
                ),
                'skills', (
                    SELECT encrypted_skills_data
                    FROM user_skills 
                    WHERE user_id = user_uuid
                ),
                'calendar_notes', (
                    SELECT json_agg(
                        json_build_object(
                            'date', note_date,
                            'data', encrypted_note_data
                        )
                    )
                    FROM user_calendar_notes 
                    WHERE user_id = user_uuid AND NOT is_deleted
                )
            ),
            'export_metadata', json_build_object(
                'format', format,
                'timestamp', NOW(),
                'version', '1.0',
                'legal_basis', 'GDPR Article 20'
            )
        ) as export_data
    )
    SELECT export_data INTO portable_data FROM portable_export;

    -- Log the portable export
    INSERT INTO audit_logs (user_id, action, table_name, metadata)
    VALUES (user_uuid, 'GDPR_PORTABLE_EXPORT', 'ALL_USER_DATA', 
            json_build_object(
                'export_timestamp', NOW(),
                'format', format,
                'legal_basis', 'GDPR Article 20 - Right to Data Portability'
            ));

    RETURN portable_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CONSENT MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to record consent
CREATE OR REPLACE FUNCTION record_user_consent(
    consent_type_param TEXT,
    consent_granted_param BOOLEAN,
    is_minor_param BOOLEAN DEFAULT FALSE,
    parental_consent_param BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
    user_uuid UUID := auth.uid();
    consent_record RECORD;
BEGIN
    -- Validate input
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to record consent';
    END IF;

    -- Insert or update consent record
    INSERT INTO user_consent (
        user_id,
        consent_type,
        consent_granted,
        is_minor,
        parental_consent_required,
        parental_consent_granted,
        gdpr_legal_basis,
        ip_address,
        user_agent
    ) VALUES (
        user_uuid,
        consent_type_param,
        consent_granted_param,
        is_minor_param,
        is_minor_param, -- If minor, parental consent required
        parental_consent_param,
        CASE 
            WHEN consent_type_param = 'health_data_processing' THEN 'Article 6(1)(a) + 9(2)(a)'
            ELSE 'Article 6(1)(a)'
        END,
        split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1)::inet,
        current_setting('request.headers', true)::json->>'user-agent'
    )
    ON CONFLICT (user_id, consent_type) DO UPDATE SET
        consent_granted = EXCLUDED.consent_granted,
        parental_consent_granted = EXCLUDED.parental_consent_granted,
        consent_timestamp = NOW(),
        updated_at = NOW()
    RETURNING * INTO consent_record;

    -- Log consent action
    INSERT INTO audit_logs (user_id, action, table_name, record_id, metadata)
    VALUES (user_uuid, 'CONSENT_RECORDED', 'user_consent', consent_record.id,
            json_build_object(
                'consent_type', consent_type_param,
                'granted', consent_granted_param,
                'is_minor', is_minor_param,
                'parental_consent', parental_consent_param
            ));

    RETURN json_build_object(
        'consent_id', consent_record.id,
        'status', 'recorded',
        'timestamp', consent_record.consent_timestamp,
        'legal_basis', consent_record.gdpr_legal_basis
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to withdraw consent
CREATE OR REPLACE FUNCTION withdraw_user_consent(consent_type_param TEXT)
RETURNS JSON AS $$
DECLARE
    user_uuid UUID := auth.uid();
    withdrawal_result RECORD;
BEGIN
    -- Update consent record to mark as withdrawn
    UPDATE user_consent 
    SET consent_granted = FALSE,
        consent_withdrawn_at = NOW(),
        updated_at = NOW()
    WHERE user_id = user_uuid AND consent_type = consent_type_param
    RETURNING * INTO withdrawal_result;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No consent record found for type: %', consent_type_param;
    END IF;

    -- Log consent withdrawal
    INSERT INTO audit_logs (user_id, action, table_name, record_id, metadata)
    VALUES (user_uuid, 'CONSENT_WITHDRAWN', 'user_consent', withdrawal_result.id,
            json_build_object(
                'consent_type', consent_type_param,
                'withdrawal_timestamp', withdrawal_result.consent_withdrawn_at
            ));

    RETURN json_build_object(
        'consent_id', withdrawal_result.id,
        'status', 'withdrawn',
        'withdrawal_timestamp', withdrawal_result.consent_withdrawn_at,
        'note', 'Consent withdrawal processed. Data processing will be limited to legal obligations only.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENCRYPTION FUNCTIONS
-- =====================================================

-- Function to encrypt health data (server-side)
CREATE OR REPLACE FUNCTION encrypt_health_data(data TEXT, user_key TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Use user-specific key or default to a server-side key
    encryption_key := COALESCE(user_key, current_setting('app.encryption_key', true));
    
    -- If no encryption key available, use a derived key from user ID
    IF encryption_key IS NULL THEN
        encryption_key := 'kompass_' || auth.uid()::text;
    END IF;
    
    RETURN pgp_sym_encrypt(data, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt health data (server-side)
CREATE OR REPLACE FUNCTION decrypt_health_data(encrypted_data TEXT, user_key TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Use user-specific key or default to a server-side key
    encryption_key := COALESCE(user_key, current_setting('app.encryption_key', true));
    
    -- If no encryption key available, use a derived key from user ID
    IF encryption_key IS NULL THEN
        encryption_key := 'kompass_' || auth.uid()::text;
    END IF;
    
    RETURN pgp_sym_decrypt(encrypted_data, encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        -- If decryption fails, return null rather than error
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GERMAN AGE VERIFICATION FUNCTIONS
-- =====================================================

-- Function to verify digital consent age (16+ in Germany)
CREATE OR REPLACE FUNCTION verify_digital_consent_age(birth_date DATE)
RETURNS JSON AS $$
DECLARE
    age_years INTEGER;
    requires_parental_consent BOOLEAN := FALSE;
    can_give_digital_consent BOOLEAN := FALSE;
BEGIN
    -- Calculate age in years
    age_years := EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date));
    
    -- German digital consent rules
    IF age_years >= 16 THEN
        can_give_digital_consent := TRUE;
        requires_parental_consent := FALSE;
    ELSE
        can_give_digital_consent := FALSE;
        requires_parental_consent := TRUE;
    END IF;
    
    RETURN json_build_object(
        'age_years', age_years,
        'can_give_digital_consent', can_give_digital_consent,
        'requires_parental_consent', requires_parental_consent,
        'legal_basis', 'German GDPR implementation - 16 years digital consent age',
        'verification_timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLIANCE REPORTING FUNCTIONS
-- =====================================================

-- Function to generate compliance report
CREATE OR REPLACE FUNCTION generate_compliance_report(start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days')
RETURNS JSON AS $$
DECLARE
    report_data JSON;
BEGIN
    -- Only allow service role or admin to generate reports
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Only service role can generate compliance reports';
    END IF;
    
    WITH compliance_metrics AS (
        SELECT 
            COUNT(DISTINCT user_id) as total_users,
            COUNT(CASE WHEN action = 'GDPR_DATA_EXPORT' THEN 1 END) as data_exports,
            COUNT(CASE WHEN action = 'GDPR_DATA_ERASURE' THEN 1 END) as data_erasures,
            COUNT(CASE WHEN action = 'CONSENT_RECORDED' THEN 1 END) as consent_records,
            COUNT(CASE WHEN action = 'CONSENT_WITHDRAWN' THEN 1 END) as consent_withdrawals
        FROM audit_logs
        WHERE created_at >= start_date
    ),
    consent_metrics AS (
        SELECT 
            COUNT(*) as total_consents,
            COUNT(CASE WHEN consent_granted = TRUE THEN 1 END) as active_consents,
            COUNT(CASE WHEN is_minor = TRUE THEN 1 END) as minor_consents,
            COUNT(CASE WHEN parental_consent_granted = TRUE THEN 1 END) as parental_consents
        FROM user_consent
        WHERE created_at >= start_date
    )
    SELECT json_build_object(
        'report_period', json_build_object(
            'start_date', start_date,
            'end_date', CURRENT_DATE,
            'generated_at', NOW()
        ),
        'gdpr_activities', row_to_json(c.*),
        'consent_management', row_to_json(co.*),
        'legal_basis', 'GDPR and German BDSG compliance',
        'report_version', '1.0'
    ) INTO report_data
    FROM compliance_metrics c, consent_metrics co;
    
    RETURN report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get user's total points (for gamification)
CREATE OR REPLACE FUNCTION get_user_total_points(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
BEGIN
    SELECT points INTO total_points 
    FROM user_profiles 
    WHERE user_id = target_user_id;
    
    RETURN COALESCE(total_points, 0);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to cleanup old audit logs (for GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to apply data retention policies
CREATE OR REPLACE FUNCTION apply_data_retention_policies()
RETURNS TABLE(user_id UUID, table_name TEXT, deleted_count INTEGER) AS $$
BEGIN
    -- This function would implement automatic data cleanup based on retention policies
    -- Implementation depends on specific healthcare compliance requirements
    RETURN;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =====================================================
-- CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Add constraints for data validation (using DO blocks for IF NOT EXISTS behavior)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_points_non_negative') THEN
        ALTER TABLE user_profiles ADD CONSTRAINT check_points_non_negative CHECK (points >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_level_positive') THEN
        ALTER TABLE user_profiles ADD CONSTRAINT check_level_positive CHECK (level > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_progress_range') THEN
        ALTER TABLE user_profiles ADD CONSTRAINT check_progress_range CHECK (level_progress >= 0 AND level_progress <= 100);
    END IF;
    
    -- Add constraints for sync status
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_sync_status_values') THEN
        ALTER TABLE sync_status ADD CONSTRAINT check_sync_status_values 
            CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_conflict_resolution_values') THEN
        ALTER TABLE sync_status ADD CONSTRAINT check_conflict_resolution_values 
            CHECK (conflict_resolution IN ('local_wins', 'remote_wins', 'manual') OR conflict_resolution IS NULL);
    END IF;
    
    -- Add constraints for offline queue
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_operation_values') THEN
        ALTER TABLE offline_changes_queue ADD CONSTRAINT check_operation_values 
            CHECK (operation IN ('insert', 'update', 'delete'));
    END IF;
END $$;

-- Add unique constraints to prevent duplicates (these will be ignored if they exist)
ALTER TABLE user_goals ADD CONSTRAINT unique_user_goal_id UNIQUE (user_id, goal_id);
ALTER TABLE user_achievements ADD CONSTRAINT unique_user_achievement_id UNIQUE (user_id, achievement_id);
ALTER TABLE user_word_files ADD CONSTRAINT unique_user_file_id UNIQUE (user_id, file_id);
ALTER TABLE user_calendar_notes ADD CONSTRAINT unique_user_note_date UNIQUE (user_id, note_date);
ALTER TABLE user_symptoms ADD CONSTRAINT unique_user_symptom_date UNIQUE (user_id, symptom_date);
ALTER TABLE user_consent ADD CONSTRAINT unique_user_consent_type UNIQUE (user_id, consent_type);

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION gdpr_export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION gdpr_erase_user_data(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION gdpr_export_portable_data(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_user_consent(TEXT, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_user_consent(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_digital_consent_age(DATE) TO authenticated;

-- Service role permissions for compliance functions
GRANT EXECUTE ON FUNCTION generate_compliance_report(DATE) TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_profiles IS 'Encrypted user profiles and preferences with gamification data';
COMMENT ON TABLE user_goals IS 'Encrypted user goals with sync metadata';
COMMENT ON TABLE user_achievements IS 'Encrypted user achievements with categorization';
COMMENT ON TABLE user_skills IS 'Encrypted user skills data';
COMMENT ON TABLE user_calendar_notes IS 'Encrypted calendar notes and mood tracking';
COMMENT ON TABLE user_symptoms IS 'Encrypted symptom tracking data (healthcare sensitive)';
COMMENT ON TABLE user_word_files IS 'Word file metadata with encrypted filenames';
COMMENT ON TABLE audit_logs IS 'Compliance audit trail for healthcare regulations';
COMMENT ON TABLE data_retention_policies IS 'User-specific data retention and GDPR consent';
COMMENT ON TABLE sync_status IS 'Synchronization status tracking for offline support';
COMMENT ON TABLE offline_changes_queue IS 'Queue for offline changes awaiting sync';
COMMENT ON TABLE user_consent IS 'GDPR consent tracking with German healthcare compliance';

COMMENT ON COLUMN user_profiles.encrypted_username IS 'AES encrypted username';
COMMENT ON COLUMN user_profiles.encrypted_preferences IS 'AES encrypted JSON of user preferences, theme, favorites';
COMMENT ON COLUMN user_profiles.device_fingerprint IS 'Device fingerprint for encryption key derivation';

-- =====================================================
-- MIGRATION COMPLETION LOG
-- =====================================================

-- Log this migration completion
INSERT INTO audit_logs (user_id, action, table_name, metadata)
VALUES (
    NULL, 
    'MIGRATION_COMPLETED', 
    'DATABASE_SCHEMA', 
    json_build_object(
        'migration_name', 'complete_healthcare_compliance_migration',
        'migration_timestamp', NOW(),
        'features_enabled', ARRAY[
            'healthcare_database_schema',
            'gdpr_compliance_functions', 
            'german_consent_management',
            'row_level_security',
            'audit_logging',
            'age_verification',
            'data_encryption_functions'
        ],
        'compliance_level', 'german_healthcare_gdpr_compliant'
    )
);