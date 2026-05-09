-- Create the recordings bucket (private, authenticated users only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Public read: owners can read their own recordings via signed URLs
CREATE POLICY "Users can upload their own recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read their own recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
