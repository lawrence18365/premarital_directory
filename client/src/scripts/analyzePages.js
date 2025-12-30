/**
 * Run this from browser console on your live site to analyze page data
 * Or use this as a Node script with proper Supabase setup
 */

import { supabase } from '../lib/supabaseClient';
import { STATE_CONFIG } from '../data/locationConfig';

export async function analyzePageData() {
  console.log('Starting page data analysis...\n');

  const results = {
    states: [],
    cities: [],
    summary: {
      totalStates: 0,
      statesWithProfiles: 0,
      statesWithoutProfiles: 0,
      totalCities: 0,
      citiesWithProfiles: 0,
      citiesWithoutProfiles: 0,
      totalProfiles: 0,
      profilesWithBio: 0,
      profilesWithoutBio: 0,
      claimedProfiles: 0,
      sponsoredProfiles: 0
    }
  };

  // 1. Get all profiles first
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_hidden', false);

  if (allError) {
    console.error('Error fetching all profiles:', allError);
    return;
  }

  console.log(`Fetched ${allProfiles?.length || 0} total profiles\n`);

  // 2. Analyze State Pages
  console.log('Analyzing State Pages...\n');

  for (const [stateSlug, stateData] of Object.entries(STATE_CONFIG)) {
    const stateProfiles = allProfiles.filter(
      p => p.state_province === stateData.abbr
    );

    const profileCount = stateProfiles.length;
    const claimedCount = stateProfiles.filter(p => p.is_claimed).length;
    const sponsoredCount = stateProfiles.filter(p => p.is_sponsored).length;

    results.states.push({
      slug: stateSlug,
      name: stateData.name,
      abbr: stateData.abbr,
      profileCount,
      claimedCount,
      sponsoredCount,
      shouldIndex: profileCount >= 5,
      url: `https://www.weddingcounselors.com/premarital-counseling/${stateSlug}`
    });

    results.summary.totalStates++;
    if (profileCount > 0) results.summary.statesWithProfiles++;
    else results.summary.statesWithoutProfiles++;

    const indexStatus = profileCount >= 5 ? 'INDEX' : 'NOINDEX';
    console.log(`${indexStatus} ${stateData.name.padEnd(20)} | Profiles: ${profileCount.toString().padStart(3)} | Should Index: ${profileCount >= 5}`);
  }

  console.log('\nAnalyzing City Pages...\n');

  // 3. Analyze City Pages
  for (const [stateSlug, stateData] of Object.entries(STATE_CONFIG)) {
    for (const citySlug of stateData.major_cities || []) {
      const cityName = citySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const cityProfiles = allProfiles.filter(
        p => p.state_province === stateData.abbr &&
             p.city &&
             p.city.toLowerCase() === cityName.toLowerCase()
      );

      const profileCount = cityProfiles.length;

      results.cities.push({
        stateSlug,
        citySlug,
        stateName: stateData.name,
        cityName,
        stateAbbr: stateData.abbr,
        profileCount,
        shouldIndex: profileCount >= 3,
        url: `https://www.weddingcounselors.com/premarital-counseling/${stateSlug}/${citySlug}`
      });

      results.summary.totalCities++;
      if (profileCount > 0) results.summary.citiesWithProfiles++;
      else results.summary.citiesWithoutProfiles++;

      const indexStatus = profileCount >= 3 ? 'INDEX' : 'NOINDEX';
      if (profileCount === 0) {
        console.log(`${indexStatus} ${cityName}, ${stateData.abbr}`.padEnd(40) + ' - NO PROFILES');
      } else {
        console.log(`${indexStatus} ${cityName}, ${stateData.abbr}`.padEnd(40) + ` | Profiles: ${profileCount.toString().padStart(2)}`);
      }
    }
  }

  // 4. Profile statistics
  results.summary.totalProfiles = allProfiles.length;
  results.summary.claimedProfiles = allProfiles.filter(p => p.is_claimed).length;
  results.summary.sponsoredProfiles = allProfiles.filter(p => p.is_sponsored).length;
  results.summary.profilesWithBio = allProfiles.filter(p => p.bio && p.bio.length > 100).length;
  results.summary.profilesWithoutBio = allProfiles.filter(p => !p.bio || p.bio.length <= 100).length;

  console.log('\n\n=== SUMMARY REPORT ===\n');
  console.log('States:');
  console.log(`   Total: ${results.summary.totalStates}`);
  console.log(`   With Profiles: ${results.summary.statesWithProfiles}`);
  console.log(`   Without Profiles: ${results.summary.statesWithoutProfiles}`);
  console.log(`   Should Index: ${results.states.filter(s => s.shouldIndex).length}`);
  console.log(`   Should Noindex: ${results.states.filter(s => !s.shouldIndex).length}`);

  console.log('\nCities:');
  console.log(`   Total: ${results.summary.totalCities}`);
  console.log(`   With Profiles: ${results.summary.citiesWithProfiles}`);
  console.log(`   Without Profiles: ${results.summary.citiesWithoutProfiles}`);
  console.log(`   Should Index: ${results.cities.filter(c => c.shouldIndex).length}`);
  console.log(`   Should Noindex: ${results.cities.filter(c => !c.shouldIndex).length}`);

  console.log('\nProfiles:');
  console.log(`   Total: ${results.summary.totalProfiles}`);
  console.log(`   With Bio: ${results.summary.profilesWithBio}`);
  console.log(`   Without Bio: ${results.summary.profilesWithoutBio}`);
  console.log(`   Claimed: ${results.summary.claimedProfiles}`);
  console.log(`   Sponsored: ${results.summary.sponsoredProfiles}`);

  // 5. Specific recommendations
  console.log(`\n\n=== RECOMMENDATIONS ===\n`);

  const statesToNoindex = results.states.filter(s => !s.shouldIndex);
  const citiesToNoindex = results.cities.filter(c => !c.shouldIndex);

  console.log(`States to Noindex (${statesToNoindex.length}):`);
  statesToNoindex.forEach(s => {
    console.log(`   - ${s.name} (${s.profileCount} profiles)`);
  });

  console.log(`\nCities to Noindex (${citiesToNoindex.length}):`);
  console.log(`   (First 20 shown)`);
  citiesToNoindex.slice(0, 20).forEach(c => {
    console.log(`   - ${c.cityName}, ${c.stateAbbr} (${c.profileCount} profiles)`);
  });

  return results;
}

// If running in Node.js context
if (typeof window === 'undefined') {
  analyzePageData().then(results => {
    console.log('\nAnalysis complete!');
    // Save to file if in Node
    const fs = require('fs');
    fs.writeFileSync(
      'page_analysis_results.json',
      JSON.stringify(results, null, 2)
    );
  }).catch(console.error);
}
