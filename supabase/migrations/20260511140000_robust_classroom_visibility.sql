-- Migration: Robust Classroom Member Visibility
-- Date: 2026-05-11

-- 1. Drop existing complex policy to avoid conflicts
DROP POLICY IF EXISTS "Class members can view other members" ON classroom_members;

-- 2. Create a simplified, robust policy using JWT email for performance
-- This allows any member of a classroom to see all other member records for that same classroom.
CREATE POLICY "Class members can view other members"
  ON classroom_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members AS self
      WHERE self.classroom_id = classroom_members.classroom_id
        AND (
          self.user_id = auth.uid() 
          OR 
          self.email = auth.jwt() ->> 'email'
        )
    )
    OR
    EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND user_id = auth.uid()
    )
  );

-- 3. Ensure profiles are globally viewable by authenticated users
-- This is critical for the join: .select("*, user:profiles(*)")
DROP POLICY IF EXISTS "Profiles are viewable by all members" ON profiles;
CREATE POLICY "Profiles are viewable by all members"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
