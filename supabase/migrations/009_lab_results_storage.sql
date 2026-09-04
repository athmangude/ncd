-- Lab results storage bucket and RLS policies
-- Path convention: {user_id}/{payment_id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-results',
  'lab-results',
  false,
  10485760, -- 10 MiB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own lab results"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lab-results'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own lab results"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lab-results'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own lab results"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lab-results'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
