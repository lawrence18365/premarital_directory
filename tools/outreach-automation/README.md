# Automated Counselor Outreach System

## Overview
Zero-budget growth system to automatically:
1. Find counselors in target cities
2. Create unclaimed profiles for them
3. Send personalized outreach emails
4. Track opens, clicks, and claims
5. Follow up automatically

## Email Limits (Free Tiers)
- SMTP2GO: 1,000/month free
- Resend: 100/day free (3,000/month)
- Gmail: 500/day (but will get flagged for cold outreach)

## Strategy: The Slow Drip
- Send 30 emails/day = 900/month
- At 10% claim rate = 90 new counselors/month
- In 6 months = 540 counselors
- That's a real directory.

## Outreach Sequence
1. Day 0: Initial "you're listed" email
2. Day 3: "Someone viewed your profile" (if true)
3. Day 7: "Quick question" follow-up
4. Day 14: Final "just checking" email

## Files
- `scrape-counselors.js` - Find counselors from Psychology Today
- `create-unclaimed-profiles.js` - Batch create profiles
- `send-outreach.js` - Email automation
- `track-engagement.js` - Monitor opens/clicks
