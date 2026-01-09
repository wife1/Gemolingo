import React from 'react';
import { Crown, Zap, GripVertical, Check, Trash2, Loader2, Download } from 'lucide-react';

interface TopicNodeProps {
  topic: any;
  index: number;
  isDefaultView: boolean;
  isFocused: boolean;
  isDragging: boolean;
  offlineStatus: string;
  isDownloading: boolean;
  isOffline: boolean;
  userState: any;
  onStartLesson: (id: string, name: string) => void;
  onContextMenu: (e: React.MouseEvent, topic: any) => void;
  startLongPress: (topic: any) => void;
  cancelLongPress: () => void;
  onDeleteDownload: (id: string) => void;
  onDownload: (id: string, name: string) => void;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragOver: (e: React.DragEvent, id: string) => void;
  handleDrop: (e: React.DragEvent, id: string) => void;
  topicRef: (el: HTMLButtonElement | null) => void;
}

export const TopicNode: React.FC<TopicNodeProps> = ({
  topic,
  index,
  isDefaultView,
  isFocused,
  isDragging,
  offlineStatus,
  isDownloading,
  isOffline,
  userState,
  onStartLesson,
  onContextMenu,
  startLongPress,
  cancelLongPress,
  onDeleteDownload,
  onDownload,
  handleDragStart,
  handleDragOver,
  handleDrop,
  topicRef
}) => {
  const i = isDefaultView ? topic.originalIndex : index;
  const isUnlocked = topic.isUnlocked;
  const level = topic.level;
  const isMastered = topic.isMastered;

  // Zigzag pattern calculation
  const offset = isDefaultView
    ? ((i % 2) === 0 ? 'translate-x-0' : ((i % 4) === 1 ? '-translate-x-8' : 'translate-x-8'))
    : 'translate-x-0';

  const progressPercent = Math.min(100, (level / 5) * 100);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className={`relative group ${offset} transition-transform duration-300 ${isDragging ? 'opacity-50 scale-95' : ''}`}
      draggable={isDefaultView}
      onDragStart={(e) => handleDragStart(e, topic.id)}
      onDragOver={(e) => handleDragOver(e, topic.id)}
      onDrop={(e) => handleDrop(e, topic.id)}
    >
      {/* Tooltip */}
      <div className="absolute bottom-[110%] mb-2 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 transform translate-y-2 group-hover:translate-y-0">
        <div className="bg-gray-800 text-white text-xs p-3 rounded-xl shadow-xl text-center relative border border-gray-700">
          <p className="font-bold mb-1 text-sm text-yellow-400">{topic.name}</p>
          <p className="text-gray-300 leading-tight">{topic.description}</p>
          {/* Triangle */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-800"></div>
        </div>
      </div>

      {/* Progress Ring Wrapper */}
      <div className="relative flex items-center justify-center">
        {/* Drag Handle */}
        {isDefaultView && (
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-move transition-opacity p-2">
            <GripVertical size={20} />
          </div>
        )}

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
              stroke={isMastered ? "#f59e0b" : "#fbbf24"}
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
          ref={topicRef}
          onClick={() => onStartLesson(topic.id, topic.name)}
          onContextMenu={(e) => onContextMenu(e, topic)}
          onTouchStart={() => startLongPress(topic)}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-sm transition-all relative z-10
            border-b-8 active:border-b-0 active:translate-y-2 focus:outline-none select-none
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

        {/* Speed Run Indicator */}
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
};