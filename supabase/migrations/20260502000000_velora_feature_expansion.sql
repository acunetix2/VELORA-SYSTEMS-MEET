-- ============================================================
-- Velora Feature Expansion Migration
-- ============================================================

-- 1. Scheduled Meetings enhancements
ALTER TABLE scheduled_meetings ADD COLUMN IF NOT EXISTS preview_image_url TEXT;
ALTER TABLE scheduled_meetings ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 100;

-- 2. Transcripts/Recordings enhancements
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. Contacts extended fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_role TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Organization enhancements
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS admin_passcode_hash TEXT;

-- 5. Profiles extended fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;

-- 6. Classroom additions
CREATE TABLE IF NOT EXISTS classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classroom_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE classroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_comments ENABLE ROW LEVEL SECURITY;

-- Host and Student can view assignments
CREATE POLICY "View assignments" ON classroom_assignments FOR SELECT USING (
  auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM classrooms WHERE id = classroom_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Host manage assignments" ON classroom_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND user_id = auth.uid())
);

-- Host and Student can view/manage comments
CREATE POLICY "View comments" ON classroom_comments FOR SELECT USING (
  auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM classrooms WHERE id = classroom_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Host and student add comments" ON classroom_comments FOR INSERT WITH CHECK (
  auth.uid() = author_id
);

-- 7. Organization Announcements
CREATE TABLE IF NOT EXISTS org_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE org_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org announcements" ON org_announcements FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE org_id = org_announcements.org_id AND user_id = auth.uid())
);

CREATE POLICY "Admins manage announcements" ON org_announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM organization_members WHERE org_id = org_announcements.org_id AND user_id = auth.uid() AND role = 'admin')
);
