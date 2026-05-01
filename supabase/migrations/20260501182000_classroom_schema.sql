-- Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  meeting_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Classroom Members Table
CREATE TABLE IF NOT EXISTS classroom_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(classroom_id, email)
);

-- RLS Policies
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_members ENABLE ROW LEVEL SECURITY;

-- Classrooms policies
DO $$ BEGIN
  CREATE POLICY "Users can manage their own classrooms" 
    ON classrooms FOR ALL 
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Classroom Members policies
DO $$ BEGIN
  CREATE POLICY "Lecturers can manage members"
    ON classroom_members FOR ALL
    USING (EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Students can view their memberships"
    ON classroom_members FOR SELECT
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
