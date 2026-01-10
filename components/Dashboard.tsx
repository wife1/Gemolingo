import React, { useState, useEffect, useRef } from 'react';
import { UserState, SUPPORTED_LANGUAGES, Difficulty, Lesson, LanguageConfig } from '../types';
import { DailyGoalWidget } from './DailyGoalWidget';
import { CloudDownload, Dumbbell, Crown, Store, Info, Trophy, Settings } from 'lucide-react';
import { TOPICS } from '../data/topics';
import { Header } from './dashboard/Header';
import { FilterBar } from './dashboard/FilterBar';
import { TopicNode } from './dashboard/TopicNode';
import {
  ResetMenuModal,
  AboutModal,
  SettingsModal,
  DownloadConfirmModal,
  BulkDownloadProgressModal,
  LanguageSelectorModal,
  ImportHelpModal
} from './dashboard/Modals';

interface DashboardProps {
  userState: UserState;
  onStartLesson: (topicId: string, topicName: string) => void;
  onStartPractice: () => void;
  onChangeLanguage: (code: string) => void;
  onChangeDifficulty: (diff: Difficulty) => void;
  onToggleTimer: () => void;
  offlineLessons: Record<string, Record<string, Lesson>>;
  onDownload: (topicId: string, topicName: string) => Promise<void>;
  onDeleteDownload: (topicId: string) => void;
  onOpenProfile: () => void;
  onOpenShop: () => void;
  onResetTopic: (topicId: string) => void;
  onReorderTopics: (newOrder: string[]) => void;
  downloadingId: string | null;
  isOffline: boolean;
  onImportLanguage: (lang: LanguageConfig) => void;
  onImportLanguages?: (langs: LanguageConfig[]) => void;
  onImportLessonData: (data: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userState,
  onStartLesson,
  onStartPractice,
  onChangeLanguage,
  onChangeDifficulty,
  onToggleTimer,
  offlineLessons,
  onDownload,
  onDeleteDownload,
  onOpenProfile,
  onOpenShop,
  onResetTopic,
  onReorderTopics,
  downloadingId,
  isOffline,
  onImportLanguage,
  onImportLanguages,
  onImportLessonData
}) => {
  const [focusedTopicIndex, setFocusedTopicIndex] = useState(0);
  const topicRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Download State
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number, total: number } | null>(null);
  const cancelDownloadRef = useRef(false);

  // Context Menu State
  const [resetMenuTopic, setResetMenuTopic] = useState<{ id: string, name: string } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag and Drop State
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);

  // Filtering and Sorting State
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'MASTERED'>('ALL');
  const [sort, setSort] = useState<'DEFAULT' | 'NAME' | 'LEVEL'>('DEFAULT');

  // Compute Base Ordered Topics
  const getOrderedTopics = () => {
    if (!userState.topicOrder || userState.topicOrder.length === 0) return TOPICS;

    const orderMap = new Map<string, number>();
    userState.topicOrder.forEach((id, index) => orderMap.set(id, index));

    return [...TOPICS].sort((a, b) => {
      const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
      const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
      return indexA - indexB;
    });
  };

  const baseTopics = getOrderedTopics();

  // Pre-calculate status for all topics
  const topicsWithMeta = baseTopics.map((topic, index) => {
    const prevTopic = index > 0 ? baseTopics[index - 1] : null;
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

  if (searchQuery.trim()) {
    displayedTopics = displayedTopics.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }

  if (filter === 'IN_PROGRESS') {
    displayedTopics = displayedTopics.filter(t => t.level > 0 && !t.isMastered);
  } else if (filter === 'MASTERED') {
    displayedTopics = displayedTopics.filter(t => t.isMastered);
  }

  if (sort === 'NAME') {
    displayedTopics.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'LEVEL') {
    displayedTopics.sort((a, b) => (b.level - a.level) || (a.originalIndex - b.originalIndex));
  }

  const isDefaultView = filter === 'ALL' && sort === 'DEFAULT' && !searchQuery;

  // Effects
  useEffect(() => {
    if (isDefaultView) {
      const firstUnfinished = baseTopics.findIndex(t => !userState.completedLessons.includes(t.id));
      if (firstUnfinished !== -1) {
        setFocusedTopicIndex(firstUnfinished);
      } else {
        setFocusedTopicIndex(baseTopics.length - 1);
      }
    }
  }, []);

  useEffect(() => {
    setFocusedTopicIndex(0);
  }, [filter, sort, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedTopicIndex(prev => Math.min(prev + 1, displayedTopics.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedTopicIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (showLanguageSelector || showImportHelp || showDownloadConfirm || bulkProgress || showAbout || showSettings || resetMenuTopic) return;
        e.preventDefault();
        const topic = displayedTopics[focusedTopicIndex];
        if (topic) {
          onStartLesson(topic.id, topic.name);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedTopicIndex, onStartLesson, displayedTopics, showLanguageSelector, showImportHelp, showDownloadConfirm, bulkProgress, showAbout, showSettings, resetMenuTopic]);

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

  const getOfflineStatus = (topicId: string) => {
    const lang = userState.currentLanguage;
    const diff = userState.difficulty;
    const key = `${topicId}-${diff}`;
    if (offlineLessons[lang] && offlineLessons[lang][key]) return 'DOWNLOADED';
    return 'NONE';
  };

  const getUndownloadedTopics = () => {
    return TOPICS.filter(t => getOfflineStatus(t.id) === 'NONE');
  };

  // Bulk Download Logic
  const handleDownloadAllClick = () => {
    const toDownload = getUndownloadedTopics();
    if (toDownload.length === 0) {
      alert("All topics for this level are already downloaded!");
      return;
    }
    setShowDownloadConfirm(true);
  };

  const confirmBulkDownload = async () => {
    setShowDownloadConfirm(false);
    const toDownload = getUndownloadedTopics();
    setBulkProgress({ current: 0, total: toDownload.length });
    cancelDownloadRef.current = false;

    for (let i = 0; i < toDownload.length; i++) {
      if (cancelDownloadRef.current) break;
      const topic = toDownload[i];
      try {
        await onDownload(topic.id, topic.name);
      } catch (e) {
        console.error(`Failed to download ${topic.name}`, e);
      }
      if (!cancelDownloadRef.current) {
        setBulkProgress({ current: i + 1, total: toDownload.length });
      }
      await new Promise(r => setTimeout(r, 50));
    }
    setBulkProgress(null);
  };

  const handleCancelBulkDownload = () => {
    cancelDownloadRef.current = true;
    setBulkProgress(null);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, topicId: string) => {
    if (!isDefaultView) {
      e.preventDefault();
      return;
    }
    setDraggedTopicId(topicId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', topicId);
  };

  const handleDragOver = (e: React.DragEvent, targetTopicId: string) => {
    if (!isDefaultView) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTopicId: string) => {
    if (!isDefaultView) return;
    e.preventDefault();
    const sourceId = draggedTopicId;
    if (!sourceId || sourceId === targetTopicId) {
      setDraggedTopicId(null);
      return;
    }
    const currentOrder = baseTopics.map(t => t.id);
    const sourceIndex = currentOrder.indexOf(sourceId);
    const targetIndex = currentOrder.indexOf(targetTopicId);
    if (sourceIndex > -1 && targetIndex > -1) {
      const newOrder = [...currentOrder];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceId);
      onReorderTopics(newOrder);
    }
    setDraggedTopicId(null);
  };

  // File Handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.code && json.name && json.flag) {
          const exists = allLanguages.some(l => l.code === json.code);
          if (exists) {
            alert("Language already exists!");
            return;
          }
          onImportLanguage(json);
          setShowLanguageSelector(false);
        } else {
          alert("Invalid JSON format. Required: code, name, flag");
        }
      } catch (err) {
        alert("Error parsing JSON file");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    // Explicitly type file as 'any' or 'File' to ensure it's compatible with readAsText which expects Blob.
    // Array.from on FileList sometimes infers unknown[] in certain TS configs.
    const readers: Promise<LanguageConfig | null>[] = Array.from(files).map((file: any) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string);
            if (json.code && json.name && json.flag) {
              resolve(json);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        };
        reader.readAsText(file);
      });
    });

    Promise.all(readers).then(results => {
      const validLangs = results.filter((l): l is LanguageConfig => l !== null);
      const newLangs = validLangs.filter(l => !allLanguages.some(existing => existing.code === l.code));
      const uniqueNewLangs = newLangs.filter((l, index, self) =>
        index === self.findIndex((t) => t.code === l.code)
      );

      if (uniqueNewLangs.length > 0) {
        if (onImportLanguages) {
          onImportLanguages(uniqueNewLangs);
          setShowLanguageSelector(false);
        } else {
          uniqueNewLangs.forEach(l => onImportLanguage(l));
          setShowLanguageSelector(false);
        }
      } else {
        if (validLangs.length > 0) {
          alert("All selected languages already exist!");
        } else {
          alert("No valid language configuration files found.");
        }
      }
    });
    event.target.value = '';
  };

  const handleExportLessons = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(offlineLessons, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gemolingo_lessons.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportLessonsFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        onImportLessonData(json);
        setShowSettings(false);
      } catch (err) {
        alert("Error parsing JSON file");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Context Menu Helpers
  const handleContextMenu = (e: React.MouseEvent, topic: { id: string, name: string }) => {
    e.preventDefault();
    setResetMenuTopic(topic);
  };

  const startLongPress = (topic: { id: string, name: string }) => {
    longPressTimer.current = setTimeout(() => {
      setResetMenuTopic(topic);
    }, 800);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleResetConfirm = () => {
    if (resetMenuTopic) {
      onResetTopic(resetMenuTopic.id);
      setResetMenuTopic(null);
    }
  };

  const totalCrowns = (Object.values(userState.topicLevels || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
  const maxCrowns = TOPICS.length * 5;
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col">
      <Header
        userState={userState}
        currentLangConfig={currentLangConfig}
        difficulties={difficulties}
        onShowLanguageSelector={() => setShowLanguageSelector(true)}
        onChangeDifficulty={onChangeDifficulty}
        onToggleTimer={onToggleTimer}
      />

      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        count={displayedTopics.length}
      />

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        {isDefaultView && (
          <div className="space-y-4">
            {/* Quick Practice Button */}
            {!isOffline && (
              <button
                onClick={onStartPractice}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-purple-200 transform transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/20 p-3 rounded-xl border border-white/20">
                    <Dumbbell size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Quick Practice</div>
                    <div className="text-xs text-purple-100 font-bold opacity-90">Review your weak spots</div>
                  </div>
                </div>
                <div className="bg-white text-purple-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm">
                  START
                </div>
                <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              </button>
            )}

            {/* Download All Button */}
            {!isOffline && (
              <button
                onClick={handleDownloadAllClick}
                className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-duo-blue p-4 rounded-2xl flex items-center justify-between transition-colors group relative overflow-hidden"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white p-3 rounded-xl border-2 border-blue-100 group-hover:scale-110 transition-transform">
                    <CloudDownload size={24} className="text-duo-blue" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-800">Offline Course</div>
                    <div className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1">
                      {getUndownloadedTopics().length} Lessons Available
                    </div>
                  </div>
                </div>
                <div className="bg-duo-blue text-white px-4 py-2 rounded-xl font-bold shadow-sm border-b-4 border-blue-600 active:border-b-0 active:translate-y-1 relative z-10 text-sm">
                  GET ALL
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-100 to-transparent opacity-50"></div>
              </button>
            )}

            <DailyGoalWidget dailyXp={userState.dailyXp} dailyGoal={userState.dailyGoal} />

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
          {isDefaultView && (
            <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-gray-200 -translate-x-1/2 rounded-full -z-10" />
          )}

          {displayedTopics.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              <div className="mb-2 text-4xl">🏜️</div>
              <div>No topics found for this filter.</div>
            </div>
          )}

          {displayedTopics.map((topic, index) => (
            <TopicNode
              key={topic.id}
              topic={topic}
              index={index}
              isDefaultView={isDefaultView}
              isFocused={focusedTopicIndex === index}
              isDragging={draggedTopicId === topic.id}
              offlineStatus={getOfflineStatus(topic.id)}
              isDownloading={downloadingId === topic.id}
              isOffline={isOffline}
              userState={userState}
              onStartLesson={onStartLesson}
              onContextMenu={handleContextMenu}
              startLongPress={startLongPress}
              cancelLongPress={cancelLongPress}
              onDeleteDownload={onDeleteDownload}
              onDownload={onDownload}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              topicRef={el => { topicRefs.current[index] = el; }}
            />
          ))}
        </div>
      </div>

      <div className="border-t-2 border-gray-200 p-2 flex justify-around bg-white">
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={onOpenShop}>
          <Store size={28} />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={onOpenProfile}>
          <Trophy size={28} />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={() => setShowSettings(true)}>
          <Settings size={28} />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400" onClick={() => setShowAbout(true)}>
          <Info size={28} />
        </button>
      </div>

      {/* Modals */}
      <ResetMenuModal
        resetMenuTopic={resetMenuTopic}
        userState={userState}
        onResetConfirm={handleResetConfirm}
        onCancel={() => setResetMenuTopic(null)}
      />

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onExportLessons={handleExportLessons}
          onImportLessonsFile={handleImportLessonsFile}
        />
      )}

      {showDownloadConfirm && (
        <DownloadConfirmModal
          count={getUndownloadedTopics().length}
          difficulty={userState.difficulty}
          onCancel={() => setShowDownloadConfirm(false)}
          onConfirm={confirmBulkDownload}
        />
      )}

      {bulkProgress && (
        <BulkDownloadProgressModal
          progress={bulkProgress}
          onCancel={handleCancelBulkDownload}
        />
      )}

      {showLanguageSelector && (
        <LanguageSelectorModal
          allLanguages={allLanguages}
          currentLanguage={userState.currentLanguage}
          onChangeLanguage={onChangeLanguage}
          onClose={() => { setShowLanguageSelector(false); setSearchQuery(''); }}
          onShowImportHelp={() => setShowImportHelp(true)}
          onImportLanguage={handleFileUpload}
          onBulkImportLanguage={handleBulkFileUpload}
        />
      )}

      {showImportHelp && <ImportHelpModal onClose={() => setShowImportHelp(false)} />}
    </div>
  );
};