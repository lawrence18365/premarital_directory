# First-Sale Warm10 Execution Report - June 11, 2026

Branch: `feat/monetization-experiments`

## Summary

- Selected 10 claimed, visible, marketing-allowed counselor profiles with real email, city/state, slug, and usable existing bio.
- Backed up the original live profile rows to ignored local JSON before making changes.
- Rewrote each bio, normalized specialty/method tags, and set each selected profile to local featured placement.
- Sent one owner proof record to `lbarwe1@gmail.com`, then sent all 10 counselor pitches one at a time with 180-second throttling.
- IMAP reply polling during the run found 0 replies.
- Stripe dashboard Payments and analytics showed no completed payments at report time.

## Selected Profiles

| # | Name | City | Specialty Focus | Profile |
|---:|---|---|---|---|
| 1 | Global Ministries Inc. Prophetess, Rev. Dr. Anastasia Alysse Barthelemy Brown, Prophetic Minister | Harvey, LA | faith-based premarital counseling | https://www.weddingcounselors.com/premarital-counseling/la/harvey/prophetess-rev-dr-anastasia-alysse-barthelemy-brown-prophetic-minister |
| 2 | Odunayo Samo | Houston, TX | Gottman and SYMBIS premarital preparation | https://www.weddingcounselors.com/premarital-counseling/tx/houston/odunayo-samo |
| 3 | Alejandra Weiss | Cincinnati, OH | online couples therapy and premarital communication | https://www.weddingcounselors.com/premarital-counseling/oh/cincinnati/alejandra-weiss |
| 4 | Dr. Russo | Sandy Springs, GA | assessment-based premarital counseling | https://www.weddingcounselors.com/premarital-counseling/ga/sandy-springs/deborah-russo |
| 5 | Lily Pernoud | Saint Louis, MO | PREPARE/ENRICH and Gottman-informed counseling | https://www.weddingcounselors.com/premarital-counseling/mo/saint-louis/lily-pernoud |
| 6 | Amanda Rausch | Seattle, WA | LGBTQ+ affirming premarital and couples counseling | https://www.weddingcounselors.com/premarital-counseling/wa/seattle/amanda-rausch |
| 7 | Heidi Farrell | Kearney, NE | blended-family and attachment-focused premarital coaching | https://www.weddingcounselors.com/premarital-counseling/ne/kearney/heidi-farrell |
| 8 | Jinal Mehta | New York, NY | culturally responsive couples therapy | https://www.weddingcounselors.com/premarital-counseling/ny/new-york/jinal-mehta |
| 9 | Maricruz Valdez | San Antonio, TX | faith-integrated premarital counseling | https://www.weddingcounselors.com/premarital-counseling/tx/san-antonio/maricruz-valdez |
| 10 | Sarah Kenville, LMFT | Minneapolis, MN | PREPARE/ENRICH premarital counseling | https://www.weddingcounselors.com/premarital-counseling/mn/minneapolis/sarah-kenville-lmft |

## Profile Changes

### 1. Global Ministries Inc. Prophetess, Rev. Dr. Anastasia Alysse Barthelemy Brown, Prophetic Minister

- Original bio length: 426 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: faith-based premarital counseling.
- Original tag counts: 18 specialties, 6 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `harvey`.
- Draft subject: I updated your Harvey profile.

### 2. Odunayo Samo

- Original bio length: 1488 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: Gottman and SYMBIS premarital preparation.
- Original tag counts: 13 specialties, 8 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `houston`.
- Draft subject: I updated your Houston profile.

### 3. Alejandra Weiss

- Original bio length: 2472 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: online couples therapy and premarital communication.
- Original tag counts: 16 specialties, 6 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `cincinnati`.
- Draft subject: I updated your Cincinnati profile.

### 4. Dr. Russo

- Original bio length: 2653 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: assessment-based premarital counseling.
- Original tag counts: 9 specialties, 10 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `sandy-springs`.
- Draft subject: I updated your Sandy Springs profile.

### 5. Lily Pernoud

- Original bio length: 423 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: PREPARE/ENRICH and Gottman-informed counseling.
- Original tag counts: 12 specialties, 5 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `saint-louis`.
- Draft subject: I updated your Saint Louis profile.

### 6. Amanda Rausch

- Original bio length: 1141 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: LGBTQ+ affirming premarital and couples counseling.
- Original tag counts: 15 specialties, 5 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `seattle`.
- Draft subject: I updated your Seattle profile.

