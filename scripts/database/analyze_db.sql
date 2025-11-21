-- Analysis queries to understand page data distribution

-- 1. Count profiles by state
SELECT
    state_province,
    COUNT(*) as profile_count,
    COUNT(CASE WHEN is_claimed THEN 1 END) as claimed_count,
    COUNT(CASE WHEN is_sponsored THEN 1 END) as sponsored_count,
    COUNT(CASE WHEN bio IS NOT NULL AND LENGTH(bio) > 100 THEN 1 END) as profiles_with_bio
FROM profiles
WHERE is_hidden = false OR is_hidden IS NULL
GROUP BY state_province
ORDER BY profile_count DESC;

-- 2. Count profiles by city (top 100)
SELECT
    state_province,
    city,
    COUNT(*) as profile_count,
    COUNT(CASE WHEN is_claimed THEN 1 END) as claimed_count
FROM profiles
WHERE is_hidden = false OR is_hidden IS NULL
GROUP BY state_province, city
ORDER BY profile_count DESC
LIMIT 100;

-- 3. Overall statistics
SELECT
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN is_claimed THEN 1 END) as claimed_profiles,
    COUNT(CASE WHEN is_sponsored THEN 1 END) as sponsored_profiles,
    COUNT(CASE WHEN bio IS NOT NULL AND LENGTH(bio) > 100 THEN 1 END) as profiles_with_bio,
    COUNT(CASE WHEN bio IS NULL OR LENGTH(bio) <= 100 THEN 1 END) as profiles_without_bio
FROM profiles
WHERE is_hidden = false OR is_hidden IS NULL;

-- 4. States with zero profiles (will need to cross-reference with state list)
SELECT DISTINCT state_province
FROM profiles
WHERE is_hidden = false OR is_hidden IS NULL
ORDER BY state_province;
