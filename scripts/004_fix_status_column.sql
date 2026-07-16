-- Fix missing status column on user_conferences
-- Migration 002 created an index on status but never added the column itself

ALTER TABLE user_conferences
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Conferences created directly by founders are auto-published
UPDATE user_conferences
SET status = 'published'
WHERE status IS NULL
  AND creator_id IN (
    SELECT user_id FROM profiles WHERE role = 'founder'
  );

-- Any remaining null statuses (e.g. general_secretary conferences) default to pending
UPDATE user_conferences
SET status = 'pending'
WHERE status IS NULL;

-- Also add approved_at column if missing (referenced in inbox approve flow)
ALTER TABLE user_conferences
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
