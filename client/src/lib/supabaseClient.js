import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const DIRECTORY_BOT_PATTERNS = [
  'bot',
  'spider',
  'crawler',
  'crawl',
  'googlebot',
  'googleother',
  'adsbot',
  'bingbot',
  'duckduckbot',
  'bytespider',
  'slurp',
  'baiduspider',
  'petalbot',
  'headless',
  'lighthouse',
  'facebookexternalhit',
  'linkedinbot',
  'preview',
  'httpclient',
  'python-requests',
  'curl/',
  'wget/'
]

const toTimestamp = (value) => {
  const parsed = Date.parse(value || '')
  return Number.isNaN(parsed) ? 0 : parsed
}

const hasPricingInfo = (profile) => Boolean(
  profile?.pricing_range ||
  Number(profile?.session_fee_min) > 0 ||
  Number(profile?.session_fee_max) > 0
)

const compareProfilesForCouples = (a, b) => {
  const claimedDelta = Number(Boolean(b?.is_claimed)) - Number(Boolean(a?.is_claimed))
  if (claimedDelta !== 0) return claimedDelta

  const completenessDelta = (Number(b?.profile_completeness_score) || 0) - (Number(a?.profile_completeness_score) || 0)
  if (completenessDelta !== 0) return completenessDelta

  const photoDelta = Number(Boolean(b?.photo_url)) - Number(Boolean(a?.photo_url))
  if (photoDelta !== 0) return photoDelta

  const pricingDelta = Number(hasPricingInfo(b)) - Number(hasPricingInfo(a))
  if (pricingDelta !== 0) return pricingDelta

  const recencyDelta = toTimestamp(b?.created_at) - toTimestamp(a?.created_at)
  if (recencyDelta !== 0) return recencyDelta

  return String(a?.full_name || '').localeCompare(String(b?.full_name || ''))
}

export const rankProfilesForCouples = (profiles = []) => [...profiles].sort(compareProfilesForCouples)

