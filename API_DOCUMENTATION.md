# API Documentation - Premarital Counseling Directory

## Overview

The Premarital Counseling Directory uses Supabase as its backend, providing a PostgreSQL database with real-time capabilities, authentication, and file storage. This document outlines the database schema, API endpoints, and usage patterns.

## Database Schema

### Profiles Table

The `profiles` table is the core entity containing information about premarital counseling professionals.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Core Profile Information
    full_name TEXT NOT NULL,
    email TEXT UNIQUE, -- Can be null initially for scraped profiles
    phone TEXT,
    website TEXT,
    bio TEXT,
    photo_url TEXT,

    -- Professional Details
    profession TEXT, -- e.g., 'Therapist', 'Coach', 'Clergy'
    specialties TEXT[], -- Array of specialties

    -- Location Details
    address_line1 TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,

    -- Monetization and Verification
    is_claimed BOOLEAN DEFAULT false,
    is_sponsored BOOLEAN DEFAULT false,
    sponsored_until TIMESTAMP WITH TIME ZONE,

    -- Foreign key to the auth.users table if the profile is claimed
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### Row Level Security (RLS) Policies

1. **Public Read Access**: All profiles are viewable by everyone
2. **User Profile Creation**: Authenticated users can create their own profile
3. **User Profile Updates**: Users can only update their own claimed profiles

## API Endpoints

All API calls go through Supabase's REST API at: `https://your-project.supabase.co/rest/v1/`

### Authentication Headers

```javascript
const headers = {
  'apikey': 'your_supabase_anon_key',
  'Authorization': 'Bearer your_supabase_anon_key',
  'Content-Type': 'application/json'
}
```

### Get All Profiles

**GET** `/profiles`

Returns all profiles ordered by sponsored status and creation date.

**Query Parameters:**
- `profession=eq.Therapist` - Filter by profession
- `city=ilike.*Austin*` - Filter by city (case-insensitive)
- `is_sponsored=eq.true` - Filter sponsored profiles
- `order=is_sponsored.desc,created_at.desc` - Custom ordering

**Example Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "full_name": "Dr. Sarah Mitchell",
    "profession": "Licensed Therapist",
    "city": "Austin",
    "state_province": "Texas",
    "specialties": ["Communication Skills", "Conflict Resolution"],
    "is_sponsored": true,
    "bio": "Dr. Sarah Mitchell is a licensed marriage and family therapist...",
    "website": "https://sarahmitchelltherapy.com",
    "created_at": "2025-06-10T12:00:00Z"
  }
]
```

### Get Single Profile

**GET** `/profiles?id=eq.{profile_id}`

Returns a specific profile by ID.

### Search Profiles

**GET** `/profiles?or=(full_name.ilike.*{term}*,bio.ilike.*{term}*,city.ilike.*{term}*)`

Searches across name, bio, and city fields.

### Create Profile (Authenticated)

**POST** `/profiles`

Creates a new profile. Requires authentication for claimed profiles.

**Request Body:**
```json
{
  "full_name": "Dr. Jane Smith",
  "profession": "Marriage & Family Therapist",
  "email": "jane@example.com",
  "phone": "(555) 123-4567",
  "city": "Dallas",
  "state_province": "Texas",
  "bio": "Experienced therapist specializing in...",
  "specialties": ["Communication Skills", "EFT"],
  "is_claimed": true,
  "user_id": "user_uuid_from_auth"
}
```

### Update Profile (Authenticated)

**PATCH** `/profiles?id=eq.{profile_id}`

Updates an existing profile. User can only update their own claimed profile.

## JavaScript Client Usage

### Setup

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'your_supabase_url'
const supabaseKey = 'your_supabase_anon_key'
const supabase = createClient(supabaseUrl, supabaseKey)
```

### Get All Profiles with Filtering

```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('profession', 'Therapist')
  .ilike('city', '%Austin%')
  .order('is_sponsored', { ascending: false })
  .order('created_at', { ascending: false })
```

### Search Profiles

```javascript
const searchTerm = 'communication'
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
```

### Create Profile

```javascript
const newProfile = {
  full_name: 'Dr. John Doe',
  profession: 'Licensed Therapist',
  email: 'john@example.com',
  city: 'Houston',
  state_province: 'Texas',
  specialties: ['Gottman Method', 'EFT']
}

const { data, error } = await supabase
  .from('profiles')
  .insert([newProfile])
  .select()
```

### Upload Profile Photo

```javascript
const uploadPhoto = async (file, profileId) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${profileId}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('profile_photos')
    .upload(fileName, file, { upsert: true })
  
  if (error) return { data: null, error }
  
  const { data: { publicUrl } } = supabase.storage
    .from('profile_photos')
    .getPublicUrl(fileName)
  
  return { data: { publicUrl }, error: null }
}
```

## Real-time Subscriptions

Subscribe to profile changes for live updates:

```javascript
const subscription = supabase
  .channel('profiles_channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'profiles' },
    (payload) => {
      console.log('Profile changed:', payload)
      // Update your UI accordingly
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

## Error Handling

```javascript
const handleSupabaseError = (error) => {
  if (error?.code === 'PGRST116') {
    return 'No profiles found matching your criteria'
  } else if (error?.code === '23505') {
    return 'A profile with this email already exists'
  } else if (error?.message) {
    return error.message
  } else {
    return 'An unexpected error occurred'
  }
}
```

## Data Validation

### Client-side Validation

```javascript
const validateProfile = (profile) => {
  const errors = {}
  
  if (!profile.full_name?.trim()) {
    errors.full_name = 'Full name is required'
  }
  
  if (!profile.profession?.trim()) {
    errors.profession = 'Profession is required'
  }
  
  if (!profile.city?.trim()) {
    errors.city = 'City is required'
  }
  
  if (profile.email && !isValidEmail(profile.email)) {
    errors.email = 'Invalid email format'
  }
  
  return Object.keys(errors).length > 0 ? errors : null
}

const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}
```

## Rate Limiting and Best Practices

1. **Batch Operations**: Use bulk inserts for multiple profiles
2. **Pagination**: Use `limit()` and `range()` for large datasets
3. **Caching**: Cache frequently accessed data on the client
4. **Optimistic Updates**: Update UI immediately, rollback on error

```javascript
// Pagination example
const getProfilesPage = async (page = 0, pageSize = 20) => {
  const start = page * pageSize
  const end = start + pageSize - 1
  
  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .range(start, end)
    .order('is_sponsored', { ascending: false })
  
  return {
    data,
    error,
    pagination: {
      page,
      pageSize,
      total: count,
      hasMore: end < count
    }
  }
}
```

## Security Considerations

1. **RLS Policies**: Ensure proper Row Level Security is enabled
2. **Input Sanitization**: Always validate and sanitize user inputs
3. **API Keys**: Never expose service role keys in client code
4. **HTTPS Only**: Always use HTTPS in production
5. **CORS**: Configure proper CORS settings in Supabase

## Performance Optimization

1. **Indexes**: Add database indexes for frequently queried columns
2. **Select Specific Fields**: Don't use `select('*')` unnecessarily
3. **Connection Pooling**: Supabase handles this automatically
4. **CDN**: Use Supabase's built-in CDN for file storage

```sql
-- Recommended indexes for better performance
CREATE INDEX idx_profiles_profession ON profiles(profession);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_state ON profiles(state_province);
CREATE INDEX idx_profiles_sponsored ON profiles(is_sponsored);
CREATE INDEX idx_profiles_specialties ON profiles USING GIN (specialties);
```
