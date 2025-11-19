# 🚀 Wedding Counselors - Automated Email System

**Finds 30 emails/day automatically. Reaches 500 profiles in 3 weeks. Costs $0/month.**

---

## Quick Start

### 1. Add GitHub Secrets (5 mins)

Go to: **GitHub Repo → Settings → Secrets → Actions**

Add these 3:
```
SUPABASE_URL = https://bkjwctlolhoxhnoospwp.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrandjdGxvbGhveGhub29zcHdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTYwNjIzMywiZXhwIjoyMDY1MTgyMjMzfQ.-5-ZNV82kSnrvbkMErIxXB2ibj6LV_jRHuhM9jzAcNc
SERPER_API_KEY = 243b861f0a2ec04e171bc1f557b55645d78f913c
```

### 2. Test It (1 min)

- Go to Actions tab
- Click "Run workflow"
- Wait for green ✅

---

## Weekly Workflow (20 mins every Friday)

```bash
python3 check_status.py           # See ~210 emails
python3 review_emails.py          # Export to CSV
# Delete bad emails in CSV
python3 mark_emails_ready.py      # Mark clean ones
python3 supabase_outreach_campaign.py  # Send batch
```

---

## What It Does

- **Automated:** 75 profiles/day, ~30 emails found
- **Manual:** 20 mins/week to review & send
- **Result:** 500 profiles in 3 weeks
- **Cost:** $0/month

---

**Add secrets → Test → Wait for Friday → Review → Send → Repeat → Hit 500! 🚀**
