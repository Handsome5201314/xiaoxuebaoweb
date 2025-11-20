import React, { useEffect, useState } from 'react';
import { Mic, MicOff, PhoneOff, Activity } from 'lucide-react';
import { CallState } from '../types';
import { SnowballAvatar } from './SnowballAvatar';

interface CallOverlayProps {
  status: CallState;
  onEndCall: (duration: number) => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ status, onEndCall }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let timer: any;
    if (status === CallState.Active) {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to mock toggle mute visually (actual logic would need to access MediaStream)
  // Since Live API manages the stream internally in the service in this simple example, 
  // we'll just toggle the visual state for now.
  const toggleMute = () => {
      setIsMuted(!isMuted);
      // In a real app, you'd pass this down to the service to track.enabled = false
  };

  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-between py-12 px-6 animate-fade-in overflow-hidden rounded-[inherit]">
      
      {/* Top Status */}
      <div className="text-white text-center mt-8">
        <h2 className="text-3xl md:text-4xl font-bold font-['ZCOOL_KuaiLe'] mb-2">小雪宝</h2>
        <div className="flex items-center justify-center space-x-2 text-blue-100">
           {status === CallState.Connecting && <Activity className="animate-spin" size={16} />}
           <span className="text-lg md:text-xl">
             {status === CallState.Connecting ? '正在连接...' : 
              status === CallState.Active ? formatTime(duration) : 
              status === CallState.Error ? '连接失败' : '通话结束'}
           </span>
        </div>
      </div>

      {/* Center Avatar & Visualizer */}
      <div className="relative flex-1 flex items-center justify-center w-full">
        {/* Pulsing Rings */}
        {status === CallState.Active && (
          <>
            <div className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-white/20 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full border border-white/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
          </>
        )}
        
        <div className="transform scale-125 md:scale-150 transition-transform">
           <SnowballAvatar isTalking={status === CallState.Active} emotion="happy" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center space-x-8 mb-8">
         <button 
           onClick={toggleMute}
           className={`p-4 md:p-6 rounded-full transition-all shadow-lg ${isMuted ? 'bg-white text-gray-800' : 'bg-white/20 text-white hover:bg-white/30'}`}
         >
            {isMuted ? <MicOff size={32} className="md:w-10 md:h-10" /> : <Mic size={32} className="md:w-10 md:h-10" />}
         </button>

         <button 
           onClick={() => onEndCall(duration)}
           className="p-6 md:p-8 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 transform hover:scale-105 transition-all active:scale-95"
         >
            <PhoneOff size={40} className="md:w-12 md:h-12" fill="currentColor" />
         </button>
      </div>
    </div>
  );
};