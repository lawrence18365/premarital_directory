-- Add cross-links to the original 3 blog posts (Aug 2025)
-- These posts pre-date the Feb 2026 content and have no internal blog links.
-- Appending a "Related Articles" section to each.

-- 1. Financial Questions post
UPDATE posts
SET content = content || '

---

## Keep Reading

- [What to Expect in Premarital Counseling](/blog/what-to-expect-premarital-counseling) — A complete guide to your first sessions
- [How Much Does Premarital Counseling Cost?](/blog/premarital-counseling-cost) — Pricing breakdown by format and provider type
- [Is Premarital Counseling Worth It?](/blog/is-premarital-counseling-worth-it) — What the research says about marriage preparation
- [Setting Boundaries with In-Laws](/blog/setting-healthy-boundaries-with-inlaws) — Navigate family dynamics before marriage

**[Browse our directory →](/premarital-counseling)** to find a qualified premarital counselor near you.'
WHERE slug = 'financial-questions-to-ask-before-marriage';

-- 2. Wedding Planning Fights post
UPDATE posts
SET content = content || '

---

## Keep Reading

- [What to Expect in Your First Premarital Counseling Session](/blog/what-to-expect-first-premarital-counseling-session) — Walk in prepared
- [How to Choose a Premarital Counselor](/blog/how-to-choose-premarital-counselor) — Find the right fit for your relationship
- [PREPARE/ENRICH Explained](/blog/prepare-enrich-explained) — The most widely used couples assessment
- [Financial Questions to Ask Before Marriage](/blog/financial-questions-to-ask-before-marriage) — Money conversations every couple needs

**[Find a counselor →](/premarital-counseling)** who specializes in communication and conflict resolution.'
WHERE slug = 'fighting-about-wedding-planning';

-- 3. In-Law Boundaries post
UPDATE posts
SET content = content || '

---

## Keep Reading

- [Premarital Counseling With Your Pastor](/blog/premarital-counseling-with-pastor) — What pastors cover in marriage prep sessions
- [What Divorced Couples Wish They Had Discussed Before Marriage](/blog/what-divorced-couples-wish-discussed-before-marriage) — Avoid common regrets
- [Online vs. In-Person Premarital Counseling](/blog/online-vs-in-person-premarital-counseling) — Which format works best?
- [Financial Questions to Ask Before Marriage](/blog/financial-questions-to-ask-before-marriage) — Essential money conversations

**[Browse our directory →](/premarital-counseling)** to find a premarital counselor who can help you navigate family dynamics.'
WHERE slug = 'setting-healthy-boundaries-with-inlaws';

-- 4. Add links to the Feb 16 "cost" post (highest-value keyword)
UPDATE posts
SET content = content || '

---

## Related Guides

- [Is Premarital Counseling Worth It?](/blog/is-premarital-counseling-worth-it) — Research and data on outcomes
- [Online vs. In-Person Premarital Counseling](/blog/online-vs-in-person-premarital-counseling) — Compare formats and pricing
- [PREPARE/ENRICH vs. Gottman vs. SYMBIS](/blog/prepare-enrich-vs-gottman-vs-symbis) — Which assessment is right for you?
- [Premarital Counseling for Second Marriages](/blog/premarital-counseling-second-marriages) — Unique considerations and costs

**[Find affordable counselors →](/premarital-counseling/affordable)** in your area.'
WHERE slug = 'premarital-counseling-cost'
  AND content NOT LIKE '%Related Guides%';

-- 5. Add links to "how to choose" post
UPDATE posts
SET content = content || '

---

## Related Guides

- [What to Expect in Premarital Counseling](/blog/what-to-expect-premarital-counseling) — A complete session-by-session guide
- [Christian vs. Secular Premarital Counseling](/blog/christian-vs-secular-premarital-counseling) — Understand the difference
- [How to Find a Gottman-Certified Therapist](/blog/how-to-find-gottman-certified-therapist) — For evidence-based couples work
- [Premarital Counseling Curriculum Comparison](/blog/premarital-counseling-curriculum-comparison) — 7 programs reviewed side by side

**[Browse counselors by specialty →](/premarital-counseling)** to find your match.'
WHERE slug = 'how-to-choose-premarital-counselor'
  AND content NOT LIKE '%Related Guides%';
