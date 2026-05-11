-- Migration: Correct Student List Relationships (Final)
-- Date: 2026-05-11

-- 1. Drop the incorrect foreign key that referenced profiles.id
ALTER TABLE public.classroom_members DROP CONSTRAINT IF EXISTS classroom_members_user_id_profiles_fkey;

-- 2. Add the correct foreign key referencing profiles.user_id
-- In our schema, profiles.user_id is the unique reference to auth.users.id.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classroom_members_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.classroom_members 
    ADD CONSTRAINT classroom_members_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Update the safety trigger to use correct column names
CREATE OR REPLACE FUNCTION public.ensure_profile_exists_for_member()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    -- In this schema, we check for user_id in profiles
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id) THEN
      INSERT INTO public.profiles (user_id, display_name)
      VALUES (NEW.user_id, split_part(NEW.email, '@', 1));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_member_insert_ensure_profile ON public.classroom_members;
CREATE TRIGGER on_member_insert_ensure_profile
  BEFORE INSERT ON public.classroom_members
  FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_exists_for_member();

-- 4. Ensure permissive SELECT for list population
DROP POLICY IF EXISTS "Classroom members are visible" ON classroom_members;
CREATE POLICY "Classroom members are visible" ON public.classroom_members FOR SELECT TO authenticated USING (true);