export const isLikelyBotUserAgent = (userAgent = '') => {
  const normalized = String(userAgent || '').toLowerCase()
  if (!normalized) return false
  return DIRECTORY_BOT_PATTERNS.some((pattern) => normalized.includes(pattern))
}

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

    if (error) {
      // Fallback: Use pagination to get all profiles
      return await this.getAllProfilesPaginated(filters)
    }

    let results = data || []

    // Merge profiles from additional locations when filtering by state or city
    if (filters.state || filters.city) {
      const { data: additionalLocs } = await this.getProfileIdsByAdditionalLocation({
        state: filters.state,
        city: filters.city
      })
      if (additionalLocs && additionalLocs.length > 0) {
        const existingIds = new Set(results.map(p => p.id))
        const extraIds = additionalLocs
          .map(loc => loc.profile_id)
          .filter(id => !existingIds.has(id))

        if (extraIds.length > 0) {
          const { data: extraProfiles } = await this.getProfilesByIds([...new Set(extraIds)])
          if (extraProfiles) {
            // Tag each extra profile with the additional location info
            const locMap = {}
            additionalLocs.forEach(loc => {
              if (!locMap[loc.profile_id]) locMap[loc.profile_id] = loc
            })
            extraProfiles.forEach(p => {
              p._isAdditionalLocation = true
              p._additionalLocationCity = locMap[p.id]?.city
              p._additionalLocationState = locMap[p.id]?.state_province
            })
            results = [...results, ...extraProfiles]
          }
        }
      }
    }

    return { data: rankProfilesForCouples(results), error: null }
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

    return { data: rankProfilesForCouples(allProfiles), error: null }
  },

  // Get single profile by ID or slug
  // allowHidden: skip visibility filters (for claim flow, admin, profile owner)
  async getProfile(idOrSlug, { allowHidden = false } = {}) {
    // First try to get by slug
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('slug', idOrSlug)
    if (!allowHidden) {
      query = query.eq('is_hidden', false).or('moderation_status.eq.approved,moderation_status.is.null')
    }
    let { data, error } = await query.single()

    // If not found by slug, try by ID
    if (error && error.code === 'PGRST116') {
      let query2 = supabase
        .from('profiles')
        .select('*')
        .eq('id', idOrSlug)
      if (!allowHidden) {
        query2 = query2.eq('is_hidden', false).or('moderation_status.eq.approved,moderation_status.is.null')
      }
      const result = await query2.single()
      data = result.data
      error = result.error
    }

    return { data, error }
  },

  // Get single profile by slug only
  async getProfileBySlug(slug) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .eq('is_hidden', false)
      .or('moderation_status.eq.approved,moderation_status.is.null')
      .maybeSingle()

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

    let results = data || []

    // Also include profiles with additional locations in this state
    const { data: additionalLocs } = await this.getProfileIdsByAdditionalLocation({ state: stateAbbr })
    if (additionalLocs && additionalLocs.length > 0) {
      const existingIds = new Set(results.map(p => p.id))
      const extraIds = [...new Set(additionalLocs.map(loc => loc.profile_id).filter(id => !existingIds.has(id)))]
      if (extraIds.length > 0) {
        const { data: extraProfiles } = await this.getProfilesByIds(extraIds)
        if (extraProfiles) {
          const locMap = {}
          additionalLocs.forEach(loc => { if (!locMap[loc.profile_id]) locMap[loc.profile_id] = loc })
          extraProfiles.forEach(p => {
            p._isAdditionalLocation = true
            p._additionalLocationCity = locMap[p.id]?.city
            p._additionalLocationState = locMap[p.id]?.state_province
          })
          results = [...results, ...extraProfiles]
        }
      }
    }

    return { data: rankProfilesForCouples(results), error }
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

    let results = data || []

    // Also include profiles with additional locations in this city/state
    const { data: additionalLocs } = await this.getProfileIdsByAdditionalLocation({ state: stateAbbr, city })
    if (additionalLocs && additionalLocs.length > 0) {
      const existingIds = new Set(results.map(p => p.id))
      const extraIds = [...new Set(additionalLocs.map(loc => loc.profile_id).filter(id => !existingIds.has(id)))]
      if (extraIds.length > 0) {
        const { data: extraProfiles } = await this.getProfilesByIds(extraIds)
        if (extraProfiles) {
          const locMap = {}
          additionalLocs.forEach(loc => { if (!locMap[loc.profile_id]) locMap[loc.profile_id] = loc })
          extraProfiles.forEach(p => {
            p._isAdditionalLocation = true
            p._additionalLocationCity = locMap[p.id]?.city
            p._additionalLocationState = locMap[p.id]?.state_province
          })
          results = [...results, ...extraProfiles]
        }
      }
    }

    return { data: rankProfilesForCouples(results), error }
  },

  // Get nearby profiles (same city/state) excluding the current one
  async getNearbyProfiles(stateAbbr, city, excludeProfileId, limit = 4) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('state_province', stateAbbr)
      .ilike('city', `%${city}%`)
      .neq('id', excludeProfileId)
      .eq('is_hidden', false)
      .or('moderation_status.eq.approved,moderation_status.is.null')
      .order('is_sponsored', { ascending: false })
      .order('sponsored_rank', { ascending: false })
      .limit(limit)

    let results = data || []

    // Fill remaining slots from additional locations
    if (results.length < limit) {
      const { data: additionalLocs } = await this.getProfileIdsByAdditionalLocation({ state: stateAbbr, city })
      if (additionalLocs && additionalLocs.length > 0) {
        const existingIds = new Set(results.map(p => p.id))
        existingIds.add(excludeProfileId)
        const extraIds = [...new Set(additionalLocs.map(loc => loc.profile_id).filter(id => !existingIds.has(id)))]
        if (extraIds.length > 0) {
          const remaining = limit - results.length
          const { data: extraProfiles } = await this.getProfilesByIds(extraIds.slice(0, remaining))
          if (extraProfiles) {
            results = [...results, ...extraProfiles]
          }
        }
      }
    }

    return { data: rankProfilesForCouples(results), error }
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

    let results = data || []

    // Also search additional location cities
    const { data: additionalLocs } = await this.getProfileIdsByAdditionalLocation({ city: searchTerm })
    if (additionalLocs && additionalLocs.length > 0) {
      const existingIds = new Set(results.map(p => p.id))
      const extraIds = [...new Set(additionalLocs.map(loc => loc.profile_id).filter(id => !existingIds.has(id)))]
      if (extraIds.length > 0) {
        const { data: extraProfiles } = await this.getProfilesByIds(extraIds)
        if (extraProfiles) {
          results = [...results, ...extraProfiles]
        }
      }
    }

    return { data: rankProfilesForCouples(results), error }
  },

  // Get state statistics
  async getStateStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select('state_province')
      .eq('is_hidden', false)
      .or('moderation_status.eq.approved,moderation_status.is.null')

    if (error) return { data: null, error }

    // Count profiles by state (primary locations)
    const stateCounts = {}
    data.forEach(profile => {
      const state = profile.state_province
      if (state) {
        stateCounts[state] = (stateCounts[state] || 0) + 1
      }
    })

    // Include additional locations
    const { data: additionalLocs } = await supabase
      .from('profile_additional_locations')
      .select('profile_id, state_province')

    if (additionalLocs) {
      // Only count a profile once per state
      const counted = new Set()
      data.forEach(p => {
        if (p.state_province) counted.add(`${p.id}|${p.state_province}`)
      })

      additionalLocs.forEach(loc => {
        const key = `${loc.profile_id}|${loc.state_province}`
        if (!counted.has(key)) {
          counted.add(key)
          stateCounts[loc.state_province] = (stateCounts[loc.state_province] || 0) + 1
        }
      })
    }

    return { data: stateCounts, error: null }
  },

  // Get active state/city coverage for discovery UX
  async getLocationCoverage() {
    const stateCounts = {}
    const cityMap = {}
    const pageSize = 1000
    let page = 0

    while (true) {
      const { data, error } = await supabase
        .from('profiles')
        .select('state_province, city')
        .eq('is_hidden', false)
        .or('moderation_status.eq.approved,moderation_status.is.null')
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        return { data: null, error }
      }

      if (!data || data.length === 0) {
        break
      }

      data.forEach((profile) => {
        const stateAbbr = (profile.state_province || '').trim().toUpperCase()
        const cityName = (profile.city || '').trim()
        if (!stateAbbr) return

        stateCounts[stateAbbr] = (stateCounts[stateAbbr] || 0) + 1
        if (!cityName) return

        const normalizedCity = cityName.toLowerCase().replace(/\s+/g, ' ').trim()
        const citySlug = normalizedCity.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        const key = `${stateAbbr}|${normalizedCity}`

        if (!cityMap[key]) {
          cityMap[key] = {
            stateAbbr,
            cityName,
            citySlug,
            count: 0
          }
        }
        cityMap[key].count += 1
      })

      if (data.length < pageSize) break
      page += 1
    }

    // Include additional locations in coverage
    const { data: additionalLocs } = await supabase
      .from('profile_additional_locations')
      .select('profile_id, city, state_province')

    if (additionalLocs) {
      additionalLocs.forEach((loc) => {
        const stateAbbr = (loc.state_province || '').trim().toUpperCase()
        const cityName = (loc.city || '').trim()
        if (!stateAbbr) return

        stateCounts[stateAbbr] = (stateCounts[stateAbbr] || 0) + 1
        if (!cityName) return

        const normalizedCity = cityName.toLowerCase().replace(/\s+/g, ' ').trim()
        const citySlug = normalizedCity.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        const key = `${stateAbbr}|${normalizedCity}`

        if (!cityMap[key]) {
          cityMap[key] = {
            stateAbbr,
            cityName,
            citySlug,
            count: 0
          }
        }
        cityMap[key].count += 1
      })
    }

    return {
      data: {
        stateCounts,
        cityCounts: Object.values(cityMap)
      },
      error: null
    }
  },

  // --- Additional Locations CRUD ---

  async getAdditionalLocations(profileId) {
    const { data, error } = await supabase
      .from('profile_additional_locations')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true })

    return { data: data || [], error }
  },

  async addAdditionalLocation(profileId, { city, state_province, postal_code }) {
    const { data, error } = await supabase
      .from('profile_additional_locations')
      .insert({ profile_id: profileId, city, state_province, postal_code: postal_code || null })
      .select()
      .single()

    return { data, error }
  },

  async removeAdditionalLocation(locationId) {
    const { error } = await supabase
      .from('profile_additional_locations')
      .delete()
      .eq('id', locationId)

    return { error }
  },

  // --- Additional Location Helpers ---

  // Get profile IDs that have an additional location matching state (and optionally city)
  async getProfileIdsByAdditionalLocation({ state, city }) {
    let query = supabase
      .from('profile_additional_locations')
      .select('profile_id, city, state_province')

    if (state) {
      query = query.eq('state_province', state)
    }
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    const { data, error } = await query
    if (error || !data) return { data: [], error }
    return { data, error: null }
  },

  // Fetch visible profiles by an array of IDs
  async getProfilesByIds(ids) {
    if (!ids || ids.length === 0) return { data: [], error: null }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids)
      .eq('is_hidden', false)
      .or('moderation_status.eq.approved,moderation_status.is.null')

    return { data: rankProfilesForCouples(data || []), error }
  },

  // Check if a visible profile already exists with this email (for signup dedup)
  async checkEmailExists(email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, is_claimed, user_id')
      .ilike('email', email.trim())
      .eq('is_hidden', false)
      .or('moderation_status.eq.approved,moderation_status.is.null')
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
    const { data, error } = await supabase
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
    const userAgent = clickData.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')
    if (isLikelyBotUserAgent(userAgent)) {
      return { data: null, error: null }
    }

    const { data, error } = await supabase
      .from('profile_clicks')
      .insert({
        profile_id: clickData.profileId,
        source_city: clickData.city,
        source_state: clickData.state,
        source_page: clickData.source || 'city_page',
        user_agent: userAgent || null,
        referrer: clickData.referrer || (typeof document !== 'undefined' ? document.referrer : null),
        partner_ref: clickData.partner_ref || null,
        utm_source: clickData.utm_source || null,
        utm_medium: clickData.utm_medium || null,
        utm_campaign: clickData.utm_campaign || null
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
