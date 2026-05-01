-- ============================================================
-- Meeting Sessions — persistent record of every room opened
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id     TEXT NOT NULL,
  host_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  classroom_id   UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  privacy        TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'open')),
  started_at     TIMESTAMPTZ DEFAULT now(),
  ended_at       TIMESTAMPTZ,
  capacity       INT DEFAULT 100,
  participant_count INT DEFAULT 0
);

ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;

-- Host can do everything with their sessions
DO $$ BEGIN
  CREATE POLICY "Hosts can manage their own sessions"
    ON meeting_sessions FOR ALL
    USING (host_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Members of the classroom can view sessions linked to that classroom
DO $$ BEGIN
  CREATE POLICY "Classroom members can view sessions"
    ON meeting_sessions FOR SELECT
    USING (
      classroom_id IS NULL
      OR EXISTS (
        SELECT 1 FROM classroom_members
        WHERE classroom_id = meeting_sessions.classroom_id
          AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Fix: organizations INSERT policy
-- (the previous migration only had a FOR ALL policy which
--  required membership — the row doesn't exist yet on insert)
-- ============================================================
DO $$ BEGIN
  CREATE POLICY "Anyone authenticated can create an organization"
    ON organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Fix: organization_members INSERT for the creator
-- ============================================================
DO $$ BEGIN
  CREATE POLICY "Org admins can add members"
    ON organization_members FOR INSERT
    WITH CHECK (
      -- Either the org's owner is inserting themselves as first admin
      user_id = auth.uid()
      OR
      -- Or an existing admin is adding someone
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.org_id = organization_members.org_id
          AND om.user_id = auth.uid()
          AND om.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Classroom members: allow authenticated users to join via ID
-- ============================================================
DO $$ BEGIN
  CREATE POLICY "Students can insert themselves by user_id"
    ON classroom_members FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
