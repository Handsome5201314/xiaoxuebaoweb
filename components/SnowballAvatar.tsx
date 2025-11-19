import React from 'react';

interface SnowballAvatarProps {
  isTalking: boolean;
  emotion?: 'happy' | 'neutral' | 'concerned';
}

export const SnowballAvatar: React.FC<SnowballAvatarProps> = ({ isTalking, emotion = 'neutral' }) => {
  return (
    <div className="relative w-32 h-32 mx-auto mb-4 transition-all duration-500 ease-in-out transform hover:scale-105">
      {/* Body (Snowball) */}
      <div className={`absolute inset-0 bg-white rounded-full shadow-2xl border-4 border-sky-100 ${isTalking ? 'animate-bounce-slow' : ''}`}></div>
      
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-blue-200 opacity-20 rounded-full blur-xl animate-pulse"></div>

      {/* Face Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        {/* Eyes */}
        <div className="flex space-x-6 mb-2">
          {/* Left Eye */}
          <div className="w-3 h-4 bg-gray-800 rounded-full animate-blink relative">
            <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-80"></div>
          </div>
          {/* Right Eye */}
          <div className="w-3 h-4 bg-gray-800 rounded-full animate-blink relative">
             <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-80"></div>
          </div>
        </div>

        {/* Cheeks */}
        <div className="absolute top-14 w-full flex justify-between px-6 opacity-40">
            <div className="w-4 h-2 bg-red-300 rounded-full blur-sm"></div>
            <div className="w-4 h-2 bg-red-300 rounded-full blur-sm"></div>
        </div>

        {/* Mouth */}
        <div className={`transition-all duration-300 ${
          isTalking 
            ? 'w-4 h-3 border-2 border-gray-700 rounded-full bg-red-100 animate-ping' 
            : emotion === 'happy' 
              ? 'w-6 h-3 border-b-2 border-gray-700 rounded-b-full' 
              : 'w-4 h-1 bg-gray-700 rounded-full'
        }`}></div>
      </div>

      {/* Scarf (Accessory) */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-orange-300 rounded-full shadow-sm rotate-2 z-10 flex items-center justify-center">
          <div className="w-full border-t border-dashed border-orange-100 opacity-50"></div>
      </div>
    </div>
  );
};