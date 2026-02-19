# Badge → Verified → Rank Boost Implementation Plan

## Overview
Turn backlinks into a product loop: Badge → Verified → Rank Boost → More Leads → More Claims → More Badges.

---

## Step 1: Ship badge as stable asset

**Action:** Convert `.webp` to `.png` and place at `client/public/assets/badges/badge-featured-on-weddingcounselors-premarital-transparent-v1.png`

- Create `client/public/assets/badges/` directory
- Convert the root `.webp` file to `.png` using `sips` (macOS built-in)
- Vercel already serves `Cache-Control: public, max-age=31536000, immutable` for static assets
- Version baked into filename (`v1`)

---

## Step 2: DB migration — `badge_submissions` table + `badge_verified` column

**File:** `supabase/migrations/20260216200000_add_badge_submissions.sql`

```sql
-- Badge submissions table
CREATE TABLE badge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  checked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add badge_verified to profiles (separate from existing is_verified which tracks PT scrape verification)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_verified_at TIMESTAMPTZ;

-- RLS
ALTER TABLE badge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers see own submissions" ON badge_submissions FOR SELECT USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Providers insert own submissions" ON badge_submissions FOR INSERT WITH CHECK (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins full access" ON badge_submissions FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- Index
CREATE INDEX idx_badge_submissions_status ON badge_submissions(status) WHERE status = 'pending';
CREATE INDEX idx_badge_submissions_provider ON badge_submissions(provider_id);
CREATE INDEX idx_profiles_badge_verified ON profiles(badge_verified) WHERE badge_verified = true;
```

**Why `badge_verified` not reuse `is_verified`?** The existing `is_verified` comes from Psychology Today scraping (used in CampaignDashboard and scraper.py). Badge verification is a separate concept — a provider actively placing a backlink. Keeping them separate avoids confusion.

---

## Step 3: "Get Verified (Rank Higher)" block on Provider Dashboard

**File:** `client/src/pages/professional/ProfessionalDashboard.js`

Add a new `<section>` after the metrics section (before `profdash-grid`). Contains:
- Title: "Get Verified (Rank Higher)"
- Explainer text about the badge + backlink benefit
- Preview of the badge image
- Two copy buttons: "Copy Badge Embed" and "Copy Text Link"
- Uses `navigator.clipboard.writeText()` with feedback toast
- Dynamic `profileUrl` from existing `getPublicProfileUrl()` (prefixed with `https://www.weddingcounselors.com`)
- Below the copy buttons: the "Submit your badge URL" form (input + button)
- Shows existing submission status if one exists (pending/verified/rejected)

**If `badge_verified` is already true:** Show a green "Verified" confirmation instead of the form.

---

## Step 4: Badge submission form (inline on dashboard)

Part of the same section in Step 3. No separate page needed.

- Input: `source_url` — "Paste the page on your website where you added the badge"
- Button: "Request Verification"
- On submit: insert into `badge_submissions` via Supabase client
- After submit: show "Submitted — we'll review within 48 hours" message
- Load existing submission on dashboard load (query `badge_submissions` where `provider_id = profile.id` and `status != 'rejected'`, order by `created_at desc`, limit 1)

---

## Step 5: Admin Badge Review Dashboard

**File:** `client/src/pages/admin/BadgeReviewDashboard.js` (new)

Follow the same pattern as `ClaimReviewDashboard.js`:
- Load pending badge submissions with joined profile data
- Each row shows: provider name, profile_url (link), source_url (link to open in new tab), submitted date
- Actions: "Approve" and "Reject" buttons
- On Approve:
  - Update `badge_submissions` set `status = 'verified'`, `checked_at = now()`
  - Update `profiles` set `badge_verified = true`, `badge_verified_at = now()` where `id = provider_id`
- On Reject:
  - Update `badge_submissions` set `status = 'rejected'`, `checked_at = now()`, `notes = reason`

**Route:** Add to `App.js` as `/admin/badges` with `ProtectedRoute requireAdmin={true}`

**Nav:** Add link to AdminDashboard sidebar/nav if one exists.

---

## Step 6: Show "Verified" badge on ProfileCard + ProfilePage

**File:** `client/src/components/profiles/ProfileCard.js`

The existing code at line 168 already renders a verified badge:
```jsx
{profile.is_verified && !profile.is_sponsored && (
  <div className="profile-badge verified">
    <i className="fa fa-shield-alt"></i> Verified
  </div>
)}
```

**Change to:** `(profile.is_verified || profile.badge_verified) && !profile.is_sponsored`

This makes badge verification show the same shield badge. No new UI needed.

**File:** `client/src/pages/ProfilePage.js`

Add a "Verified Provider" indicator near the provider name/badges area (similar to how sponsored badges are shown).

---

## Step 7: Ranking boost for badge-verified providers

**File:** `client/src/pages/CityPage.js`

In the sort function (line 604-606), add `badge_verified` as a tiebreaker **before** `created_at`:

```javascript
// Current:
if (getTierPriority(a) !== getTierPriority(b)) return getTierPriority(a) - getTierPriority(b)
return new Date(b.created_at) - new Date(a.created_at)

// New:
if (getTierPriority(a) !== getTierPriority(b)) return getTierPriority(a) - getTierPriority(b)
if (Boolean(b.badge_verified) !== Boolean(a.badge_verified)) return Number(b.badge_verified) - Number(a.badge_verified)
return new Date(b.created_at) - new Date(a.created_at)
```

This means: within the same tier, badge-verified providers rank above non-verified. Paid tiers still outrank free verified.

**Also:** Ensure `badge_verified` is included in the Supabase query that fetches profiles for city pages (in `supabaseClient.js` profileOperations).

---

## Step 8: CSS for the dashboard badge section

**File:** `client/src/assets/css/professional.css`

Add styles for:
- `.profdash-badge-section` — card styling matching existing `profdash-panel`
- `.profdash-badge-preview` — badge image preview
- `.profdash-copy-btn` — copy buttons with success state
- `.profdash-badge-form` — input + submit button
- `.profdash-badge-status` — status indicator (pending/verified)

---

## Step 9: Verification email (deferred / manual)

When admin approves, we could send an email. For MVP, skip automated email — admin can manually notify or we add it in V2. The dashboard already shows "Verified" status which is immediate feedback.

---

## File Change Summary

| File | Action |
|------|--------|
| `client/public/assets/badges/...v1.png` | Create (convert from webp) |
| `supabase/migrations/20260216200000_add_badge_submissions.sql` | Create |
| `client/src/pages/professional/ProfessionalDashboard.js` | Edit — add badge section + submission form |
| `client/src/pages/admin/BadgeReviewDashboard.js` | Create |
| `client/src/App.js` | Edit — add admin route + lazy import |
| `client/src/components/profiles/ProfileCard.js` | Edit — add `badge_verified` to verified badge condition |
| `client/src/pages/ProfilePage.js` | Edit — add verified badge indicator |
| `client/src/pages/CityPage.js` | Edit — add verified ranking boost |
| `client/src/lib/supabaseClient.js` | Edit — ensure `badge_verified` in profile select |
| `client/src/assets/css/professional.css` | Edit — add badge section styles |

## Implementation Order
1. Badge asset (Step 1)
2. Migration (Step 2)
3. Dashboard badge section + form (Steps 3-4)
4. CSS (Step 8)
5. Admin review page + route (Step 5)
6. ProfileCard + ProfilePage verified badge (Step 6)
7. Ranking boost in CityPage (Step 7)
