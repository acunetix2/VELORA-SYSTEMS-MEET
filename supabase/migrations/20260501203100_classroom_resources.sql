-- Classroom Resources Table
CREATE TABLE IF NOT EXISTS classroom_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE classroom_resources ENABLE ROW LEVEL SECURITY;

-- Lecturers can do everything with their class resources
DO $$ BEGIN
  CREATE POLICY "Lecturers can manage class resources"
    ON classroom_resources FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM classrooms 
        WHERE classrooms.id = classroom_resources.classroom_id 
        AND classrooms.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Students can read resources for classes they are enrolled in
DO $$ BEGIN
  CREATE POLICY "Students can view class resources"
    ON classroom_resources FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM classroom_members 
        WHERE classroom_members.classroom_id = classroom_resources.classroom_id 
        AND classroom_members.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create a storage bucket for classroom files
INSERT INTO storage.buckets (id, name, public)
VALUES ('classroom-resources', 'classroom-resources', true)
ON CONFLICT DO NOTHING;

-- Storage policies: allow authenticated users to upload
DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload classroom files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'classroom-resources');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read classroom files"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'classroom-resources');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can delete classroom files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'classroom-resources' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
