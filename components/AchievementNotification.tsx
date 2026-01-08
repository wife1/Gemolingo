import React, { useEffect } from 'react';
import { Achievement } from '../types';
import { X } from 'lucide-react';

interface Props {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementNotification: React.FC<Props> = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="bg-yellow-400 text-yellow-900 px-6 py-4 rounded-2xl shadow-2xl border-b-8 border-yellow-600 flex items-center gap-4 min-w-[300px]">
        <div className="bg-white p-2 rounded-full shadow-lg text-2xl">
          {achievement.icon}
        </div>
        <div className="flex-1">
          <div className="text-xs font-black uppercase tracking-wider opacity-75">Achievement Unlocked!</div>
          <div className="font-bold text-lg leading-tight">{achievement.title}</div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-yellow-500 rounded-full text-white">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};