-- Fix meta_title and meta_description for the in-laws blog post
-- Currently ranking pos 9.6 with 28 impressions and 0 clicks — title is not earning the click
UPDATE posts
SET
  meta_title       = 'Setting Healthy Boundaries with In-Laws Before Marriage | Premarital Counseling Guide',
  meta_description = 'Learn how to establish healthy boundaries with in-laws before your wedding. Expert advice for engaged couples on managing family dynamics, avoiding conflict, and protecting your new marriage.'
WHERE slug = 'setting-healthy-boundaries-with-inlaws';
