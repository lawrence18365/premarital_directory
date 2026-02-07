/**
 * Enhance Unclaimed Profiles Tool
 * 
 * This script helps enhance the 5000 unclaimed profiles with better data
 * before outreach, improving their SEO value and claim conversion rates.
 * 
 * Usage:
 *   node tools/enhance-unclaimed-profiles.js
 * 
 * Features:
 *   - Calculates profile completeness scores
 *   - Identifies profiles needing enhancement
 *   - Can generate placeholder bios based on profession/location
 *   - Exports CSV for bulk outreach with personalization tokens
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Calculate completeness score (matches DB function)
function calculateCompleteness(profile) {
  let score = 0;
  
  // Core fields (10 points each)
  if (profile.full_name?.length > 0) score += 10;
  if (profile.bio?.length > 100) score += 10;
  if (profile.profession?.length > 0) score += 10;
  if (profile.city?.length > 0) score += 10;
  if (profile.state_province?.length > 0) score += 10;
  
  // Contact info (5 points each)
  if (profile.email?.length > 0) score += 5;
  if (profile.phone?.length > 0) score += 5;
  if (profile.website?.length > 0) score += 5;
  
  // Enhanced fields (5 points each)
  if (profile.photo_url?.length > 0) score += 5;
  if (profile.specialties?.length > 0) score += 5;
  if (profile.credentials?.length > 0) score += 5;
  if (profile.education?.length > 0) score += 5;
  if (profile.years_experience > 0) score += 5;
  if (profile.approach?.length > 50) score += 5;
  if (profile.languages?.length > 0) score += 5;
  if (profile.session_types?.length > 0) score += 5;
  if (profile.insurance_accepted?.length > 0) score += 5;
  if (profile.pricing_range?.length > 0) score += 5;
  if (profile.faith_tradition?.length > 0) score += 5;
  if (profile.certifications?.length > 0) score += 5;
  if (profile.treatment_approaches?.length > 0) score += 5;
  if (profile.client_focus?.length > 0) score += 5;
  
  return Math.min(score, 100);
}

// Generate a basic bio for profiles that don't have one
function generatePlaceholderBio(profile) {
  const profession = profile.profession || 'premarital counselor';
  const city = profile.city || 'your area';
  const state = profile.state_province || '';
  
  const templates = [
    `${profile.full_name} is a ${profession} based in ${city}, ${state}, helping engaged couples prepare for a strong, healthy marriage. With a focus on communication, conflict resolution, and building a solid foundation, they guide couples through important conversations before their wedding day.`,
    
    `Based in ${city}, ${state}, ${profile.full_name} provides ${profession.toLowerCase()} services to couples preparing for marriage. Their approach helps partners develop the skills needed for a lifetime of love and understanding.`,
    
    `${profile.full_name} offers premarital counseling in ${city}, ${state} as a ${profession}. They work with engaged couples to build strong communication skills, navigate differences, and start their marriage with confidence.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

async function analyzeProfiles() {
  console.log('🔍 Analyzing unclaimed profiles...\n');
  
  // Get all unclaimed profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_claimed', false)
    .eq('is_hidden', false);
  
  if (error) {
    console.error('❌ Error fetching profiles:', error);
    return;
  }
  
  console.log(`📊 Found ${profiles.length} unclaimed profiles\n`);
  
  // Analyze completeness
  const analysis = {
    total: profiles.length,
    withPhoto: 0,
    withBio: 0,
    withSpecialties: 0,
    withCertifications: 0,
    withFaithTradition: 0,
    withSessionTypes: 0,
    withPricing: 0,
    completenessScores: [],
    byProfession: {},
    byState: {}
  };
  
  profiles.forEach(profile => {
    // Calculate completeness
    const score = calculateCompleteness(profile);
    analysis.completenessScores.push(score);
    
    // Count fields
    if (profile.photo_url) analysis.withPhoto++;
    if (profile.bio?.length > 50) analysis.withBio++;
    if (profile.specialties?.length > 0) analysis.withSpecialties++;
    if (profile.certifications?.length > 0) analysis.withCertifications++;
    if (profile.faith_tradition) analysis.withFaithTradition++;
    if (profile.session_types?.length > 0) analysis.withSessionTypes++;
    if (profile.pricing_range || profile.session_fee_min) analysis.withPricing++;
    
    // By profession
    const prof = profile.profession || 'Unknown';
    analysis.byProfession[prof] = (analysis.byProfession[prof] || 0) + 1;
    
    // By state
    const state = profile.state_province || 'Unknown';
    analysis.byState[state] = (analysis.byState[state] || 0) + 1;
  });
  
  // Calculate averages
  const avgCompleteness = analysis.completenessScores.reduce((a, b) => a + b, 0) / analysis.completenessScores.length;
  const lowCompleteness = analysis.completenessScores.filter(s => s < 30).length;
  const mediumCompleteness = analysis.completenessScores.filter(s => s >= 30 && s < 60).length;
  const highCompleteness = analysis.completenessScores.filter(s => s >= 60).length;
  
  // Print report
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           UNCLAIMED PROFILES ANALYSIS                    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║ Total Profiles:                    ${String(analysis.total).padStart(6)}              ║`);
  console.log(`║ Avg Completeness Score:            ${String(avgCompleteness.toFixed(1) + '%').padStart(6)}              ║`);
  console.log(`║                                                          ║`);
  console.log(`║ COMPLETENESS DISTRIBUTION:                               ║`);
  console.log(`║   Low (0-30%):                     ${String(lowCompleteness).padStart(6)}              ║`);
  console.log(`║   Medium (30-60%):                 ${String(mediumCompleteness).padStart(6)}              ║`);
  console.log(`║   High (60%+):                     ${String(highCompleteness).padStart(6)}              ║`);
  console.log(`║                                                          ║`);
  console.log(`║ FIELD COVERAGE:                                          ║`);
  console.log(`║   Has Photo:                       ${String(analysis.withPhoto).padStart(6)} (${((analysis.withPhoto/analysis.total)*100).toFixed(1)}%)       ║`);
  console.log(`║   Has Bio (50+ chars):             ${String(analysis.withBio).padStart(6)} (${((analysis.withBio/analysis.total)*100).toFixed(1)}%)       ║`);
  console.log(`║   Has Specialties:                 ${String(analysis.withSpecialties).padStart(6)} (${((analysis.withSpecialties/analysis.total)*100).toFixed(1)}%)       ║`);
  console.log(`║   Has Certifications:              ${String(analysis.withCertifications).padStart(6)} (${((analysis.withCertifications/analysis.total)*100).toFixed(1)}%)       ║`);
  console.log(`║   Has Faith Tradition:             ${String(analysis.withFaithTradition).padStart(6)} (${((analysis.withFaithTradition/analysis.total)*100).toFixed(1)}%)       ║`);
  console.log(`║   Has Session Types:               ${String(analysis.withSessionTypes).padStart(6)} (${((analysis.withSessionTypes/analysis.total)*100).toFixed(1)}%)       ║`);
  console.log(`║   Has Pricing:                     ${String(analysis.withPricing).padStart(6)} (${((analysis.withPricing/analysis.total)*100).toFixed(1)}%)       ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // Top states
  console.log('📍 TOP 10 STATES:');
  Object.entries(analysis.byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([state, count]) => {
      console.log(`   ${state.padEnd(20)} ${String(count).padStart(4)} profiles`);
    });
  
  console.log('\n👔 PROFESSION BREAKDOWN:');
  Object.entries(analysis.byProfession)
    .sort((a, b) => b[1] - a[1])
    .forEach(([prof, count]) => {
      console.log(`   ${prof.padEnd(30)} ${String(count).padStart(4)} profiles`);
    });
  
  return { profiles, analysis };
}

async function exportForOutreach(profiles) {
  const fs = require('fs');
  
  // Create CSV with personalization data
  const csvRows = [
    ['email', 'full_name', 'profession', 'city', 'state', 'profile_url', 'completeness_score', 'has_photo', 'has_bio', 'suggested_bio'].join(',')
  ];
  
  profiles.slice(0, 100).forEach(profile => {
    const score = calculateCompleteness(profile);
    const stateSlug = (profile.state_province || '').toLowerCase().replace(/\s+/g, '-');
    const citySlug = (profile.city || '').toLowerCase().replace(/\s+/g, '-');
    const profileUrl = `https://www.weddingcounselors.com/premarital-counseling/${stateSlug}/${citySlug}/${profile.slug || profile.id}`;
    const suggestedBio = generatePlaceholderBio(profile).replace(/"/g, '""'); // Escape quotes for CSV
    
    csvRows.push([
      profile.email || '',
      (profile.full_name || '').replace(/,/g, ' '),
      profile.profession || '',
      profile.city || '',
      profile.state_province || '',
      profileUrl,
      score,
      profile.photo_url ? 'yes' : 'no',
      profile.bio?.length > 50 ? 'yes' : 'no',
      `"${suggestedBio}"`
    ].join(','));
  });
  
  const csvContent = csvRows.join('\n');
  fs.writeFileSync('./unclaimed-profiles-sample.csv', csvContent);
  console.log('\n✅ Exported sample CSV: unclaimed-profiles-sample.csv (100 profiles)');
}

async function suggestEnhancements(profiles) {
  console.log('\n🔧 ENHANCEMENT RECOMMENDATIONS:\n');
  
  // Find profiles that would benefit most from enhancement
  const needsBio = profiles.filter(p => !p.bio || p.bio.length < 50);
  const needsSpecialties = profiles.filter(p => !p.specialties || p.specialties.length === 0);
  const needsPhoto = profiles.filter(p => !p.photo_url);
  
  console.log(`1. Profiles needing bios: ${needsBio.length}`);
  console.log(`   Suggestion: Generate placeholder bios for these profiles`);
  console.log(`   Impact: +10 points to completeness score\n`);
  
  console.log(`2. Profiles needing specialties: ${needsSpecialties.length}`);
  console.log(`   Suggestion: Add default specialties based on profession`);
  console.log(`   Impact: +5 points, better search matching\n`);
  
  console.log(`3. Profiles needing photos: ${needsPhoto.length}`);
  console.log(`   Suggestion: Cannot auto-add, but flag for outreach emphasis`);
  console.log(`   Impact: +5 points, 3x more views\n`);
  
  // Show sample of low-completeness profiles
  const lowCompleteness = profiles
    .map(p => ({ ...p, score: calculateCompleteness(p) }))
    .filter(p => p.score < 30)
    .slice(0, 5);
  
  console.log('📋 SAMPLE LOW-COMPLETENESS PROFILES:');
  lowCompleteness.forEach(p => {
    console.log(`   ${p.full_name} (${p.profession}) - ${p.city}, ${p.state_province}`);
    console.log(`   Score: ${p.score}% | Bio: ${p.bio ? 'Y' : 'N'} | Photo: ${p.photo_url ? 'Y' : 'N'} | Specialties: ${p.specialties?.length || 0}`);
    console.log(`   Suggested bio: ${generatePlaceholderBio(p).substring(0, 80)}...\n`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';
  
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     ENHANCE UNCLAIMED PROFILES TOOL                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  switch (command) {
    case 'analyze':
      const { profiles, analysis } = await analyzeProfiles();
      await suggestEnhancements(profiles);
      break;
      
    case 'export':
      const { profiles: profilesForExport } = await analyzeProfiles();
      await exportForOutreach(profilesForExport);
      break;
      
    default:
      console.log('Usage:');
      console.log('  node tools/enhance-unclaimed-profiles.js analyze  - Analyze profile completeness');
      console.log('  node tools/enhance-unclaimed-profiles.js export   - Export CSV for outreach');
  }
  
  console.log('\n✨ Done!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
