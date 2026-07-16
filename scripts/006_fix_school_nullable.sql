-- Make school and grade optional — they are not collected in the modern apply form
ALTER TABLE delegate_applications ALTER COLUMN school DROP NOT NULL;
ALTER TABLE delegate_applications ALTER COLUMN grade DROP NOT NULL;
