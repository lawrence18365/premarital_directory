# SMTP2GO Integration Setup Guide

## Overview
Your premarital directory application is now configured to use SMTP2GO for email delivery with your verified weddingcounselors.com domain.

## Environment Configuration

### 1. Required Environment Variables
Add these to your production environment (Supabase Edge Functions):

```bash
# SMTP2GO Configuration
SMTP2GO_API_KEY=your_smtp2go_api_key_from_dashboard
SMTP2GO_FROM_EMAIL=info@weddingcounselors.com
SUPPORT_EMAIL=haylee@weddingcounselors.com
```

### 2. Verified Email Addresses
Your available verified sender addresses:
- `haylee@weddingcounselors.com` - Set as support email
- `info@weddingcounselors.com` - Set as default sender
- `jessie@weddingcounselors.com`
- `lauren@weddingcounselors.com`
- `samantha@weddingcounselors.com`

## Email Functions

### 1. Lead Notification Emails
**Function:** `send-lead-notification`
- **Purpose:** Sends lead notifications to professionals when couples contact them
- **Sender:** `info@weddingcounselors.com`
- **Recipient:** Professional's email address
- **Reply-to:** Couple's email address

### 2. Contact Form Emails
**Function:** `send-contact-email`
- **Purpose:** Sends contact form submissions to support team
- **Sender:** `info@weddingcounselors.com`
- **Recipient:** `haylee@weddingcounselors.com`
- **Reply-to:** Contact form submitter's email

## Setup Steps

### 1. Get SMTP2GO API Key
1. Log into your SMTP2GO dashboard: https://app.smtp2go.com/
2. Go to Settings > API Keys
3. Create a new API key or copy existing one
4. Copy the API key value

### 2. Configure Supabase Environment
1. Go to your Supabase project dashboard
2. Navigate to Edge Functions > Environment Variables
3. Add the following variables:
   ```
   SMTP2GO_API_KEY = your_actual_api_key
   SMTP2GO_FROM_EMAIL = info@weddingcounselors.com
   SUPPORT_EMAIL = haylee@weddingcounselors.com
   ```

### 3. Deploy Functions
Deploy the updated email functions to Supabase:

```bash
# Deploy lead notification function
supabase functions deploy send-lead-notification

# Deploy contact form function
supabase functions deploy send-contact-email
```

### 4. Test Configuration
Use the included test script:

```bash
# Set environment variables
export SMTP2GO_API_KEY="your_api_key_here"
export SMTP2GO_FROM_EMAIL="info@weddingcounselors.com"
export TEST_EMAIL="haylee@weddingcounselors.com"

# Run test
node test-smtp2go.js
```

## Email Templates

### Lead Notification Template
- **Subject:** `New Premarital Counseling Inquiry from [Couple Name]`
- **Content:** Professional HTML template with couple details and contact information
- **Call-to-action:** Direct reply button and dashboard link

### Contact Form Template
- **Subject:** `[TYPE] [User Subject]`
- **Content:** Contact details, message, and reply options
- **Organization:** Categorized by inquiry type

## Security Features

### 1. API Key Protection
- API key stored securely in Supabase environment variables
- Never exposed in client-side code
- Validated before each API call

### 2. Email Validation
- Required fields validation
- Email format validation
- XSS protection in message content

### 3. Custom Headers
- `X-Lead-Source: Premarital Directory` for lead emails
- `X-Contact-Type: [type]` for contact form emails
- `X-Form-Source: Premarital Directory Contact Form`

## Monitoring and Troubleshooting

### 1. SMTP2GO Dashboard
Monitor email delivery in your SMTP2GO dashboard:
- Delivery statistics
- Bounce rates
- Failed deliveries
- Email logs

### 2. Supabase Logs
Check function logs in Supabase dashboard:
- Edge Functions > Logs
- Filter by function name
- Check for error messages

### 3. Error Handling
Both email functions include:
- Graceful error handling
- Detailed error logging
- Non-blocking failures (application continues even if email fails)

## Production Checklist

- [ ] SMTP2GO API key configured in Supabase
- [ ] Environment variables set correctly
- [ ] Email functions deployed
- [ ] Test emails sent successfully
- [ ] DNS records verified for weddingcounselors.com
- [ ] SMTP2GO sender addresses verified
- [ ] Contact form updated and functional
- [ ] Lead notification system tested

## Support

If you encounter issues:
1. Check Supabase function logs
2. Verify SMTP2GO dashboard for delivery status
3. Ensure all environment variables are set correctly
4. Test with the provided test script

## Cost Optimization

SMTP2GO pricing is based on email volume:
- Monitor usage in SMTP2GO dashboard
- Set up usage alerts if needed
- Consider email frequency limits for high-volume periods