-- 성능 최적화를 위한 추가 인덱스 및 정책

-- 1. 복합 인덱스 추가 (user_id + created_at 조합 쿼리 최적화)
CREATE INDEX IF NOT EXISTS messages_user_id_created_at_idx 
ON messages(user_id, created_at DESC);

-- 2. ai_type과 user_id 조합 인덱스 (AI 메시지 필터링 최적화)
CREATE INDEX IF NOT EXISTS messages_user_id_ai_type_idx 
ON messages(user_id, ai_type) 
WHERE ai_type IS NOT NULL;

-- 3. 오래된 메시지 정리 함수 (선택사항)
-- 90일 이상 된 메시지를 아카이브 테이블로 이동하거나 삭제
CREATE OR REPLACE FUNCTION archive_old_messages()
RETURNS void AS $$
BEGIN
  -- 90일 이상 된 메시지 삭제 (또는 아카이브 테이블로 이동)
  DELETE FROM messages 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 4. 통계 정보 업데이트 (쿼리 플래너 최적화)
ANALYZE messages;




