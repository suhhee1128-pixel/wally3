# 배포 후 문제 해결 가이드

## 🔍 로그인 후 문제 진단

### 문제 증상
- 로그인 창은 뜨지만 로그인 후 작동하지 않음

### 가능한 원인

1. **Supabase 환경 변수 미설정** (가장 가능성 높음)
   - Vercel에 `REACT_APP_SUPABASE_URL` 설정 안 됨
   - Vercel에 `REACT_APP_SUPABASE_ANON_KEY` 설정 안 됨

2. **Supabase 연결 실패**
   - 환경 변수가 잘못 설정됨
   - CORS 설정 문제

3. **Edge Function 환경 변수 미설정**
   - Supabase Dashboard에 `OPENAI_API_KEY` 설정 안 됨

## ✅ 해결 방법

### 1. Vercel 환경 변수 확인 및 설정

**Vercel Dashboard → Settings → Environment Variables**

다음 변수들이 설정되어 있는지 확인:

```
CI=false
REACT_APP_SUPABASE_URL=https://ydlmkmgwxinfbhqbdben.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**설정 방법:**
1. Key: `REACT_APP_SUPABASE_URL`
2. Value: `https://ydlmkmgwxinfbhqbdben.supabase.co`
3. Environments: All Environments 선택
4. Save

5. Key: `REACT_APP_SUPABASE_ANON_KEY`
6. Value: Supabase Anon Key (`.env` 파일에서 확인)
7. Environments: All Environments 선택
8. Save

### 2. Supabase Edge Function 환경 변수 확인

**Supabase Dashboard → Edge Functions → Settings → Secrets**

- Name: `OPENAI_API_KEY`
- Value: OpenAI API 키
- 설정되어 있는지 확인

### 3. 브라우저 콘솔 확인

배포된 사이트에서:
1. F12 키 누르기 (개발자 도구 열기)
2. Console 탭 확인
3. 에러 메시지 확인

**확인할 에러:**
- `Supabase connection test failed`
- `Failed to fetch`
- `Environment variable not found`

### 4. 재배포

환경 변수 설정 후:
1. Vercel Dashboard에서 "Redeploy" 클릭
2. 또는 GitHub에 푸시하면 자동 재배포

## 🔍 디버깅 체크리스트

- [ ] Vercel에 `REACT_APP_SUPABASE_URL` 설정됨
- [ ] Vercel에 `REACT_APP_SUPABASE_ANON_KEY` 설정됨
- [ ] Supabase에 `OPENAI_API_KEY` 설정됨 (Edge Function용)
- [ ] 환경 변수 설정 후 재배포 완료
- [ ] 브라우저 콘솔에서 에러 확인

## 💡 빠른 확인 방법

브라우저 개발자 도구(F12) → Console 탭에서:
- "Supabase connection test successful" 메시지가 보이는지 확인
- 에러 메시지가 있는지 확인

