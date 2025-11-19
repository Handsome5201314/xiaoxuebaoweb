import React from 'react';
import { Star, Heart, Trophy } from 'lucide-react';
import { UserStats } from '../types';

interface StatsBarProps {
  stats: UserStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-sm border border-blue-50 flex justify-around items-center mb-4 mx-4">
      <div className="flex flex-col items-center">
        <div className="flex items-center text-yellow-500 font-bold text-lg">
          <Star className="w-5 h-5 fill-current mr-1" />
          {stats.stars}
        </div>
        <span className="text-xs text-gray-500">勇气星</span>
      </div>

      <div className="h-8 w-px bg-gray-200"></div>

      <div className="flex flex-col items-center">
        <div className="flex items-center text-red-400 font-bold text-lg">
          <Heart className="w-5 h-5 fill-current mr-1" />
          {stats.level}
        </div>
        <span className="text-xs text-gray-500">健康等级</span>
      </div>

      <div className="h-8 w-px bg-gray-200"></div>

      <div className="flex flex-col items-center">
        <div className="flex items-center text-purple-500 font-bold text-lg">
          <Trophy className="w-5 h-5 mr-1" />
          {stats.streak}
        </div>
        <span className="text-xs text-gray-500">连续打卡</span>
      </div>
    </div>
  );
};