-- Migration: Fix Classroom Join Permissions
-- Date: 2026-05-11

-- 1. Allow students to join classrooms (INSERT themselves)
-- This allows a user to create a membership record for themselves.
DROP POLICY IF EXISTS "Students can join classrooms" ON classroom_members;
CREATE POLICY "Students can join classrooms"
  ON classroom_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 2. Allow students to leave classrooms (DELETE their own membership)
DROP POLICY IF EXISTS "Students can leave classrooms" ON classroom_members;
CREATE POLICY "Students can leave classrooms"
  ON classroom_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
