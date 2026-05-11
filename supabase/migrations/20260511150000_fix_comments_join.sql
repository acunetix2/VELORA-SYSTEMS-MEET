-- Migration: Fix Comments Profile Join (Safe Version)
-- Date: 2026-05-11

-- 1. Ensure classroom_comments can be joined with profiles
-- Clean up orphaned author_ids first to allow FK creation
UPDATE classroom_comments 
SET author_id = NULL 
WHERE author_id IS NOT NULL 
AND author_id NOT IN (SELECT id FROM public.profiles);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_comments_author_id_profiles_fkey'
  ) THEN
    ALTER TABLE classroom_comments 
    ADD CONSTRAINT classroom_comments_author_id_profiles_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Clean up student_id too
UPDATE classroom_comments 
SET student_id = (SELECT id FROM public.profiles LIMIT 1) -- Set to a valid profile if orphaned, or NULL if allowed
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM public.profiles);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_comments_student_id_profiles_fkey'
  ) THEN
    ALTER TABLE classroom_comments 
    ADD CONSTRAINT classroom_comments_student_id_profiles_fkey 
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
