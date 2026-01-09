import React from 'react';
import { UserState, Difficulty } from '../../types';
import { Zap, Flame, Signal, ChevronDown, Check } from 'lucide-react';

interface HeaderProps {
  userState: UserState;
  currentLangConfig: any;
  difficulties: Difficulty[];
  onShowLanguageSelector: () => void;
  onChangeDifficulty: (diff: Difficulty) => void;
  onToggleTimer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userState,
  currentLangConfig,
  difficulties,
  onShowLanguageSelector,
  onChangeDifficulty,
  onToggleTimer
}) => {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        {/* Language Selector Trigger */}
        <button
          onClick={onShowLanguageSelector}
          className="flex items-center gap-1 hover:bg-gray-100 p-2 rounded-xl transition-all active:scale-95 border-2 border-transparent hover:border-gray-200"
          title="Select Language"
        >
          <span className="text-2xl">{currentLangConfig?.flag}</span>
        </button>

        {/* Difficulty Selector */}
        <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors group relative border-2 border-transparent hover:border-gray-200">
          <Signal size={16} className={`
             ${userState.difficulty === 'beginner' ? 'text-green-500' : ''}
             ${userState.difficulty === 'intermediate' ? 'text-yellow-500' : ''}
             ${userState.difficulty === 'advanced' ? 'text-red-500' : ''}
          `} />
          <span className="font-bold text-xs text-gray-600 capitalize hidden min-[360px]:block">{userState.difficulty}</span>
          <ChevronDown size={14} className="text-gray-400" />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 hidden group-focus-within:block w-40 z-50 animate-pop-in">
            {difficulties.map(diff => (
              <div
                key={diff}
                onClick={() => onChangeDifficulty(diff)}
                className={`
                   flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 
                   ${userState.difficulty === diff ? 'bg-blue-50 text-duo-blue' : 'text-gray-600'}
                 `}
              >
                <div className={`w-2 h-2 rounded-full ${diff === 'beginner' ? 'bg-green-400' :
                  diff === 'intermediate' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                <span className="capitalize font-bold text-sm">{diff}</span>
                {userState.difficulty === diff && <Check size={14} className="ml-auto" />}
              </div>
            ))}
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTimer}
          className={`
             flex items-center gap-1 px-2 py-1.5 rounded-xl transition-all border-b-4 active:border-b-0 active:translate-y-1 focus:outline-none
             ${userState.timerEnabled
              ? 'bg-yellow-400 border-yellow-600 text-yellow-900 shadow-lg'
              : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
            }
           `}
          title={userState.timerEnabled ? "Speed Run Active" : "Enable Speed Run"}
        >
          <Zap size={16} className={userState.timerEnabled ? "fill-current animate-pulse" : ""} />
          <span className="font-extrabold text-[10px] tracking-wide hidden min-[400px]:block">SPEED</span>
        </button>

        <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
          <Flame className="fill-current" size={18} /> {userState.streak}
        </div>
        <div className="flex items-center gap-1 text-duo-yellow-dark font-bold text-sm">
          <Zap className="fill-current" size={18} /> {userState.xp}
        </div>
      </div>
    </div>
  );
};