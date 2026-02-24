-- Migration: Normalize existing dirty website URLs in profiles table
-- Fixes: interior spaces, missing protocol, trailing slashes

-- Step 1: Strip all whitespace (interior spaces like "therapist .com" → "therapist.com")
UPDATE profiles
SET website = regexp_replace(website, '\s+', '', 'g')
WHERE website IS NOT NULL
  AND website ~ '\s';

-- Step 2: Prepend https:// where protocol is missing
UPDATE profiles
SET website = 'https://' || website
WHERE website IS NOT NULL
  AND website != ''
  AND website !~ '^https?://';

-- Step 3: Strip trailing slashes for consistency
UPDATE profiles
SET website = regexp_replace(website, '/+$', '')
WHERE website IS NOT NULL
  AND website ~ '/+$';
