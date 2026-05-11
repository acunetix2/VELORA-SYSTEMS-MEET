-- Migration: Fix RLS Recursion (Final & Robust)
-- Date: 2026-05-11

-- 1. Create Security Definer functions with search_path set to bypass RLS correctly
CREATE OR REPLACE FUNCTION public.check_is_owner(c_id UUID)
RETURNS BOOLEAN AS $$
  -- This query runs as the function owner (postgres), bypassing RLS on classrooms
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE id = c_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_member(c_id UUID)
RETURNS BOOLEAN AS $$
  -- This query runs as the function owner (postgres), bypassing RLS on classroom_members
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_members 
    WHERE classroom_id = c_id 
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Drop all previous conflicting policies to ensure a clean state
DROP POLICY IF EXISTS "Classroom select" ON classrooms;
DROP POLICY IF EXISTS "Classroom manage" ON classrooms;
DROP POLICY IF EXISTS "Member select" ON classroom_members;
DROP POLICY IF EXISTS "Member manage" ON classroom_members;
DROP POLICY IF EXISTS "Classrooms are viewable by members and for joining" ON classrooms;
DROP POLICY IF EXISTS "Owners can manage classrooms" ON classrooms;
DROP POLICY IF EXISTS "Class members visibility" ON classroom_members;
DROP POLICY IF EXISTS "Owners can manage members" ON classroom_members;

-- 3. Apply non-recursive policies using the functions
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

-- 4. Backfill existing classroom owners into the membership table
-- We join with auth.users to get the email as it's required in classroom_members
DO $$
BEGIN
    INSERT INTO public.classroom_members (classroom_id, user_id, email, role)
    SELECT r.id, r.user_id, u.email, 'host'
    FROM public.classrooms r
    JOIN auth.users u ON u.id = r.user_id
    ON CONFLICT (classroom_id, email) DO NOTHING;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Backfill failed, likely due to schema permissions. Manual backfill may be required.';
END $$;
