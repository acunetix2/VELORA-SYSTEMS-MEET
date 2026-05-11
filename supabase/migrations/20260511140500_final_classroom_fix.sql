-- Migration: Final Classroom Visibility Fix
-- Date: 2026-05-11

-- 1. Ensure classrooms are selectable by their members
-- The previous 'lookup' policy was too broad or might be shadowed.
DROP POLICY IF EXISTS "Authenticated users can lookup classrooms to join" ON classrooms;
DROP POLICY IF EXISTS "Members can view classroom details" ON classrooms;

CREATE POLICY "Members can view classroom details"
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
    join_code IS NOT NULL -- Allow lookup by code for joining
  );

-- 2. Ensure classroom_members can be joined with profiles
-- PostgREST often needs an explicit foreign key to the table it's joining if it's not the primary one.
-- Let's make sure there's a relationship between classroom_members and profiles.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_members_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE classroom_members 
    ADD CONSTRAINT classroom_members_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id);
  END IF;
END $$;

-- 3. Robust member visibility (Instructor must see all, students see each other)
DROP POLICY IF EXISTS "Class members can view other members" ON classroom_members;
CREATE POLICY "Class members can view other members"
  ON classroom_members FOR SELECT
  TO authenticated
  USING (
    -- Instructor can see all
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
