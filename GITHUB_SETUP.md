# GitHub Actions Setup Guide

## Required Secrets

You need to add these secrets to your GitHub repository for the automated outreach to work:

### How to Add Secrets:
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below:

### Secrets Needed:

#### 1. SUPABASE_URL
- **Name:** `SUPABASE_URL`
- **Value:** Your Supabase project URL
- Get it from: https://app.supabase.com → Your Project → Settings → API

#### 2. SUPABASE_KEY
- **Name:** `SUPABASE_KEY`
- **Value:** Your Supabase service role key (or anon key)
- Get it from: https://app.supabase.com → Your Project → Settings → API

#### 3. SERPER_API_KEY
- **Name:** `SERPER_API_KEY`
- **Value:** Your Serper API key for Google searches
- Get it from: https://serper.dev/

#### 4. RESEND_API_KEY ⚠️ **CRITICAL - NEW REQUIREMENT**
- **Name:** `RESEND_API_KEY`
- **Value:** Your Resend API key
- Get it from: https://resend.com/api-keys
- **This is required for sending emails via Resend**

---

## Verify Setup

After adding the secrets, you can verify your GitHub Actions setup:

### Option 1: Check via GitHub UI
1. Go to: **Actions** tab in your repo
2. Look for "Daily Automated Outreach" workflow
3. Click **Run workflow** (dropdown on the right)
4. Click the green **Run workflow** button
5. Watch it run and check for any errors

### Option 2: Check Secrets List
1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. You should see all 4 secrets listed:
   - ✅ SUPABASE_URL
   - ✅ SUPABASE_KEY
   - ✅ SERPER_API_KEY
   - ✅ RESEND_API_KEY

---

## Testing the Workflow

### Test Now (Manual Trigger):
```bash
# Push your changes first
git add .
git commit -m "Update to Resend API for automated outreach"
git push

# Then trigger via GitHub UI:
# 1. Go to Actions tab
# 2. Select "Daily Automated Outreach"
# 3. Click "Run workflow"
# 4. Select "Skip enrichment" if you just want to test email sending
# 5. Click "Run workflow"
```

### Automatic Daily Runs:
- The workflow runs automatically every day at **9 AM UTC** (4 AM EST / 1 AM PST)
- This is the optimal time for B2B emails (recipients see it first thing in morning)
- You can change the schedule in `.github/workflows/daily_enrichment.yml` line 6

---

## What Happens Each Day:

1. **Enrichment (Optional):**
   - Finds new counselor emails
   - Marks them as `ready_to_email`

2. **Automated Sending:**
   - Loads all profiles with `status='ready_to_email'`
   - Sends personalized emails via Resend
   - Updates status to `contacted`
   - Waits 30-90 seconds between emails (natural pattern)

3. **Results:**
   - Check the Actions log for summary
   - Check `haylee@weddingcounselors.com` for replies

---

## Troubleshooting

### Workflow fails with "Secret not found"
- Make sure you've added all 4 secrets in GitHub Settings
- Secret names must match exactly (case-sensitive)

### Workflow fails at "Install dependencies"
- Check that `requirements.txt` includes `resend`
- This should be automatic now

### No emails sent / "No profiles found"
- Run `python3 check_status.py` locally to see profile counts
- Make sure you have profiles with `status='ready_to_email'`
- Run `python3 enrichment_engine.py` locally first to find emails

### Emails not arriving
- Check Resend dashboard: https://resend.com/emails
- Verify `RESEND_API_KEY` is correct in GitHub Secrets
- Check spam folders
- Verify your Resend domain is verified

---

## Current Status

✅ Workflow file updated: `.github/workflows/daily_enrichment.yml`
✅ Auto-send script updated: `auto_send_emails.py` (now uses Resend)
✅ Requirements updated: `requirements.txt` (includes `resend`)
✅ Test email sent successfully locally

**Next Steps:**
1. Add `RESEND_API_KEY` to GitHub Secrets
2. Push changes to GitHub
3. Manually trigger workflow to test
4. Let it run automatically every day

---

## Monitoring

### Check Results:
- **GitHub Actions:** See run history and logs
- **Resend Dashboard:** See sent emails and deliverability
- **Supabase:** Query profiles with `status='contacted'`
- **Email:** Check replies at `haylee@weddingcounselors.com`

### Expected Results (from 133 remaining ready_to_email):
- 13-27 responses (10-20% response rate)
- 4-13 signups (30-50% of responders)
- Peak responses in 6-24 hours after sending

---

**You're all set! The system is ready to run automatically every day at 9 AM UTC** 🚀
