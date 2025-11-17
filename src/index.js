import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initGA } from './lib/analytics';

// Google Analytics 초기화 (가장 먼저 실행)
const gaMeasurementId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-PEW2CSJ9GW';
console.log('[index.js] Initializing Google Analytics with ID:', gaMeasurementId);
initGA(gaMeasurementId).catch(error => {
  console.error('[index.js] Failed to initialize GA:', error);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

