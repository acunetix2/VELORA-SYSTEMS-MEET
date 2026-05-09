-- Add duration tracking to meeting_history
ALTER TABLE meeting_history ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;

-- Allow users to update their own meeting history (to save duration on leave)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meeting_history'
      AND policyname = 'Users can update their own history'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own history"
      ON meeting_history
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END
$$;
