-- Migration: Specialized Assignment & Submission System
-- Date: 2026-05-09

-- 1. Create Submissions table for student work
CREATE TABLE IF NOT EXISTS classroom_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES classroom_assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  grade TEXT,
  feedback TEXT,
  status TEXT DEFAULT 'submitted', -- submitted, graded
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enhance Assignments table with educational metadata
ALTER TABLE classroom_assignments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'assignment'; -- assignment, cat, quiz, material
ALTER TABLE classroom_assignments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE classroom_assignments ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE classroom_assignments ADD COLUMN IF NOT EXISTS points INT DEFAULT 100;
ALTER TABLE classroom_assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. Enable RLS
ALTER TABLE classroom_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Submissions
DO $$ BEGIN
  CREATE POLICY "Students can manage their own submissions" 
    ON classroom_submissions FOR ALL 
    USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Instructors can view and grade all submissions" 
    ON classroom_submissions FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM classroom_assignments a
      JOIN classrooms c ON a.classroom_id = c.id
      WHERE a.id = classroom_submissions.assignment_id AND c.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Helper function for student progress (optional but good for performance)
-- We'll handle this in the UI for now via joins.
