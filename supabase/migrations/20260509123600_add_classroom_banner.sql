-- Add preview_image_url to classrooms table
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS preview_image_url TEXT;
