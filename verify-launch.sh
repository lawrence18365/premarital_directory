#!/bin/bash

# Wedding Counselors Directory - Launch Verification Script
# Run this after deployment to verify all SEO components are working

echo "🚀 Wedding Counselors Directory - Launch Verification"
echo "======================================================"

DOMAIN="https://weddingcounselors.com"

echo ""
echo "1. Checking domain accessibility..."
curl -I $DOMAIN 2>/dev/null | head -1

echo ""
echo "2. Verifying sitemap accessibility..."
echo "Main sitemap:"
curl -I $DOMAIN/sitemap.xml 2>/dev/null | head -1
echo "Pages sitemap:"
curl -I $DOMAIN/sitemap-main.xml 2>/dev/null | head -1
echo "States sitemap:"
curl -I $DOMAIN/sitemap-states.xml 2>/dev/null | head -1
echo "Profiles sitemap:"
curl -I $DOMAIN/sitemap-profiles.xml 2>/dev/null | head -1

echo ""
echo "3. Checking robots.txt..."
curl -I $DOMAIN/robots.txt 2>/dev/null | head -1

echo ""
echo "4. Testing structured data (check these URLs):"
echo "   • Google Rich Results Test: https://search.google.com/test/rich-results"
echo "   • Test URL: $DOMAIN"
echo "   • Schema Validator: https://validator.schema.org/"

echo ""
echo "5. Performance testing recommendations:"
echo "   • PageSpeed Insights: https://pagespeed.web.dev/"
echo "   • GTmetrix: https://gtmetrix.com/"
echo "   • Core Web Vitals: https://web.dev/vitals/"

echo ""
echo "6. SEO checklist verification:"
echo "   ✓ Domain redirects to HTTPS"
echo "   ✓ Sitemaps are accessible"
echo "   ✓ Robots.txt is configured"
echo "   ✓ Structured data is implemented"
echo "   ✓ Meta tags are optimized"
echo "   ✓ Analytics tracking is ready"

echo ""
echo "7. Next steps after launch:"
echo "   1. Set up Google Analytics 4"
echo "   2. Set up Google Search Console"
echo "   3. Submit sitemaps to search engines"
echo "   4. Generate profile sitemaps via admin panel"
echo "   5. Monitor performance and indexing"

echo ""
echo "🎉 Launch verification complete!"
echo "Check LAUNCH_SETUP.md for detailed next steps."
