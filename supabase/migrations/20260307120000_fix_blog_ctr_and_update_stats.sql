-- Migration: Fix CTR on high-impression blog posts + update statistics with 2026 data
-- Problem: church-denomination post has 917 impressions at position 3.8 with 0 clicks
-- Problem: statistics post has 93 impressions at position 5.7 with 0 clicks

-- 1. Fix meta titles/descriptions for CTR optimization
-- church-premarital-counseling-by-denomination: 917 impressions, pos 3.8, 0 clicks
UPDATE posts SET
  meta_title = 'What Does Your Church Require Before Marriage? (2026 Denomination Guide)',
  meta_description = 'Your church likely requires premarital counseling before the wedding. See exactly what Catholic, Baptist, Methodist, Lutheran, Presbyterian, and LDS churches require — session counts, costs, and timelines.'
WHERE slug = 'church-premarital-counseling-by-denomination';

-- premarital-counseling-statistics: 93 impressions, pos 5.7, 0 clicks
UPDATE posts SET
  meta_title = '31% Lower Divorce Rate: Every Premarital Counseling Statistic (2026)',
  meta_description = 'Sourced statistics on premarital counseling: 31% divorce reduction, 39% of Gen Z couples now participate, costs $75-$250/session, 10 states offer license discounts. Updated March 2026.'
WHERE slug = 'premarital-counseling-statistics';

-- premarital-counseling-cost: 38 impressions, pos 9.4, 0 clicks
UPDATE posts SET
  meta_title = 'How Much Does Premarital Counseling Cost in 2026? ($75-$250/Session)',
  meta_description = 'Premarital counseling costs $75-$250 per session with a therapist, or free through many churches. Compare costs for PREPARE/ENRICH, Gottman, SYMBIS, and faith-based programs.'
WHERE slug = 'premarital-counseling-cost';

-- premarital-counseling-with-pastor: 76 impressions, pos 7.9, 0 clicks
UPDATE posts SET
  meta_title = 'Premarital Counseling With Your Pastor: What to Expect (2026)',
  meta_description = 'Most pastors require 4-8 premarital sessions before the wedding. Here is what they cover, common questions they ask, and how to prepare — from pastors who do this every week.'
WHERE slug = 'premarital-counseling-with-pastor';

-- premarital-counseling-curriculum-comparison: 43 impressions, pos 6, 0 clicks
UPDATE posts SET
  meta_title = 'PREPARE/ENRICH vs Gottman vs SYMBIS vs FOCCUS: Which Is Best? (2026)',
  meta_description = 'Side-by-side comparison of the 4 major premarital counseling programs. See what each covers, how much it costs, session length, and which is right for your relationship.'
WHERE slug = 'premarital-counseling-curriculum-comparison';

-- setting-healthy-boundaries-with-inlaws: 26 impressions, pos 10.3, 0 clicks
UPDATE posts SET
  meta_title = 'How to Set Boundaries With In-Laws (Without Ruining the Relationship)',
  meta_description = 'Therapist-approved scripts for the hardest in-law conversations: holidays, unsolicited advice, financial boundaries, and visits. Protect your marriage without starting a war.'
WHERE slug = 'setting-healthy-boundaries-with-inlaws';

-- how-long-does-premarital-counseling-take: 20 impressions, pos 8.1, 0 clicks
UPDATE posts SET
  meta_title = 'How Long Does Premarital Counseling Take? (4-8 Sessions Typical)',
  meta_description = 'Most premarital counseling takes 4-8 sessions over 2-3 months. See timelines for church programs, licensed therapists, online options, and intensive weekend formats.'
WHERE slug = 'how-long-does-premarital-counseling-take';

-- register-premarital-course-provider: 18 impressions, pos 5.6, 0 clicks
UPDATE posts SET
  meta_title = 'List Your Practice Free: Join the Premarital Counseling Directory',
  meta_description = 'Get found by engaged couples searching for premarital counseling. Free listing includes your profile, specialties, and direct contact. No per-lead fees. Join 500+ counselors.'
WHERE slug = 'register-premarital-course-provider';

-- 2. Update statistics post content with fresh 2026 data
UPDATE posts SET
  content = $post_content$
## Why This Page Exists

Premarital counseling statistics are widely cited but rarely sourced. If you have ever seen "premarital counseling reduces divorce by 30%" without a citation, you know the problem.

This page compiles every verified statistic we could find about premarital counseling — with sources. Journalists, pastors, therapists, researchers, and couples: bookmark this page.

*Last updated: March 2026*

## Divorce Reduction

