import React from 'react';

function LoadingIcon({ size = 40, color = '#0B0B0F', strokeWidth = 2, className = '' }) {
  const half = size / 2;
  const radius = half - strokeWidth;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[...Array(8)].map((_, index) => {
        const angle = (Math.PI / 4) * index;
        const x1 = half + Math.cos(angle) * (radius - 6);
        const y1 = half + Math.sin(angle) * (radius - 6);
        const x2 = half + Math.cos(angle) * radius;
        const y2 = half + Math.sin(angle) * radius;
        const opacity = 0.25 + (index / 8) * 0.75;

        return (
      <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={opacity}
          className={className}
          />
        );
      })}
    </svg>
  );
}

export default LoadingIcon;

