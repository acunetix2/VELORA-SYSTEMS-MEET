-- Migration: Fix RLS Recursion and Classroom Loading
-- Date: 2026-05-11

-- 1. Create Security Definer functions to break recursion
-- These functions run with the privileges of the creator (postgres), bypassing RLS.
CREATE OR REPLACE FUNCTION public.is_classroom_owner(c_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM classrooms 
    WHERE id = c_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_classroom_member(c_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM classroom_members 
    WHERE classroom_id = c_id 
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all conflicting policies
DROP POLICY IF EXISTS "Classrooms are viewable by members and for joining" ON classrooms;
DROP POLICY IF EXISTS "Owners can manage classrooms" ON classrooms;
DROP POLICY IF EXISTS "Classrooms are viewable by members and for joining" ON classrooms;
DROP POLICY IF EXISTS "Class members can view other members" ON classroom_members;
DROP POLICY IF EXISTS "Owners can manage members" ON classroom_members;
DROP POLICY IF EXISTS "Class members visibility" ON classroom_members;

-- 3. Apply clean, non-recursive policies using the functions
-- Classrooms
CREATE POLICY "Classroom select"
  ON classrooms FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    is_classroom_member(id)
    OR
    join_code IS NOT NULL
  );

CREATE POLICY "Classroom manage"
  ON classrooms FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Classroom Members
CREATE POLICY "Member select"
  ON classroom_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    is_classroom_owner(classroom_id)
    OR
    is_classroom_member(classroom_id)
  );

CREATE POLICY "Member manage"
  ON classroom_members FOR ALL
  TO authenticated
  USING (is_classroom_owner(classroom_id));
