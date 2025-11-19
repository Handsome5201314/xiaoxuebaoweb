import React from 'react';
import { TutorialStep } from '../types';

interface TutorialOverlayProps {
  step: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, currentStepIndex, totalSteps, onNext, onSkip }) => {
  const target = document.getElementById(step.targetId);
  
  if (!target) return null;
  
  const rect = target.getBoundingClientRect();
  
  // Calculate position for the tooltip
  let top = 0;
  let left = 0;
  const tooltipWidth = 280; 
  
  switch (step.position) {
    case 'bottom':
      top = rect.bottom + 16;
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      break;
    case 'top':
      top = rect.top - 150; 
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      break;
    case 'left':
        top = rect.top;
        left = rect.left - tooltipWidth - 16;
        break;
    default:
      top = rect.bottom + 16;
      left = rect.left;
  }

  // Ensure it doesn't go off screen
  if (left < 10) left = 10;
  if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 10;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Dark Background with hole */}
      <div className="absolute inset-0 bg-black/60 mix-blend-hard-light"></div>
      
      {/* Highlighter */}
      <div 
        className="absolute transition-all duration-500 ease-in-out border-4 border-yellow-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-[101] animate-pulse"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        }}
      ></div>

      {/* Tooltip Card */}
      <div 
        className="absolute bg-white p-5 rounded-2xl shadow-2xl z-[102] w-[280px] flex flex-col animate-bounce-slow"
        style={{ top, left }}
      >
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">新手引导 {currentStepIndex + 1}/{totalSteps}</span>
            <button onClick={onSkip} className="text-gray-300 hover:text-gray-500 text-xs underline">跳过</button>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2 font-['ZCOOL_KuaiLe']">{step.title}</h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{step.content}</p>
        <button 
          onClick={onNext}
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-transform active:scale-95"
        >
          {currentStepIndex === totalSteps - 1 ? '开始旅程！' : '下一步'}
        </button>
        
        {/* Arrow */}
        <div 
          className={`absolute w-4 h-4 bg-white transform rotate-45 ${
             step.position === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2' :
             step.position === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2' : ''
          }`}
        ></div>
      </div>
    </div>
  );
};