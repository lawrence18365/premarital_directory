-- Fix blog post internal links: /states -> /premarital-counseling
-- This ensures all internal links use the canonical URL structure

UPDATE posts
SET content = REPLACE(content, '](/states)', '](/premarital-counseling)')
WHERE content LIKE '%](/states)%';

-- Also fix any old /professionals/ URLs to /premarital-counseling/
UPDATE posts
SET content = REPLACE(content, '](/professionals/', '](/premarital-counseling/')
WHERE content LIKE '%](/professionals/%';

-- Update any anchor text variations
UPDATE posts
SET content = REPLACE(content, 'href="/states"', 'href="/premarital-counseling"')
WHERE content LIKE '%href="/states"%';

UPDATE posts
SET content = REPLACE(content, 'href="/professionals/', 'href="/premarital-counseling/')
WHERE content LIKE '%href="/professionals/%';
