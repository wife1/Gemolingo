import React, { useState, useEffect, useRef } from 'react';
import { UserState, SUPPORTED_LANGUAGES, Difficulty, Lesson, LanguageConfig } from '../types';
import { Button } from './UI';
import { DailyGoalWidget } from './DailyGoalWidget';
import { Star, Zap, Trophy, Flame, Download, Check, Trash2, Loader2, WifiOff, Globe, Timer, Crown, Store, ChevronDown, Signal, Upload, Filter, ArrowUpDown, HelpCircle, FileJson, X } from 'lucide-react';

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
  onImportLanguage: (lang: LanguageConfig) => void;
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
  isOffline,
  onImportLanguage
}) => {
  const [focusedTopicIndex, setFocusedTopicIndex] = useState(0);
  const topicRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [showImportHelp, setShowImportHelp] = useState(false);
  
  // Filtering and Sorting State
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'MASTERED'>('ALL');
  const [sort, setSort] = useState<'DEFAULT' | 'NAME' | 'LEVEL'>('DEFAULT');

  // Pre-calculate status for all topics based on original order to preserve unlock logic
  const topicsWithMeta = TOPICS.map((topic, index) => {
     // Unlock logic: First item is unlocked, or if previous topic has at least level 1
     const prevTopic = index > 0 ? TOPICS[index - 1] : null;
     const prevLevelRaw = prevTopic && userState.topicLevels ? userState.topicLevels[prevTopic.id] : undefined;
     const prevLevelVal: number = typeof prevLevelRaw === 'number' ? prevLevelRaw : 0;
     const isPrevCompleted = prevTopic ? userState.completedLessons.includes(prevTopic.id) : false;
     
     const prevLevel = prevTopic 
       ? (prevLevelVal > 0 ? prevLevelVal : (isPrevCompleted ? 1 : 0))
       : 1;
     
     const isUnlocked = index === 0 || prevLevel > 0;
     
     const levelRaw = userState.topicLevels?.[topic.id];
     const level: number = typeof levelRaw === 'number' ? levelRaw : 0;
     const isMastered = level >= 5;

     return { ...topic, isUnlocked, level, isMastered, originalIndex: index };
  });

  // Apply Filter and Sort
  let displayedTopics = [...topicsWithMeta];

  if (filter === 'IN_PROGRESS') {
      displayedTopics = displayedTopics.filter(t => t.level > 0 && !t.isMastered);
  } else if (filter === 'MASTERED') {
      displayedTopics = displayedTopics.filter(t => t.isMastered);
  }

  if (sort === 'NAME') {
      displayedTopics.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'LEVEL') {
      displayedTopics.sort((a, b) => b.level - a.level);
  }

  const isDefaultView = filter === 'ALL' && sort === 'DEFAULT';

  // On mount, auto-focus the first incomplete lesson (only in default view)
  useEffect(() => {
    if (isDefaultView) {
        const firstUnfinished = TOPICS.findIndex(t => !userState.completedLessons.includes(t.id));
        if (firstUnfinished !== -1) {
            setFocusedTopicIndex(firstUnfinished);
        } else {
            setFocusedTopicIndex(TOPICS.length - 1);
        }
    }
  }, []); // Only on mount

  // Reset focus when list changes
  useEffect(() => {
      setFocusedTopicIndex(0);
  }, [filter, sort]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow moving through lessons with arrows
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedTopicIndex(prev => Math.min(prev + 1, displayedTopics.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedTopicIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const topic = displayedTopics[focusedTopicIndex];
        if (topic) {
          onStartLesson(topic.id, topic.name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedTopicIndex, onStartLesson, displayedTopics]);

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

  const allLanguages = [...SUPPORTED_LANGUAGES, ...(userState.customLanguages || [])];
  const currentLangConfig = allLanguages.find(l => l.code === userState.currentLanguage) || SUPPORTED_LANGUAGES[0];
  
  // Helper to check download status
  const getOfflineStatus = (topicId: string) => {
    const lang = userState.currentLanguage;
    const diff = userState.difficulty;
    const key = `${topicId}-${diff}`;
    
    if (offlineLessons[lang] && offlineLessons[lang][key]) return 'DOWNLOADED';
    return 'NONE';
  };

  const totalCrowns = (Object.values(userState.topicLevels || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
  const maxCrowns = TOPICS.length * 5;
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            // Basic validation
            if (json.code && json.name && json.flag) {
                // Check for duplicates
                const exists = allLanguages.some(l => l.code === json.code);
                if (exists) {
                    alert("Language already exists!");
                    return;
                }
                onImportLanguage(json);
            } else {
                alert("Invalid JSON format. Required: code, name, flag");
            }
        } catch (err) {
            alert("Error parsing JSON file");
        }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded-lg transition-colors group relative">
             <span className="text-2xl">{currentLangConfig?.flag}</span>
             {/* Simple Language Dropdown Simulator */}
             <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 hidden group-focus-within:block w-56 z-50 max-h-80 overflow-y-auto">
                {allLanguages.map(lang => (
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
                
                {/* Import Section */}
                <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 mt-1 pt-1 grid grid-cols-[1fr,auto] gap-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 text-duo-blue font-bold transition-colors">
                        <Upload size={16} />
                        <span className="text-sm">Import JSON</span>
                        <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button 
                         onClick={(e) => {
                             e.preventDefault(); 
                             e.stopPropagation();
                             setShowImportHelp(true);
                         }}
                         className="p-2 text-gray-400 hover:text-duo-blue hover:bg-blue-50 rounded-lg transition-colors"
                         title="Help"
                         type="button"
                    >
                        <HelpCircle size={18} />
                    </button>
                </div>
             </div>
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
                    <div className={`w-2 h-2 rounded-full ${
                      diff === 'beginner' ? 'bg-green-400' : 
                      diff === 'intermediate' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <span className="capitalize font-bold text-sm">{diff}</span>
                    {userState.difficulty === diff && <Check size={14} className="ml-auto"/>}
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

      {/* Filter/Sort Bar */}
      <div className="px-4 py-2 flex items-center gap-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
         <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100">
             <Filter size={14} className="text-gray-400" />
             <select 
               value={filter}
               onChange={(e) => setFilter(e.target.value as any)}
               className="text-xs font-bold text-gray-600 bg-transparent outline-none cursor-pointer"
             >
                <option value="ALL">All Topics</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="MASTERED">Mastered</option>
             </select>
         </div>

         <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100">
             <ArrowUpDown size={14} className="text-gray-400" />
             <select 
               value={sort}
               onChange={(e) => setSort(e.target.value as any)}
               className="text-xs font-bold text-gray-600 bg-transparent outline-none cursor-pointer"
             >
                <option value="DEFAULT">Path Order</option>
                <option value="NAME">Name (A-Z)</option>
                <option value="LEVEL">Level (High-Low)</option>
             </select>
         </div>
         
         <div className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-wider">
             {displayedTopics.length} Topics
         </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        {isDefaultView && (
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
        )}

        <div className={`flex flex-col items-center gap-8 relative py-4 ${!isDefaultView ? 'gap-4' : ''}`}>
           {/* Path Guide Line (Simplified) - Only in default view */}
           {isDefaultView && (
               <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-gray-200 -translate-x-1/2 rounded-full -z-10" />
           )}
           
           {displayedTopics.length === 0 && (
               <div className="text-center text-gray-400 py-10">
                   <div className="mb-2 text-4xl">🏜️</div>
                   <div>No topics found for this filter.</div>
               </div>
           )}

           {displayedTopics.map((topic, index) => {
             // For default view, use the original index to maintain the zigzag path correctly
             // For other views, we reset the zigzag logic to a simple list/grid
             const i = isDefaultView ? topic.originalIndex : index;
             const isUnlocked = topic.isUnlocked;
             const level = topic.level;
             const isMastered = topic.isMastered;

             // Zigzag pattern calculation
             const offset = isDefaultView 
                ? ((i % 2) === 0 ? 'translate-x-0' : ((i % 4) === 1 ? '-translate-x-8' : 'translate-x-8'))
                : 'translate-x-0'; // Center align in filtered view
             
             const isFocused = focusedTopicIndex === index;
             const offlineStatus = getOfflineStatus(topic.id);
             const isDownloading = downloadingId === topic.id;

             // Progress Calculation for Ring
             const progressPercent = Math.min(100, (level / 5) * 100);
             const radius = 42;
             const circumference = 2 * Math.PI * radius;
             const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

             return (
               <div key={topic.id} className={`relative group ${offset} transition-transform duration-300`}>
                 {/* Progress Ring Wrapper */}
                 <div className="relative flex items-center justify-center">
                    {/* Background Ring - Only show ring in default/path view for aesthetics, or keep it always? Keeping it. */}
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
                      ref={el => { topicRefs.current[index] = el; }}
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

                    {/* Speed Run Indicator on Node */}
                    {isUnlocked && userState.timerEnabled && (
                        <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 rounded-full p-1.5 border-2 border-white shadow-md z-20 animate-bounce">
                           <Zap size={14} fill="currentColor" />
                        </div>
                    )}
                    
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

      {/* Import Help Modal */}
      {showImportHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
              <button 
                onClick={() => setShowImportHelp(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3 mb-4 text-duo-blue">
                 <FileJson size={32} />
                 <h3 className="text-xl font-bold text-gray-800">Import Language</h3>
              </div>
              
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                 Add custom languages by importing a JSON file with the following format:
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm border-2 border-gray-100 mb-6 relative group">
                 <div className="text-gray-400 mb-2 text-[10px] font-bold uppercase tracking-wider select-none flex justify-between">
                    <span>example.json</span>
                 </div>
                 <pre className="text-gray-700 whitespace-pre-wrap break-all">
{`{
  "code": "fr",
  "name": "French",
  "flag": "🇫🇷"
}`}
                 </pre>
              </div>

              <Button fullWidth onClick={() => setShowImportHelp(false)}>
                 Got it
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};