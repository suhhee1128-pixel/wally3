import React from 'react';
import './NavigationBar.css';

function NavigationBar({ currentPage, onNavigate }) {
  const navItems = [
    {
      id: 'spending',
      label: 'Spending',
      iconSize: 22,
      icon: (isActive, size) => (
        <svg className={`${isActive ? 'text-[#F35DC8]' : 'text-gray-400'}`} style={{ width: size, height: size }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
    {
      id: 'chat',
      label: 'Chat',
      iconSize: 21,
      icon: (isActive, size) => (
        <svg className={`${isActive ? 'text-[#F35DC8]' : 'text-gray-400'}`} style={{ width: size, height: size }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      iconSize: 24,
      icon: (isActive, size) => (
        <svg className={`${isActive ? 'text-[#F35DC8]' : 'text-gray-400'}`} style={{ width: size, height: size }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      )
    },
    {
      id: 'mood',
      label: 'Mood',
      iconSize: 22,
      icon: (isActive, size) => (
        <svg
          className={`${isActive ? 'text-[#F35DC8]' : 'text-gray-400'}`}
          style={{ width: size, height: size }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" fill={isActive ? '#FFE68A' : 'none'} />
          <circle cx="9" cy="11" r="1.2" fill="currentColor" />
          <circle cx="15" cy="11" r="1.2" fill="currentColor" />
          <path d="M9 15c.7.9 1.7 1.4 3 1.4s2.3-.5 3-1.4" stroke="currentColor" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      iconSize: 22,
      icon: (isActive, size) => (
        <svg className={`${isActive ? 'text-[#F35DC8]' : 'text-gray-400'}`} style={{ width: size, height: size }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="navigation-bar">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          aria-label={item.label}
        >
          {item.icon(currentPage === item.id, item.iconSize)}
        </button>
      ))}
    </div>
  );
}

export default NavigationBar;

