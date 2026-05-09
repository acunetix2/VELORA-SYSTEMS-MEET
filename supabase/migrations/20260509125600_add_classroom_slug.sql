-- Add slug column to classrooms
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Populate slugs for existing classrooms
UPDATE classrooms SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || SUBSTRING(id::text, 1, 8) WHERE slug IS NULL;

-- Make slug NOT NULL for future entries (optional, but good for consistency)
-- ALTER TABLE classrooms ALTER COLUMN slug SET NOT NULL;
