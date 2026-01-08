import React from 'react';
import { Trophy, CheckCircle, Target } from 'lucide-react';

interface Props {
  dailyXp: number;
  dailyGoal: number;
}

export const DailyGoalWidget: React.FC<Props> = ({ dailyXp, dailyGoal }) => {
  const progress = Math.min(100, (dailyXp / dailyGoal) * 100);
  const isComplete = dailyXp >= dailyGoal;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 mb-8 mx-auto w-full max-w-md shadow-sm relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-5 transform translate-x-4 -translate-y-4">
        <Target size={100} />
      </div>

      <div className="flex items-center justify-between mb-2 relative z-10">
        <h3 className="font-bold text-gray-700 uppercase tracking-widest text-xs">Daily Goal</h3>
        <span className="font-bold text-duo-yellow-dark text-sm">{dailyXp} / {dailyGoal} XP</span>
      </div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={`
             w-12 h-12 rounded-xl flex items-center justify-center border-b-4 transition-all duration-500
             ${isComplete 
               ? 'bg-duo-yellow border-duo-yellow-dark text-white scale-110' 
               : 'bg-white border-gray-200 text-gray-300'
             }
        `}>
            {isComplete ? <CheckCircle size={28} className="animate-bounce" /> : <Target size={28} />}
        </div>
        
        <div className="flex-1">
             <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${isComplete ? 'bg-duo-yellow' : 'bg-duo-blue'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
             <p className="text-xs text-gray-400 mt-2 font-bold">
                {isComplete ? "Goal Complete! You're on fire! 🔥" : "Complete exercises to reach your goal!"}
             </p>
        </div>
      </div>
    </div>
  );
};