### 7. Heidi Farrell

- Original bio length: 1517 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: blended-family and attachment-focused premarital coaching.
- Original tag counts: 12 specialties, 3 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `kearney`.
- Draft subject: I updated your Kearney profile.

### 8. Jinal Mehta

- Original bio length: 3987 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: culturally responsive couples therapy.
- Original tag counts: 10 specialties, 4 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `new-york`.
- Draft subject: I updated your New York profile.

### 9. Maricruz Valdez

- Original bio length: 1539 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: faith-integrated premarital counseling.
- Original tag counts: 6 specialties, 5 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `san-antonio`.
- Draft subject: I updated your San Antonio profile.

### 10. Sarah Kenville, LMFT

- Original bio length: 1886 chars; rewritten bio is staged live via Supabase update.
- Specialty focus used in pitch: PREPARE/ENRICH premarital counseling.
- Original tag counts: 12 specialties, 1 methods; normalized tags now emphasize the stated specialty focus.
- Featured placement applied: `is_sponsored=true`, `sponsored_rank=2`, `tier=local_featured`, city featured for `minneapolis`.
- Draft subject: I updated your Minneapolis profile.

## Email Sends

- Owner proof record: sent, messageId <4e2b1f91-bd3f-e586-9351-3fa74a9b25dd@weddingcounselors.com>.

| # | Name | City | Status | Sent At | Message ID |
|---:|---|---|---|---|---|
| 1 | Global Ministries Inc. Prophetess, Rev. Dr. Anastasia Alysse Barthelemy Brown, Prophetic Minister | Harvey | sent | 2026-06-11T23:01:30.853Z | <22916c6a-4d82-80e8-f2e6-10bb194c30b9@weddingcounselors.com> |
| 2 | Odunayo Samo | Houston | sent | 2026-06-11T23:04:34.969Z | <976ddb91-f704-72b5-91ae-bdc04084f206@weddingcounselors.com> |
| 3 | Alejandra Weiss | Cincinnati | sent | 2026-06-11T23:07:39.072Z | <114c9b69-830e-88bf-932e-1ff6bdc8fb0c@weddingcounselors.com> |
| 4 | Dr. Russo | Sandy Springs | sent | 2026-06-11T23:10:43.289Z | <af1c1b33-2ad7-a660-d908-238181db6fc0@weddingcounselors.com> |
| 5 | Lily Pernoud | Saint Louis | sent | 2026-06-11T23:13:47.630Z | <1fa1f41b-e064-6149-7405-b1b783c04a83@weddingcounselors.com> |
| 6 | Amanda Rausch | Seattle | sent | 2026-06-11T23:16:51.644Z | <e800fed1-c8b5-6e85-e57f-184f6f3eb47d@weddingcounselors.com> |
| 7 | Heidi Farrell | Kearney | sent | 2026-06-11T23:19:55.479Z | <2e4badc1-47d4-2625-b5a8-2b6eab0c9437@weddingcounselors.com> |
| 8 | Jinal Mehta | New York | sent | 2026-06-11T23:22:59.193Z | <68a887d4-3273-cac3-8653-f6991e2f0407@weddingcounselors.com> |
| 9 | Maricruz Valdez | San Antonio | sent | 2026-06-11T23:26:02.967Z | <446d67c7-281a-5179-ce32-8f01254621d2@weddingcounselors.com> |
| 10 | Sarah Kenville, LMFT | Minneapolis | sent | 2026-06-11T23:29:07.031Z | <4280b830-3f98-40c3-48f2-7211354da05d@weddingcounselors.com> |

## Replies

No replies were found during the IMAP polling window for this run.

## Payments

- Stripe Payment Link: active Founding Listing, US$79.00 one-time. The raw URL lives only in `.env` and ignored local send logs.
- Stripe dashboard Payments and analytics at report time: No payments.
- Confirmed paid yeses: 0 / 3 proof goal.

## Human TODO

- Watch `hello@weddingcounselors.com` for replies and approve any drafted sales response before sending.
- Check Stripe for new Founding Listing payments; payment-confirmation replies should be matched against Stripe before marking paid.
- Around June 25, 2026, apply the decision rule: 3 or more paying providers means continue; fewer means revise or stop.
- If a provider declines or asks to be removed, remove them from outreach and decide whether to roll their profile back using `scripts/email/_warm10_backup.json`.
