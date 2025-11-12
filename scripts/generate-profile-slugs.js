/**
 * Generate proper slugs for all profiles
 * Format: firstname-lastname-city-state-number (if duplicate)
 * Example: jami-lacona-west-des-moines-ia
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
)

function generateSlug(name, city, state) {
  const slug = `${name}-${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Multiple hyphens to single
    .replace(/^-|-$/g, '')         // Trim hyphens

  return slug
}

async function generateSlugs() {
  try {
    console.log('🔄 Fetching all profiles...')

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, city, state_province, slug')
      .order('created_at', { ascending: true })

    if (error) throw error

    console.log(`📊 Found ${profiles.length} profiles`)

    const slugs = new Map() // Track duplicates
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const profile of profiles) {
      // Skip if already has a proper slug (not UUID)
      if (profile.slug && !profile.slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
        console.log(`⏭️  Skipping ${profile.full_name} - already has slug: ${profile.slug}`)
        skipped++
        continue
      }

      const city = (profile.city || 'unknown').toLowerCase()
      const state = (profile.state_province || 'unknown').toLowerCase()
      let slug = generateSlug(profile.full_name, city, state)

      // Handle duplicates by appending number
      if (slugs.has(slug)) {
        const count = slugs.get(slug) + 1
        slugs.set(slug, count)
        slug = `${slug}-${count}`
      } else {
        slugs.set(slug, 1)
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ slug })
        .eq('id', profile.id)

      if (updateError) {
        console.error(`❌ Error updating ${profile.full_name}:`, updateError.message)
        errors++
      } else {
        console.log(`✅ Updated ${profile.full_name} → ${slug}`)
        updated++
      }
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Updated: ${updated}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)

  } catch (err) {
    console.error('💥 Fatal error:', err)
    process.exit(1)
  }
}

generateSlugs()
