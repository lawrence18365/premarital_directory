# 🚀 Deploy to GitHub - Make It Run Automatically

**CRITICAL:** Your system won't run automatically until you complete these 3 steps!

---

## ❌ Why It Won't Work Yet

1. **Missing Keys:** GitHub doesn't have your API credentials
2. **Missing Dependency:** Workflow missing `python-dotenv`
3. **Code Not Pushed:** Scripts are on your laptop, not GitHub

## ✅ Let's Fix It (10 Minutes)

---

## Step 1: Add Secrets to GitHub (5 minutes)

### A. Get Your Keys

Your keys are in `.env` file:

```bash
# View your keys
cat .env
```

You'll see:
```
SUPABASE_URL=https://bkjwctlolhoxhnoospwp.supabase.co
SUPABASE_KEY=eyJhbG... [long key]
SERPER_API_KEY=243b861f...
```

### B. Add Them to GitHub

1. **Go to your GitHub repo**:
   - https://github.com/YOUR_USERNAME/YOUR_REPO

2. **Click**: `Settings` (top right)

3. **Click**: `Secrets and variables` → `Actions` (left sidebar)

4. **Click**: `New repository secret` (green button)

5. **Add each secret** (one at a time):

   **Secret #1:**
   - Name: `SUPABASE_URL`
   - Value: `https://bkjwctlolhoxhnoospwp.supabase.co`
   - Click "Add secret"

   **Secret #2:**
   - Name: `SUPABASE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key from .env)
   - Click "Add secret"

   **Secret #3:**
   - Name: `SERPER_API_KEY`
   - Value: `243b861f0a2ec04e171bc1f557b55645d78f913c`
   - Click "Add secret"

### C. Verify

You should see 3 secrets listed:
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY
- ✅ SERPER_API_KEY

---

## Step 2: Fix Workflow File (Already Done! ✅)

I already fixed the workflow to include `python-dotenv`. The updated file is:

`.github/workflows/daily_enrichment.yml`

It now includes:
```yaml
run: pip install requests supabase python-dotenv
```

---

## Step 3: Push Code to GitHub (2 minutes)

### A. Check Git Status

```bash
cd /Users/hayleemandarino/Desktop/premarital_directory

# Check what will be committed
git status
```

### B. Add All Files

```bash
git add .
```

### C. Commit Changes

```bash
git commit -m "feat: Add fully automated email enrichment system

- Enrichment engine with 50% hit rate (2.5x improvement)
- Multi-page email scraping (homepage, contact, about)
- Duplicate prevention (triple-locked status workflow)
- Safety valve with manual review
- Database-connected outreach campaign
- GitHub Actions automation for daily enrichment
- Complete documentation and helper scripts"
```

### D. Push to GitHub

```bash
git push origin main
```

If you get an error about branch name, try:
```bash
git push origin master
```

---

## Step 4: Verify It Works (3 minutes)

### A. Check GitHub Actions

1. Go to your repo on GitHub
2. Click the "Actions" tab
3. You should see "Daily Email Hunter" workflow

### B. Test It Manually (Don't Wait Until Tomorrow!)

1. Click on "Daily Email Hunter" workflow
2. Click "Run workflow" button (right side)
3. Click green "Run workflow" button
4. Wait 1-2 minutes
5. Refresh page

You should see:
- ✅ Green checkmark = Success!
- ❌ Red X = Something wrong

### C. If It Fails

Click on the failed run to see logs. Common issues:
- **"Secret not found"** → Add secrets (Step 1)
- **"Module not found"** → Workflow not updated (Step 2)
- **"Permission denied"** → Check repo settings

### D. If It Succeeds

🎉 **YOU'RE LIVE!**

The system will now run automatically:
- **Every day at 8:00 AM UTC**
- Processes 10 profiles
- Finds ~4-5 emails
- Saves to database

---

## 🎯 What Happens Now

### Automated (No Action Needed)
```
Monday 8:00 AM UTC    → Enrichment runs (finds ~5 emails)
Tuesday 8:00 AM UTC   → Enrichment runs (finds ~5 emails)
Wednesday 8:00 AM UTC → Enrichment runs (finds ~5 emails)
Thursday 8:00 AM UTC  → Enrichment runs (finds ~5 emails)
Friday 8:00 AM UTC    → Enrichment runs (finds ~5 emails)
```

**Total by Friday: ~25 emails waiting for you!**

### Your Friday Workflow (10 minutes)
```bash
# 1. Check status
python3 check_status.py

# 2. Review emails
python3 review_emails.py
# Delete bad ones in CSV

# 3. Mark as ready
python3 mark_emails_ready.py

# 4. Send emails
python3 supabase_outreach_campaign.py
# Type "YES"
```

---

## 📊 Monitoring Your Automation

### View GitHub Actions Logs

1. Go to repo → "Actions" tab
2. See all runs (daily at 8 AM UTC)
3. Click any run to see detailed logs
4. Green = success, Red = failed

### Check Database

```bash
# On your laptop anytime
python3 check_status.py
```

Shows real-time status of all profiles.

---

## 🚨 Troubleshooting

### "Secrets not found" Error

**Problem:** GitHub can't access your API keys

**Fix:**
1. Go to Settings → Secrets → Actions
2. Verify all 3 secrets exist:
   - SUPABASE_URL
   - SUPABASE_KEY
   - SERPER_API_KEY
3. If missing, add them (Step 1)

### "ModuleNotFoundError: dotenv"

**Problem:** Workflow not updated

**Fix:**
1. Make sure `.github/workflows/daily_enrichment.yml` has:
   ```yaml
   run: pip install requests supabase python-dotenv
   ```
2. Commit and push again

### "Permission denied to repository"

**Problem:** Git authentication issue

**Fix:**
```bash
# Set up GitHub token or SSH key
# Follow: https://docs.github.com/en/authentication
```

### Workflow Not Running

**Problem:** Cron schedule or workflow disabled

**Fix:**
1. Go to Actions tab
2. Click "Daily Email Hunter"
3. Enable workflow if disabled
4. Manually trigger to test

---

## ✅ Success Checklist

Before you close this guide, verify:

- [ ] Added 3 secrets to GitHub (SUPABASE_URL, SUPABASE_KEY, SERPER_API_KEY)
- [ ] Workflow file includes `python-dotenv`
- [ ] Code pushed to GitHub (`git push origin main`)
- [ ] Manually triggered workflow (green checkmark)
- [ ] Can see new emails in database (`check_status.py`)

If all checked, **YOU'RE FULLY AUTOMATED! 🎉**

---

## 🎉 You're Done!

Your system is now:
- ✅ Running on GitHub's servers
- ✅ Scheduled to run daily at 8 AM UTC
- ✅ Has access to your API keys (securely)
- ✅ Will process 10 profiles per day
- ✅ No laptop needed!

**Next Check-In: Friday morning!**

By then, you'll have ~25 emails waiting to review and send.

Just run:
```bash
python3 check_status.py
python3 review_emails.py
python3 mark_emails_ready.py
python3 supabase_outreach_campaign.py
```

And watch your directory grow! 🚀
