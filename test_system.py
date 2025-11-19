#!/usr/bin/env python3
"""
End-to-End Test Script for Wedding Counselors Email System
Tests: Database connection, enrichment engine, and overall health
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SERPER_API_KEY = os.environ.get("SERPER_API_KEY")

def test_env_variables():
    """Test that all required environment variables are set"""
    print("🔍 Testing Environment Variables...")

    required_vars = {
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_KEY": SUPABASE_KEY,
        "SERPER_API_KEY": SERPER_API_KEY
    }

    all_set = True
    for var_name, var_value in required_vars.items():
        if var_value and var_value != "your_supabase_service_role_key":
            print(f"   ✅ {var_name}: Set")
        else:
            print(f"   ❌ {var_name}: Missing or invalid")
            all_set = False

    return all_set

def test_database_connection():
    """Test connection to Supabase database"""
    print("\n🔍 Testing Database Connection...")

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("   ✅ Database client created successfully")

        # Try to query the profiles table
        response = supabase.table('profiles').select("*").limit(1).execute()
        print(f"   ✅ Successfully queried profiles table")
        print(f"   📊 Table exists and is accessible")

        return True, supabase

    except Exception as e:
        print(f"   ❌ Database connection failed: {e}")
        return False, None

def test_database_stats(supabase):
    """Get statistics about the database"""
    print("\n📊 Database Statistics...")

    try:
        # Total profiles
        response = supabase.table('profiles').select("*", count='exact').execute()
        total = response.count
        print(f"   Total profiles: {total}")

        # Profiles without emails
        response = supabase.table('profiles').select("*", count='exact').is_("email", "null").execute()
        no_email = response.count
        print(f"   Profiles without email: {no_email}")

        # Profiles with emails
        response = supabase.table('profiles').select("*", count='exact').not_.is_("email", "null").execute()
        with_email = response.count
        print(f"   Profiles with email: {with_email}")

        # Ready to email
        response = supabase.table('profiles').select("*", count='exact').eq("status", "ready_to_email").execute()
        ready = response.count
        print(f"   Ready to email: {ready}")

        # Show a sample profile without email (for enrichment testing)
        response = supabase.table('profiles').select("*").is_("email", "null").limit(1).execute()
        if response.data:
            sample = response.data[0]
            print(f"\n   📋 Sample profile needing enrichment:")
            print(f"      Name: {sample.get('first_name', 'N/A')} {sample.get('last_name', 'N/A')}")
            print(f"      City: {sample.get('city', 'N/A')}")
            print(f"      State: {sample.get('state', 'N/A')}")
            print(f"      Email: {sample.get('email', 'None')}")
            print(f"      Status: {sample.get('status', 'N/A')}")

        return True

    except Exception as e:
        print(f"   ❌ Error getting stats: {e}")
        return False

def test_serper_api():
    """Test Serper API for Google search"""
    print("\n🔍 Testing Serper API...")

    import requests
    import json

    try:
        url = "https://google.serper.dev/search"
        payload = json.dumps({"q": "test query", "num": 1})
        headers = {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
        }

        response = requests.post(url, headers=headers, data=payload, timeout=10)

        if response.status_code == 200:
            print(f"   ✅ Serper API is working")
            return True
        else:
            print(f"   ❌ Serper API error: Status {response.status_code}")
            return False

    except Exception as e:
        print(f"   ❌ Serper API test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 WEDDING COUNSELORS EMAIL SYSTEM - END-TO-END TEST")
    print("=" * 60)

    # Test 1: Environment variables
    env_ok = test_env_variables()

    if not env_ok:
        print("\n❌ FAILED: Environment variables not properly configured")
        print("   Please check your .env file")
        return False

    # Test 2: Database connection
    db_ok, supabase = test_database_connection()

    if not db_ok:
        print("\n❌ FAILED: Cannot connect to database")
        return False

    # Test 3: Database stats
    stats_ok = test_database_stats(supabase)

    # Test 4: Serper API
    serper_ok = test_serper_api()

    # Final report
    print("\n" + "=" * 60)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"   Environment Variables: {'✅ PASS' if env_ok else '❌ FAIL'}")
    print(f"   Database Connection:   {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"   Database Statistics:   {'✅ PASS' if stats_ok else '❌ FAIL'}")
    print(f"   Serper API:           {'✅ PASS' if serper_ok else '❌ FAIL'}")

    all_pass = env_ok and db_ok and stats_ok and serper_ok

    if all_pass:
        print("\n🎉 ALL TESTS PASSED! System is ready to run.")
        print("\n📝 Next steps:")
        print("   1. Run: python enrichment_engine.py")
        print("      This will find emails for counselors without them")
        print("\n   2. Check database for profiles with status='ready_to_email'")
        print("\n   3. To send emails, you'll need to use actual-outreach-campaign.py")
        print("      (Note: That script uses SMTP, not Resend)")
    else:
        print("\n❌ SOME TESTS FAILED. Please fix the issues above.")

    print("=" * 60)

    return all_pass

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
