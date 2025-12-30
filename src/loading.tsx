import logo from '@/assets/images/logo.svg';
import React from 'react';

const Loading: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: '#ffffff',

        zIndex: 9999,
      }}
    >
      <img
        src={logo}
        alt="Loading..."
        style={{
          width: 120,
          height: 'auto',
          marginBottom: 24,

          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      <span
        style={{
          fontFamily: 'YekanBakh, Tahoma, sans-serif',
          fontSize: 16,
          color: '#666666',
        }}
      >
        در حال بارگذاری...
      </span>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(0.97);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
