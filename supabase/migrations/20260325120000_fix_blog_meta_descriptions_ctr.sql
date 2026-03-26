-- Fix blog meta descriptions for high-impression zero-click pages
-- These posts rank position 3-7 in Google but get 0 clicks because
-- the meta descriptions are either generic or don't match search intent.
--
-- Data from GSC pull 2026-03-25:
--   church-premarital-counseling-by-denomination: 2,855 imp, 0 clicks, pos 3.7
--   premarital-counseling-with-pastor:            214 imp,   0 clicks, pos 7.1
--   premarital-counseling-curriculum-comparison:   223 imp,   0 clicks, pos 6.9
--   premarital-counseling-statistics:              202 imp,   0 clicks, pos 7.0
--   premarital-counseling-cost:                    124 imp,   1 click,  pos 10.8

-- 1. Denomination post — top queries: "PCA premarital counseling", "church premarital counseling"
--    Current description likely falls back to excerpt. Needs to answer "what will I learn?"
UPDATE posts
SET meta_description = 'Compare premarital counseling requirements across 12 denominations — Catholic Pre-Cana, PCA Presbyterian, Baptist, Lutheran, Methodist & more. Session counts, costs, and approved providers.',
    updated_at = now()
WHERE slug = 'church-premarital-counseling-by-denomination';

-- 2. Pastor post — top queries: "premarital counseling with pastor", "pastoral counseling questions"
--    Current description is decent but doesn't differentiate from position 1-6 results
UPDATE posts
SET meta_description = 'What pastors actually cover in premarital counseling: the 6 standard topics, typical session count (4-8), how to prepare, and when to add a licensed therapist. Includes questions to ask.',
    updated_at = now()
WHERE slug = 'premarital-counseling-with-pastor';

-- 3. Curriculum comparison — top queries: "best premarital counseling program", "PREPARE/ENRICH vs Gottman"
--    Current description lists programs but doesn't create urgency or differentiation
UPDATE posts
SET meta_description = 'Side-by-side comparison of 7 premarital programs: PREPARE/ENRICH, SYMBIS, Gottman, Ready to Wed & more. Cost per couple, faith alignment, session format, and which fits your relationship.',
    updated_at = now()
WHERE slug = 'premarital-counseling-curriculum-comparison';

-- 4. Statistics post — top queries: "premarital counseling statistics", "does premarital counseling work"
--    Current description is good but can be punchier with the key stat upfront
UPDATE posts
SET meta_description = 'Premarital counseling cuts divorce risk by 31% — backed by peer-reviewed research. See participation rates, average costs, state discount programs, and outcome data with cited sources.',
    updated_at = now()
WHERE slug = 'premarital-counseling-statistics';

-- 5. Cost post — top queries: "premarital counseling cost", "how much does premarital counseling cost"
--    This one gets the most transactional traffic. Lead with the number.
UPDATE posts
SET meta_description = 'Premarital counseling typically costs $75-$250 per session, with most couples doing 4-8 sessions ($300-$2,000 total). Online options start at $49. See cost breakdowns and ways to save.',
    updated_at = now()
WHERE slug = 'premarital-counseling-cost';
