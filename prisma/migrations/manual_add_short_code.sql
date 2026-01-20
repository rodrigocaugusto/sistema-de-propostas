-- Migration: Add shortCode column to Proposal table
-- This adds the short URL feature for proposals

-- Add the shortCode column
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "shortCode" TEXT;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Proposal_shortCode_key" ON "Proposal"("shortCode");

-- Generate short codes for existing proposals (optional - run if needed)
-- DO $$
-- DECLARE
--     proposal_record RECORD;
--     new_code TEXT;
--     chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
-- BEGIN
--     FOR proposal_record IN SELECT id FROM "Proposal" WHERE "shortCode" IS NULL LOOP
--         new_code := '';
--         FOR i IN 1..6 LOOP
--             new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
--         END LOOP;
--         UPDATE "Proposal" SET "shortCode" = new_code WHERE id = proposal_record.id;
--     END LOOP;
-- END $$;
