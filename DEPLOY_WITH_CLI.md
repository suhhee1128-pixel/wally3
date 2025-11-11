# Vercel CLI로 직접 배포하기

## 🚀 방법: npx로 Vercel CLI 사용 (권한 문제 없음)

터미널에서 다음 명령어를 실행하세요:

```bash
cd /Users/yeonwoo/PBL/FullStack/wally3

# Vercel 로그인 (처음 한 번만)
npx vercel login

# 프로덕션 배포
npx vercel --prod
```

## 📝 단계별 설명

1. **`npx vercel login`**
   - 브라우저가 열리고 Vercel 계정으로 로그인
   - 로그인 후 터미널로 돌아오면 완료

2. **`npx vercel --prod`**
   - 현재 디렉토리의 코드를 Vercel에 배포
   - 최신 커밋 (e283b8e)이 배포됨
   - 배포 URL이 표시됨

## ✅ 확인 사항

배포 후:
- Vercel Dashboard에서 최신 배포 확인
- 배포된 커밋이 "Trigger Vercel deployment" (e283b8e)인지 확인
- "Initial commit"이 아니어야 함

## 🔧 대안: Vercel Dashboard에서 설정 확인

만약 CLI를 사용하지 않으려면:

1. **Vercel Dashboard → Settings → Git**
   - Repository: `suhhee1128-pixel/wally3` 확인
   - Production Branch: `main` 확인
   - "Disconnect" 후 "Connect Git Repository"로 재연결

2. **GitHub에서 Webhook 확인**
   - https://github.com/suhhee1128-pixel/wally3/settings/hooks
   - Vercel webhook이 있는지 확인

