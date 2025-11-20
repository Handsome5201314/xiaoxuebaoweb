import React from 'react';

interface SnowballAvatarProps {
  isTalking: boolean;
  emotion?: 'happy' | 'neutral' | 'concerned';
}

export const SnowballAvatar: React.FC<SnowballAvatarProps> = ({ isTalking, emotion = 'neutral' }) => {
  
  // Determine body styles based on emotion
  let bodyStyle = "bg-white border-sky-100"; // Default Neutral
  let glowColor = "bg-blue-200";

  if (emotion === 'happy') {
    // Warm / Happy (Yellow-Orangeish)
    bodyStyle = "bg-gradient-to-br from-white via-yellow-50 to-orange-100 border-orange-200";
    glowColor = "bg-yellow-200";
  } else if (emotion === 'concerned') {
    // Cool / Concerned (Blue-Greyish)
    bodyStyle = "bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-200";
    glowColor = "bg-indigo-200";
  }

  // Dynamic Eye Styles
  const getEyeStyle = () => {
    switch (emotion) {
      case 'happy':
        return "h-2 w-4 mt-2 rounded-full"; // Squint/Smile
      case 'concerned':
        return "h-5 w-3.5 -mt-0.5 rounded-full"; // Wide/Alert
      default:
        return "h-4 w-3 rounded-full"; // Neutral
    }
  };

  // Dynamic Cheek Styles
  const getCheekStyle = () => {
    switch (emotion) {
      case 'happy':
        return "bg-red-400 scale-125 opacity-60 animate-pulse"; // Blushing
      case 'concerned':
        return "bg-blue-300 scale-90 opacity-30"; // Pale
      default:
        return "bg-red-300 opacity-40"; // Neutral
    }
  };

  return (
    <div className="relative w-32 h-32 mx-auto mb-4 transition-all duration-500 ease-in-out transform hover:scale-105">
      {/* Body (Snowball) */}
      <div className={`absolute inset-0 rounded-full shadow-2xl border-4 transition-colors duration-500 ${bodyStyle} ${isTalking ? 'animate-bounce-slow' : ''}`}></div>
      
      {/* Glow effect */}
      <div className={`absolute -inset-4 opacity-20 rounded-full blur-xl animate-pulse transition-colors duration-500 ${glowColor}`}></div>

      {/* Face Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        {/* Eyes */}
        <div className="flex space-x-6 mb-2 items-center h-6">
          {/* Left Eye */}
          <div className={`bg-gray-800 transition-all duration-300 relative overflow-hidden ${getEyeStyle()} animate-blink`}>
            <div className={`absolute top-0.5 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-90 ${emotion === 'happy' ? 'translate-x-0.5 animate-pulse' : ''}`}></div>
          </div>
          {/* Right Eye */}
          <div className={`bg-gray-800 transition-all duration-300 relative overflow-hidden ${getEyeStyle()} animate-blink`}>
             <div className={`absolute top-0.5 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-90 ${emotion === 'happy' ? 'translate-x-0.5 animate-pulse' : ''}`}></div>
          </div>
        </div>

        {/* Cheeks */}
        <div className="absolute top-14 w-full flex justify-between px-6">
            <div className={`w-4 h-2 rounded-full blur-sm transition-all duration-500 ${getCheekStyle()}`}></div>
            <div className={`w-4 h-2 rounded-full blur-sm transition-all duration-500 ${getCheekStyle()}`}></div>
        </div>

        {/* Mouth */}
        <div className={`transition-all duration-300 ${
          isTalking 
            ? 'w-4 h-3 border-2 border-gray-700 rounded-full bg-red-100 animate-ping' 
            : emotion === 'happy' 
              ? 'w-6 h-3 border-b-2 border-gray-700 rounded-b-full mt-1' 
              : emotion === 'concerned'
                ? 'w-3 h-1.5 bg-gray-700 rounded-full mt-2 opacity-80' // Small O mouth
                : 'w-4 h-1 bg-gray-700 rounded-full' // Neutral
        }`}></div>
      </div>

      {/* Scarf (Accessory) */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-orange-300 rounded-full shadow-sm rotate-2 z-10 flex items-center justify-center group hover:rotate-0 transition-transform">
          <div className="w-full border-t border-dashed border-orange-100 opacity-50"></div>
      </div>
    </div>
  );
};