-- Migration: Classroom Syllabus Tracking
-- Date: 2026-05-12

-- 1. Create Syllabus table
CREATE TABLE IF NOT EXISTS classroom_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE classroom_syllabus ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DO $$ BEGIN
  CREATE POLICY "Anyone in class can view syllabus" 
    ON classroom_syllabus FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM classroom_members 
      WHERE classroom_id = classroom_syllabus.classroom_id 
      AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    ) OR EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_syllabus.classroom_id AND user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Instructors can manage syllabus" 
    ON classroom_syllabus FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_syllabus.classroom_id AND user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_classroom_syllabus_updated_at
    BEFORE UPDATE ON classroom_syllabus
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
