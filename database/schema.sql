-- =====================================================
-- KOMPASS APP DATABASE SCHEMA - Healthcare Grade
-- =====================================================
-- This schema supports encrypted storage of sensitive healthcare data
-- with Row Level Security (RLS) and audit trails for compliance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE USER DATA TABLES
-- =====================================================

-- User profiles table - stores encrypted user preferences and settings
CREATE TABLE user_profiles (
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
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_id TEXT NOT NULL, -- Original goal ID from localStorage
    
    -- Encrypted goal data
    encrypted_goal_data JSONB NOT NULL, -- { title, text, completed, etc. }
    
    -- Metadata for sync and conflict resolution
    is_deleted BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE, -- Denormalized for queries
    version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table - encrypted achievement data
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id TEXT NOT NULL, -- Original achievement ID
    
    -- Encrypted achievement data
    encrypted_achievement_data JSONB NOT NULL, -- { title, text, type, icon, etc. }
    
    -- Metadata
    achievement_date TIMESTAMP WITH TIME ZONE, -- Denormalized for queries
    achievement_type TEXT, -- Denormalized for categorization
    is_deleted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table - encrypted skills data
CREATE TABLE user_skills (
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
CREATE TABLE user_calendar_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note_date DATE NOT NULL, -- The date of the note
    
    -- Encrypted note data
    encrypted_note_data JSONB NOT NULL, -- { title, text, etc. }
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Symptoms tracking table - highly sensitive healthcare data
CREATE TABLE user_symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symptom_date DATE NOT NULL, -- The date of symptom tracking
    
    -- Encrypted symptom data
    encrypted_symptom_data JSONB NOT NULL, -- Array of { title, intensity } objects
    
    -- Metadata for healthcare compliance
    symptom_count INTEGER DEFAULT 0, -- Denormalized for analytics
    is_deleted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Word files metadata (file content stored in Supabase Storage)
CREATE TABLE user_word_files (
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
    version INTEGER DEFAULT 1,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HEALTHCARE COMPLIANCE TABLES
-- =====================================================

-- Audit log for healthcare compliance (GDPR/HIPAA)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Audit information
    action TEXT NOT NULL, -- 'read', 'write', 'delete', 'sync', 'login', 'export'
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
CREATE TABLE data_retention_policies (
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
CREATE TABLE sync_status (
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline changes queue
CREATE TABLE offline_changes_queue (
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
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_last_synced ON user_profiles(last_synced_at);

-- Goals indexes
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_user_completed ON user_goals(user_id, completed) WHERE NOT is_deleted;
CREATE INDEX idx_user_goals_modified ON user_goals(last_modified DESC);

-- Achievements indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_date ON user_achievements(user_id, achievement_date DESC) WHERE NOT is_deleted;
CREATE INDEX idx_user_achievements_type ON user_achievements(user_id, achievement_type) WHERE NOT is_deleted;

-- Skills indexes
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_modified ON user_skills(last_modified DESC);

-- Calendar notes indexes
CREATE INDEX idx_user_calendar_user_date ON user_calendar_notes(user_id, note_date DESC) WHERE NOT is_deleted;

-- Symptoms indexes (critical for healthcare queries)
CREATE INDEX idx_user_symptoms_user_date ON user_symptoms(user_id, symptom_date DESC) WHERE NOT is_deleted;
CREATE INDEX idx_user_symptoms_recent ON user_symptoms(user_id, symptom_date DESC) WHERE symptom_date >= CURRENT_DATE - INTERVAL '30 days' AND NOT is_deleted;

-- Word files indexes
CREATE INDEX idx_user_word_files_user_id ON user_word_files(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_user_word_files_uploaded ON user_word_files(uploaded_at DESC);

-- Audit log indexes (for compliance queries)
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, created_at DESC);

-- Sync status indexes
CREATE INDEX idx_sync_status_user_table ON sync_status(user_id, table_name);
CREATE INDEX idx_sync_status_pending ON sync_status(sync_status, created_at) WHERE sync_status = 'pending';

-- Offline queue indexes
CREATE INDEX idx_offline_queue_user ON offline_changes_queue(user_id, queued_at) WHERE NOT processed;
CREATE INDEX idx_offline_queue_table ON offline_changes_queue(table_name, queued_at) WHERE NOT processed;

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
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at 
    BEFORE UPDATE ON data_retention_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_status_updated_at 
    BEFORE UPDATE ON sync_status 
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
CREATE TRIGGER audit_user_symptoms 
    AFTER INSERT OR UPDATE OR DELETE ON user_symptoms
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER audit_user_calendar_notes 
    AFTER INSERT OR UPDATE OR DELETE ON user_calendar_notes
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

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
-- INITIAL DATA AND CONSTRAINTS
-- =====================================================

-- Add constraints for data validation
ALTER TABLE user_profiles ADD CONSTRAINT check_points_non_negative CHECK (points >= 0);
ALTER TABLE user_profiles ADD CONSTRAINT check_level_positive CHECK (level > 0);
ALTER TABLE user_profiles ADD CONSTRAINT check_progress_range CHECK (level_progress >= 0 AND level_progress <= 100);

-- Add constraints for sync status
ALTER TABLE sync_status ADD CONSTRAINT check_sync_status_values 
    CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed'));

ALTER TABLE sync_status ADD CONSTRAINT check_conflict_resolution_values 
    CHECK (conflict_resolution IN ('local_wins', 'remote_wins', 'manual') OR conflict_resolution IS NULL);

-- Add constraints for offline queue
ALTER TABLE offline_changes_queue ADD CONSTRAINT check_operation_values 
    CHECK (operation IN ('insert', 'update', 'delete'));

-- Add unique constraints to prevent duplicates
ALTER TABLE user_goals ADD CONSTRAINT unique_user_goal_id UNIQUE (user_id, goal_id);
ALTER TABLE user_achievements ADD CONSTRAINT unique_user_achievement_id UNIQUE (user_id, achievement_id);
ALTER TABLE user_word_files ADD CONSTRAINT unique_user_file_id UNIQUE (user_id, file_id);
ALTER TABLE user_calendar_notes ADD CONSTRAINT unique_user_note_date UNIQUE (user_id, note_date);
ALTER TABLE user_symptoms ADD CONSTRAINT unique_user_symptom_date UNIQUE (user_id, symptom_date);

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

COMMENT ON COLUMN user_profiles.encrypted_username IS 'AES encrypted username';
COMMENT ON COLUMN user_profiles.encrypted_preferences IS 'AES encrypted JSON of user preferences, theme, favorites';
COMMENT ON COLUMN user_profiles.device_fingerprint IS 'Device fingerprint for encryption key derivation';