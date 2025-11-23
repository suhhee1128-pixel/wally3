import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initGA } from './lib/analytics';

// Google Analytics 초기화 (비동기, 블로킹하지 않음)
const gaMeasurementId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-PEW2CSJ9GW';
console.log('[index.js] Initializing Google Analytics with ID:', gaMeasurementId);

// 앱 렌더링을 블로킹하지 않도록 별도로 실행
setTimeout(() => {
  initGA(gaMeasurementId).catch(error => {
    console.error('[index.js] Failed to initialize GA:', error);
    // GA 초기화 실패해도 앱은 계속 실행됨
  });
}, 0);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker 등록 (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

