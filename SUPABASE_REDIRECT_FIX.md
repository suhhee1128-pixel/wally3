# Supabase 리다이렉트 URL 설정 가이드

## 🔍 문제 진단

로그인 후 localhost로 연결되는 문제는 **Supabase 리다이렉트 URL 설정** 문제입니다.

## ✅ 해결 방법

### Supabase Dashboard에서 리다이렉트 URL 추가

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/ydlmkmgwxinfbhqbdben 접속

2. **Authentication → URL Configuration**
   - 좌측 메뉴에서 "Authentication" 클릭
   - "URL Configuration" 섹션 찾기

3. **Site URL 설정**
   - Site URL: `https://wally3.vercel.app`

4. **Redirect URLs 추가**
   - "Redirect URLs" 섹션에서 "Add URL" 클릭
   - 다음 URL들을 추가:
     ```
     https://wally3.vercel.app
     https://wally3.vercel.app/**
     https://wally3-git-main-yeonwoos-projects-d44e7542.vercel.app
     https://wally3-git-main-yeonwoos-projects-d44e7542.vercel.app/**
     ```
   - 각 URL 추가 후 "Save" 클릭

5. **Google OAuth 설정 (사용하는 경우)**
   - Authentication → Providers → Google
   - Authorized redirect URIs에 Vercel URL 추가:
     ```
     https://ydlmkmgwxinfbhqbdben.supabase.co/auth/v1/callback
     ```

## 📝 현재 코드 확인

코드에서는 `window.location.origin`을 사용하고 있어서 자동으로 올바른 URL을 사용합니다:
```javascript
redirectTo: window.location.origin
```

하지만 Supabase Dashboard에서 이 URL을 허용하지 않으면 리다이렉트가 실패합니다.

## 🔧 추가 확인사항

### 1. Vercel 환경 변수 확인
- `REACT_APP_SUPABASE_URL` 설정됨
- `REACT_APP_SUPABASE_ANON_KEY` 설정됨

### 2. Supabase CORS 설정
- Settings → API → CORS
- Vercel 도메인이 허용되어 있는지 확인

## 🎯 빠른 해결

**가장 중요한 것:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://wally3.vercel.app`
3. Redirect URLs에 Vercel URL 추가
4. Save

이렇게 하면 로그인 후 올바른 URL로 리다이렉트됩니다!

