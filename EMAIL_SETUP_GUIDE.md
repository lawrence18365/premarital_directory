# Email System Setup Guide - Resend Integration

## Status: ⚠️ Supabase Project Inactive

Your Supabase project `gizoxffsqbyibtkxkytn` is currently **INACTIVE** (paused). You need to activate it first.

---

## Step 1: Activate Your Supabase Project

1. Go to https://supabase.com/dashboard/project/gizoxffsqbyibtkxkytn
2. Click **"Resume Project"** or **"Unpause"**
3. Wait 2-3 minutes for it to fully activate

---

## Step 2: Deploy the Email Edge Function

Once your project is active, run:

```bash
cd /Users/hayleemandarino/Desktop/premarital_directory
supabase functions deploy email-unclaimed-profile-owner --no-verify-jwt --project-ref gizoxffsqbyibtkxkytn
```

**Expected output:**
```
Uploading asset: email-unclaimed-profile-owner
Function deployed successfully
Function URL: https://gizoxffsqbyibtkxkytn.supabase.co/functions/v1/email-unclaimed-profile-owner
```

---

## Step 3: Set Your Resend API Key as a Secret

### Option A: Via Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/gizoxffsqbyibtkxkytn/settings/functions
2. Scroll to **"Secrets"** section
3. Click **"Add New Secret"**
4. Name: `RESEND_API_KEY`
5. Value: `[paste your Resend API key here]`
6. Click **"Save"**

### Option B: Via CLI

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here --project-ref gizoxffsqbyibtkxkytn
```

---

## Step 4: Configure Your Resend Domain

### Get Your Resend API Key:

1. Go to https://resend.com/api-keys
2. Create a new API key (if you haven't already)
3. Copy it to use in Step 3

### Set Up Your Sending Domain:

1. Go to https://resend.com/domains
2. Add domain: `weddingcounselors.com`
3. Add DNS records (provided by Resend) to your domain registrar
4. Verify domain (wait for DNS propagation, usually 15 mins)

**OR use Resend's test domain for now:**
- No setup needed
- Emails will come from `@onboarding.resend.dev`
- Good for testing

---

## Step 5: Update Edge Function Email Sender

If you verify `weddingcounselors.com` in Resend, update the Edge Function:

**File:** `supabase/functions/email-unclaimed-profile-owner/index.ts`

**Change line 167:**
```typescript
// From:
from: 'Wedding Counselors <noreply@weddingcounselors.com>',

// To (if using onboarding domain):
from: 'Wedding Counselors <onboarding@resend.dev>',
```

Then redeploy:
```bash
supabase functions deploy email-unclaimed-profile-owner --no-verify-jwt --project-ref gizoxffsqbyibtkxkytn
```

---

## Step 6: Test the Email System

### Test 1: Send Test Email via Dashboard

1. Go to https://supabase.com/dashboard/project/gizoxffsqbyibtkxkytn/functions/email-unclaimed-profile-owner
2. Click **"Run"**
3. Paste this test payload:

```json
{
  "profileEmail": "your-email@example.com",
  "professionalName": "Test Counselor",
  "coupleName": "John & Jane Test",
  "coupleEmail": "couple@example.com",
  "coupleLocation": "Austin, TX",
  "city": "Austin",
  "state": "Texas",
  "claimUrl": "https://www.weddingcounselors.com/claim-profile/test",
  "profileSlug": "test-profile"
}
```

4. Click **"Invoke Function"**
5. Check your email inbox!

### Test 2: Test via Your Website

1. Go to any unclaimed profile on weddingcounselors.com
2. Fill out the contact form as a couple
3. Submit
4. Check the profile owner's email address
5. They should receive the claim notification!

---

## Troubleshooting

### Error: "Cannot retrieve service for project... INACTIVE"
- **Solution:** Unpause your Supabase project (Step 1)

### Error: "Resend API error: 403 Forbidden"
- **Solution:** Your API key is invalid
- **Fix:** Generate new key at https://resend.com/api-keys
- **Update:** Secret in Supabase dashboard

### Error: "Email not delivered"
- **Check 1:** Resend dashboard → Logs → See delivery status
- **Check 2:** Verify sender domain or use `@resend.dev`
- **Check 3:** Check spam folder

### Edge Function not found
- **Solution:** Make sure you deployed it: `supabase functions deploy email-unclaimed-profile-owner`

---

## Verification Checklist

- [ ] Supabase project is ACTIVE (not paused)
- [ ] Edge Function deployed successfully
- [ ] `RESEND_API_KEY` secret set in Supabase
- [ ] Resend account created at https://resend.com
- [ ] Test email sent successfully
- [ ] Email appears in inbox (not spam)
- [ ] Contact form on website triggers email

---

## Next Steps After Email Works

1. **Monitor Resend Dashboard**
   - Track deliveries, opens, clicks
   - View: https://resend.com/emails

2. **Set Up Domain (Optional)**
   - Verify `weddingcounselors.com` in Resend
   - Update Edge Function sender address
   - Redeploy function

3. **Add Email Templates**
   - Create branded HTML templates
   - Add your logo
   - Customize copy

4. **Track Conversions**
   - UTM parameters already in claim links
   - Monitor in Google Analytics
   - Track: `utm_source=email&utm_medium=lead_intercept`

---

## Quick Commands Reference

```bash
# Deploy Edge Function
supabase functions deploy email-unclaimed-profile-owner --no-verify-jwt --project-ref gizoxffsqbyibtkxkytn

# Set API Key Secret
supabase secrets set RESEND_API_KEY=your_key_here --project-ref gizoxffsqbyibtkxkytn

# Test locally (requires Docker)
supabase functions serve email-unclaimed-profile-owner

# View function logs
supabase functions logs email-unclaimed-profile-owner --project-ref gizoxffsqbyibtkxkytn
```

---

**Questions?** Check:
- Resend Docs: https://resend.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Edge Function code: `supabase/functions/email-unclaimed-profile-owner/index.ts`
