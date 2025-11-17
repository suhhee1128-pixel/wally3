// Google Analytics 4 초기화 및 추적 유틸리티
import ReactGA from 'react-ga4';

// Google Analytics 초기화
export const initGA = (measurementId) => {
  if (measurementId && typeof window !== 'undefined') {
    ReactGA.initialize(measurementId, {
      testMode: process.env.NODE_ENV === 'development' // 개발 모드에서는 테스트 모드로 실행
    });
    console.log('Google Analytics initialized:', measurementId);
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

