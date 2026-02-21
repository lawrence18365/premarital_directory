/**
 * scripts/gsc/analyze.js
 *
 * Sends GSC data to Claude for SEO opportunity analysis.
 * Finds: near-wins, low-CTR pages, keyword gaps, money SERP targets.
 *
 * Run AFTER pull-data.js: node scripts/gsc/analyze.js
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *
 * Reads from: scripts/gsc/output/combined.json + pages.json
 * Saves to:   scripts/gsc/output/analysis.md
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not set in .env');
  process.exit(1);
}

function loadJSON(filename) {
  const file = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(file)) {
    console.error(`ERROR: ${file} not found. Run pull-data.js first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function buildDataSummary(combined, pages) {
  // Near-wins: position 4–20, decent impressions (most actionable)
  const nearWins = combined
    .filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 30)
    .sort((a, b) => (b.impressions - a.impressions))
    .slice(0, 60);

  // Low CTR with high impressions (page 1 but people aren't clicking)
  const lowCTR = combined
    .filter(r => r.position <= 10 && r.impressions >= 100 && r.ctr < 3)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 30);

  // Best performing (already winning — double down)
  const topPerformers = combined
    .filter(r => r.clicks >= 5)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);

  // Pages with most impressions but low conversion (position-weighted)
  const pageOpps = pages
    .filter(r => r.impressions >= 50 && r.position >= 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  // Money-intent queries (buy/hire/best/near/cost/price keywords)
  const moneyIntentTerms = /\b(premarital|counseling|counselor|therapist|therapy|near me|cost|price|best|find|hire|online|couples|marriage prep)\b/i;
  const moneyKeywords = combined
    .filter(r => moneyIntentTerms.test(r.query) && r.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 40);

  return { nearWins, lowCTR, topPerformers, pageOpps, moneyKeywords };
}

const ANALYSIS_PROMPT = `You are a senior SEO strategist analyzing Google Search Console data for **weddingcounselors.com** — a premarital counseling directory connecting engaged couples with licensed therapists and counselors.

The site makes money when couples find and contact counselors listed in the directory. The highest-value pages are:
- State/city directory pages (e.g., "premarital counseling in Texas")
- Discount/deal pages (couples looking for affordable options)
- Informational pages that drive counselor search intent

**Your job**: Analyze the GSC data below and deliver a concrete, prioritized SEO action plan.

Focus on:
1. **Near-wins** (positions 4–20) — small improvements = big traffic jumps
2. **Low-CTR page-1 keywords** — title/meta description rewrites needed
3. **Money SERP opportunities** — queries with commercial intent we should dominate
4. **Content gaps** — high-impression queries where we rank poorly or not at all
5. **Quick wins** — things that can move in 2–4 weeks, not months

For each recommendation, be specific:
- Name the exact keyword or page
- State the current position and impressions
- Tell us exactly what to change (title tag, add a section, internal link, etc.)
- Estimate the opportunity (traffic uplift, intent quality)

Format your response as a clear markdown report with sections and tables where useful.

---

## GSC DATA

`;

async function main() {
  console.log('Loading GSC data...');
  const combined = loadJSON('combined.json');
  const pages    = loadJSON('pages.json');

  console.log(`Loaded ${combined.length} query+page rows, ${pages.length} page rows`);

  const { nearWins, lowCTR, topPerformers, pageOpps, moneyKeywords } = buildDataSummary(combined, pages);

  const dataBlock = [
    `### Near-Win Keywords (pos 4–20, sorted by impressions)\n\`\`\`json\n${JSON.stringify(nearWins, null, 2)}\n\`\`\``,
    `### Low-CTR Page-1 Keywords (pos ≤10, CTR < 3%, high impressions)\n\`\`\`json\n${JSON.stringify(lowCTR, null, 2)}\n\`\`\``,
    `### Top Performing Keywords (most clicks)\n\`\`\`json\n${JSON.stringify(topPerformers, null, 2)}\n\`\`\``,
    `### Pages with Opportunity (high impressions, pos ≥5)\n\`\`\`json\n${JSON.stringify(pageOpps, null, 2)}\n\`\`\``,
    `### Money-Intent Keywords\n\`\`\`json\n${JSON.stringify(moneyKeywords, null, 2)}\n\`\`\``,
  ].join('\n\n');

  const fullPrompt = ANALYSIS_PROMPT + dataBlock;

  console.log('\nSending to Claude for analysis...\n');

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: fullPrompt }],
  });

  const analysis = message.content[0].text;

  // Save report
  const reportFile = path.join(OUTPUT_DIR, 'analysis.md');
  const header = `# GSC SEO Analysis — weddingcounselors.com\n_Generated: ${new Date().toISOString()}_\n\n`;
  fs.writeFileSync(reportFile, header + analysis);

  console.log(analysis);
  console.log(`\n\nFull report saved to: ${reportFile}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
