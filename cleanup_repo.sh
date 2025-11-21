#!/bin/bash

# Repository Cleanup Script
# Organizes scattered scripts and removes clutter

echo "🧹 Starting repository cleanup..."
echo ""

# Create organized directory structure
echo "1️⃣ Creating organized directories..."
mkdir -p scripts/outreach
mkdir -p scripts/database
mkdir -p scripts/seo
mkdir -p scripts/testing
mkdir -p docs

echo "  ✅ Directories created"
echo ""

# Move outreach/email scripts
echo "2️⃣ Organizing outreach scripts..."
mv actual-outreach-campaign.py scripts/outreach/ 2>/dev/null
mv auto_send_emails.py scripts/outreach/ 2>/dev/null
mv continuous_reply_forwarding.py scripts/outreach/ 2>/dev/null
mv daily-outreach-script.py scripts/outreach/ 2>/dev/null
mv daily-prospect-pipeline.py scripts/outreach/ 2>/dev/null
mv daily-workflow.py scripts/outreach/ 2>/dev/null
mv enrichment_engine.py scripts/outreach/ 2>/dev/null
mv fix-email-addresses.py scripts/outreach/ 2>/dev/null
mv generate-initial-prospects.py scripts/outreach/ 2>/dev/null
mv mark_emails_ready.py scripts/outreach/ 2>/dev/null
mv monitor-campaign.py scripts/outreach/ 2>/dev/null
mv prospect-finder.py scripts/outreach/ 2>/dev/null
mv reply-monitoring-system.py scripts/outreach/ 2>/dev/null
mv review_emails.py scripts/outreach/ 2>/dev/null
mv run-outreach-report.py scripts/outreach/ 2>/dev/null
mv send_one_test_email.py scripts/outreach/ 2>/dev/null
mv send_test_with_resend.py scripts/outreach/ 2>/dev/null
mv start-warmup.py scripts/outreach/ 2>/dev/null
mv supabase_outreach_campaign.py scripts/outreach/ 2>/dev/null
mv unsubscribe-handler.py scripts/outreach/ 2>/dev/null

echo "  ✅ Outreach scripts moved"
echo ""

# Move database scripts
echo "3️⃣ Organizing database scripts..."
mv ADMIN_RUN_THIS.sql scripts/database/ 2>/dev/null
mv add_status_column.py scripts/database/ 2>/dev/null
mv analyze_db.sql scripts/database/ 2>/dev/null
mv create_seo_table.sql scripts/database/ 2>/dev/null

echo "  ✅ Database scripts moved"
echo ""

# Move SEO scripts
echo "4️⃣ Organizing SEO scripts..."
mv analyze_pages.js scripts/seo/ 2>/dev/null
mv bulk_generate_content.js scripts/seo/ 2>/dev/null
mv generate-sample-seo.js scripts/seo/ 2>/dev/null

echo "  ✅ SEO scripts moved"
echo ""

# Move testing scripts
echo "5️⃣ Organizing testing scripts..."
mv check_env.py scripts/testing/ 2>/dev/null
mv check_status.py scripts/testing/ 2>/dev/null
mv github_workflow_test.py scripts/testing/ 2>/dev/null
mv test_system.py scripts/testing/ 2>/dev/null
mv test_system_status.py scripts/testing/ 2>/dev/null
mv verify_before_push.py scripts/testing/ 2>/dev/null
mv verify_results.py scripts/testing/ 2>/dev/null
mv test_soft404_fixes.sh scripts/testing/ 2>/dev/null

echo "  ✅ Testing scripts moved"
echo ""

# Move documentation
echo "6️⃣ Organizing documentation..."
mv AUTOPILOT_VERIFICATION.md docs/ 2>/dev/null
mv SOFT_404_FIX_IMPLEMENTATION.md docs/ 2>/dev/null

echo "  ✅ Documentation moved"
echo ""

# Move data files to data directory
echo "7️⃣ Organizing data files..."
mkdir -p data
mv actual_campaign_log.csv data/ 2>/dev/null
mv outreach_replies.csv data/ 2>/dev/null
mv prospect-tracking.csv data/ 2>/dev/null
mv reply_forwarding_config.json data/ 2>/dev/null

echo "  ✅ Data files moved"
echo ""

# Clean up config files
echo "8️⃣ Organizing config files..."
mkdir -p config
mv daily_enrichment_CORRECT.yml config/ 2>/dev/null

echo "  ✅ Config files moved"
echo ""

echo "✅ Repository cleanup complete!"
echo ""
echo "New structure:"
echo "  📁 scripts/"
echo "    📁 outreach/ - Email campaign scripts"
echo "    📁 database/ - Database migration/admin scripts"
echo "    📁 seo/ - SEO and content generation scripts"
echo "    📁 testing/ - Test and verification scripts"
echo "  📁 docs/ - Documentation files"
echo "  📁 data/ - CSV and data files"
echo "  📁 config/ - Configuration files"
echo ""
echo "Run 'git status' to review changes"
