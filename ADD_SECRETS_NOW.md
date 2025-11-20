# ⚠️ ACTION REQUIRED: Add GitHub Secrets

## Step 1: Go to GitHub Secrets Page

Click this link to go directly to your secrets page:
👉 **https://github.com/lawrence18365/premarital_directory/settings/secrets/actions**

## Step 2: Add These 4 Secrets

For each secret below:
1. Click **"New repository secret"**
2. Copy the **Name** (exactly as shown)
3. Copy the **Value** (from your .env file)
4. Click **"Add secret"**

---

### Secret #1: SUPABASE_URL
```
Name: SUPABASE_URL
Value: https://bkjwctlolhoxhnoospwp.supabase.co
```

### Secret #2: SUPABASE_KEY
```
Name: SUPABASE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrandjdGxvbGhveGhub29zcHdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTYwNjIzMywiZXhwIjoyMDY1MTgyMjMzfQ.-5-ZNV82kSnrvbkMErIxXB2ibj6LV_jRHuhM9jzAcNc
```

### Secret #3: SERPER_API_KEY
```
Name: SERPER_API_KEY
Value: 243b861f0a2ec04e171bc1f557b55645d78f913c
```

### Secret #4: RESEND_API_KEY ⭐ **CRITICAL**
```
Name: RESEND_API_KEY
Value: re_hmxthwbV_MRAvW2mvgtZgnMVYDQmQ9jiP
```

---

## Step 3: Verify Secrets Are Added

After adding all 4 secrets, you should see them listed on the secrets page:
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY
- ✅ SERPER_API_KEY
- ✅ RESEND_API_KEY

---

## Step 4: Test the Workflow

Once secrets are added:

1. **Go to Actions tab:**
   👉 https://github.com/lawrence18365/premarital_directory/actions

2. **Find "Daily Automated Outreach" workflow**

3. **Click "Run workflow" (dropdown button on the right)**

4. **Click the green "Run workflow" button**

5. **Watch it run!**
   - It will install dependencies
   - Find new emails (optional)
   - Send emails to all ready_to_email profiles (133 emails!)
   - Update database status

---

## What Happens Next:

### Immediate (Within 5 minutes):
- ✅ Workflow runs and sends emails
- ✅ Database updated with "contacted" status
- ✅ You can see results in Actions log

### Within 6-24 hours:
- 📧 13-27 email responses expected
- 💬 Check haylee@weddingcounselors.com
- 📊 4-13 signups expected

### Every Day at 9 AM UTC:
- 🤖 Workflow runs automatically
- 🔍 Finds new emails
- 📤 Sends to all ready_to_email profiles
- ♻️ Repeats daily

---

## Current Status:

✅ Code updated and pushed to GitHub
✅ Test email sent successfully (Resend ID: 0e349dbe-9676-48e1-8d2b-8af08d29be61)
✅ 133 profiles ready to email
✅ Workflow configured to run daily

⚠️ **NEXT:** Add the 4 secrets to GitHub (takes 2 minutes)
🚀 **THEN:** Run the workflow and watch emails go out!

---

## Need Help?

If the workflow fails:
1. Check the Actions log for error messages
2. Verify all 4 secrets are added correctly
3. Names must match exactly (case-sensitive)
4. Values must be complete (no extra spaces)

**You're one step away from fully automated outreach!** 🎉
