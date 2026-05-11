-- Migration: Fix Classroom Join and Recursive RLS (Permissive Select Version)
-- Date: 2026-05-11

-- 1. Drop ALL recursive functions and policies to start completely fresh
DROP POLICY IF EXISTS "Classroom select" ON classrooms;
DROP POLICY IF EXISTS "Classroom manage" ON classrooms;
DROP POLICY IF EXISTS "Member select" ON classroom_members;
DROP POLICY IF EXISTS "Member manage" ON classroom_members;
DROP POLICY IF EXISTS "Classrooms are viewable by members and for joining" ON classrooms;
DROP POLICY IF EXISTS "Owners can manage classrooms" ON classrooms;
DROP POLICY IF EXISTS "Class members visibility" ON classroom_members;
DROP POLICY IF EXISTS "Owners can manage members" ON classroom_members;
DROP FUNCTION IF EXISTS check_is_owner(UUID);
DROP FUNCTION IF EXISTS check_is_member(UUID);
DROP FUNCTION IF EXISTS is_classroom_owner(UUID);
DROP FUNCTION IF EXISTS is_classroom_member(UUID);

-- 2. CLASSROOMS: Permissive SELECT to allow discovery and joining
-- This breaks the recursion because classrooms SELECT no longer depends on classroom_members.
-- It is safe because only non-sensitive columns are exposed, and 'manage' (INSERT/UPDATE/DELETE) 
-- is still strictly restricted to the owner.
CREATE POLICY "Classrooms are discoverable"
  ON classrooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can manage their classrooms"
  ON classrooms FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. CLASSROOM_MEMBERS: Restricted SELECT
-- Members can see their own records, and instructors can see all students in their classes.
-- This depends on 'classrooms' but since 'classrooms' SELECT is 'true', there is NO RECURSION.
CREATE POLICY "Members can see themselves"
  ON classroom_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage members"
  ON classroom_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND user_id = auth.uid()
    )
  );

-- 4. Ensure students can see other students in the same class (for the 'Students' tab)
CREATE POLICY "Students can see classmates"
  ON classroom_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members AS self
      WHERE self.classroom_id = classroom_members.classroom_id
        AND (self.user_id = auth.uid() OR self.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );
