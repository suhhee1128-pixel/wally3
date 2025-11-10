# ChattyPay - Catty Wallet 😺

AI 기반 대화형 금융 관리 앱입니다. 5명의 독특한 캐릭터가 친근한 대화를 통해 사용자의 지출을 관리하도록 도와줍니다.

## 💡 서비스 아이디어 소개

### 핵심 컨셉: "거지방" (Geoji-bang)

**Chatty Wallet**은 전통적인 지출 관리 앱과는 다른 접근 방식을 취합니다. 

#### 🎯 문제 인식
- 일반적인 가계부 앱은 단순히 기록만 하고, 실제로 지출을 막는 데 도움이 되지 않음
- 금융 관리가 지루하고 부담스러워서 지속적으로 사용하기 어려움
- 사용자가 스스로 지출을 통제하기 어려움

#### ✨ 해결 방법
**"거지방"** 컨셉을 통해 유머와 공감으로 지출을 막는 독특한 경험을 제공합니다:

1. **AI 챗봇 "Catty"** 😺
   - 사용자가 뭔가 사고 싶다고 하면 유머러스하게 막아주는 친구 같은 AI
   - 실제 지출 데이터를 분석해서 구체적이고 관련성 있는 조언 제공
   - "이번 주에 이미 $XX 썼어!", "이번 달에 커피를 X번 샀어" 같은 실제 데이터 기반 피드백
   - 억지로 연관 짓지 않고, 실제로 관련된 정보만 사용

2. **데이터 기반 인사이트**
   - 이번 주/이번 달 지출 분석
   - 카테고리별 지출 패턴 추적
   - 특정 항목의 구매 횟수 추적
   - 목표 대비 진행률 실시간 모니터링
   - 기분(mood)과 지출의 연관성 분석

3. **직관적인 시각화**
   - 목표 달성률을 색상으로 표현 (초록→노랑→빨강)
   - 달력 기반 일일 지출 추적
   - 월별 지출 히스토리
   - 기분별 지출 통계

#### 🚀 차별화 포인트

- **유머 기반 접근**: 지루한 금융 관리를 재미있게 만듦
- **실제 데이터 활용**: AI가 사용자의 실제 지출 패턴을 분석해서 개인화된 조언 제공
- **지출 방지 중심**: 단순 기록이 아닌, 실제로 지출을 막는 데 집중
- **자연스러운 상호작용**: 억지로 연관 짓지 않고, 관련성 있는 정보만 사용
- **감정 추적**: 지출 시 기분을 기록해 감정과 소비의 관계 파악

#### 🎨 사용자 경험

사용자가 "치킨버거 $45 사고 싶어"라고 하면:
- ❌ "지난번 '기분이 거지같아요'에 쓴 $45랑 똑같아" (억지로 연관 짓기)
- ✅ "이미 목표의 112% 초과했어! 그 버거는 지갑을 채워주지 않아 🍔💸" (실제 관련 데이터 사용)

## 기능

- **지출 추적**: 일일 수입과 지출을 한눈에 확인
- **AI 채팅**: Catty와 대화하며 금융 습관 개선
- **분석**: 카테고리별 지출 분석 및 인사이트
- **프로필**: 개인 설정 및 계정 관리

## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Gemini API 키
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase 설정
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Gemini API 키 발급
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키를 발급받으세요
2. `.env` 파일의 `REACT_APP_GEMINI_API_KEY`에 발급받은 키를 입력하세요

#### Supabase 설정
1. [Supabase](https://supabase.com)에서 프로젝트를 생성하세요
2. 프로젝트 설정 → API에서 URL과 Anon Key를 확인하세요
3. `.env` 파일에 각각 입력하세요
4. `src/database/schema.sql` 파일의 SQL을 Supabase SQL Editor에서 실행하여 테이블을 생성하세요
5. (선택) Google OAuth를 사용하려면:
   - Supabase: Authentication → Providers → Google 설정
   - Google Cloud Console에서 OAuth 클라이언트 ID 생성 및 리다이렉트 URI 설정

### 3. 개발 서버 실행
```bash
npm start
```

브라우저에서 자동으로 `http://localhost:3000`이 열립니다.

## 기술 스택

- **React 18**: UI 프레임워크
- **Tailwind CSS**: 스타일링 (CDN)
- **Helvetica 폰트**: 전체 앱에 적용
- **Supabase**: 백엔드 서비스 (인증, 데이터베이스)
  - 사용자 인증 (이메일/비밀번호, Google OAuth)
  - 거래 내역 저장
  - 채팅 메시지 저장
  - 카테고리 관리
- **Google Gemini API**: AI 챗봇 엔진
  - 사용자의 지출 데이터를 분석하여 개인화된 조언 제공
- **Google OAuth**: 소셜 로그인

## 디자인 특징

- ✨ 우아한 미니멀리즘과 기능적 디자인의 완벽한 균형
- 📱 아이폰 스타일 곡선 프레임 (375x812px)
- 🎨 부드러운 그라데이션 색상
- 🔄 섬세한 마이크로 인터랙션
- 🎯 핵심 기능에 자연스러운 집중

## 프로젝트 구조

```
chatty wallet/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── SpendingPage.js      # 지출 개요 페이지
│   │   ├── ChatPage.js          # AI 채팅 페이지
│   │   ├── AnalyticsPage.js     # 분석 페이지
│   │   ├── ProfilePage.js       # 프로필 페이지
│   │   ├── NavigationBar.js     # 하단 내비게이션
│   │   └── NavigationBar.css
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
└── README.md
```

## 라이선스

MIT License

