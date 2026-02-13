-- Delete profile for Samantha Rott (GDPR-style removal request)
-- This migration removes the profile and all related data via CASCADE constraints

-- Profile ID: 3da61068-399b-4291-9778-ecd48b046df1
-- Email: samantha@bridgestg.com
-- Reason: Profile created without consent, removal requested via email

DELETE FROM profiles
WHERE id = '3da61068-399b-4291-9778-ecd48b046df1'
  AND full_name = 'Samantha Rott'
  AND email = 'samantha@bridgestg.com';

-- Add to do-not-contact list to prevent future outreach
INSERT INTO do_not_contact (email, reason, created_at)
VALUES (
  'samantha@bridgestg.com',
  'Profile removal request - profile created without consent',
  NOW()
)
ON CONFLICT (email) DO NOTHING;
