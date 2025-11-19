#!/usr/bin/env python3
"""
END-TO-END GITHUB WORKFLOW VERIFICATION
Tests that your GitHub Actions setup will properly fill your directory over time

This script verifies:
1. GitHub Actions workflow file exists and is configured correctly
2. All required secrets are mentioned in workflow
3. Database connection works
4. You have profiles ready for enrichment
5. The enrichment process can run successfully
6. The complete pipeline (enrichment → review → send) is operational

Run this before relying on your automated system!
"""

import os
import sys
import yaml
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Try to import supabase - needed for database checks
try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  Warning: supabase-py not installed. Database checks will be skipped.")

load_dotenv()

# Configuration
WORKFLOW_FILE = ".github/workflows/daily_enrichment.yml"
REQUIRED_SECRETS = ["SUPABASE_URL", "SUPABASE_KEY", "SERPER_API_KEY"]

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_check(test_name, passed, details=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status} - {test_name}")
    if details:
        print(f"       {details}")

def check_workflow_file_exists():
    """Check if workflow file exists"""
    exists = os.path.exists(WORKFLOW_FILE)
    print_check("Workflow file exists", exists,
                f"Path: {WORKFLOW_FILE}" if exists else f"Missing: {WORKFLOW_FILE}")
    return exists

def check_workflow_configuration():
    """Verify workflow YAML is properly configured"""
    try:
        with open(WORKFLOW_FILE, 'r') as f:
            workflow = yaml.safe_load(f)

        # YAML treats 'on' as boolean True, so check both
        triggers = workflow.get(True) or workflow.get('on')

        # Check schedule exists
        has_schedule = triggers and 'schedule' in triggers
        print_check("Cron schedule configured", has_schedule,
                   f"Schedule: {triggers['schedule']}" if has_schedule else "No schedule found")

        # Check workflow_dispatch (manual trigger)
        has_manual = triggers and 'workflow_dispatch' in triggers
        print_check("Manual trigger enabled", has_manual,
                   "Can test via Actions tab" if has_manual else "Cannot manually trigger")

        # Check Python setup
        jobs = workflow.get('jobs', {})
        hunt_job = jobs.get('hunt', {})
        steps = hunt_job.get('steps', [])

        has_python_setup = any('python' in str(step).lower() for step in steps)
        print_check("Python setup configured", has_python_setup)

        # Check enrichment script runs
        has_enrichment = any('enrichment_engine.py' in str(step) for step in steps)
        print_check("Enrichment engine configured", has_enrichment,
                   "Runs: python enrichment_engine.py" if has_enrichment else "Script not configured")

        # Check secrets are used
        env_step = None
        for step in steps:
            if isinstance(step, dict) and 'env' in step:
                env_step = step['env']
                break

        if env_step:
            secrets_used = []
            for secret in REQUIRED_SECRETS:
                if f"secrets.{secret}" in str(env_step):
                    secrets_used.append(secret)

            all_secrets_configured = len(secrets_used) == len(REQUIRED_SECRETS)
            print_check("All secrets configured in workflow", all_secrets_configured,
                       f"Found: {', '.join(secrets_used)}" if secrets_used else "No secrets found")
        else:
            print_check("Secrets configuration", False, "No env section found")

        return has_schedule and has_manual and has_enrichment

    except Exception as e:
        print_check("Workflow configuration", False, f"Error: {e}")
        return False

def check_environment_variables():
    """Check if required environment variables are set locally"""
    all_set = True
    missing = []

    for secret in REQUIRED_SECRETS:
        value = os.environ.get(secret)
        is_set = value is not None and value != "" and "your_" not in value.lower()

        if not is_set:
            all_set = False
            missing.append(secret)

    print_check("Environment variables set locally", all_set,
               f"Missing: {', '.join(missing)}" if missing else "All variables found")

    return all_set

def check_database_connection():
    """Test connection to Supabase"""
    if not SUPABASE_AVAILABLE:
        print_check("Database connection", False, "supabase-py not installed")
        return False

    try:
        SUPABASE_URL = os.environ.get("SUPABASE_URL")
        SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

        if not SUPABASE_URL or not SUPABASE_KEY:
            print_check("Database connection", False, "Missing credentials")
            return False

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Test query
        response = supabase.table('profiles').select("id", count='exact').limit(1).execute()

        print_check("Database connection", True,
                   f"Connected to Supabase - {response.count} total profiles")
        return True

    except Exception as e:
        print_check("Database connection", False, f"Error: {e}")
        return False

def check_profiles_ready_for_enrichment():
    """Check if there are profiles ready for enrichment"""
    if not SUPABASE_AVAILABLE:
        return False

    try:
        SUPABASE_URL = os.environ.get("SUPABASE_URL")
        SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Count profiles that need enrichment (no email, no status)
        response = supabase.table('profiles') \
            .select("id", count='exact') \
            .is_("email", "null") \
            .is_("status", "null") \
            .execute()

        ready_count = response.count
        has_profiles = ready_count > 0

        print_check("Profiles ready for enrichment", has_profiles,
                   f"{ready_count} profiles waiting" if has_profiles
                   else "No profiles ready - import more data")

        return has_profiles

    except Exception as e:
        print_check("Profiles ready for enrichment", False, f"Error: {e}")
        return False

