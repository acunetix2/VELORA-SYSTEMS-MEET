-- Allow students to view classrooms they are members of
DO $$ BEGIN
  CREATE POLICY "Students can view classrooms they belong to"
    ON classrooms FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM classroom_members
        WHERE classroom_id = classrooms.id
          AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow students to view other members in the same classroom
DO $$ BEGIN
  CREATE POLICY "Members can view each other"
    ON classroom_members FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM classroom_members self
        WHERE self.classroom_id = classroom_members.classroom_id
          AND (self.user_id = auth.uid() OR self.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
