
import React, { useState, useEffect, useRef } from 'react';
import { UserState, SUPPORTED_LANGUAGES, Difficulty, Lesson } from '../types';
import { Button } from './UI';
import { DailyGoalWidget } from './DailyGoalWidget';
import { Star, Zap, Trophy, Flame, Download, Check, Trash2, Loader2, WifiOff, Globe, Timer, Crown, Store } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onStartLesson: (topicId: string, topicName: string) => void;
  onChangeLanguage: (code: string) => void;
  onChangeDifficulty: (diff: Difficulty) => void;
  onToggleTimer: () => void;
  offlineLessons: Record<string, Record<string, Lesson>>;
  onDownload: (topicId: string, topicName: string) => void;
  onDeleteDownload: (topicId: string) => void;
  onOpenProfile: () => void;
  onOpenShop: () => void;
  downloadingId: string | null;
  isOffline: boolean;
}

const TOPICS = [
  { id: 'basics', name: 'Basics', icon: '🥚', color: 'bg-green-500' },
  { id: 'greetings', name: 'Greetings', icon: '👋', color: 'bg-blue-500' },
  { id: 'food', name: 'Food', icon: '🍎', color: 'bg-red-500' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'bg-purple-500' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧', color: 'bg-yellow-500' },
  { id: 'hobbies', name: 'Hobbies', icon: '🎨', color: 'bg-pink-500' },
  { id: 'work', name: 'Work', icon: '💼', color: 'bg-indigo-500' },
  { id: 'weather', name: 'Weather', icon: '☀️', color: 'bg-orange-500' },
  { id: 'emotions', name: 'Emotions', icon: '😊', color: 'bg-teal-500' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'bg-rose-500' },
];

export const Dashboard: React.FC<DashboardProps> = ({
  userState,
  onStartLesson,
  onChangeLanguage,
  onChangeDifficulty,
  onToggleTimer,
  offlineLessons,
  onDownload,
  onDeleteDownload,
  onOpenProfile,
  onOpenShop,
  downloadingId,
  isOffline
}) => {
  const [focusedTopicIndex, setFocusedTopicIndex] = useState(0);
  const topicRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // On mount, auto-focus the first incomplete lesson
  useEffect(() => {
    const firstUnfinished = TOPICS.findIndex(t => !userState.completedLessons.includes(t.id));
    if (firstUnfinished !== -1) {
      setFocusedTopicIndex(firstUnfinished);
    } else {
      setFocusedTopicIndex(TOPICS.length - 1);
    }
  }, []); // Only on mount

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow moving through lessons with arrows
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedTopicIndex(prev => Math.min(prev + 1, TOPICS.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedTopicIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const topic = TOPICS[focusedTopicIndex];
        if (topic) {
          onStartLesson(topic.id, topic.name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedTopicIndex, onStartLesson]);

  // Auto-scroll to focused topic
  useEffect(() => {
    if (topicRefs.current[focusedTopicIndex]) {
      topicRefs.current[focusedTopicIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [focusedTopicIndex]);

  const currentLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === userState.currentLanguage);
  
  // Helper to check download status
  const getOfflineStatus = (topicId: string) => {
    const lang = userState.currentLanguage;
    const diff = userState.difficulty;
    const key = `${topicId}-${diff}`;
    
    if (offlineLessons[lang] && offlineLessons[lang][key]) return 'DOWNLOADED';
    return 'NONE';
  };

  const totalCrowns = Object.values(userState.topicLevels || {}).reduce((a, b) => Number(a) + Number(b), 0);
  const maxCrowns = TOPICS.length * 5;

  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded-lg transition-colors group relative">
             <span className="text-2xl">{currentLangConfig?.flag}</span>
             {/* Simple Language Dropdown Simulator */}
             <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 hidden group-focus-within:block w-48 z-50">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <div 
                    key={lang.code}
                    onClick={() => onChangeLanguage(lang.code)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${userState.currentLanguage === lang.code ? 'bg-blue-50' : ''}`}
                  >
                    <span>{lang.flag}</span>
                    <span className="font-bold text-gray-700">{lang.name}</span>
                    {userState.currentLanguage === lang.code && <Check size={16} className="text-duo-green ml-auto"/>}
                  </div>
                ))}
             </div>
           </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-yellow-500 font-bold" title="Total Crowns">
             <Crown className="fill-current" size={20} /> {totalCrowns}
          </div>

          <button 
            onClick={onToggleTimer}
            className={`
              flex items-center justify-center p-1.5 rounded-lg transition-colors border-2
              ${userState.timerEnabled 
                ? 'bg-red-50 text-red-500 border-red-200' 
                : 'bg-gray-50 text-gray-300 border-transparent hover:bg-gray-100'
              }
            `}
            title={userState.timerEnabled ? "Timer Active" : "Enable Timer"}
          >
            <Timer size={20} className={userState.timerEnabled ? "fill-red-100" : ""} />
          </button>

          <div className="flex items-center gap-1 text-orange-500 font-bold">
            <Flame className="fill-current" size={20} /> {userState.streak}
          </div>
          <div className="flex items-center gap-1 text-duo-yellow-dark font-bold">
            <Zap className="fill-current" size={20} /> {userState.xp}
          </div>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        <div className="space-y-4">
           {/* Daily Goal */}
           <DailyGoalWidget dailyXp={userState.dailyXp} dailyGoal={userState.dailyGoal} />

           {/* Course Progress Widget */}
           <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
               <div className="flex items-center justify-between mb-2 z-10 relative">
                 <span className="font-bold text-yellow-100 uppercase text-xs tracking-wider">Course Mastery</span>
                 <span className="font-bold">{Math.round((totalCrowns / maxCrowns) * 100)}%</span>
               </div>
               <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden z-10 relative">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(totalCrowns / maxCrowns) * 100}%` }} />
               </div>
               <Crown className="absolute -bottom-4 -right-4 w-24 h-24 text-white/20 rotate-12" />
           </div>
        </div>

        <div className="flex flex-col items-center gap-8 relative py-4">
           {/* Path Guide Line (Simplified) */}
           <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-gray-200 -translate-x-1/2 rounded-full -z-10" />

           {TOPICS.map((topic, index) => {
             // Unlock logic: First item is unlocked, or if previous topic has at least level 1 (or is in completedLessons for backward compat)
             const prevTopic = index > 0 ? TOPICS[index - 1] : null;
             // Use safer optional chaining and default
             const prevLevelRaw = prevTopic && userState.topicLevels ? userState.topicLevels[prevTopic.id] : undefined;
             
             // Explicitly cast to number to satisfy strict arithmetic checks
             const prevLevelVal = typeof prevLevelRaw === 'number' ? prevLevelRaw : 0;
             const isPrevCompleted = prevTopic ? userState.completedLessons.includes(prevTopic.id) : false;
             const prevLevel = prevTopic 
               ? (prevLevelVal > 0 ? prevLevelVal : (isPrevCompleted ? 1 : 0))
               : 1;
             
             const isUnlocked = index === 0 || prevLevel > 0;
             
             const levelRaw = userState.topicLevels?.[topic.id];
             const level = typeof levelRaw === 'number' ? levelRaw : 0;
             const isMastered = level >= 5;

             // Zigzag pattern calculation
             // Explicitly cast index to number
             const idx = Number(index);
             const offset = idx % 2 === 0 ? 'translate-x-0' : (idx % 4 === 1 ? '-translate-x-8' : 'translate-x-8');
             
             const isFocused = focusedTopicIndex === index;
             const offlineStatus = getOfflineStatus(topic.id);
             const isDownloading = downloadingId === topic.id;

             // Progress Calculation for Ring
             const progressPercent = Math.min(100, (level / 5) * 100);
             const radius = 42;
             const circumference = 2 * Math.PI * radius;
             const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

             return (
               <div key={topic.id} className={`relative group ${offset}`}>
                 {/* Progress Ring Wrapper */}
                 <div className="relative flex items-center justify-center">
                    {/* Background Ring */}
                    {isUnlocked && (
                      <svg className="absolute w-24 h-24 -rotate-90 pointer-events-none" style={{ zIndex: 5 }}>
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          fill="none"
                          stroke={isMastered ? "#fbbf24" : "#e5e7eb"} 
                          strokeWidth="6"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          fill="none"
                          stroke={isMastered ? "#f59e0b" : "#fbbf24"} // Gold or yellow
                          strokeWidth="6"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                    )}

                    {/* Lesson Node Button */}
                    <button
                      ref={el => topicRefs.current[index] = el}
                      onClick={() => onStartLesson(topic.id, topic.name)}
                      className={`
                        w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-sm transition-all relative z-10
                        border-b-8 active:border-b-0 active:translate-y-2 focus:outline-none
                        ${isMastered 
                            ? 'bg-amber-400 border-amber-600 text-white shadow-amber-200'
                            : (isUnlocked 
                                ? `${topic.color} border-black/20 text-white`
                                : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed')
                        }
                        ${isFocused ? 'ring-4 ring-offset-2 ring-duo-blue scale-110' : ''}
                      `}
                      disabled={!isUnlocked}
                    >
                      {isMastered ? <Crown size={32} className="text-white drop-shadow-md fill-current" strokeWidth={2} /> : topic.icon}
                    </button>
                    
                    {/* Crown Level Badge */}
                    {isUnlocked && level > 0 && (
                        <div className={`
                           absolute -top-1 -right-4 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full border-2 shadow-sm text-xs font-bold
                           ${isMastered ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white text-yellow-500 border-gray-100'}
                        `}>
                           <Crown size={10} className="fill-current" />
                           {level}
                        </div>
                    )}
                 </div>

                 {/* Label */}
                 <div className="text-center font-bold text-gray-600 mt-2 text-sm bg-white/80 px-2 rounded-lg backdrop-blur-sm">
                   {topic.name}
                 </div>

                 {/* Download/Offline Controls */}
                 {!isOffline && (
                    <div className="absolute top-0 -right-12 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                      {offlineStatus === 'DOWNLOADED' ? (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onDeleteDownload(topic.id); }}
                           className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow border border-gray-200"
                           title="Remove download"
                         >
                           <Trash2 size={14} />
                         </button>
                      ) : (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onDownload(topic.id, topic.name); }}
                           className="p-2 bg-white rounded-full text-duo-blue hover:bg-blue-50 shadow border border-gray-200"
                           title="Download for offline"
                           disabled={isDownloading}
                         >
                           {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                         </button>
                      )}
                    </div>
                 )}
                 {offlineStatus === 'DOWNLOADED' && (
                     <div className="absolute top-0 -left-8 text-duo-blue bg-white rounded-full p-1 border shadow-sm" title="Available Offline">
                        <Check size={12} strokeWidth={3} />
                     </div>
                 )}
               </div>
             );
           })}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="border-t-2 border-gray-200 p-2 flex justify-around bg-white">
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={onOpenShop}>
          <Store size={28} />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={onOpenProfile}>
          <Trophy size={28} />
        </button>
      </div>
    </div>
  );
};
