-- Migration: Fix Student List Visibility & Relationships
-- Date: 2026-05-11

-- 1. Restore the Foreign Key to profiles for easy joining
-- We use ON DELETE SET NULL to prevent blocking user deletions.
-- This enables PostgREST to recognize the 'user:profiles(*)' relationship.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_members_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.classroom_members 
    ADD CONSTRAINT classroom_members_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Add a trigger to ensure a profile exists BEFORE adding a member
-- This prevents the 23503 (Foreign Key Violation) if a user joins before their profile trigger fires.
CREATE OR REPLACE FUNCTION public.ensure_profile_exists_for_member()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is provided, ensure a profile exists
  IF NEW.user_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id) THEN
      INSERT INTO public.profiles (id, display_name)
      VALUES (NEW.user_id, split_part(NEW.email, '@', 1));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_member_insert_ensure_profile ON public.classroom_members;
CREATE TRIGGER on_member_insert_ensure_profile
  BEFORE INSERT ON public.classroom_members
  FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_exists_for_member();

-- 3. Finalize RLS for visibility
-- Allow anyone authenticated to see memberships (non-sensitive info)
-- This ensures the student list and enrolled counts are always populated.
DROP POLICY IF EXISTS "Classroom members are visible" ON classroom_members;
CREATE POLICY "Classroom members are visible" ON public.classroom_members FOR SELECT TO authenticated USING (true);
