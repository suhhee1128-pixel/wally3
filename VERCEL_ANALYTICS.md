# Vercel 분석 기능 사용 가이드

## 📊 Vercel에서 확인할 수 있는 것들

### 1. **Web Analytics** (사용자 행동 분석)
- 페이지뷰, 고유 방문자 수
- 사용자가 어디를 클릭하는지 (Heatmap은 별도 도구 필요)
- 어떤 페이지를 많이 보는지
- 사용자 플로우 (어디서 들어와서 어디로 가는지)
- 디바이스, 브라우저, 국가별 통계

### 2. **Speed Insights** (성능 분석)
- 페이지 로딩 속도
- Core Web Vitals (LCP, FID, CLS)
- 실제 사용자의 성능 데이터

### 3. **Functions Analytics** (API 사용량)
- Edge Functions 호출 횟수
- 함수 실행 시간
- 에러율
- 사용량 통계

### 4. **Runtime Logs** (실시간 로그)
- 애플리케이션 에러
- 콘솔 로그
- 디버깅 정보

## ✅ 활성화 방법

### Web Analytics 활성화

1. **Vercel Dashboard → 프로젝트 선택**
2. **Settings → Analytics**
3. **"Enable Web Analytics" 클릭**
4. **무료 플랜**: 월 100,000 이벤트까지 무료
5. **코드에 추가 필요** (자동으로 추가됨)

### Speed Insights 활성화

1. **Vercel Dashboard → 프로젝트 선택**
2. **Settings → Speed Insights**
3. **"Enable Speed Insights" 클릭**
4. **무료 플랜**: 월 100,000 페이지뷰까지 무료

### Functions Analytics 확인

1. **Vercel Dashboard → 프로젝트 선택**
2. **Functions 탭** (또는 Edge Functions)
3. **사용량 통계 자동 표시됨**
   - 호출 횟수
   - 실행 시간
   - 에러율

### Runtime Logs 확인

1. **Vercel Dashboard → 프로젝트 선택**
2. **Deployments → 특정 배포 선택**
3. **"Runtime Logs" 섹션 클릭**
4. **실시간 로그 확인**

## 📈 더 자세한 사용자 행동 분석이 필요하면

### Google Analytics 추가 (추천)

1. **Google Analytics 계정 생성**
   - https://analytics.google.com

2. **React 앱에 추가**
   ```bash
   npm install react-ga4
   ```

3. **코드에 추가** (App.js 또는 index.js)
   ```javascript
   import ReactGA from 'react-ga4';
   
   ReactGA.initialize('G-XXXXXXXXXX'); // Google Analytics ID
   ReactGA.send({ hitType: "pageview", page: window.location.pathname });
   ```

### Hotjar 또는 Mixpanel (고급 분석)
- Heatmap (사용자가 어디를 클릭하는지 시각화)
- 세션 녹화
- 사용자 플로우 분석

## 💰 Vercel 플랜별 제한

### Hobby (무료)
- Web Analytics: 월 100,000 이벤트
- Speed Insights: 월 100,000 페이지뷰
- Functions: 제한 없음 (사용량에 따라 과금)

### Pro ($20/월)
- Web Analytics: 무제한
- Speed Insights: 무제한
- Functions: 더 많은 사용량 포함

## 🎯 추천 설정

1. **Web Analytics 활성화** (무료로 충분)
2. **Speed Insights 활성화** (성능 모니터링)
3. **Runtime Logs 확인** (에러 디버깅)
4. **필요하면 Google Analytics 추가** (더 자세한 분석)

