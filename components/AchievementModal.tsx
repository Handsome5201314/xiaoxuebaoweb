import React from 'react';
import { Trophy, Lock, CheckCircle } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  unlockedIds: string[];
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose, achievements, unlockedIds }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 flex justify-between items-center">
          <div className="flex items-center text-white">
            <Trophy className="w-6 h-6 mr-2" />
            <h2 className="text-lg font-bold font-['ZCOOL_KuaiLe']">我的成就馆</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white font-bold text-xl">&times;</button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {achievements.map((achievement) => {
              const isUnlocked = unlockedIds.includes(achievement.id);
              return (
                <div 
                  key={achievement.id} 
                  className={`flex items-center p-3 rounded-xl border-2 transition-all ${
                    isUnlocked 
                      ? 'border-yellow-200 bg-yellow-50' 
                      : 'border-gray-100 bg-gray-50 opacity-70 grayscale'
                  }`}
                >
                  <div className={`p-2 rounded-full mr-3 ${isUnlocked ? 'bg-white text-yellow-500 shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
                    {isUnlocked ? achievement.icon : <Lock size={20} />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-sm ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-tight mt-1">{achievement.description}</p>
                  </div>
                  {isUnlocked && <CheckCircle className="text-green-500 w-4 h-4 ml-2" />}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 text-center">
            <p className="text-xs text-gray-400">继续探索小雪宝的世界来解锁更多！</p>
        </div>
      </div>
    </div>
  );
};