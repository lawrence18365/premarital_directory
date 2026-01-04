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
      .eq('is_hidden', false)  // Filter out hidden profiles
      .or('moderation_status.eq.approved,moderation_status.is.null')  // Only show approved or legacy profiles
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
        .eq('is_hidden', false)  // Filter out hidden profiles
        .or('moderation_status.eq.approved,moderation_status.is.null')  // Only show approved or legacy profiles
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
      .eq('is_hidden', false)  // Filter out hidden profiles
      .or('moderation_status.eq.approved,moderation_status.is.null')  // Only show approved or legacy profiles
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
      .eq('is_hidden', false)  // Filter out hidden profiles
      .or('moderation_status.eq.approved,moderation_status.is.null')  // Only show approved or legacy profiles
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
      .eq('is_hidden', false)
      .or('moderation_status.eq.approved,moderation_status.is.null')
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

  // Check if a profile already exists with this email
  async checkEmailExists(email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    return { exists: !!data, profile: data, error }
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

  // Check for duplicate claims
  async checkDuplicateClaim(profileId, email) {
    const { data, error } = await supabase
      .from('profile_claims')
      .select('id, status, submitted_at')
      .eq('profile_id', profileId)
      .eq('submitted_by_email', email)
      .eq('status', 'pending')

    return { data, error }
  },

  // Get all pending claims (admin only)
  async getPendingClaims() {
    const { data, error } = await supabase
      .from('profile_claims')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })

    return { data, error }
  },

  // Get profiles pending moderation (admin only)
  async getPendingProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false })

    return { data, error }
  },

  // Approve a profile (admin only)
  async approveProfile(profileId) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        moderation_status: 'approved',
        moderation_reviewed_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single()

    return { data, error }
  },

  // Reject a profile (admin only)
  async rejectProfile(profileId, reason) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        moderation_status: 'rejected',
        moderation_reviewed_at: new Date().toISOString(),
        moderation_notes: reason
      })
      .eq('id', profileId)
      .select()
      .single()

    return { data, error }
  },

  // Approve a profile claim
  async approveProfileClaim(claimId, reviewedBy) {
    const { data, error } = await supabase
      .from('profile_claims')
      .update({
        status: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', claimId)
      .select()
      .single()

    return { data, error }
  },

  // Reject a profile claim
  async rejectProfileClaim(claimId, reviewedBy, notes) {
    const { data, error} = await supabase
      .from('profile_claims')
      .update({
        status: 'rejected',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        notes: notes
      })
      .eq('id', claimId)
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

  // Upload profile photo (Cloudflare R2)
  async uploadPhoto(file, profileId) {
    try {
      // 1. Get Presigned URL from our backend
      const { data: uploadConfig, error: configError } = await supabase.functions.invoke('generate-upload-url', {
        body: {
          profileId,
          fileType: file.type
        }
      })

      if (configError) throw configError
      if (!uploadConfig?.uploadUrl) throw new Error('Failed to generate upload URL')

      // 2. Upload directly to Cloudflare R2
      const uploadResponse = await fetch(uploadConfig.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload to storage failed')
      }

      // 3. Return the public URL
      return { 
        data: { 
          publicUrl: uploadConfig.publicUrl 
        }, 
        error: null 
      }

    } catch (error) {
      console.error('Photo upload error:', error)
      return { data: null, error }
    }
  },

  // Log contact reveal for analytics (with city tracking)
  async logContactReveal(revealData) {
    const { data, error } = await supabase
      .from('contact_reveals')
      .insert({
        profile_id: revealData.profile_id,
        reveal_type: revealData.reveal_type,
        ip_address: revealData.ip_address || null,
        user_agent: revealData.user_agent || null,
        session_id: revealData.session_id || null,
        city: revealData.city || null,
        state_province: revealData.state_province || null,
        page_url: revealData.page_url || window.location.href,
        referrer: revealData.referrer || document.referrer || null
      })
      .select()
      .single()

    // Also increment the profile's contact_reveals_count
    if (!error && revealData.profile_id) {
      await supabase.rpc('increment_reveal_count', {
        profile_id: revealData.profile_id
      }).catch(err => {
        console.warn('Failed to increment reveal count:', err)
      })
    }

    return { data, error }
  },

  // Get contact reveals by city (for admin analytics)
  async getContactRevealsByCity() {
    const { data, error } = await supabase
      .from('contact_reveals')
      .select('city, state_province, revealed_at')
      .not('city', 'is', null)
      .order('revealed_at', { ascending: false })

    if (error) return { data: null, error }

    // Aggregate by city
    const cityStats = {}
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    data.forEach(reveal => {
      const key = `${reveal.city}, ${reveal.state_province}`
      if (!cityStats[key]) {
        cityStats[key] = {
          city: reveal.city,
          state: reveal.state_province,
          total: 0,
          last7Days: 0,
          last30Days: 0
        }
      }
      cityStats[key].total++

      const revealDate = new Date(reveal.revealed_at)
      if (revealDate >= sevenDaysAgo) cityStats[key].last7Days++
      if (revealDate >= thirtyDaysAgo) cityStats[key].last30Days++
    })

    const sortedStats = Object.values(cityStats)
      .sort((a, b) => b.total - a.total)

    return { data: sortedStats, error: null }
  }
}

// Profile click tracking operations
export const clickTrackingOperations = {
  // Log a profile click from a city page
  async logProfileClick(clickData) {
    const { data, error } = await supabase
      .from('profile_clicks')
      .insert({
        profile_id: clickData.profileId,
        source_city: clickData.city,
        source_state: clickData.state,
        source_page: clickData.source || 'city_page',
        user_agent: navigator.userAgent || null,
        referrer: document.referrer || null
      })

    return { data, error }
  },

  // Get click stats by city (admin only)
  async getClicksByCity() {
    const { data, error } = await supabase
      .from('profile_clicks')
      .select('source_city, source_state, created_at')

    if (error || !data) {
      return { data: [], error }
    }

    // Aggregate by city
    const cityStats = {}
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    data.forEach(click => {
      const key = `${click.source_city}, ${click.source_state}`
      if (!cityStats[key]) {
        cityStats[key] = {
          city: click.source_city,
          state: click.source_state,
          total: 0,
          last7Days: 0,
          last30Days: 0
        }
      }
      cityStats[key].total++

      const clickDate = new Date(click.created_at)
      if (clickDate >= sevenDaysAgo) cityStats[key].last7Days++
      if (clickDate >= thirtyDaysAgo) cityStats[key].last30Days++
    })

    const sortedStats = Object.values(cityStats)
      .sort((a, b) => b.total - a.total)

    return { data: sortedStats, error: null }
  }
}

// City overrides operations
export const cityOverridesOperations = {
  // Get override content for a city
  async getCityOverride(stateSlug, citySlug) {
    const { data, error } = await supabase
      .from('city_overrides')
      .select('*')
      .eq('state_slug', stateSlug)
      .eq('city_slug', citySlug)
      .single()

    // Not found is not an error, just return null
    if (error?.code === 'PGRST116') {
      return { data: null, error: null }
    }

    return { data, error }
  }
}

export default supabase