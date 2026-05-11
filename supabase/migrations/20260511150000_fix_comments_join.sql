-- Migration: Resolve Comments Join (Hard Fix)
-- Date: 2026-05-11

-- 1. Remove existing constraints to prevent conflicts
ALTER TABLE public.classroom_comments DROP CONSTRAINT IF EXISTS classroom_comments_author_id_profiles_fkey;
ALTER TABLE public.classroom_comments DROP CONSTRAINT IF EXISTS classroom_comments_student_id_profiles_fkey;

-- 2. Clean up data: Remove comments from authors who no longer exist or never had a profile
-- This is necessary to satisfy the foreign key constraint.
DELETE FROM public.classroom_comments 
WHERE author_id IS NOT NULL 
AND author_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.classroom_comments 
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM public.profiles);

-- 3. Apply the foreign key constraints
ALTER TABLE public.classroom_comments 
  ADD CONSTRAINT classroom_comments_author_id_profiles_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE public.classroom_comments 
  ADD CONSTRAINT classroom_comments_student_id_profiles_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
