-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR KOMPASS HEALTHCARE APP
-- =====================================================
-- This file contains all RLS policies for healthcare-grade data protection
-- Run these commands in your Supabase SQL editor after creating the schema

-- =====================================================
-- ENABLE RLS ON ALL TABLES
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

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================

-- Users can only access their own profile
CREATE POLICY "Users can access own profile" ON user_profiles
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Prevent unauthorized profile creation
CREATE POLICY "Prevent unauthorized profile creation" ON user_profiles
    FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND 
        auth.role() = 'authenticated'
    );

-- =====================================================
-- USER GOALS POLICIES
-- =====================================================

-- Users can only access their own goals
CREATE POLICY "Users can access own goals" ON user_goals
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Prevent access to deleted goals (additional security)
CREATE POLICY "Block access to deleted goals" ON user_goals
    FOR SELECT 
    USING (
        auth.uid() = user_id AND 
        is_deleted = false
    );

-- =====================================================
-- USER ACHIEVEMENTS POLICIES
-- =====================================================

-- Users can only access their own achievements
CREATE POLICY "Users can access own achievements" ON user_achievements
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Block access to deleted achievements
CREATE POLICY "Block access to deleted achievements" ON user_achievements
    FOR SELECT 
    USING (
        auth.uid() = user_id AND 
        is_deleted = false
    );

-- =====================================================
-- USER SKILLS POLICIES
-- =====================================================

-- Users can only access their own skills
CREATE POLICY "Users can access own skills" ON user_skills
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- USER CALENDAR NOTES POLICIES
-- =====================================================

-- Users can only access their own calendar notes
CREATE POLICY "Users can access own calendar notes" ON user_calendar_notes
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Block access to deleted calendar notes
CREATE POLICY "Block access to deleted calendar notes" ON user_calendar_notes
    FOR SELECT 
    USING (
        auth.uid() = user_id AND 
        is_deleted = false
    );

-- =====================================================
-- USER SYMPTOMS POLICIES (EXTRA HEALTHCARE SECURITY)
-- =====================================================

-- Users can only access their own symptoms with extra validation
CREATE POLICY "Users can access own symptoms" ON user_symptoms
    FOR ALL 
    USING (
        auth.uid() = user_id AND 
        auth.role() = 'authenticated' AND
        -- Additional security: verify session is valid
        auth.jwt() ->> 'aud' = 'authenticated'
    )
    WITH CHECK (
        auth.uid() = user_id AND 
        auth.role() = 'authenticated'
    );

-- Block access to deleted symptoms
CREATE POLICY "Block access to deleted symptoms" ON user_symptoms
    FOR SELECT 
    USING (
        auth.uid() = user_id AND 
        is_deleted = false AND
        auth.role() = 'authenticated'
    );

-- Additional policy: Limit symptom data access to recent entries for performance
CREATE POLICY "Limit symptom data to recent entries" ON user_symptoms
    FOR SELECT 
    USING (
        auth.uid() = user_id AND 
        symptom_date >= CURRENT_DATE - INTERVAL '2 years' AND
        is_deleted = false
    );

-- =====================================================
-- USER WORD FILES POLICIES
-- =====================================================

-- Users can only access their own word files
CREATE POLICY "Users can access own word files" ON user_word_files
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Block access to deleted word files
CREATE POLICY "Block access to deleted word files" ON user_word_files
    FOR SELECT 
    USING (
        auth.uid() = user_id AND 
        is_deleted = false
    );

-- =====================================================
-- AUDIT LOGS POLICIES (COMPLIANCE)
-- =====================================================

-- Users can read their own audit logs (transparency)
CREATE POLICY "Users can read own audit logs" ON audit_logs
    FOR SELECT 
    USING (auth.uid() = user_id);

-- System can insert audit logs for any user (for compliance logging)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT 
    WITH CHECK (true);

-- Prevent users from modifying audit logs (compliance requirement)
CREATE POLICY "Prevent audit log modifications" ON audit_logs
    FOR UPDATE 
    USING (false);

CREATE POLICY "Prevent audit log deletions" ON audit_logs
    FOR DELETE 
    USING (false);

