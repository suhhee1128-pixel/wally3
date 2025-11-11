-- Supabase Storage 설정: 프로필 사진 업로드를 위한 avatars bucket 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. Storage bucket 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket (모든 사용자가 접근 가능)
  5242880,  -- 5MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS 정책: 모든 사용자가 자신의 프로필 사진만 업로드 가능
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Storage RLS 정책: 모든 사용자가 프로필 사진 조회 가능 (public bucket)
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 4. Storage RLS 정책: 사용자가 자신의 프로필 사진만 업데이트 가능
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Storage RLS 정책: 사용자가 자신의 프로필 사진만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
