# 프로필 저장 확인 가이드

## 🔍 현재 저장 방식

### 닉네임 저장
- **저장 위치**: Supabase Auth User Metadata
- **코드**: `supabase.auth.updateUser({ data: { nickname, avatar_url } })`
- **저장 여부**: ✅ Supabase에 저장됨 (로컬 아님)

### 프로필 사진 저장
- **저장 위치**: Supabase Storage (`avatars` bucket)
- **코드**: `supabase.storage.from('avatars').upload(...)`
- **저장 여부**: ⚠️ Supabase Storage 설정 필요

## ⚠️ 문제 가능성

### 1. Supabase Storage 설정 안 됨
- `avatars` bucket이 생성되지 않았을 수 있음
- 이미지 업로드가 실패하면 data URL로 저장됨 (로컬처럼 보임)

### 2. 확인 방법

**브라우저 개발자 도구(F12) → Console 탭에서:**
- "Uploading new profile image..." 메시지 확인
- "Image uploaded successfully: ..." 메시지 확인
- 에러 메시지 확인

**Supabase Dashboard에서 확인:**
1. Storage → avatars bucket 확인
2. Authentication → Users → 사용자 선택 → User Metadata 확인

## ✅ 해결 방법

### Supabase Storage 설정 (필수)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/ydlmkmgwxinfbhqbdben

2. **Storage → Create bucket**
   - Name: `avatars`
   - Public bucket: ✅ 체크
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

3. **RLS 정책 설정**
   - `src/database/setup_storage.sql` 파일의 SQL 실행
   - Supabase SQL Editor에서 실행

## 📊 저장 위치 확인

### 닉네임
- ✅ **Supabase Auth User Metadata**에 저장됨
- 로컬이 아닌 Supabase 서버에 저장
- 다른 기기에서도 동일하게 표시됨

### 프로필 사진
- ✅ **Supabase Storage**에 저장됨 (설정되어 있다면)
- ❌ **Data URL**로 저장됨 (Storage 설정 안 되어 있다면)
  - 이 경우 브라우저에만 저장되어 새로고침하면 사라질 수 있음

## 🎯 확인 방법

1. **프로필 변경 후 다른 기기/브라우저에서 확인**
   - 같은 계정으로 로그인
   - 닉네임과 사진이 동일한지 확인

2. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - 저장 시 로그 메시지 확인

3. **Supabase Dashboard 확인**
   - Storage → avatars bucket에 파일이 있는지 확인
   - Authentication → Users → User Metadata 확인

