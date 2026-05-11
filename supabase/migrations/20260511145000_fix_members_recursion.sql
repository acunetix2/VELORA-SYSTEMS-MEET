-- Migration: Fix RLS Recursion and Accessibility
-- Date: 2026-05-11

-- 1. Create a non-recursive membership check function
-- Using SECURITY DEFINER to bypass RLS during the check itself.
CREATE OR REPLACE FUNCTION public.check_is_member_v2(c_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.classroom_members 
    WHERE classroom_id = c_id 
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Students can see classmates" ON classroom_members;

-- 3. Re-apply a non-recursive classmates policy
CREATE POLICY "Students can see classmates"
  ON classroom_members FOR SELECT
  TO authenticated
  USING (
    check_is_member_v2(classroom_id)
  );
