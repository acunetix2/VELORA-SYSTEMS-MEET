-- Migration: Resolve Comments Join (Final Attempt)
-- Date: 2026-05-11

-- 1. Ensure columns exist and have the right type
ALTER TABLE public.classroom_comments ALTER COLUMN author_id SET DATA TYPE UUID;
ALTER TABLE public.classroom_comments ALTER COLUMN student_id SET DATA TYPE UUID;

-- 2. Drop existing FKs if any
ALTER TABLE public.classroom_comments DROP CONSTRAINT IF EXISTS classroom_comments_author_id_fkey;
ALTER TABLE public.classroom_comments DROP CONSTRAINT IF EXISTS classroom_comments_student_id_fkey;
ALTER TABLE public.classroom_comments DROP CONSTRAINT IF EXISTS classroom_comments_author_id_profiles_fkey;
ALTER TABLE public.classroom_comments DROP CONSTRAINT IF EXISTS classroom_comments_student_id_profiles_fkey;

-- 3. Add explicit FK to profiles to enable PostgREST auto-join
-- Note: This requires author_id to refer to a valid profile. 
-- We allow NULL for authors who don't have a profile yet.
ALTER TABLE public.classroom_comments 
  ADD CONSTRAINT classroom_comments_author_id_profiles_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE public.classroom_comments 
  ADD CONSTRAINT classroom_comments_student_id_profiles_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
