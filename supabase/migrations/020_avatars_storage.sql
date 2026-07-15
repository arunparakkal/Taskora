-- Public avatars bucket for optional profile photos uploaded by admins.
-- Max 2MB; jpeg/png/webp/gif only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anyone can view avatar images (URLs are stored on profiles).
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated admins can upload/replace avatars (service role also bypasses RLS).
DROP POLICY IF EXISTS "Admins can upload avatars" ON storage.objects;
CREATE POLICY "Admins can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update avatars" ON storage.objects;
CREATE POLICY "Admins can update avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND public.is_admin())
  WITH CHECK (bucket_id = 'avatars' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete avatars" ON storage.objects;
CREATE POLICY "Admins can delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND public.is_admin());
