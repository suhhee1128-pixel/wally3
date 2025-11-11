# 배포 에러 해결 가이드

## 🔍 문제 분석

에러 메시지: "API key is missing. Please set REACT_APP_GEMINI_API_KEY"
- 이 메시지는 현재 코드에 없습니다
- 배포된 빌드가 오래된 버전이거나 Edge Function이 작동하지 않는 것 같습니다

## ✅ 해결 방법

### 1. Edge Function 환경 변수 확인 (가장 중요!)

**Supabase Dashboard에서:**
1. https://supabase.com/dashboard/project/ydlmkmgwxinfbhqbdben
2. **Edge Functions** → **openai-proxy** 선택
3. **Settings** → **Secrets** 확인
4. `OPENAI_API_KEY`가 설정되어 있는지 확인
   - 없으면 추가: `OPENAI_API_KEY` = `sk-proj-...` (OpenAI API 키)

### 2. Edge Function 재배포

터미널에서:
```bash
npx supabase functions deploy openai-proxy
```

### 3. Vercel에 최신 코드 배포

**옵션 A: 자동 배포 (GitHub 연결 시)**
- GitHub에 push하면 자동 배포됨
- 최신 코드가 push되었는지 확인

**옵션 B: 수동 재배포**
- Vercel Dashboard → 프로젝트 → **Deployments** → **Redeploy**

### 4. 확인 사항 체크리스트

- [ ] Edge Function `openai-proxy`가 배포되어 있음
- [ ] Edge Function에 `OPENAI_API_KEY` 환경 변수가 설정되어 있음
- [ ] Vercel에 최신 코드가 배포되어 있음
- [ ] 브라우저 캐시를 지우고 다시 시도

## 🧪 테스트 방법

1. **브라우저 개발자 도구(F12) → Console 탭 열기**
2. **채팅 메시지 전송**
3. **콘솔에서 확인:**
   - "Edge Function error: ..." → Edge Function 문제
   - "OpenAI API response: ..." → 정상 작동

## 📝 Edge Function 환경 변수 설정 방법

1. **Supabase CLI 사용:**
```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-your-key-here
```

2. **또는 Supabase Dashboard:**
   - Edge Functions → openai-proxy → Settings → Secrets
   - `OPENAI_API_KEY` 추가

