-- Migration 002: Role Hierarchy Restructure
-- Implements Deputy-General Secretary relationships and conference approval workflow

-- ============================================================================
-- STEP 1: Add new columns to existing tables
-- ============================================================================

-- Add supervisor relationship to profiles (Deputy → General Secretary)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES auth.users(id);

-- Add conference assignment and approval fields
ALTER TABLE user_conferences ADD COLUMN IF NOT EXISTS assigned_deputy_id UUID REFERENCES auth.users(id);
ALTER TABLE user_conferences ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT true;
ALTER TABLE user_conferences ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- STEP 2: Create action logs table for audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'conference', 'application', 'user', 'role'
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on action_logs
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view their own logs, Admin/Founder can see all
DROP POLICY IF EXISTS "Users can view their own logs" ON action_logs;
CREATE POLICY "Users can view their own logs" ON action_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('founder', 'admin'))
  );

DROP POLICY IF EXISTS "System can insert logs" ON action_logs;
CREATE POLICY "System can insert logs" ON action_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_supervisor ON profiles(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_conferences_assigned_deputy ON user_conferences(assigned_deputy_id);
CREATE INDEX IF NOT EXISTS idx_conferences_status ON user_conferences(status);
CREATE INDEX IF NOT EXISTS idx_conferences_approval_required ON user_conferences(approval_required);
CREATE INDEX IF NOT EXISTS idx_action_logs_user ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_target ON action_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at DESC);

-- ============================================================================
-- STEP 4: Update existing data
-- ============================================================================

-- Mark existing published conferences as not requiring approval
UPDATE user_conferences 
SET approval_required = false 
WHERE status = 'published';

-- Mark conferences created by Admin/Founder as not requiring approval
UPDATE user_conferences 
SET approval_required = false 
WHERE creator_id IN (
  SELECT user_id FROM profiles WHERE role IN ('founder', 'admin')
);

-- ============================================================================
-- STEP 5: Create RPC functions
-- ============================================================================

-- Function to log actions
CREATE OR REPLACE FUNCTION log_action(
  p_user_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO action_logs (user_id, action, target_type, target_id, details)
  VALUES (p_user_id, p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION log_action TO authenticated;

-- Function to assign Deputy to General Secretary
CREATE OR REPLACE FUNCTION assign_deputy_to_general_secretary(
  deputy_user_id UUID,
  gen_sec_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  caller_email TEXT;
  deputy_role TEXT;
  gen_sec_role TEXT;
BEGIN
  -- Check caller is Admin or Founder
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email != 'speed_777_speed@mail.ru' AND 
     NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RETURN false;
  END IF;

  -- Validate deputy is actually a Deputy
  SELECT role INTO deputy_role FROM profiles WHERE user_id = deputy_user_id;
  IF deputy_role != 'deputy' THEN
    RETURN false;
  END IF;

  -- Validate gen_sec is actually a General Secretary
  SELECT role INTO gen_sec_role FROM profiles WHERE user_id = gen_sec_user_id;
  IF gen_sec_role != 'general_secretary' THEN
    RETURN false;
  END IF;

  -- Update supervisor
  UPDATE profiles SET supervisor_id = gen_sec_user_id WHERE user_id = deputy_user_id;

  -- Log the action
  PERFORM log_action(
    auth.uid(),
    'assign_deputy',
    'user',
    deputy_user_id,
    jsonb_build_object('supervisor_id', gen_sec_user_id)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION assign_deputy_to_general_secretary TO authenticated;

-- Function to check if user can manage a specific application
CREATE OR REPLACE FUNCTION can_manage_application(
  app_id UUID,
  manager_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  manager_role TEXT;
  conf_assigned_deputy UUID;
  conf_creator UUID;
BEGIN
  -- Get manager's role
  SELECT role INTO manager_role FROM profiles WHERE user_id = manager_id;

  -- Founder and Admin can manage all
  IF manager_role IN ('founder', 'admin') THEN
    RETURN true;
  END IF;

  -- Get conference info
  SELECT uc.assigned_deputy_id, uc.creator_id 
  INTO conf_assigned_deputy, conf_creator
  FROM delegate_applications da
  JOIN user_conferences uc ON da.conference_id = uc.id
  WHERE da.id = app_id;

  -- Deputy can manage only if assigned to this conference
  IF manager_role = 'deputy' AND conf_assigned_deputy = manager_id THEN
    RETURN true;
  END IF;

  -- General Secretary cannot manage applications
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION can_manage_application TO authenticated;

-- Function to approve/reject conference requests
CREATE OR REPLACE FUNCTION approve_conference_request(
  conf_id UUID,
  approver_id UUID,
  action_type TEXT -- 'approve' or 'reject'
) RETURNS BOOLEAN AS $$
DECLARE
  approver_role TEXT;
  caller_email TEXT;
  current_status TEXT;
BEGIN
  -- Check caller is Admin or Founder
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  SELECT role INTO approver_role FROM profiles WHERE user_id = approver_id;
  
  IF caller_email != 'speed_777_speed@mail.ru' AND approver_role != 'admin' THEN
    RETURN false;
  END IF;

  -- Check conference is pending
  SELECT status INTO current_status FROM user_conferences WHERE id = conf_id;
  IF current_status != 'pending' THEN
    RETURN false; -- Already processed
  END IF;

  -- Update conference status (first action wins due to WHERE status = 'pending')
  IF action_type = 'approve' THEN
    UPDATE user_conferences 
    SET status = 'published', approved_by = approver_id, approved_at = NOW()
    WHERE id = conf_id AND status = 'pending';
  ELSIF action_type = 'reject' THEN
    UPDATE user_conferences 
    SET status = 'rejected', approved_by = approver_id, approved_at = NOW()
    WHERE id = conf_id AND status = 'pending';
  ELSE
    RETURN false;
  END IF;

  -- Log the action
  PERFORM log_action(
    approver_id,
    action_type || '_conference',
    'conference',
    conf_id,
    jsonb_build_object('action', action_type)
  );

  RETURN FOUND; -- true if UPDATE affected a row
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION approve_conference_request TO authenticated;

-- Function to get assigned deputy for a General Secretary
CREATE OR REPLACE FUNCTION get_assigned_deputy(gen_sec_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.full_name, u.email
  FROM profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE p.supervisor_id = gen_sec_id AND p.role = 'deputy'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_assigned_deputy TO authenticated;

-- ============================================================================
-- STEP 6: Update RLS policies
-- ============================================================================

-- Allow General Secretaries and Admins to view pending conferences
DROP POLICY IF EXISTS "Users can view pending conferences" ON user_conferences;
CREATE POLICY "Users can view pending conferences" ON user_conferences
  FOR SELECT USING (
    status = 'published' OR
    creator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- Grant permissions
GRANT ALL ON action_logs TO authenticated;

-- ============================================================================
-- Migration complete
-- ============================================================================
