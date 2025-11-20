# Email Warm-Up Strategy - Avoid Spam Filters

## ⚠️ CRITICAL: Don't Send 133 Emails on Day 1!

Based on 2025 email deliverability best practices, sending 133 emails from a domain on day 1 will:
- ❌ Trigger spam filters immediately
- ❌ Damage sender reputation
- ❌ Land in spam folders
- ❌ Get domain blacklisted

## ✅ Safe Warm-Up Schedule (4 Weeks)

### Week 1: Build Foundation
- **Day 1-2:** 20 emails/day
- **Day 3-4:** 30 emails/day
- **Day 5-7:** 40 emails/day

### Week 2: Gradual Increase
- **Day 8-10:** 50 emails/day
- **Day 11-14:** 60 emails/day

### Week 3: Scale Up
- **Day 15-17:** 70 emails/day
- **Day 18-21:** 80 emails/day

### Week 4: Full Capacity
- **Day 22+:** 100 emails/day (sustainable)

## Key Rules:

1. **Never increase by more than 20% per day**
2. **Monitor bounce rate (keep below 4%)**
3. **Monitor spam rate (keep below 0.08%)**
4. **Space emails throughout the day (not all at once)**
5. **Focus on engagement in first week**

## For Your 133 Profiles:

With this schedule:
- Week 1: ~210 emails sent (20+20+30+30+40+40+40)
- Week 2: ~390 emails sent
- **All 133 profiles contacted within 7-10 days safely**

## Updated Daily Limits:

```python
# Safe daily limits based on warm-up stage
DAILY_LIMITS = {
    "day_1_2": 20,    # Start slow
    "day_3_4": 30,    # Small increase
    "day_5_7": 40,    # Building trust
    "day_8_10": 50,   # Week 2 start
    "day_11_14": 60,  # Increasing
    "day_15_17": 70,  # Week 3
    "day_18_21": 80,  # Almost there
    "day_22+": 100    # Sustainable full capacity
}
```

## Why This Matters:

**Resend's Official Guidance:**
- "Progressively increase sending volume"
- "Send at consistent rate, avoid spikes"
- "Bounce rate must stay below 4%"
- "Spam rate must stay below 0.08%"

**Industry Standards (2025):**
- New domains: Start with 20-50 emails/day
- Never increase by more than 20% in single day
- 4-8 week warm-up period recommended
- Quality over quantity in first weeks

## Benefits of Gradual Approach:

✅ Better deliverability (inbox vs spam)
✅ Higher open rates
✅ Better sender reputation
✅ Sustainable long-term
✅ No risk of blacklisting

## Implementation:

I'll update `auto_send_emails.py` to:
1. Check how many emails sent today
2. Apply daily limit based on warm-up stage
3. Space emails throughout the day
4. Track daily progress in database

**Result:** Safe, sustainable outreach that actually reaches inboxes! 📧
