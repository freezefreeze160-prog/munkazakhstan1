-- Add team member fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_team_member BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_role TEXT;

-- Set founder as team member with "Technical Founder" role
UPDATE profiles 
SET is_team_member = TRUE, 
    team_role = 'Technical Founder'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'speed_777_speed@mail.ru'
);

-- Set Arailym as team member with "Founder of MUN Kazakhstan" role  
UPDATE profiles
SET is_team_member = TRUE,
    team_role = 'Founder of MUN Kazakhstan'
WHERE full_name ILIKE '%Арайлым%Спандияр%' OR full_name ILIKE '%Arailym%Spandiyar%';

-- Create RPC function for founder to manage team members
CREATE OR REPLACE FUNCTION admin_update_team_member(
  target_user_id UUID,
  is_member BOOLEAN,
  custom_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_email TEXT;
BEGIN
  -- Get caller's email
  SELECT email INTO caller_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Only founder can manage team members
  IF caller_email != 'speed_777_speed@mail.ru' THEN
    RETURN FALSE;
  END IF;

  -- Update team member status and role
  UPDATE profiles
  SET 
    is_team_member = is_member,
    team_role = custom_role,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN TRUE;
END;
$$;
