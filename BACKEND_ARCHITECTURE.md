# 백엔드 아키텍처 문서

## 📋 개요

ChattyPay는 **Supabase**를 백엔드로 사용하는 멀티테넌트 애플리케이션입니다.

## 🗄️ 데이터베이스 구조

### 테이블 목록

#### 1. `transactions` - 거래 내역
```sql
- id: BIGSERIAL (PK)
- user_id: UUID (FK → auth.users) - 각 유저의 거래만 저장
- date: TEXT
- time: TEXT
- description: TEXT
- amount: DECIMAL(10,2)
- type: TEXT ('income' | 'expense')
- category: TEXT
- mood: TEXT ('happy' | 'neutral' | 'sad')
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `messages` - 채팅 메시지
```sql
- id: BIGSERIAL (PK)
- user_id: UUID (FK → auth.users) - 각 유저의 메시지만 저장
- message_id: BIGINT - 클라이언트에서 생성한 고유 ID
- type: TEXT ('user' | 'catty' | 'futureme')
- text: TEXT
- time: TEXT
- ai_type: TEXT ('catty' | 'futureme' | NULL) - AI 메시지 구분용
- created_at: TIMESTAMP
- UNIQUE(user_id, message_id, ai_type)
```

#### 3. `user_categories` - 사용자 정의 카테고리
```sql
- id: BIGSERIAL (PK)
- user_id: UUID (FK → auth.users)
- category_name: TEXT
- created_at: TIMESTAMP
- UNIQUE(user_id, category_name)
```

#### 4. `user_settings` - 사용자 설정
```sql
- id: BIGSERIAL (PK)
- user_id: UUID (FK → auth.users) UNIQUE
- analytics_target: DECIMAL(10,2) DEFAULT 5000
- analytics_period: TEXT ('week' | '2weeks' | '3weeks' | 'month')
- analytics_start_date: TEXT
- spending_summary_period: TEXT ('day' | 'week' | 'month')
- ai_enabled: JSONB DEFAULT '{"catty": true, "futureme": true}'
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🔒 보안: Row Level Security (RLS)

### 중요: 모든 유저의 데이터가 같은 테이블에 저장되는 이유

**✅ 이것은 정상적이고 올바른 구조입니다!**

모든 유저의 데이터가 같은 테이블(`messages`, `transactions` 등)에 저장되지만, **RLS(Row Level Security)** 정책으로 각 유저는 **자신의 데이터만** 접근할 수 있습니다.

### RLS 작동 방식

1. **자동 필터링**: 모든 쿼리에 `WHERE user_id = auth.uid()` 조건이 자동으로 추가됩니다.
2. **보안**: 유저가 다른 유저의 데이터를 조회/수정/삭제할 수 없습니다.
3. **효율성**: 하나의 테이블로 모든 유저 데이터를 관리하면서도 완전히 격리됩니다.

### RLS 정책 예시

```sql
-- SELECT 정책: 자신의 메시지만 조회 가능
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT 정책: 자신의 메시지만 추가 가능
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 실제 동작 예시

```javascript
// 유저 A가 메시지를 조회할 때
const { data } = await supabase
  .from('messages')
  .select('*');
// 실제 실행되는 쿼리:
// SELECT * FROM messages WHERE user_id = 'user-a-id'

// 유저 B가 메시지를 조회할 때
// 실제 실행되는 쿼리:
// SELECT * FROM messages WHERE user_id = 'user-b-id'
```

**결과**: 각 유저는 자신의 메시지만 보게 됩니다. 다른 유저의 데이터는 완전히 격리됩니다.

## 📁 프로젝트 구조

```
src/
├── database/
│   ├── schema.sql                    # 전체 스키마 (테이블 생성 + RLS 정책)
│   ├── migration_add_ai_type.sql     # ai_type 컬럼 추가 마이그레이션
│   ├── migration_add_notes.sql       # notes 컬럼 추가 마이그레이션
│   ├── migration_add_user_settings.sql # user_settings 테이블 추가
│   ├── migration_fix_message_id_type.sql # message_id 타입 변경
│   └── migration_fix_type_constraint.sql # type 제약 조건 수정
├── lib/
│   ├── supabase.js                   # Supabase 클라이언트 초기화
│   └── userSettings.js               # 사용자 설정 관리 유틸리티
└── contexts/
    └── AuthContext.js                # 인증 컨텍스트 (signIn, signOut 등)
```

## 🔐 인증

- **Supabase Auth** 사용
- 지원 방식:
  - 이메일/비밀번호
  - Google OAuth
- 인증된 유저만 데이터 접근 가능 (RLS)

## 📊 데이터 흐름

### 메시지 저장 예시

```javascript
// 1. 유저가 메시지 전송
const userMessage = {
  id: Date.now(),
  type: 'user',
  text: '안녕',
  time: '3:00 PM'
};

// 2. Supabase에 저장 (RLS가 자동으로 user_id 추가)
await supabase
  .from('messages')
  .insert({
    user_id: user.id,  // 현재 로그인한 유저 ID
    message_id: userMessage.id,
    type: 'user',
    text: userMessage.text,
    time: userMessage.time
  });

// 3. 다른 유저는 이 메시지를 볼 수 없음 (RLS 필터링)
```

### 거래 내역 저장 예시

```javascript
// 1. 유저가 거래 추가
await supabase
  .from('transactions')
  .insert({
    user_id: user.id,  // 자동으로 현재 유저 ID 사용
    description: '커피',
    amount: 5.00,
    type: 'expense',
    category: 'food'
  });

// 2. 조회 시 자동으로 자신의 거래만 반환
const { data } = await supabase
  .from('transactions')
  .select('*')
  .order('created_at', { ascending: false });
// RLS가 자동으로 WHERE user_id = current_user 추가
```

## ✅ 보안 체크리스트

- [x] 모든 테이블에 RLS 활성화
- [x] 모든 CRUD 작업에 RLS 정책 설정
- [x] `user_id` 외래키 제약 조건 설정
- [x] `ON DELETE CASCADE`로 유저 삭제 시 데이터 자동 삭제
- [x] 인덱스 최적화 (`user_id`, `created_at`)

## 🚀 마이그레이션 가이드

새로운 마이그레이션이 필요할 때:

1. `src/database/` 폴더에 새 마이그레이션 파일 생성
2. SQL 작성 및 테스트
3. Supabase SQL Editor에서 실행
4. 문서 업데이트

## ⚠️ 성능 고려사항

### 채팅 내역이 많아질 때의 문제점

현재 구조에서 채팅 내역이 무한정 쌓이면 다음과 같은 문제가 발생할 수 있습니다:

#### 1. **쿼리 성능 저하**
- 모든 메시지를 한 번에 로드 (`SELECT *` 제한 없음)
- 메시지가 수천~수만 개가 되면 쿼리 시간이 느려짐
- 인덱스는 있지만, 전체 스캔이 필요할 수 있음

#### 2. **메모리 사용량 증가**
- 클라이언트에서 모든 메시지를 메모리에 로드
- 브라우저 성능 저하, 렌더링 지연

#### 3. **네트워크 전송 시간**
- 대량의 데이터 전송으로 인한 느린 로딩
- 모바일 환경에서 데이터 사용량 증가

#### 4. **저장 공간 비용**
- Supabase 무료 플랜: 500MB 저장 공간
- 메시지가 많아지면 저장 공간 부족 가능

### 해결 방안

#### ✅ 권장: 페이지네이션 구현

```javascript
// 최근 100개만 로드
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(100);  // 최근 100개만
```

#### ✅ 무한 스크롤 구현

```javascript
// 스크롤 시 이전 메시지 추가 로드
const loadMoreMessages = async (lastMessageId) => {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .lt('id', lastMessageId)  // 마지막 메시지보다 이전 것들
    .order('created_at', { ascending: false })
    .limit(50);
};
```

#### ✅ 오래된 메시지 아카이빙

```sql
-- 90일 이상 된 메시지 자동 삭제 (또는 아카이브)
DELETE FROM messages 
WHERE created_at < NOW() - INTERVAL '90 days';
```

#### ✅ 추가 인덱스 최적화

`performance_optimization.sql` 파일 참고:
- 복합 인덱스 추가
- 통계 정보 업데이트

### 성능 모니터링

다음 지표를 주기적으로 확인하세요:

1. **메시지 수**: 유저당 평균 메시지 수
2. **쿼리 시간**: `loadMessages()` 실행 시간
3. **저장 공간**: Supabase 대시보드에서 확인
4. **메모리 사용량**: 브라우저 개발자 도구에서 확인

### 예상 임계값

- **경고**: 유저당 1,000개 이상 메시지
- **위험**: 유저당 10,000개 이상 메시지
- **즉시 조치 필요**: 유저당 50,000개 이상 메시지

## 📝 참고사항

- **모든 유저 데이터가 같은 테이블에 저장되는 것은 정상입니다**
- RLS가 쿼리 레벨에서 자동으로 필터링합니다
- 각 유저는 자신의 데이터만 접근할 수 있습니다
- 이것은 Supabase/PostgreSQL의 표준 멀티테넌트 패턴입니다
- **하지만 페이지네이션이나 제한 없이 모든 데이터를 로드하면 성능 문제 발생 가능**

