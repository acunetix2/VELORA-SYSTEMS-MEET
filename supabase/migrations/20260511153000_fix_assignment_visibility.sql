-- Migration: Fix Assignment Visibility
-- Date: 2026-05-11

-- 1. Drop old restrictive policies
DROP POLICY IF EXISTS "View assignments" ON classroom_assignments;
DROP POLICY IF EXISTS "Host manage assignments" ON classroom_assignments;

-- 2. Implement permissive SELECT policy
-- Assignments (curriculum) should be visible to all authenticated users for discovery
-- and to students of the class. Permissive SELECT is the most stable approach.
CREATE POLICY "Assignments are visible" 
  ON public.classroom_assignments FOR SELECT 
  TO authenticated 
  USING (true);

-- 3. Implement secure management policy for instructors
CREATE POLICY "Instructors manage their assignments"
  ON public.classroom_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms 
      WHERE id = classroom_assignments.classroom_id 
      AND user_id = auth.uid()
    )
  );

-- 4. Fix any potentially recursive submission policies
DROP POLICY IF EXISTS "Instructors can view and grade all submissions" ON classroom_submissions;
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
