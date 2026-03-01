#!/usr/bin/env node

/**
 * Add internal links to blog posts that are missing them.
 *
 * For each post, determines the relevant city/specialty/discount pages
 * and appends a contextual internal links section at the end of the post content.
 *
 * Run with: node scripts/seo/add-internal-links.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const DRY_RUN = process.argv.includes('--dry-run')

// Define which links each post should have.
// key = post slug, value = array of { url, text } links to append.
const LINK_MAP = {
  // === ZERO-LINK POSTS — highest priority ===

  '5-common-myths-about-premarital-counseling-debunked': [
    { url: '/premarital-counseling', text: 'Browse premarital counselors near you' },
    { url: '/premarital-counseling/online', text: 'Online premarital counseling options' },
    { url: '/premarital-counseling/marriage-license-discount', text: 'States that discount your marriage license fee' },
  ],
  'financial-questions-to-ask-before-marriage': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/premarital-counseling/affordable', text: 'Affordable premarital counseling options' },
    { url: '/premarital-counseling/marriage-license-discount', text: 'Save on your marriage license with premarital counseling' },
  ],
  'fighting-about-wedding-planning': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/premarital-counseling/online', text: 'Online couples counseling' },
    { url: '/premarital-counseling/gottman', text: 'Gottman method premarital counseling' },
  ],
  'setting-healthy-boundaries-with-inlaws': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/premarital-counseling/christian', text: 'Christian premarital counseling' },
    { url: '/premarital-counseling/second-marriages', text: 'Premarital counseling for second marriages' },
  ],
  'how-long-does-premarital-counseling-take': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/premarital-counseling/online', text: 'Online premarital counseling' },
    { url: '/blog/premarital-counseling-cost', text: 'How much does premarital counseling cost?' },
  ],
  'is-premarital-counseling-worth-it': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/premarital-counseling/marriage-license-discount', text: 'States that discount your marriage license' },
    { url: '/blog/premarital-counseling-cost', text: 'How much does premarital counseling cost?' },
  ],
  'what-to-expect-first-premarital-counseling-session': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/blog/how-to-choose-premarital-counselor', text: 'How to choose a premarital counselor' },
    { url: '/premarital-counseling/prepare-enrich', text: 'PREPARE/ENRICH premarital counseling' },
  ],
  'how-to-find-a-marriage-counselor': [
    { url: '/premarital-counseling', text: 'Browse premarital counselors by location' },
    { url: '/premarital-counseling/christian', text: 'Christian marriage counselors' },
    { url: '/premarital-counseling/gottman', text: 'Gottman-certified therapists' },
    { url: '/premarital-counseling/online', text: 'Online marriage counseling' },
  ],
  'premarital-counseling-questions-pastor': [
    { url: '/premarital-counseling/christian', text: 'Find Christian premarital counselors' },
    { url: '/blog/premarital-counseling-with-pastor', text: 'How premarital counseling with a pastor works' },
    { url: '/blog/church-premarital-counseling-by-denomination', text: 'Church premarital counseling by denomination' },
  ],
  'church-premarital-counseling-by-denomination': [
    { url: '/premarital-counseling/christian', text: 'Find Christian premarital counselors' },
    { url: '/premarital-counseling/catholic', text: 'Catholic Pre-Cana programs' },
    { url: '/premarital-counseling/interfaith', text: 'Interfaith premarital counseling' },
  ],
  'premarital-counseling-exercises-at-home': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/premarital-counseling/online', text: 'Online premarital counseling' },
    { url: '/blog/best-premarital-counseling-books', text: 'Best premarital counseling books' },
  ],
  'best-premarital-counseling-books': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/premarital-counseling/gottman', text: 'Gottman method premarital counseling' },
    { url: '/blog/premarital-counseling-exercises-at-home', text: 'Premarital counseling exercises to try at home' },
  ],
  'pastors-guide-premarital-counseling-program': [
    { url: '/premarital-counseling/christian', text: 'Christian premarital counseling directory' },
    { url: '/blog/premarital-counseling-curriculum-comparison', text: 'Compare premarital counseling curricula' },
    { url: '/for-churches', text: 'Partner with Wedding Counselors for your church' },
  ],
  'premarital-counseling-curriculum-comparison': [
    { url: '/premarital-counseling/prepare-enrich', text: 'PREPARE/ENRICH counselors' },
    { url: '/premarital-counseling/gottman', text: 'Gottman method counselors' },
    { url: '/blog/prepare-enrich-vs-gottman-vs-symbis', text: 'PREPARE/ENRICH vs Gottman vs SYMBIS comparison' },
  ],
  'what-divorced-couples-wish-discussed-before-marriage': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
    { url: '/premarital-counseling/second-marriages', text: 'Premarital counseling for second marriages' },
    { url: '/blog/is-premarital-counseling-worth-it', text: 'Is premarital counseling worth it?' },
  ],

  // === POSTS WITH SOME LINKS BUT MISSING KEY ONES ===

  // City-specific posts — ensure they link to their city page
  'premarital-counseling-phoenix': [
    { url: '/premarital-counseling/arizona/phoenix', text: 'Browse premarital counselors in Phoenix' },
  ],
  'premarital-counseling-raleigh-nc': [
    { url: '/premarital-counseling/north-carolina/raleigh', text: 'Browse premarital counselors in Raleigh' },
  ],
  'premarital-counseling-nashville': [
    { url: '/premarital-counseling/tennessee/nashville', text: 'Browse premarital counselors in Nashville' },
  ],
  'premarital-counseling-detroit': [
    { url: '/premarital-counseling/michigan/detroit', text: 'Browse premarital counselors in Detroit' },
  ],
  'premarital-counseling-chicago': [
    { url: '/premarital-counseling/illinois/chicago', text: 'Browse premarital counselors in Chicago' },
  ],

  // Specialty posts — ensure they link to specialty pages
  'christian-vs-secular-premarital-counseling': [
    { url: '/premarital-counseling/christian', text: 'Browse Christian premarital counselors' },
    { url: '/premarital-counseling/gottman', text: 'Gottman-certified therapists near you' },
  ],
  'how-to-find-gottman-certified-therapist': [
    { url: '/premarital-counseling/gottman', text: 'Browse Gottman-certified therapists' },
  ],
  'catholic-marriage-counseling': [
    { url: '/premarital-counseling/catholic', text: 'Find Catholic Pre-Cana programs near you' },
  ],
  'premarital-counseling-second-marriages': [
    { url: '/premarital-counseling/second-marriages', text: 'Browse counselors for second marriages' },
  ],
  'online-vs-in-person-premarital-counseling': [
    { url: '/premarital-counseling/online', text: 'Browse online premarital counselors' },
  ],

  // Discount posts — ensure they link to discount state pages
  'oklahoma-marriage-license-discount': [
    { url: '/premarital-counseling/marriage-license-discount', text: 'All states with marriage license discounts' },
  ],
  'indiana-marriage-license-discount': [
    { url: '/premarital-counseling/marriage-license-discount', text: 'All states with marriage license discounts' },
  ],

  // Authority posts — add directory links
  'premarital-counseling-statistics': [
    { url: '/premarital-counseling', text: 'Find a premarital counselor near you' },
  ],
}

function buildLinkSection(links) {
  const items = links.map(l => `- [${l.text}](${l.url})`).join('\n')
  return `\n\n---\n\n### Explore More\n\n${items}\n`
}

function postAlreadyHasLink(content, url) {
  return content.includes(url)
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== LIVE RUN ===')
  console.log('')

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, content')
    .eq('status', 'published')

  if (error) {
    console.error('Failed to fetch posts:', error.message)
    process.exit(1)
  }

  let updated = 0
  let skipped = 0

  for (const post of posts) {
    const links = LINK_MAP[post.slug]
    if (!links) {
      continue
    }

    // Filter out links that already exist in the content
    const newLinks = links.filter(l => !postAlreadyHasLink(post.content || '', l.url))
    if (newLinks.length === 0) {
      console.log(`  SKIP  ${post.slug} (all links already present)`)
      skipped++
      continue
    }

    const section = buildLinkSection(newLinks)
    const newContent = (post.content || '') + section

    if (DRY_RUN) {
      console.log(`  WOULD UPDATE  ${post.slug} (+${newLinks.length} links)`)
      newLinks.forEach(l => console.log(`    → ${l.url}`))
    } else {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ content: newContent })
        .eq('id', post.id)

      if (updateError) {
        console.error(`  ERROR  ${post.slug}: ${updateError.message}`)
      } else {
        console.log(`  UPDATED  ${post.slug} (+${newLinks.length} links)`)
        newLinks.forEach(l => console.log(`    → ${l.url}`))
        updated++
      }
    }
  }

  console.log('')
  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}`)
}

main()
