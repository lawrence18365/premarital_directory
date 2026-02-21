-- Add niche optimizations for Premarital / Clergy providers
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "is_officiant" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "clergy_title" TEXT;
