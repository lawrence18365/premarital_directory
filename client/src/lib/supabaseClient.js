import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations
export const profileOperations = {
  // Get all profiles with optional filtering
  async getProfiles(filters = {}) {
    // Try single query first (should work now with 10k limit)
    let query = supabase
      .from('profiles')
      .select('*')
      .order('sponsored_rank', { ascending: false })
      .order('is_sponsored', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.profession) {
      query = query.eq('profession', filters.profession)
    }
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }
    if (filters.state) {
      query = query.ilike('state_province', `%${filters.state}%`)
    }
    if (filters.specialty) {
      query = query.contains('specialties', [filters.specialty])
    }

    const { data, error } = await query
    
    if (data && data.length > 0) {
      return { data, error }
    }
    
    if (error) {
      // Fallback: Use pagination to get all profiles
      return await this.getAllProfilesPaginated(filters)
    }
    
    return { data, error }
  },

  // Fallback method: Get all profiles using pagination
  async getAllProfilesPaginated(filters = {}) {
    
    let allProfiles = []
    let page = 0
    const pageSize = 1000
    
    while (true) {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('sponsored_rank', { ascending: false })
        .order('is_sponsored', { ascending: false })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      // Apply filters
      if (filters.profession) {
        query = query.eq('profession', filters.profession)
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`)
      }
      if (filters.state) {
        query = query.ilike('state_province', `%${filters.state}%`)
      }
      if (filters.specialty) {
        query = query.contains('specialties', [filters.specialty])
      }

      const { data, error } = await query
      
      if (error) {
        break
      }
      
      if (!data || data.length === 0) {
        break
      }
      
      allProfiles.push(...data)
      
      // If we got less than pageSize, we're done
      if (data.length < pageSize) {
        break
      }
      
      page++
    }
    
    return { data: allProfiles, error: null }
  },

  // Get single profile by ID or slug
  async getProfile(idOrSlug) {
    // First try to get by slug
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', idOrSlug)
      .single()
    
    // If not found by slug, try by ID
    if (error && error.code === 'PGRST116') {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', idOrSlug)
        .single()
      data = result.data
      error = result.error
    }
    
    return { data, error }
  },

  // Get profiles by state
  async getProfilesByState(stateAbbr) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('state_province', stateAbbr)
      .order('sponsored_rank', { ascending: false })
      .order('is_sponsored', { ascending: false })
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Get profiles by state and city
  async getProfilesByStateAndCity(stateAbbr, city) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('state_province', stateAbbr)
      .ilike('city', `%${city}%`)
      .order('sponsored_rank', { ascending: false })
      .order('is_sponsored', { ascending: false })
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Search profiles by text
  async searchProfiles(searchTerm) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .order('sponsored_rank', { ascending: false })
      .order('is_sponsored', { ascending: false })
    
    return { data, error }
  },

  // Get state statistics
  async getStateStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select('state_province')
    
    if (error) return { data: null, error }
    
    // Count profiles by state
    const stateCounts = {}
    data.forEach(profile => {
      const state = profile.state_province
      if (state) {
        stateCounts[state] = (stateCounts[state] || 0) + 1
      }
    })
    
    return { data: stateCounts, error: null }
  },

  // Create new profile
  async createProfile(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    return { data, error }
  },

  // Create a new profile claim
  async createProfileClaim(claimData) {
    const { data, error } = await supabase
      .from('profile_claims')
      .insert(claimData)
      .select()
      .single()
    
    return { data, error }
  },

  // Create or update profile (for claimed profiles)
  async upsertProfile(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
    
    return { data, error }
  },

  // Upload profile photo
  async uploadPhoto(file, profileId) {
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
}

export default supabase