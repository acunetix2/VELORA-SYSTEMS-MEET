-- Migration: Fix Classroom Comment Policies
-- Date: 2026-05-09

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "View comments" ON classroom_comments;
DROP POLICY IF EXISTS "Host and student add comments" ON classroom_comments;

-- 2. Create inclusive viewing policy
-- Enrolled students and the host should be able to view all comments in a classroom
CREATE POLICY "Enrolled users can view comments" 
  ON classroom_comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members 
      WHERE classroom_id = classroom_comments.classroom_id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM classrooms 
      WHERE id = classroom_comments.classroom_id 
      AND user_id = auth.uid()
    )
  );

-- 3. Create inclusive insertion policy
CREATE POLICY "Enrolled users can post comments" 
  ON classroom_comments FOR INSERT 
  WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (
        SELECT 1 FROM classroom_members 
        WHERE classroom_id = classroom_comments.classroom_id 
        AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      ) OR EXISTS (
        SELECT 1 FROM classrooms 
        WHERE id = classroom_comments.classroom_id 
        AND user_id = auth.uid()
      )
    )
  );

-- 4. Allow authors to delete their own comments
CREATE POLICY "Authors can delete their own comments"
  ON classroom_comments FOR DELETE
  USING (auth.uid() = author_id);
