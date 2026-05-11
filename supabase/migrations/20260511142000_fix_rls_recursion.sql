-- Migration: Fix RLS Recursion (Final Attempt)
-- Date: 2026-05-11

-- 1. Drop EVERYTHING
DROP POLICY IF EXISTS "Classroom select" ON classrooms;
DROP POLICY IF EXISTS "Classroom manage" ON classrooms;
DROP POLICY IF EXISTS "Member select" ON classroom_members;
DROP POLICY IF EXISTS "Member manage" ON classroom_members;
DROP FUNCTION IF EXISTS is_classroom_owner(UUID);
DROP FUNCTION IF EXISTS is_classroom_member(UUID);

-- 2. Create Security Definer functions with search_path set to bypass RLS correctly
CREATE OR REPLACE FUNCTION public.check_is_owner(c_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE id = c_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_member(c_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_members 
    WHERE classroom_id = c_id 
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. Apply policies using these functions
-- Classrooms
CREATE POLICY "Classroom select" ON public.classrooms FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR check_is_member(id) OR join_code IS NOT NULL);

CREATE POLICY "Classroom manage" ON public.classrooms FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Members
CREATE POLICY "Member select" ON public.classroom_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
    OR 
    check_is_owner(classroom_id)
  );

CREATE POLICY "Member manage" ON public.classroom_members FOR ALL TO authenticated
  USING (check_is_owner(classroom_id));
