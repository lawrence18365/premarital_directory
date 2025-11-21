#!/usr/bin/env python3
import os
from dotenv import load_dotenv

load_dotenv()

print('Local Environment Check:')
print(f'SUPABASE_URL: {"✅ SET" if os.getenv("SUPABASE_URL") else "❌ MISSING"}')
print(f'SUPABASE_KEY: {"✅ SET" if os.getenv("SUPABASE_KEY") else "❌ MISSING"}')
print(f'SERPER_API_KEY: {"✅ SET" if os.getenv("SERPER_API_KEY") else "❌ MISSING"}')
print(f'RESEND_API_KEY: {"✅ SET" if os.getenv("RESEND_API_KEY") else "❌ MISSING"}')
