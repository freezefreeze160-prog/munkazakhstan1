-- Fix 1: Set founder's conferences to 'published'
-- (previous migration used DEFAULT 'pending' so WHERE status IS NULL never matched)
UPDATE user_conferences
SET status = 'published'
WHERE creator_id IN (
    SELECT user_id FROM profiles WHERE role = 'founder'
);

-- Fix 2: Allow founders and admins to update ANY conference (approve/reject workflow)
DROP POLICY IF EXISTS "Founders and admins can update any conference" ON public.user_conferences;
CREATE POLICY "Founders and admins can update any conference" ON public.user_conferences
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('founder', 'admin'))
  );

-- Fix 3: Allow founders and admins to update ANY delegate application
DROP POLICY IF EXISTS "Founders can update any application" ON public.delegate_applications;
CREATE POLICY "Founders can update any application" ON public.delegate_applications
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('founder', 'admin'))
  );

-- Fix 4: Allow deputies to view and update applications for their assigned conferences
DROP POLICY IF EXISTS "Deputies can view assigned conference applications" ON public.delegate_applications;
CREATE POLICY "Deputies can view assigned conference applications" ON public.delegate_applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT assigned_deputy_id FROM public.user_conferences WHERE id = conference_id
    )
  );

DROP POLICY IF EXISTS "Deputies can update assigned conference applications" ON public.delegate_applications;
CREATE POLICY "Deputies can update assigned conference applications" ON public.delegate_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT assigned_deputy_id FROM public.user_conferences WHERE id = conference_id
    )
  );