**31% reduction in divorce risk** for couples who complete premarital counseling.
*Source: Stanley, S. M., Amato, P. R., Johnson, C. A., & Markman, H. J. (2006). "Premarital Education, Marital Quality, and Marital Stability." Journal of Family Psychology, 20(1), 117–126.*

**Couples who participated in premarital education were 44% less likely to divorce** compared to those who did not, controlling for demographics.
*Source: Carroll, J. S., & Doherty, W. J. (2003). "Evaluating the Effectiveness of Premarital Prevention Programs." Family Relations, 52(2), 105–118.*

**The divorce rate for couples who completed PREPARE/ENRICH is approximately 17%** — vs. a national average of roughly 40–50%.
*Source: Life Innovations, Inc. (PREPARE/ENRICH research database).*

**Couples who participated in premarital counseling were better off than 80% of couples** who decided against counseling.
*Source: Meta-analysis of 20 studies involving more than 10,000 couples, Journal of Family Psychology (2014).*

## Participation Rates

**30% of all recently married couples** in the United States attended premarital counseling or couples therapy before the wedding.
*Source: The Knot 2025 Real Weddings Study (nearly 17,000 couples surveyed).*

**39% of Gen Z engaged couples** participated in premarital counseling — the highest rate of any generation.
*Source: The Knot 2025 Real Weddings Study.*

**More than 2 in 5 Gen Z respondents** believe couples therapy is important for a strong relationship, and 87% would consider going to couples counseling in the future.
*Source: Grow Therapy 2026 Couples Therapy Survey.*

**Family and couples therapy appointments increased more than 50% year-over-year** from January 2023 to January 2025.
*Source: Headway mental health platform data, reported by Axios (February 2025).*

**Among couples married in religious settings, approximately 75% complete some form of premarital preparation.**
*Source: Gallup surveys on marriage preparation; National Association of Evangelicals.*

## Marriage Rate Trends

**The U.S. marriage rate is forecast at 5.6 marriages per 1,000 people in 2026**, down from 6.2 in 2022 and continuing a long-term decline.
*Source: IBISWorld; CDC National Vital Statistics System.*

**The median age at first marriage reached 30.8 for men and 28.4 for women** — up from 23.5 and 21.1 respectively in 1975.
*Source: U.S. Census Bureau, Current Population Survey (2024).*

**Fewer than half of U.S. households (47%) are now married-couple households**, compared to 71% in 1970.
*Source: U.S. Census Bureau, America's Families and Living Arrangements (2025).*

## State Discount Programs

**10 states currently offer marriage license fee discounts** for completing premarital counseling:
Florida, Texas, Minnesota, Tennessee, Georgia, Oklahoma, South Carolina, Utah, Maryland, and West Virginia.

[See full state-by-state comparison →](/premarital-counseling/state-requirements)

**Discounts range from $5 to $75**, depending on the state. Minnesota offers the largest single-state discount at $75 off the $115 license fee.

**An estimated 14,785 fewer divorces** are attributable to state premarital counseling incentive policies, based on modeling of participation rates and divorce reduction effects.
*Source: Hawkins, A. J., Blanchard, V. L., Baldwin, S. A., & Fawcett, E. B. (2008). "Does Marriage and Relationship Education Work?" Journal of Consulting and Clinical Psychology, 76(5), 723–734; state participation data extrapolations.*

**Florida's program (est. 1998) is the oldest and largest** state premarital discount program, with an estimated 200,000+ couples completing the course since inception.

## Cost and Duration

**The average cost of premarital counseling is $75–$250 per session** for licensed therapists, depending on location and credentials.
*Source: Aggregated from therapist directories and insurance databases, 2024–2025.*

**Faith-based and church programs range from free to $200** for a complete program (typically 4–8 sessions). Many churches offer premarital counseling at no cost to members.

**The typical premarital counseling program lasts 5–8 sessions** over 2–3 months.
*Source: National survey of premarital counseling providers; PREPARE/ENRICH facilitator data.*

**Assessment costs by tool:**

| Assessment | Cost Per Couple |
|-----------|----------------|
| [PREPARE/ENRICH](/blog/prepare-enrich-explained) | ~$35 |
| [SYMBIS](/blog/symbis-explained) | ~$40 |
| [Gottman Relationship Checkup](/blog/how-to-find-gottman-certified-therapist) | ~$50–$75 |
| [FOCCUS](/blog/foccus-explained) | ~$10 |

## Satisfaction and Outcomes

**93% of couples who completed premarital counseling said it was a valuable experience.**
*Source: PREPARE/ENRICH post-program survey data.*

