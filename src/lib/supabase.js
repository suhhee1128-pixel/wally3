import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file.')
}

// 개발 환경에서만 초기화 로그 출력
if (process.env.NODE_ENV === 'development') {
  console.log('Initializing Supabase client:', { 
    url: supabaseUrl, 
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length,
    envUrl: process.env.REACT_APP_SUPABASE_URL ? '✅ .env에서 로드됨' : '❌ .env에서 로드 안됨',
    envKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ .env에서 로드됨' : '❌ .env에서 로드 안됨'
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection (비동기, 블로킹하지 않음)
setTimeout(() => {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
      // 연결 실패해도 앱은 계속 실행됨
    } else {
      console.log('Supabase connection test successful');
    }
  }).catch(err => {
    console.error('Supabase connection test error:', err);
    // 에러가 발생해도 앱은 계속 실행됨
  });
}, 100);

