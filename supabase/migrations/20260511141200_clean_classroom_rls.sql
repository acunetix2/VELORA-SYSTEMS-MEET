-- Migration: Clean Classroom RLS (Unifying Policies)
-- Date: 2026-05-11

-- 1. Drop ALL previous policies on classrooms to start fresh
DROP POLICY IF EXISTS "Users can manage their own classrooms" ON classrooms;
DROP POLICY IF EXISTS "Students can view classrooms they belong to" ON classrooms;
DROP POLICY IF EXISTS "Authenticated users can lookup classrooms to join" ON classrooms;
DROP POLICY IF EXISTS "Members can view classroom details" ON classrooms;
DROP POLICY IF EXISTS "Anyone can lookup classrooms" ON classrooms;

-- 2. Create one unified, robust SELECT policy for classrooms
CREATE POLICY "Classrooms are viewable by members and for joining"
  ON classrooms FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() -- Owner
    OR
    EXISTS (
      SELECT 1 FROM classroom_members 
      WHERE classroom_id = classrooms.id 
      AND (user_id = auth.uid() OR email = auth.jwt() ->> 'email')
    )
    OR
    join_code IS NOT NULL -- Allow lookup by code for joining (public discovery)
  );

-- 3. Create unified manage policy for owners
CREATE POLICY "Owners can manage classrooms"
  ON classrooms FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Clean up classroom_members policies
DROP POLICY IF EXISTS "Lecturers can manage members" ON classroom_members;
DROP POLICY IF EXISTS "Students can view their memberships" ON classroom_members;
DROP POLICY IF EXISTS "Members can view each other" ON classroom_members;
DROP POLICY IF EXISTS "Class members can view other members" ON classroom_members;

CREATE POLICY "Class members visibility"
  ON classroom_members FOR SELECT
  TO authenticated
  USING (
    -- You can see your own membership
    user_id = auth.uid() 
    OR 
    email = auth.jwt() ->> 'email'
    OR
    -- Owners can see all members
    EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND user_id = auth.uid()
    )
    OR
    -- Members can see each other
    EXISTS (
      SELECT 1 FROM classroom_members AS self
      WHERE self.classroom_id = classroom_members.classroom_id
        AND (self.user_id = auth.uid() OR self.email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Owners can manage members"
  ON classroom_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND user_id = auth.uid()
    )
  );
