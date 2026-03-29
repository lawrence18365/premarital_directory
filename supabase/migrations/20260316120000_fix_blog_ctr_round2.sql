-- Fix blog meta titles to match actual GSC query patterns for CTR improvement
-- Issue: High-impression posts have titles that don't include the terms users are searching for

-- 1. Denomination post: 2,768 impressions, position 3.7
--    Top queries include "PCA premarital counseling", "Presbyterian premarital counseling"
--    Current title omits "Presbyterian" entirely
UPDATE posts
SET meta_title = 'Church Premarital Counseling by Denomination: Catholic, Baptist, Presbyterian & More',
    updated_at = now()
WHERE slug = 'church-premarital-counseling-by-denomination';

-- 2. Pastor post: 203 impressions, position 7.0
--    Top queries include "premarital counseling with pastor", "pastoral premarital counseling questions"
UPDATE posts
SET meta_title = 'Premarital Counseling With Your Pastor: Sessions, Questions & What to Expect',
    updated_at = now()
WHERE slug = 'premarital-counseling-with-pastor';

-- 3. Curriculum comparison post: 151 impressions, position 6.7
--    Top queries include "best premarital counseling curriculum", "PREPARE/ENRICH vs Gottman"
UPDATE posts
SET meta_title = 'Best Premarital Counseling Curriculum: PREPARE/ENRICH vs Gottman vs SYMBIS (2026)',
    updated_at = now()
WHERE slug = 'premarital-counseling-curriculum-comparison';