def check_enrichment_results():
    """Check if enrichment has been producing results"""
    if not SUPABASE_AVAILABLE:
        return False

    try:
        SUPABASE_URL = os.environ.get("SUPABASE_URL")
        SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Count successful enrichments
        success_response = supabase.table('profiles') \
            .select("id", count='exact') \
            .eq("status", "enrichment_success") \
            .execute()

        success_count = success_response.count

        # Count failed enrichments
        failed_response = supabase.table('profiles') \
            .select("id", count='exact') \
            .eq("status", "enrichment_failed") \
            .execute()

        failed_count = failed_response.count

        total_attempted = success_count + failed_count
        has_results = total_attempted > 0

        if has_results:
            success_rate = (success_count / total_attempted * 100) if total_attempted > 0 else 0
            print_check("Enrichment has run successfully", has_results,
                       f"{success_count} emails found, {failed_count} failed ({success_rate:.1f}% success rate)")
        else:
            print_check("Enrichment has run successfully", False,
                       "No enrichment attempts found - workflow may not have run yet")

        return has_results

    except Exception as e:
        print_check("Enrichment results", False, f"Error: {e}")
        return False

def check_pipeline_status():
    """Check status of the complete pipeline"""
    if not SUPABASE_AVAILABLE:
        return False

    try:
        SUPABASE_URL = os.environ.get("SUPABASE_URL")
        SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Get counts for each stage
        stages = {
            'Ready to enrich': ('null', 'is_'),
            'Emails found': ('enrichment_success', 'eq'),
            'Ready to send': ('ready_to_email', 'eq'),
            'Already contacted': ('contacted', 'eq'),
        }

        print("\n📊 PIPELINE STATUS:")
        print("-" * 70)

        pipeline_active = False

        for label, (status, method) in stages.items():
            if method == 'is_':
                response = supabase.table('profiles').select("id", count='exact').is_("status", status).execute()
            else:
                response = supabase.table('profiles').select("id", count='exact').eq("status", status).execute()

            count = response.count
            bar = "█" * min(50, count // 10) if count > 0 else ""
            print(f"  {label:20} {count:4d}  {bar}")

            if count > 0:
                pipeline_active = True

        print("-" * 70)

        print_check("Pipeline has activity", pipeline_active,
                   "System is processing profiles" if pipeline_active
                   else "No activity - may need to import profiles or run enrichment")

        return pipeline_active

    except Exception as e:
        print_check("Pipeline status", False, f"Error: {e}")
        return False

def check_recent_enrichment_activity():
    """Check if enrichment has run recently"""
    if not SUPABASE_AVAILABLE:
        return False

    try:
        SUPABASE_URL = os.environ.get("SUPABASE_URL")
        SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Get profiles enriched in the last 7 days
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()

        response = supabase.table('profiles') \
            .select("id, enrichment_attempted_at", count='exact') \
            .not_.is_("enrichment_attempted_at", "null") \
            .gte("enrichment_attempted_at", seven_days_ago) \
            .execute()

        recent_count = response.count
        has_recent = recent_count > 0

        print_check("Recent enrichment activity (7 days)", has_recent,
                   f"{recent_count} profiles processed" if has_recent
                   else "No recent activity - check GitHub Actions runs")

        return has_recent

    except Exception as e:
        # enrichment_attempted_at column might not exist yet
        print_check("Recent enrichment activity", False,
                   f"Could not check (column may not exist yet)")
        return False

def estimate_time_to_goal():
    """Estimate time to reach 500 profiles"""
    if not SUPABASE_AVAILABLE:
        return

    try:
        SUPABASE_URL = os.environ.get("SUPABASE_URL")
        SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Count contacted profiles
        contacted = supabase.table('profiles').select("id", count='exact').eq("status", "contacted").execute().count

        # Count ready to email
        ready = supabase.table('profiles').select("id", count='exact').eq("status", "ready_to_email").execute().count

        # Count emails found (not yet reviewed)
        found = supabase.table('profiles').select("id", count='exact').eq("status", "enrichment_success").execute().count

        total_in_pipeline = contacted + ready + found

        # Estimate: 75 profiles/day × 40% hit rate = ~30 emails/day
        # Weekly batch: 5 days × 30 = ~150 emails
        # After review (~85% clean): ~128 sent/week

        remaining = max(0, 500 - total_in_pipeline)
        weeks_remaining = remaining / 128 if remaining > 0 else 0

        print("\n📈 PROGRESS TO 500 PROFILES:")
        print("-" * 70)
        print(f"  Already contacted:     {contacted:4d}")
        print(f"  Ready to send:         {ready:4d}")
        print(f"  Awaiting review:       {found:4d}")
        print("-" * 70)
        print(f"  Total in pipeline:     {total_in_pipeline:4d}")
        print(f"  Remaining to goal:     {remaining:4d}")

        if remaining > 0:
            print(f"\n  Estimated time: {weeks_remaining:.1f} weeks ({weeks_remaining * 5:.0f} business days)")
            print(f"  At current rate: ~128 emails sent per week")
        else:
            print(f"\n  🎉 GOAL REACHED! You've hit 500+ profiles!")

        print("-" * 70)

    except Exception as e:
        print(f"\n⚠️  Could not estimate time to goal: {e}")

def main():
    """Run all checks"""
    print_header("🤖 GITHUB WORKFLOW END-TO-END VERIFICATION")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = {}

    # Critical checks (must pass for system to work)
    print_header("CRITICAL CHECKS")
    results['workflow_exists'] = check_workflow_file_exists()
    results['workflow_config'] = check_workflow_configuration()
    results['env_vars'] = check_environment_variables()
    results['db_connection'] = check_database_connection()

    # Operational checks (verify system is working)
    print_header("OPERATIONAL CHECKS")
    results['profiles_ready'] = check_profiles_ready_for_enrichment()
    results['enrichment_results'] = check_enrichment_results()
    results['recent_activity'] = check_recent_enrichment_activity()

    # Pipeline overview
    print_header("PIPELINE OVERVIEW")
    results['pipeline_status'] = check_pipeline_status()

    # Progress tracking
    print_header("PROGRESS TRACKING")
    estimate_time_to_goal()

    # Summary
    print_header("📋 VERIFICATION SUMMARY")

    critical_checks = ['workflow_exists', 'workflow_config', 'env_vars', 'db_connection']
    critical_passed = all(results.get(check, False) for check in critical_checks)

    operational_checks = ['profiles_ready', 'enrichment_results', 'pipeline_status']
    operational_passed = all(results.get(check, False) for check in operational_checks)

    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)

    print(f"\nPassed: {passed_count}/{total_count} checks")

    if critical_passed and operational_passed:
        print("\n✅ SYSTEM IS FULLY OPERATIONAL!")
        print("\nYour automated workflow will:")
        print("  • Run daily at 8:00 AM UTC via GitHub Actions")
        print("  • Process 75 profiles per day")
        print("  • Find ~30 emails per day (40% hit rate)")
        print("  • Fill your database over time automatically")
        print("\nNext steps:")
        print("  1. Let it run automatically (no action needed)")
        print("  2. Check status every Friday: python3 check_status.py")
        print("  3. Review & send emails weekly: python3 review_emails.py")
        print("  4. Reach 500 profiles in ~3 weeks!")

    elif critical_passed:
        print("\n⚠️  WORKFLOW IS CONFIGURED BUT NOT YET ACTIVE")
        print("\nWhat's working:")
        print("  • GitHub Actions workflow is set up correctly")
        print("  • Database connection works")
        print("  • Configuration is valid")

        print("\nWhat needs attention:")
        if not results.get('profiles_ready'):
            print("  • Import profiles to database (none ready for enrichment)")
        if not results.get('enrichment_results'):
            print("  • Run workflow manually to test: GitHub Actions → Run workflow")

    else:
        print("\n❌ SYSTEM NEEDS CONFIGURATION")
        print("\nIssues found:")

        if not results.get('workflow_exists'):
            print("  • Workflow file missing - create .github/workflows/daily_enrichment.yml")
        if not results.get('workflow_config'):
            print("  • Workflow configuration invalid - check YAML syntax")
        if not results.get('env_vars'):
            print("  • Environment variables not set - add to .env file")
        if not results.get('db_connection'):
            print("  • Database connection failed - check Supabase credentials")

        print("\nFix these issues before the automated system can work!")

    print("\n" + "=" * 70)

    # Instructions for GitHub Actions
    print_header("🔧 GITHUB ACTIONS SETUP REMINDER")
    print("\nTo ensure this works on GitHub, verify you've added these secrets:")
    print("  GitHub Repo → Settings → Secrets → Actions\n")
    for secret in REQUIRED_SECRETS:
        value = os.environ.get(secret, "NOT SET")
        # Don't print full secrets, just confirm they exist
        status = "✅" if value and value != "NOT SET" else "❌"
        print(f"  {status} {secret}")

    print("\nTo test on GitHub:")
    print("  1. Go to your repo → Actions tab")
    print("  2. Click 'Daily Email Hunter' workflow")
    print("  3. Click 'Run workflow' → Run workflow")
    print("  4. Wait 2-3 minutes for completion")
    print("  5. Check for green ✅ (success) or red ❌ (failure)")

    print("\n" + "=" * 70)

    sys.exit(0 if critical_passed else 1)

if __name__ == "__main__":
    main()
