import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ydlmkmgwxinfbhqbdben.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkbG1rbWd3eGluZmJocWJkYmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzE1MzMsImV4cCI6MjA3Nzg0NzUzM30.XEDXjp2FuA1x-Vbb7rD2uqx_GKauksdTAt9Jc7zqqXs'

console.log('Initializing Supabase client:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  envUrl: process.env.REACT_APP_SUPABASE_URL ? '✅ .env에서 로드됨' : '❌ .env에서 로드 안됨 (기본값 사용)',
  envKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ .env에서 로드됨' : '❌ .env에서 로드 안됨 (기본값 사용)'
});

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

