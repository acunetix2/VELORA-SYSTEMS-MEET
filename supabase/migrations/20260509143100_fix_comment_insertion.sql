-- Migration: Robust Classroom Comment Policies
-- Date: 2026-05-09

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Enrolled users can view comments" ON classroom_comments;
DROP POLICY IF EXISTS "Enrolled users can post comments" ON classroom_comments;

-- 2. Simplified but secure viewing policy
-- Anyone who is either the host or has a membership record can view
CREATE POLICY "View comments" 
  ON classroom_comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM classrooms WHERE id = classroom_id AND user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM classroom_members 
      WHERE classroom_id = classroom_comments.classroom_id 
      AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- 3. Simplified insertion policy
CREATE POLICY "Post comments" 
  ON classroom_comments FOR INSERT 
  WITH CHECK (
    auth.uid() = author_id
  );

-- 4. Enable RLS (already enabled but just in case)
ALTER TABLE classroom_comments ENABLE ROW LEVEL SECURITY;
