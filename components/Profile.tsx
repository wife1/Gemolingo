import React from 'react';
import { UserState } from '../types';
import { ArrowLeft, User, Trophy, Calendar, Zap, Medal } from 'lucide-react';

interface ProfileProps {
  userState: UserState;
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ userState, onBack }) => {
  const unlockedCount = userState.achievements.filter(a => a.unlocked).length;
  
  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-700">Profile</h1>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 mb-8">
        <div className="flex items-center gap-4 mb-6 border-b pb-6">
          <div className="w-20 h-20 bg-duo-green rounded-full flex items-center justify-center text-4xl border-4 border-duo-green-dark">
            <User className="text-white w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Language Learner</h2>
            <p className="text-gray-500">Joined 2024</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-orange-500 font-bold">
              <Calendar size={20} /> Streak
            </div>
            <div className="text-2xl font-black text-gray-700">{userState.streak}</div>
          </div>
          <div className="border rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-duo-yellow-dark font-bold">
              <Zap size={20} /> Total XP
            </div>
            <div className="text-2xl font-black text-gray-700">{userState.xp}</div>
          </div>
          <div className="border rounded-xl p-4 flex flex-col gap-1">
             <div className="flex items-center gap-2 text-duo-blue font-bold">
              <Medal size={20} /> Lessons
            </div>
            <div className="text-2xl font-black text-gray-700">{userState.completedLessons.length}</div>
          </div>
           <div className="border rounded-xl p-4 flex flex-col gap-1">
             <div className="flex items-center gap-2 text-purple-500 font-bold">
              <Trophy size={20} /> Awards
            </div>
            <div className="text-2xl font-black text-gray-700">{unlockedCount} / {userState.achievements.length}</div>
          </div>
        </div>
      </div>

      {/* Achievements List */}
      <h3 className="text-xl font-bold mb-4 text-gray-700">Achievements</h3>
      <div className="space-y-4">
        {userState.achievements.map((ach) => (
          <div 
            key={ach.id} 
            className={`
              flex items-center gap-4 p-4 rounded-xl border-2 border-b-4
              ${ach.unlocked ? 'bg-white border-yellow-400' : 'bg-gray-100 border-gray-200 opacity-70'}
            `}
          >
             <div className={`
               w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm
               ${ach.unlocked ? 'bg-gradient-to-br from-yellow-100 to-yellow-300' : 'bg-gray-200 grayscale'}
             `}>
               {ach.icon}
             </div>
             <div className="flex-1">
               <h4 className={`font-bold ${ach.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>{ach.title}</h4>
               <p className="text-sm text-gray-500">{ach.description}</p>
               {ach.unlocked && (
                 <p className="text-xs text-yellow-600 font-bold mt-1">UNLOCKED</p>
               )}
               {!ach.unlocked && (
                 <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden w-full max-w-[150px]">
                    <div 
                      className="h-full bg-gray-400" 
                      style={{ width: `${Math.min(100, (getProgress(ach, userState) / ach.threshold) * 100)}%` }}
                    />
                 </div>
               )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getProgress(ach: any, state: UserState) {
  switch (ach.conditionType) {
    case 'LESSONS_COMPLETED': return state.completedLessons.length;
    case 'STREAK_DAYS': return state.streak;
    case 'XP_EARNED': return state.xp;
    default: return 0;
  }
}