-- Fix classroom INSERT policy
-- The FOR ALL policy with only USING clause doesn't cover INSERT (needs WITH CHECK)

DO $$ BEGIN
  CREATE POLICY "Users can insert their own classrooms"
    ON classrooms FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Also fix classroom_members INSERT for lecturers
DO $$ BEGIN
  CREATE POLICY "Users can join classrooms"
    ON classroom_members FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
