-- 1. Create a helper function that bypasses RLS to check ownership
-- This breaks the infinite recursion loop
CREATE OR REPLACE FUNCTION is_classroom_owner(_classroom_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM classrooms 
    WHERE id = _classroom_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all old policies to start fresh
DROP POLICY IF EXISTS "Lecturers can manage own classrooms" ON classrooms;
DROP POLICY IF EXISTS "Students can view joined classrooms" ON classrooms;
DROP POLICY IF EXISTS "Lecturers can manage class members" ON classroom_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON classroom_members;
DROP POLICY IF EXISTS "Students can view enrolled classrooms" ON classrooms;
DROP POLICY IF EXISTS "Lecturers can manage members" ON classroom_members;
DROP POLICY IF EXISTS "Students can view their memberships" ON classroom_members;
DROP POLICY IF EXISTS "Users can insert their own classrooms" ON classrooms;

-- 3. Final, Recursion-Free Policies for Classrooms
CREATE POLICY "classrooms_owner_policy" 
ON classrooms FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "classrooms_member_policy" 
ON classrooms FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM classroom_members 
    WHERE classroom_id = classrooms.id 
    AND user_id = auth.uid()
  )
);

-- 4. Final, Recursion-Free Policies for Members
-- This uses our helper function to break the loop!
CREATE POLICY "members_owner_policy" 
ON classroom_members FOR ALL 
USING (is_classroom_owner(classroom_id));

CREATE POLICY "members_self_policy" 
ON classroom_members FOR SELECT 
USING (user_id = auth.uid());
