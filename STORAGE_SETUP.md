# Supabase Storage 설정 가이드

프로필 사진 업로드 기능을 사용하려면 Supabase Storage를 설정해야 합니다.

## 설정 방법

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 에서 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭

3. **setup_storage.sql 파일 실행**
   - `src/database/setup_storage.sql` 파일의 내용을 복사
   - SQL Editor에 붙여넣고 실행 (Run 버튼 클릭)

4. **Storage 확인**
   - 왼쪽 메뉴에서 "Storage" 클릭
   - `avatars` bucket이 생성되어 있는지 확인

## 문제 해결

만약 "사진 업로드에 실패했습니다" 오류가 발생하면:

1. **avatars bucket 존재 확인**
   - Storage > Buckets에서 `avatars` bucket이 있는지 확인
   - 없으면 setup_storage.sql을 실행

2. **RLS 정책 확인**
   - Storage > Policies에서 다음 정책들이 있는지 확인:
     - "Users can upload own avatar" (INSERT)
     - "Public avatar access" (SELECT)
     - "Users can update own avatar" (UPDATE)
     - "Users can delete own avatar" (DELETE)

3. **브라우저 콘솔 확인**
   - 개발자 도구 > Console에서 자세한 에러 메시지 확인