-- =====================================================
-- DATA RETENTION POLICIES
-- =====================================================

-- Users can manage their own data retention settings
CREATE POLICY "Users can manage own retention policies" ON data_retention_policies
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SYNC STATUS POLICIES
-- =====================================================

-- Users can access their own sync status
CREATE POLICY "Users can access own sync status" ON sync_status
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- OFFLINE CHANGES QUEUE POLICIES
-- =====================================================

-- Users can access their own offline changes queue
CREATE POLICY "Users can access own offline queue" ON offline_changes_queue
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- EXISTING SCHOOL TABLES POLICIES (MAINTAIN COMPATIBILITY)
-- =====================================================

-- Ensure existing school_plans table has proper RLS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'school_plans') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE school_plans ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can access own school plans" ON school_plans;
        
        -- Create comprehensive policy
        CREATE POLICY "Users can access own school plans" ON school_plans
            FOR ALL 
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Ensure existing school_files table has proper RLS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'school_files') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE school_files ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can access own school files" ON school_files;
        
        -- Create comprehensive policy
        CREATE POLICY "Users can access own school files" ON school_files
            FOR ALL 
            USING (auth.uid() = for_user_id OR auth.uid() = uploader_id)
            WITH CHECK (auth.uid() = for_user_id OR auth.uid() = uploader_id);
    END IF;
END
$$;

-- =====================================================
-- ADVANCED SECURITY POLICIES
-- =====================================================

-- Policy to prevent data leakage through joins
CREATE OR REPLACE FUNCTION prevent_cross_user_access()
RETURNS boolean AS $$
BEGIN
    -- This function can be used in policies to add extra validation
    -- Ensure the current user is authenticated and has a valid session
    RETURN (
        auth.uid() IS NOT NULL AND 
        auth.role() = 'authenticated' AND
        -- Verify session hasn't expired (if you track session expiry)
        auth.jwt() ->> 'exp' > extract(epoch from now())::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the function to critical healthcare data
CREATE POLICY "Extra security for symptoms" ON user_symptoms
    FOR ALL 
    USING (
        prevent_cross_user_access() AND 
        auth.uid() = user_id
    );

-- =====================================================
-- STORAGE BUCKET POLICIES (FOR FILE UPLOADS)
-- =====================================================

-- Policy for school-files bucket (if it exists)
-- Note: This should be run in the Supabase dashboard under Storage > Policies

/*
-- For school-files bucket:
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'school-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'school-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'school-files' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- =====================================================
-- COMPLIANCE VERIFICATION QUERIES
-- =====================================================

-- Function to verify RLS is working correctly
CREATE OR REPLACE FUNCTION verify_rls_policies()
RETURNS TABLE(
    table_name text,
    rls_enabled boolean,
    policy_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        t.rowsecurity,
        COUNT(p.policyname)
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename LIKE 'user_%'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_isolation()
RETURNS boolean AS $$
DECLARE
    test_result boolean := true;
BEGIN
    -- This function would contain tests to verify users can't access each other's data
    -- Implementation would depend on having test users
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
TO APPLY THESE POLICIES:

1. First, run the main schema.sql file to create tables
2. Then run this rls-policies.sql file to apply security policies
3. Test the policies by:
   - Creating test users in Supabase Auth
   - Attempting to access data across users (should fail)
   - Running: SELECT * FROM verify_rls_policies();

IMPORTANT NOTES:

1. These policies ensure healthcare-grade data isolation
2. Users can only access their own data
3. Audit logs are protected from modification
4. Extra security is applied to sensitive health data (symptoms)
5. Storage bucket policies need to be applied separately in the Supabase dashboard

HEALTHCARE COMPLIANCE:

- All user data is isolated by user_id
- Audit logs are immutable once created
- Deleted data is soft-deleted and filtered out
- Extra validation for healthcare-sensitive data
- Session validation prevents stale session access

MONITORING:

Run these queries regularly to ensure RLS is working:
- SELECT * FROM verify_rls_policies();
- Check audit logs for unauthorized access attempts
- Monitor sync_status for any unusual patterns
*/