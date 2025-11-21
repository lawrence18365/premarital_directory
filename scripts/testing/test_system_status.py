#!/usr/bin/env python3
"""Check system status before sending emails"""

from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

print('='*70)
print('SYSTEM STATUS CHECK')
print('='*70)

# Check environment variables
print('\n1. Environment Variables:')
print(f'   SUPABASE_URL: {"✅ SET" if os.getenv("SUPABASE_URL") else "❌ MISSING"}')
print(f'   SUPABASE_KEY: {"✅ SET" if os.getenv("SUPABASE_KEY") else "❌ MISSING"}')
print(f'   SERPER_API_KEY: {"✅ SET" if os.getenv("SERPER_API_KEY") else "❌ MISSING"}')

# Check Supabase connection
print('\n2. Database Connection:')
try:
    client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

    # Count profiles by status
    ready = client.table('profiles').select('id', count='exact').eq('status', 'ready_to_email').execute()
    contacted = client.table('profiles').select('id', count='exact').eq('status', 'contacted').execute()
    all_profiles = client.table('profiles').select('id', count='exact').execute()

    print(f'   ✅ Connected to Supabase')
    print(f'\n3. Profile Counts:')
    print(f'   Total profiles: {all_profiles.count}')
    print(f'   Ready to email: {ready.count}')
    print(f'   Already contacted: {contacted.count}')

    # Get sample profile
    if ready.count > 0:
        sample = client.table('profiles').select('*').eq('status', 'ready_to_email').limit(1).execute()
        if sample.data:
            p = sample.data[0]
            print(f'\n4. Sample Profile (ready to email):')
            print(f'   Name: {p.get("full_name")}')
            print(f'   Email: {p.get("email")}')
            print(f'   City: {p.get("city")}, {p.get("state_province")}')
            print(f'   Status: {p.get("status")}')
    else:
        print(f'\n⚠️  No profiles with status="ready_to_email"')

    print('\n' + '='*70)
    print('✅ SYSTEM CHECK COMPLETE')
    print('='*70)

except Exception as e:
    print(f'   ❌ Error: {e}')
