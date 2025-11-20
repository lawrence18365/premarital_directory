#!/bin/bash
# Script to help set up GitHub secrets
# This script will show you the values from your .env file
# You need to manually add them to GitHub Settings → Secrets

echo "======================================================================"
echo "GITHUB SECRETS SETUP HELPER"
echo "======================================================================"
echo ""
echo "You need to add these secrets to your GitHub repository:"
echo "Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "======================================================================"
echo ""

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Make sure you're in the project directory"
    exit 1
fi

# Load .env file
source .env

echo "1️⃣  SUPABASE_URL"
echo "   Value: ${SUPABASE_URL:-NOT SET}"
echo ""

echo "2️⃣  SUPABASE_KEY"
echo "   Value: ${SUPABASE_KEY:-NOT SET}"
echo ""

echo "3️⃣  SERPER_API_KEY"
echo "   Value: ${SERPER_API_KEY:-NOT SET}"
echo ""

echo "4️⃣  RESEND_API_KEY ⭐ REQUIRED FOR EMAILS"
echo "   Value: ${RESEND_API_KEY:-NOT SET}"
echo ""

echo "======================================================================"
echo "HOW TO ADD THESE SECRETS:"
echo "======================================================================"
echo "1. Go to your GitHub repository"
echo "2. Click: Settings → Secrets and variables → Actions"
echo "3. Click: New repository secret"
echo "4. Add each secret above (name and value)"
echo "5. Come back and run the workflow!"
echo ""
echo "======================================================================"
echo "AFTER ADDING SECRETS, TEST WITH:"
echo "======================================================================"
echo "Go to: Actions tab → Daily Automated Outreach → Run workflow"
echo ""
