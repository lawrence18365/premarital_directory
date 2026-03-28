-- Fill in meta_description for blog posts that may be missing them.
-- City/state-specific blog posts were created via admin UI and may lack meta descriptions.
-- Only updates rows where meta_description IS NULL — safe to run idempotently.
--
-- Also covers the 5 top-funnel posts from 20260307 migration that may have been
-- inserted without meta_description in some environments.

-- City/state blog posts
UPDATE posts SET meta_description = 'Find top-rated premarital counselors in Phoenix, AZ. Compare licensed therapists, faith-based counselors & online options. Prices, reviews & availability.', updated_at = now()
WHERE slug = 'premarital-counseling-phoenix' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counseling in Raleigh-Durham, NC. Compare licensed therapists, Christian counselors & couples programs. Session costs, specialties & availability.', updated_at = now()
WHERE slug = 'premarital-counseling-raleigh-nc' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counselors in Nashville, TN. Compare licensed therapists, faith-based counselors & online programs. Session costs, availability & reviews.', updated_at = now()
WHERE slug = 'premarital-counseling-nashville' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counseling in Detroit, MI. Compare licensed marriage therapists, Christian counselors & affordable options. Costs, specialties & availability.', updated_at = now()
WHERE slug = 'premarital-counseling-detroit' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counselors in Chicago, IL. Compare licensed therapists, faith-based counselors & online programs. Session rates from $75. Specialties & availability.', updated_at = now()
WHERE slug = 'premarital-counseling-chicago' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counseling in Texas. Compare licensed therapists, Christian counselors & Twogether in Texas certified providers. Session costs, availability & discount info.', updated_at = now()
WHERE slug = 'premarital-counseling-texas' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counselors in New York. Compare licensed therapists, faith-based counselors & online programs across NYC, Long Island & upstate. Costs & availability.', updated_at = now()
WHERE slug = 'premarital-counseling-new-york' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counseling in Minnesota. Compare licensed therapists, faith-based counselors & marriage prep programs. Session costs, availability & marriage license discount info.', updated_at = now()
WHERE slug = 'premarital-counseling-minnesota' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counselors in Florida. Compare licensed therapists, Christian counselors & online programs. Session costs, availability & FL marriage license discount details.', updated_at = now()
WHERE slug = 'premarital-counseling-florida' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Find premarital counseling in Illinois. Compare licensed therapists, faith-based counselors & couples programs in Chicago, suburbs & downstate. Costs & availability.', updated_at = now()
WHERE slug = 'premarital-counseling-illinois' AND meta_description IS NULL;

-- Top-funnel posts (safety net — only fills if NULL)
UPDATE posts SET meta_description = '50 essential questions to ask before getting married — covering finances, family, faith, conflict styles & life goals. Used by counselors nationwide.', updated_at = now()
WHERE slug = 'questions-to-ask-before-getting-married' AND meta_description IS NULL;

UPDATE posts SET meta_description = '7 signs you''re ready for marriage, backed by relationship research. Self-assessment checklist used by premarital counselors to gauge couple readiness.', updated_at = now()
WHERE slug = 'signs-youre-ready-for-marriage' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'Just got engaged? Here''s your first-month checklist: from setting a date to starting premarital counseling. Practical steps to start your engagement right.', updated_at = now()
WHERE slug = 'just-got-engaged-what-to-do-first' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'How to have difficult conversations with your partner without fighting. Evidence-based techniques from Gottman, EFT & attachment research for engaged couples.', updated_at = now()
WHERE slug = 'how-to-have-hard-conversations-with-partner' AND meta_description IS NULL;

UPDATE posts SET meta_description = 'What do happy couples do differently? 8 research-backed habits from long-term marriage studies. Practical relationship advice for engaged and newlywed couples.', updated_at = now()
WHERE slug = 'what-happy-couples-do-differently' AND meta_description IS NULL;
