-- Allow students to select their classrooms
DO $$ BEGIN
  CREATE POLICY "Students can view enrolled classrooms"
    ON classrooms FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM classroom_members 
        WHERE classroom_members.classroom_id = classrooms.id 
        AND classroom_members.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
