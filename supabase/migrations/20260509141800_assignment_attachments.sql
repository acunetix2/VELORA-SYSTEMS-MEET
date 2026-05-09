-- Migration: Assignment Reference Documents & Attachment Support
-- Date: 2026-05-09

-- 1. Add file_url to assignments for reference documents
ALTER TABLE classroom_assignments ADD COLUMN IF NOT EXISTS file_url TEXT;

-- 2. Ensure storage policies allow assignment attachments
-- We use the existing classroom-resources bucket
DO $$ BEGIN
  -- Ensure instructors can upload to assignment_attachments folder
  CREATE POLICY "Instructors can upload assignment attachments" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
      bucket_id = 'classroom-resources' AND 
      (storage.foldername(name))[1] = auth.uid()::text AND
      (storage.foldername(name))[2] = 'assignment_attachments'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can view assignment attachments" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'classroom-resources');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
