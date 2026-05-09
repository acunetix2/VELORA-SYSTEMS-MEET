-- Migration: Add join_code to classrooms
-- Date: 2026-05-09

ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Function to generate a random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_classroom_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed confusing chars like I, O, 0, 1
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing classrooms that don't have a code
UPDATE classrooms SET join_code = generate_classroom_code() WHERE join_code IS NULL;
