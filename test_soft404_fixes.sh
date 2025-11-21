#!/bin/bash

# Test script for Soft 404 fixes
# Verifies that all components are correctly integrated

echo "🧪 Testing Soft 404 Fixes..."
echo ""

cd client

# 1. Check if new component files exist
echo "1️⃣ Checking new component files..."
if [ -f "src/components/city/DynamicCityStats.js" ]; then
  echo "  ✅ DynamicCityStats.js exists"
else
  echo "  ❌ DynamicCityStats.js missing"
  exit 1
fi

if [ -f "src/components/city/DynamicCityStats.css" ]; then
  echo "  ✅ DynamicCityStats.css exists"
else
  echo "  ❌ DynamicCityStats.css missing"
  exit 1
fi

if [ -f "src/components/state/DynamicStateStats.js" ]; then
  echo "  ✅ DynamicStateStats.js exists"
else
  echo "  ❌ DynamicStateStats.js missing"
  exit 1
fi

if [ -f "src/components/state/DynamicStateStats.css" ]; then
  echo "  ✅ DynamicStateStats.css exists"
else
  echo "  ❌ DynamicStateStats.css missing"
  exit 1
fi

echo ""

# 2. Check if components are imported in pages
echo "2️⃣ Checking component imports..."
if grep -q "DynamicCityStats" src/pages/CityPage.js; then
  echo "  ✅ DynamicCityStats imported in CityPage.js"
else
  echo "  ❌ DynamicCityStats not imported in CityPage.js"
  exit 1
fi

if grep -q "DynamicStateStats" src/pages/StatePage.js; then
  echo "  ✅ DynamicStateStats imported in StatePage.js"
else
  echo "  ❌ DynamicStateStats not imported in StatePage.js"
  exit 1
fi

echo ""

# 3. Check if noindex logic was updated
echo "3️⃣ Checking noindex threshold updates..."
if grep -q "profiles.length < 3" src/pages/CityPage.js; then
  echo "  ✅ CityPage noindex threshold updated to 3"
else
  echo "  ⚠️  CityPage noindex threshold may not be updated"
fi

echo ""

# 4. Try to build the project
echo "4️⃣ Running build test..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "  ✅ Build successful"
else
  echo "  ❌ Build failed - check for syntax errors"
  echo "  Run 'npm run build' for details"
  exit 1
fi

echo ""

# 5. Check for the bulk generation script
echo "5️⃣ Checking bulk generation script..."
cd ..
if [ -f "bulk_generate_content.js" ]; then
  echo "  ✅ bulk_generate_content.js exists"
else
  echo "  ❌ bulk_generate_content.js missing"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "Next steps:"
echo "1. Run 'npm start' in /client to test locally"
echo "2. Visit /premarital-counseling/georgia/atlanta to see DynamicCityStats"
echo "3. Visit /premarital-counseling/georgia to see DynamicStateStats"
echo "4. Run 'node bulk_generate_content.js' to generate AI content"
echo "5. Deploy with 'npm run build && vercel --prod'"
