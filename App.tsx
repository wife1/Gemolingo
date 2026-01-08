import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { LessonView } from './components/LessonView';
import { Profile } from './components/Profile';
import { AchievementNotification } from './components/AchievementNotification';
import { UserState, Lesson, SUPPORTED_LANGUAGES, Difficulty, Achievement } from './types';
import { generateLessonContent } from './services/geminiService';
import { 
  loadUserState, 
  saveUserState, 
  saveOfflineLesson, 
  getOfflineLesson, 
  getAllOfflineLessons,
  removeOfflineLesson 
} from './services/storageService';
import { initializeAchievements, checkAchievements } from './services/achievementService';
import { Loader2, WifiOff } from 'lucide-react';

// Initial state
const INITIAL_USER_STATE: UserState = {
  hearts: 5,
  xp: 0,
  streak: 1,
  currentLanguage: 'es',
  completedLessons: [],
  difficulty: 'beginner',
  achievements: [], // Will be initialized in component
  dailyXp: 0,
  dailyGoal: 50,
  lastActiveDate: new Date().toDateString(),
  timerEnabled: false,
  topicLevels: {} // Initialize empty
};

const App: React.FC = () => {
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'LESSON' | 'LOADING' | 'PROFILE'>('DASHBOARD');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineLessons, setOfflineLessons] = useState<any>({});
  const [downloadingTopic, setDownloadingTopic] = useState<string | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  // Initialize from storage and setup listeners
  useEffect(() => {
    const storedState = loadUserState();
    let stateToUse = INITIAL_USER_STATE;
    
    if (storedState) {
      stateToUse = { ...INITIAL_USER_STATE, ...storedState };
    }
    
    // Migration: ensure topicLevels exists
    if (!stateToUse.topicLevels) {
      stateToUse.topicLevels = {};
      // If we have completed lessons but no levels, assume level 1 for them
      stateToUse.completedLessons.forEach(lessonId => {
        // completedLessons stored 'topic-difficulty', we need to extract topic
        // But wait, older logic stored topicID directly? The App logic below stores composite ID.
        // Let's iterate topics in Dashboard to be safe, but here we can try to guess.
        // Actually simpler: we just start fresh for levels if missing, or we can parse.
        // For robustness, let's leave it empty or 1 for legacy.
        // Since we can't easily parse topicId from composite without the delimiter logic which might vary,
        // let's just initialize.
      });
    }

    // Date Check for Daily XP and Streak
    const today = new Date().toDateString();
    if (stateToUse.lastActiveDate !== today) {
      // It is a new day
      stateToUse.dailyXp = 0;
      
      // Simple streak logic: if last active was yesterday, keep streak, else reset if missed a day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (stateToUse.lastActiveDate !== yesterday.toDateString()) {
         // If last active was not yesterday (and not today), streak breaks
         // Exception: If lastActiveDate is empty (first run), start at 1
         if (stateToUse.lastActiveDate) {
             stateToUse.streak = 1;
         }
      }
      
      stateToUse.lastActiveDate = today;
    }

    // Ensure achievements are initialized (handles new achievements added to code)
    stateToUse.achievements = initializeAchievements(stateToUse.achievements);
    
    setUserState(stateToUse);
    setOfflineLessons(getAllOfflineLessons());

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    saveUserState(userState);
  }, [userState]);

  const getCompositeKey = (topicId: string, difficulty: Difficulty) => {
    return `${topicId}-${difficulty}`;
  };

  const startLesson = async (topicId: string, topicName: string) => {
    setCurrentScreen('LOADING');
    
    const langCode = userState.currentLanguage;
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name || 'Spanish';
    const difficulty = userState.difficulty;
    const compositeKey = getCompositeKey(topicId, difficulty);

    // 1. Try to load from offline storage first
    const offlineData = getOfflineLesson(langCode, compositeKey);
    
    if (offlineData) {
      console.log("Loaded from offline storage");
      setTimeout(() => {
        setCurrentLesson(offlineData);
        setCurrentScreen('LESSON');
      }, 500);
      return;
    }

    // 2. If not found locally and offline, show error
    if (isOffline) {
      alert(`You are offline and the ${difficulty} lesson for "${topicName}" hasn't been downloaded.`);
      setCurrentScreen('DASHBOARD');
      return;
    }

    // 3. Generate fresh content from API
    try {
      const exercises = await generateLessonContent(langName, topicName, difficulty);
      
      const newLesson: Lesson = {
        id: compositeKey,
        topicId: topicId,
        title: topicName,
        description: `Learn ${topicName} in ${langName} (${difficulty})`,
        exercises: exercises,
        difficulty: difficulty
      };
      
      setCurrentLesson(newLesson);
      setCurrentScreen('LESSON');
    } catch (error) {
      console.error(error);
      alert("Failed to start lesson. Please try again.");
      setCurrentScreen('DASHBOARD');
    }
  };

  const handleDownloadLesson = async (topicId: string, topicName: string) => {
    if (isOffline) return;
    
    setDownloadingTopic(topicId);
    const langCode = userState.currentLanguage;
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name || 'Spanish';
    const difficulty = userState.difficulty;
    const compositeKey = getCompositeKey(topicId, difficulty);

    try {
      const exercises = await generateLessonContent(langName, topicName, difficulty);
      const lesson: Lesson = {
        id: compositeKey,
        topicId: topicId,
        title: topicName,
        description: `Learn ${topicName} in ${langName} (${difficulty})`,
        exercises: exercises,
        difficulty: difficulty
      };
      
      saveOfflineLesson(langCode, compositeKey, lesson);
      setOfflineLessons(getAllOfflineLessons()); // Refresh state
    } catch (e) {
      alert("Failed to download lesson.");
    } finally {
      setDownloadingTopic(null);
    }
  };

  const handleDeleteDownload = (topicId: string) => {
    const langCode = userState.currentLanguage;
    const compositeKey = getCompositeKey(topicId, userState.difficulty);
    removeOfflineLesson(langCode, compositeKey);
    setOfflineLessons(getAllOfflineLessons());
  };

  const handleLessonComplete = (xpEarned: number) => {
    setUserState(prev => {
      const today = new Date().toDateString();
      const isNewDay = prev.lastActiveDate !== today;
      
      let newStreak = prev.streak;
      if (isNewDay) {
          newStreak += 1;
      }

      // Update Topic Level
      const currentTopicId = currentLesson?.topicId || '';
      const currentLevel = prev.topicLevels?.[currentTopicId] || 0;
      const newLevel = Math.min(5, currentLevel + 1);

      const newState = {
        ...prev,
        xp: prev.xp + xpEarned,
        dailyXp: (isNewDay ? 0 : prev.dailyXp) + xpEarned,
        completedLessons: [...new Set([...prev.completedLessons, currentTopicId])], // Now storing topicId directly for simplicity in unlock logic
        lastActiveDate: today,
        streak: newStreak,
        topicLevels: {
          ...prev.topicLevels,
          [currentTopicId]: newLevel
        }
      };

      // Check achievements
      const { updatedAchievements, newUnlocks } = checkAchievements(newState);
      newState.achievements = updatedAchievements;

      // Notify unlocked
      if (newUnlocks.length > 0) {
        setUnlockedAchievement(newUnlocks[0]);
      }

      return newState;
    });

    setCurrentScreen('DASHBOARD');
    setCurrentLesson(null);
  };

  const handleExitLesson = () => {
    if (window.confirm("Are you sure you want to quit? You'll lose your progress for this lesson.")) {
      setCurrentScreen('DASHBOARD');
      setCurrentLesson(null);
    }
  };

  const handleLoseHeart = () => {
    setUserState(prev => {
      const newHearts = Math.max(0, prev.hearts - 1);
      if (newHearts === 0) {
        // Simple alert for now, could be a modal
        return { ...prev, hearts: 5 }; 
      }
      return { ...prev, hearts: newHearts };
    });
  };

  const handleChangeLanguage = (code: string) => {
    setUserState(prev => ({ ...prev, currentLanguage: code }));
  };

  const handleChangeDifficulty = (diff: Difficulty) => {
    setUserState(prev => ({ ...prev, difficulty: diff }));
  };

  const handleToggleTimer = () => {
    setUserState(prev => ({ ...prev, timerEnabled: !prev.timerEnabled }));
  };

  const handleOpenProfile = () => {
    setCurrentScreen('PROFILE');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isOffline && currentScreen === 'DASHBOARD' && (
        <div className="bg-gray-800 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2">
          <WifiOff size={16} /> Offline Mode - Using downloaded lessons
        </div>
      )}

      {currentScreen === 'DASHBOARD' && (
        <Dashboard 
          userState={userState} 
          onStartLesson={startLesson} 
          onChangeLanguage={handleChangeLanguage}
          onChangeDifficulty={handleChangeDifficulty}
          onToggleTimer={handleToggleTimer}
          offlineLessons={offlineLessons}
          onDownload={handleDownloadLesson}
          onDeleteDownload={handleDeleteDownload}
          onOpenProfile={handleOpenProfile}
          downloadingId={downloadingTopic}
          isOffline={isOffline}
        />
      )}

      {currentScreen === 'PROFILE' && (
        <Profile 
          userState={userState} 
          onBack={() => setCurrentScreen('DASHBOARD')} 
        />
      )}

      {currentScreen === 'LOADING' && (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
           <div className="animate-spin text-duo-green mb-4">
             <Loader2 size={64} />
           </div>
           <h2 className="text-xl font-bold text-gray-600 animate-pulse">
             {isOffline ? 'Loading lesson from storage...' : `Crafting ${userState.difficulty} lesson...`}
           </h2>
        </div>
      )}

      {currentScreen === 'LESSON' && currentLesson && (
        <LessonView 
          lesson={currentLesson} 
          onComplete={handleLessonComplete}
          onExit={handleExitLesson}
          onLoseHeart={handleLoseHeart}
          hearts={userState.hearts}
          isOffline={isOffline}
          timerEnabled={userState.timerEnabled}
        />
      )}

      {unlockedAchievement && (
        <AchievementNotification 
          achievement={unlockedAchievement} 
          onClose={() => setUnlockedAchievement(null)} 
        />
      )}
    </div>
  );
};

export default App;