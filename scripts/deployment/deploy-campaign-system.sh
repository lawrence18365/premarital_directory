#!/bin/bash

# Deploy Campaign System for WeddingCounselors.com
# This script deploys the automated email campaign system

echo "🚀 Deploying Campaign System for WeddingCounselors.com"
echo "=================================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Running database migration..."
supabase db reset --linked
if [ $? -eq 0 ]; then
    echo "✅ Database migration completed"
else
    echo "❌ Database migration failed"
    exit 1
fi

echo ""
echo "📧 Step 2: Deploying email functions..."

# Deploy profile activation email function
echo "  Deploying send-profile-activation-email..."
supabase functions deploy send-profile-activation-email
if [ $? -eq 0 ]; then
    echo "  ✅ send-profile-activation-email deployed"
else
    echo "  ❌ send-profile-activation-email deployment failed"
    exit 1
fi

# Deploy campaign automation function
echo "  Deploying profile-activation-campaign..."
supabase functions deploy profile-activation-campaign
if [ $? -eq 0 ]; then
    echo "  ✅ profile-activation-campaign deployed"
else
    echo "  ❌ profile-activation-campaign deployment failed"
    exit 1
fi

echo ""
echo "🔑 Step 3: Environment Variables Check"
echo "Please ensure these environment variables are set in your Supabase project:"
echo ""
echo "Required variables:"
echo "  SMTP2GO_API_KEY=your_smtp2go_api_key"
echo "  SMTP2GO_FROM_EMAIL=info@weddingcounselors.com"
echo "  SUPPORT_EMAIL=haylee@weddingcounselors.com"
echo ""
echo "To set these variables:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to Edge Functions > Environment Variables"
echo "3. Add each variable listed above"
echo ""

echo "🧪 Step 4: Testing the campaign system..."
echo ""
echo "To test the campaign system:"
echo "1. Build and deploy your React app"
echo "2. Go to /admin/campaigns in your browser"
echo "3. Enable 'Test Mode' (sends emails to haylee@weddingcounselors.com)"
echo "4. Click 'Send Batch Now' to test"
echo ""

echo "⚙️ Step 5: Setting up automation"
echo ""
echo "To automate the campaign (send emails every hour):"
echo ""
echo "Option A - GitHub Actions:"
echo "Create .github/workflows/email-campaign.yml:"
echo ""
cat << 'EOF'
name: Hourly Email Campaign
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Campaign
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/profile-activation-campaign" \
            -H "x-internal-api-key: ${{ secrets.INTERNAL_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"emailsPerHour": 50, "maxDailyEmails": 500}'
EOF
echo ""
echo "Option B - Vercel Cron:"
echo "Create api/cron/email-campaign.js in your project"
echo ""
echo "Option C - External Cron Service:"
echo "Use a service like cron-job.org to call your campaign endpoint every hour"
echo ""

echo "🎯 Campaign Goals & Recommendations"
echo ""
echo "With 1500+ profiles, recommended settings:"
echo "  • Start with: 25 emails/hour, 200/day"
echo "  • Scale up to: 50 emails/hour, 500/day"
echo "  • Monitor open rates and responses"
echo "  • Expected timeline: 6-12 weeks to contact all profiles"
echo ""

echo "✅ Campaign System Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Supabase"
echo "2. Test the system in admin dashboard"
echo "3. Set up automation with your preferred method"
echo "4. Monitor campaign performance and adjust as needed"
echo ""
echo "Good luck with your launch! 🚀"
