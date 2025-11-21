#!/usr/bin/env python3
"""
Pre-push verification - Make sure everything is ready for GitHub deployment
"""

import os
import sys

print("=" * 70)
print("🔍 PRE-PUSH VERIFICATION")
print("=" * 70)

errors = []
warnings = []

# Check 1: .env file exists (should NOT be pushed)
print("\n1. Checking .env file...")
if os.path.exists(".env"):
    print("   ✅ .env file exists locally")

    # Check .gitignore
    if os.path.exists(".gitignore"):
        with open(".gitignore", "r") as f:
            gitignore = f.read()
            if ".env" in gitignore:
                print("   ✅ .env is in .gitignore (won't be pushed)")
            else:
                errors.append(".env is NOT in .gitignore - WILL BE PUSHED! Add it now!")
    else:
        warnings.append(".gitignore doesn't exist - create one with .env in it")
else:
    errors.append(".env file not found - system won't work locally")

# Check 2: Critical files exist
print("\n2. Checking critical files...")
critical_files = [
    "enrichment_engine.py",
    "supabase_outreach_campaign.py",
    "review_emails.py",
    ".github/workflows/daily_enrichment.yml"
]

for file in critical_files:
    if os.path.exists(file):
        print(f"   ✅ {file}")
    else:
        errors.append(f"Missing critical file: {file}")

# Check 3: Workflow file is correct
print("\n3. Checking GitHub Actions workflow...")
workflow_path = ".github/workflows/daily_enrichment.yml"
if os.path.exists(workflow_path):
    with open(workflow_path, "r") as f:
        workflow = f.read()

        if "python-dotenv" in workflow:
            print("   ✅ python-dotenv in dependencies")
        else:
            errors.append("Workflow missing python-dotenv - will crash!")

        if "secrets.SUPABASE_URL" in workflow:
            print("   ✅ Uses GitHub secrets")
        else:
            errors.append("Workflow not using secrets - will fail!")

        if "enrichment_engine.py" in workflow:
            print("   ✅ Runs enrichment_engine.py")
        else:
            errors.append("Workflow not running enrichment script!")

# Check 4: Required Python packages
print("\n4. Checking Python dependencies...")
try:
    import requests
    print("   ✅ requests installed")
except ImportError:
    warnings.append("requests not installed locally (but OK for GitHub)")

try:
    from supabase import create_client
    print("   ✅ supabase installed")
except ImportError:
    errors.append("supabase not installed - install: pip install supabase")

try:
    from dotenv import load_dotenv
    print("   ✅ python-dotenv installed")
except ImportError:
    warnings.append("python-dotenv not installed locally (but OK for GitHub)")

# Check 5: Secrets documented
print("\n5. Checking secrets documentation...")
deploy_guide = "DEPLOY_TO_GITHUB.md"
if os.path.exists(deploy_guide):
    print(f"   ✅ {deploy_guide} exists")
    with open(deploy_guide, "r") as f:
        content = f.read()
        required_secrets = ["SUPABASE_URL", "SUPABASE_KEY", "SERPER_API_KEY"]
        for secret in required_secrets:
            if secret in content:
                print(f"   ✅ {secret} documented")
            else:
                warnings.append(f"{secret} not documented in deploy guide")
else:
    warnings.append(f"{deploy_guide} not found")

# Check 6: Git status
print("\n6. Checking git status...")
import subprocess
result = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
untracked = [line for line in result.stdout.split('\n') if line.startswith('??')]

if untracked:
    print(f"   ⚠️  {len(untracked)} untracked files (need 'git add')")
else:
    print("   ✅ All files tracked")

# Summary
print("\n" + "=" * 70)
print("📋 VERIFICATION SUMMARY")
print("=" * 70)

if errors:
    print("\n❌ ERRORS (Must fix before pushing):")
    for i, error in enumerate(errors, 1):
        print(f"   {i}. {error}")

if warnings:
    print("\n⚠️  WARNINGS (Review but OK to push):")
    for i, warning in enumerate(warnings, 1):
        print(f"   {i}. {warning}")

if not errors and not warnings:
    print("\n🎉 ALL CHECKS PASSED!")
    print("\n✅ Ready to push to GitHub!")
    print("\nNext steps:")
    print("   1. Add GitHub secrets (see DEPLOY_TO_GITHUB.md)")
    print("   2. git add .")
    print("   3. git commit -m 'feat: Add automated email enrichment'")
    print("   4. git push origin main")
elif not errors:
    print("\n✅ READY TO PUSH (warnings are OK)")
    print("\nNext steps:")
    print("   1. Review warnings above")
    print("   2. Add GitHub secrets (see DEPLOY_TO_GITHUB.md)")
    print("   3. git add .")
    print("   4. git commit -m 'feat: Add automated email enrichment'")
    print("   5. git push origin main")
else:
    print("\n❌ NOT READY TO PUSH")
    print("   Fix errors above first!")
    sys.exit(1)

print("=" * 70)
