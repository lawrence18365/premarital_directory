# How to Apply the Profile Enhancement Migration

## Step 1: Log into Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: `bkjwctlolhoxhnoospwp`

## Step 2: Open SQL Editor

1. Click on "SQL Editor" in the left sidebar
2. Click "New Query"

## Step 3: Run the Migration

Copy and paste the entire contents of the file:
```
supabase/migrations/20250113000000_add_enhanced_profile_fields.sql
```

Then click "Run" or press Cmd+Enter

## Step 4: Verify the Migration

Run this query to verify the new fields were added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
  'credentials',
  'years_experience',
  'approach',
  'client_focus',
  'languages',
  'session_types',
  'insurance_accepted',
  'pricing_range',
  'education',
  'booking_url',
  'accepting_new_clients',
  'offers_free_consultation',
  'profile_completeness_score'
)
ORDER BY column_name;
```

You should see all 13 new fields listed.

## Step 5: Test Completeness Score

Test that the completeness calculation works:

```sql
SELECT
  full_name,
  profile_completeness_score,
  bio IS NOT NULL as has_bio,
  specialties IS NOT NULL as has_specialties
FROM profiles
LIMIT 5;
```

You should see completeness scores calculated for existing profiles.

## What This Migration Does

### New Fields Added:
- ✅ `credentials` - Professional licenses and certifications (array)
- ✅ `years_experience` - Years in practice (integer)
- ✅ `approach` - Therapeutic methodology (text)
- ✅ `client_focus` - Types of clients served (array)
- ✅ `languages` - Languages spoken (array)
- ✅ `session_types` - In-person, online, hybrid (array)
- ✅ `insurance_accepted` - Insurance providers (array)
- ✅ `pricing_range` - Fee range description (text)
- ✅ `session_fee_min` - Minimum fee in cents (integer)
- ✅ `session_fee_max` - Maximum fee in cents (integer)
- ✅ `education` - Degrees and training (array)
- ✅ `office_hours` - Availability schedule (JSON)
- ✅ `booking_url` - Direct booking link (text)
- ✅ `accepting_new_clients` - Availability flag (boolean)
- ✅ `offers_free_consultation` - Free consult flag (boolean)
- ✅ `profile_completeness_score` - Auto-calculated 0-100 (integer)

### Indexes Created:
- Index on languages (for filtering)
- Index on insurance_accepted (for filtering)
- Index on session_types (for filtering)
- Index on accepting_new_clients (for active profiles)

### Automatic Features:
- Profile completeness score automatically updates when profiles are created/updated
- Scores are calculated based on field completeness (0-100)
- Helps identify which profiles need more information

## Troubleshooting

If you see an error about columns already existing, that's okay - the migration uses `IF NOT EXISTS` so it's safe to run multiple times.

If you see permission errors, make sure you're using the service role key or are logged in as a super admin.
