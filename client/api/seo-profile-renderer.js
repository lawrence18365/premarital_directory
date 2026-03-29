const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_TITLE = 'Premarital Counseling Near Me | Find Marriage Counselors in Your City | Wedding Counselors';
const DEFAULT_DESC = 'Find qualified premarital counselors, therapists, and coaches near you.';

/**
 * Convert state abbreviation (e.g., "OH") to full slug (e.g., "ohio").
 * Falls back to lowercased input if abbreviation is not recognized.
 */
const STATE_ABBR_TO_SLUG = {
    'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california',
    'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'FL': 'florida', 'GA': 'georgia',
    'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
    'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
    'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri',
    'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada', 'NH': 'new-hampshire', 'NJ': 'new-jersey',
    'NM': 'new-mexico', 'NY': 'new-york', 'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio',
    'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina',
    'SD': 'south-dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont',
    'VA': 'virginia', 'WA': 'washington', 'WV': 'west-virginia', 'WI': 'wisconsin', 'WY': 'wyoming',
    'DC': 'washington-dc'
};

function getStateSlug(stateProvince) {
    if (!stateProvince) return null;
    const upper = stateProvince.trim().toUpperCase();
    return STATE_ABBR_TO_SLUG[upper] || stateProvince.toLowerCase().replace(/\s+/g, '-');
}

function getCitySlug(city) {
    if (!city) return null;
    return city.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
}

/**
 * Helper to escape HTML to prevent XSS.
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Helper to strip Markdown formatting for meta descriptions.
 */
function stripMarkdown(text) {
    if (!text) return '';
    return text.replace(/[#*`_]/g, '').trim();
}

/**
 * Builds the Person structured data schema for a profile.
 */
function generateSchema(profile) {
    const isClergy = profile.profession === 'clergy';
    const schemaType = isClergy ? 'Person' : 'HealthAndBeautyBusiness';

    // Attempt to map to a standard image if one doesn't exist.
    let imageUrl = profile.profile_image_url;
    if (!imageUrl) {
        imageUrl = "https://www.weddingcounselors.com/og-image.jpg";
    }

    const schema = {
        "@context": "https://schema.org",
        "@type": schemaType,
        "name": profile.full_name,
        "description": stripMarkdown(profile.bio),
        "url": `https://www.weddingcounselors.com/premarital-counseling/${getStateSlug(profile.state_province)}/${getCitySlug(profile.city)}/${profile.slug}`,
        "image": imageUrl,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": profile.city,
            "addressRegion": profile.state_province
        }
    };

    if (profile.external_review_score && profile.external_review_count && profile.external_review_score > 0) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": profile.external_review_score,
            "reviewCount": profile.external_review_count,
            "bestRating": "5"
        };
    }

    return JSON.stringify(schema);
}

module.exports = async function (req, res) {
    // 1. Parse the requested slug from the URL.
    // The vercel rewrite passes the entire path, e.g., `/premarital-counseling/ne/kearney/heidi-farrell`
    const urlParts = req.url.split('/').filter(Boolean);
    const slug = urlParts[urlParts.length - 1]; // "heidi-farrell"

    // 2. Load the generic React index.html envelope.
    const indexPath = path.resolve('./client/build/index.html');
    let htmlData;
    try {
        htmlData = fs.readFileSync(indexPath, 'utf8');
    } catch (err) {
        console.error('Error reading index.html:', err);
        return res.status(500).send('Error loading frontend shell.');
    }

    // 3. If there is no slug (which shouldn't happen with our vercel rewrite), just return the shell.
    if (!slug || slug === 'premarital-counseling' || urlParts.length < 3) {
        return res.status(200).send(htmlData);
    }

    // 4. Fetch the profile from Supabase using the slug.
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('slug', slug)
            .eq('is_hidden', false)
            .or('moderation_status.eq.approved,moderation_status.is.null')
            .single();

        // 5. If profile not found, let React Router handle the 404 client-side.
        if (error || !profile) {
            return res.status(200).send(htmlData);
        }

        // 6. Generate Profile-specific Meta Information.
        const cleanBio = stripMarkdown(profile.bio);
        const metaDesc = cleanBio.length > 155 ? cleanBio.substring(0, 155) + '...' : cleanBio;
        let titleSuffix = profile.profession === 'clergy' ? 'Officiant & Premarital Counselor' : 'Premarital Counselor';
        if (profile.credentials) titleSuffix = profile.credentials;
        const metaTitle = `${profile.full_name} | ${titleSuffix} in ${profile.city}, ${profile.state_province} | Wedding Counselors`;

        // Custom Canonical
        const canonicalUrl = `https://www.weddingcounselors.com/premarital-counseling/${getStateSlug(profile.state_province)}/${getCitySlug(profile.city)}/${profile.slug}`;

        // Prepare the JSON-LD Script
        const schemaString = generateSchema(profile);

        // 7. Inject Meta Tags into the HTML <head> using basic string replacement.
        // Replace canonical if it exists, otherwise add it.
        if (htmlData.includes('<link rel="canonical"')) {
            htmlData = htmlData.replace(
                /<link[^>]*rel="canonical"[^>]*>/gi,
                `<link rel="canonical" href="${canonicalUrl}" />`
            );
        } else {
            htmlData = htmlData.replace(
                '</head>',
                `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`
            );
        }

        // Inject All Meta Tags (Title, Description, Schema, Open Graph) for social sharing.
        const customOGTags = `
        <title>${escapeHtml(metaTitle)}</title>
        <meta name="description" content="${escapeHtml(metaDesc)}" />
        <meta property="og:title" content="${escapeHtml(metaTitle)}" />
        <meta property="og:description" content="${escapeHtml(metaDesc)}" />
        <meta property="og:url" content="${canonicalUrl}" />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">${schemaString}</script>
        `;

        // Remove generic og:tags if they exist, then append custom ones before </head>
        htmlData = htmlData.replace(/<title>[\s\S]*?<\/title>/gi, '');
        htmlData = htmlData.replace(/<meta[^>]*name="description"[\s\S]*?>/gi, '');
        htmlData = htmlData.replace(/<meta property="og:[^>]*>/gi, '');
        htmlData = htmlData.replace('</head>', `${customOGTags}\n</head>`);

        // 8. Send the fully enriched HTML to the browser/Googlebot.
        // We set cache controls to tell Vercel's Edge Network to cache this profile for 1 hour.
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        return res.status(200).send(htmlData);

    } catch (err) {
        console.error('Serverless Function Execution Error:', err);
        // Fallback to purely client-rendered React if Supabase fails.
        return res.status(200).send(htmlData);
    }
};
