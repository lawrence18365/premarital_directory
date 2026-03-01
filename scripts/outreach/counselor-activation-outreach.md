# Counselor Activation — Personal Outreach to 25 Claimed Counselors

## Why This Matters
Each claimed counselor has:
- A website (potential backlink)
- Social media followers
- An existing client base
- Professional colleagues

If even 10 of them share us once, that's more distribution than months of SEO.

## The Ask (3 asks, in priority order)
1. Link to your WeddingCounselors profile from your website (backlink = SEO boost for both)
2. Share your profile link with 2-3 colleagues who should be listed (referral link)
3. Mention the directory to engaged couples who aren't a fit for your practice

## Email Template (Personal, from Lawrence)

Subject: Quick favor — 2 minutes to help your profile rank higher

---

Hi [First Name],

This is Lawrence from WeddingCounselors.com — thanks for being one of our earliest counselors.

Quick question: would you be open to adding a small link to your WeddingCounselors profile from your website? It helps both of us rank higher in Google for "[city] premarital counseling."

Your profile: [profile URL]
Your referral link: [referral URL]

If you know any colleagues who should be listed, your referral link gets them set up in 5 minutes (free).

If there's anything I can do to make your listing more useful — better photo, different bio, anything — just reply and I'll handle it.

Thanks,
Lawrence

---

## Counselor List
(Pull from Supabase: profiles WHERE is_claimed = true AND moderation_status = 'approved')

Run this to get the list:
```
SELECT full_name, email, city, state_province, slug, website, badge_verified
FROM profiles
WHERE is_claimed = true AND moderation_status = 'approved' AND is_hidden = false
ORDER BY created_at;
```