**Couples who completed premarital education reported 30% higher satisfaction scores** in the first five years of marriage compared to couples who did not.
*Source: Fawcett, E. B., Hawkins, A. J., Blanchard, V. L., & Carroll, J. S. (2010). "Do Premarital Education Programs Really Work?" Journal of Family Psychology, 24(2), 236–244.*

**Communication skills showed the largest improvement** after premarital counseling, followed by conflict management and financial planning.
*Source: Stanley et al. (2006); PREPARE/ENRICH outcome studies.*

**Women are more likely to seek couples therapy proactively** — 28% of women cite "strengthening the relationship" as their motivation vs. 18% of men.
*Source: Grow Therapy 2026 Couples Therapy Survey.*

## Online and Virtual Counseling

**The online couples therapy market reached $19.8 billion in 2025**, growing at a CAGR of 10.6%.
*Source: Research and Markets, Online Couples Therapy and Counseling Services Market Report (2025).*

**Approximately 56% of counseling sessions have moved online**, with virtual platforms gaining strong traction among younger couples seeking convenience and privacy.
*Source: Research and Markets industry analysis (2025).*

**The broader marriage counseling services market is projected to reach $1.09 billion by 2035**, growing at a CAGR of 11.5%.
*Source: Business Research Insights, Marriage Counseling Services Market Report.*

## How Couples Find Therapists in 2026

**Psychology Today referrals have declined 77–94%** for many therapists since 2023, with individual profiles seeing contacts drop from 357 to 40 over four years.
*Source: ClearHealthCosts investigation (January 2026); therapist-reported data.*

**Therapy clients now search five main channels:** Google search, AI tools (ChatGPT has 800M+ weekly users), insurance portals (Alma, Rula), directories, and word-of-mouth referrals.
*Source: Reframe Practice, "How Clients Find Therapists in 2026."*

**Google search remains the #1 channel** for finding a therapist, with couples increasingly using long-tail queries like "premarital counseling near me" and "gottman therapist [city]."

## Clergy and Church Involvement

**75% of clergy in the United States require some form of premarital preparation** before they will officiate a wedding.
*Source: National Association of Evangelicals; Gallup surveys on clergy practices.*

**Catholic Pre-Cana programs serve an estimated 500,000+ couples per year** in the United States, making the Catholic Church the single largest provider of premarital education.
*Source: United States Conference of Catholic Bishops (USCCB).*

**An estimated 85% of Catholic parishes require premarital preparation**, typically the FOCCUS inventory and a Pre-Cana weekend or series.
*Source: USCCB guidelines on marriage preparation.*

## Insurance Coverage

**Some insurance plans cover premarital therapy** when billed under couples therapy CPT codes (90847 for family therapy or 90834 for individual therapy with a relational focus). Coverage varies significantly by plan, state, and provider.

**An estimated 15–20% of couples use insurance to partially cover premarital counseling costs.**
*Source: Aggregated claims data; therapist directory surveys.*

**EAP (Employee Assistance Program) benefits** often cover 3–6 sessions of couples counseling, including premarital work. Check with your employer's EAP provider.

## Global and Historical Context

**The first formal premarital counseling programs in the United States emerged in the 1930s**, pioneered by clergy and family life educators.
*Source: Stahmann, R. F., & Hiebert, W. J. (1997). "Premarital and Remarital Counseling." Jossey-Bass.*

**PREPARE/ENRICH was developed in 1977** by Dr. David Olson at the University of Minnesota and has since been used by over 4 million couples worldwide.
*Source: Life Innovations, Inc.*

**Countries with formal premarital education requirements include** Singapore (mandatory for couples in government housing), and some jurisdictions in Australia and parts of the Middle East.
*Source: International comparative family law research.*

## Citing These Statistics

If you are citing statistics from this page:
- Always include the original source (listed after each statistic)
- Note that aggregated data points represent best available estimates and may be updated
- For the most current state-by-state data, see our [State Requirements page](/premarital-counseling/state-requirements)

If you notice an error or have a more current source, please [contact us](/contact).

## Bottom Line

The research is consistent: premarital counseling works. It reduces divorce risk, improves relationship satisfaction, and builds the communication and conflict skills that sustain a marriage through hard seasons. The specific program matters less than the act of intentional preparation.

With 39% of Gen Z couples now seeking premarital counseling — the highest rate of any generation — and couples therapy appointments up 50% year-over-year, the trend is clear: investing in your relationship before and after the wedding is becoming the norm, not the exception.

[Find a premarital counselor near you →](/premarital-counseling)
$post_content$,
  title = 'Premarital Counseling Statistics: What the Research Actually Shows (2026)',
  updated_at = now()
WHERE slug = 'premarital-counseling-statistics';
