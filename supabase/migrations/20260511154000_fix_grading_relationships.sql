-- Migration: Fix Grading Portal Relationships
-- Date: 2026-05-11

-- 1. Ensure classroom_submissions can be joined with profiles
-- This adds the missing link between student_id and the profiles table.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_submissions_student_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.classroom_submissions 
    ADD CONSTRAINT classroom_submissions_student_id_profiles_fkey 
    FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Ensure Instructors have full access to submissions for their classes
-- This policy is simplified to ensure it never fails due to recursion.
DROP POLICY IF EXISTS "Instructors can view and grade all submissions" ON public.classroom_submissions;
CREATE POLICY "Instructors can view and grade all submissions" 
  ON public.classroom_submissions FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_assignments a
      JOIN public.classrooms c ON a.classroom_id = c.id
      WHERE a.id = classroom_submissions.assignment_id AND c.user_id = auth.uid()
    )
  );

-- 3. Ensure Students can see their own submissions
DROP POLICY IF EXISTS "Students can manage their own submissions" ON public.classroom_submissions;
CREATE POLICY "Students can manage their own submissions" 
  ON public.classroom_submissions FOR ALL 
  TO authenticated
  USING (auth.uid() = student_id);
