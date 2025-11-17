// Google Analytics 4 초기화 및 추적 유틸리티
import ReactGA from 'react-ga4';

// gtag.js 스크립트 동적 로드
const loadGtagScript = (measurementId) => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있는지 확인
    if (window.gtag && window.dataLayer) {
      console.log('gtag.js already loaded');
      resolve();
      return;
    }

    // dataLayer 초기화
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    // gtag.js 스크립트 로드
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onload = () => {
      console.log('gtag.js script loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load gtag.js script');
      reject(new Error('Failed to load gtag.js'));
    };
    document.head.appendChild(script);
  });
};

// Google Analytics 초기화
export const initGA = async (measurementId) => {
  if (!measurementId || typeof window === 'undefined') {
    console.warn('Google Analytics: Invalid measurement ID or not in browser');
    return;
  }

  try {
    // 먼저 gtag.js 스크립트 로드
    await loadGtagScript(measurementId);
    
    // 그 다음 react-ga4 초기화
    ReactGA.initialize(measurementId, {
      testMode: process.env.NODE_ENV === 'development'
    });
    
    console.log('Google Analytics initialized:', measurementId);
    console.log('dataLayer:', window.dataLayer);
    console.log('gtag function:', typeof window.gtag);
  } catch (error) {
    console.error('Failed to initialize Google Analytics:', error);
  }
};

// 페이지뷰 추적
export const trackPageView = (page) => {
  if (typeof window !== 'undefined') {
    ReactGA.send({ hitType: 'pageview', page });
    console.log('Page view tracked:', page);
  }
};

// 이벤트 추적
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined') {
    ReactGA.event(eventName, eventParams);
    console.log('Event tracked:', eventName, eventParams);
  }
};

// 사용자 액션 추적 예시
export const trackUserAction = (action, details = {}) => {
  trackEvent('user_action', {
    action,
    ...details
  });
};

// 거래 추가 추적
export const trackTransactionAdded = (amount, category) => {
  trackEvent('transaction_added', {
    value: amount,
    category: category || 'uncategorized'
  });
};

// AI 채팅 추적
export const trackAIChat = (aiId, messageLength) => {
  trackEvent('ai_chat', {
    ai_character: aiId,
    message_length: messageLength
  });
};

// 로그인 추적
export const trackLogin = (method) => {
  trackEvent('login', {
    method: method || 'email'
  });
};

// 로그아웃 추적
export const trackLogout = () => {
  trackEvent('logout');
};

