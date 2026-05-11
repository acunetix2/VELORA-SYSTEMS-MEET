-- Migration: Fix Comments Profile Join
-- Date: 2026-05-11

-- 1. Ensure classroom_comments can be joined with profiles
-- This adds an explicit foreign key between author_id and the profiles table.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_comments_author_id_profiles_fkey'
  ) THEN
    -- First, ensure all author_ids exist in profiles (backfill if needed, but usually they do)
    -- We'll use ON DELETE SET NULL to be safe.
    ALTER TABLE classroom_comments 
    ADD CONSTRAINT classroom_comments_author_id_profiles_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Add foreign key for student_id as well just in case
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_comments_student_id_profiles_fkey'
  ) THEN
    ALTER TABLE classroom_comments 
    ADD CONSTRAINT classroom_comments_student_id_profiles_fkey 
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
