import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Lesson, LessonResult } from '../types';
import { Button, ProgressBar, Card } from './UI';
import { Heart, Volume2, X, Check, Trophy, Timer, Zap, ArrowLeft, BookOpen, Plus, Ear, Eye, EyeOff, WifiOff, RotateCcw } from 'lucide-react';
import { generateSpeech, playAudioBuffer } from '../services/geminiService';
import confetti from 'canvas-confetti';

interface LessonViewProps {
  lesson: Lesson;
  onComplete: (result: LessonResult) => void;
  onExit: () => void;
  onLoseHeart: () => void;
  hearts: number;
  isOffline: boolean;
  timerEnabled?: boolean;
}

const DEFAULT_TIME_LIMIT = 120; // 2 minutes

// Sound Effect Helpers
const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    
    // First note (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, t); 
    gain1.gain.setValueAtTime(0.1, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc1.start(t);
    osc1.stop(t + 0.4);

    // Second note (A5) - Ding!
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, t + 0.1); 
    gain2.gain.setValueAtTime(0.1, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.5);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const playErrorSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    
    // Low pitched buzz/thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  onComplete, 
  onExit,
  onLoseHeart,
  hearts,
  isOffline,
  timerEnabled = false
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [status, setStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG' | 'TIME_UP'>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  
  // Custom word bank state
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_LIMIT);
  const startTimeRef = useRef(Date.now());

  const currentExercise = lesson.exercises[currentExerciseIndex];
  const progress = (currentExerciseIndex / lesson.exercises.length) * 100;

  // Timer Logic
  useEffect(() => {
    if (!timerEnabled || isLessonComplete || status === 'TIME_UP') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus('TIME_UP');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnabled, isLessonComplete, status]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setSelectedWords([]);
    setCustomOptions([]);
    setCustomInput("");
    setTextInput("");
    setShowExplanation(false);
    setShowPronunciation(false);
    if (status !== 'TIME_UP') {
      setStatus('IDLE');
    }
    
    // Auto-play audio for listen exercises
    if (currentExercise.type === 'LISTEN_AND_TYPE' && status === 'IDLE' && !isOffline) {
       // Small delay to ensure smooth transition
       setTimeout(() => handlePlayAudio(currentExercise.prompt), 500);
    }
  }, [currentExerciseIndex]);

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      // If modal is open, only allow Escape or Enter to close
      if (showExplanation) {
        if (e.key === 'Escape' || e.key === 'Enter') {
            setShowExplanation(false);
        }
        return;
      }
      
      if (showExitModal) {
         if (e.key === 'Escape') setShowExitModal(false);
         return;
      }

      // Special handling for FILL_IN_THE_BLANK input to allow Enter key to submit
      if (currentExercise.type === 'FILL_IN_THE_BLANK' && e.key === 'Enter') {
          e.preventDefault();
          if (status === 'IDLE' && textInput.trim()) {
             handleCheck();
          } else if (status !== 'IDLE') {
             handleContinue();
          }
          return;
      }

      // Ignore Enter key if user is typing in a word bank input field
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Escape') {
            (e.target as HTMLInputElement).blur();
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (isLessonComplete) {
           handleFinishLesson();
        } else if (status === 'TIME_UP') {
           onExit();
        } else if (status === 'IDLE') {
           if (selectedOption || selectedWords.length > 0) {
             handleCheck();
           }
        } else {
           handleContinue();
        }
      } else if (e.key === ' ' && status === 'IDLE') {
        e.preventDefault();
        handlePlayAudio(currentExercise.prompt);
      } else if (status === 'IDLE' && currentExercise.type === 'SELECT_MEANING' && currentExercise.options) {
        const num = parseInt(e.key);
        if (!isNaN(num) && num > 0 && num <= currentExercise.options.length) {
          setSelectedOption(currentExercise.options[num-1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isLessonComplete, selectedOption, selectedWords, currentExercise, showExplanation, showExitModal, textInput]);

  // Handle Lesson Completion Celebration
  useEffect(() => {
    if (isLessonComplete) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#58cc02', '#ffc800', '#1cb0f6']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#58cc02', '#ffc800', '#1cb0f6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isLessonComplete]);

  const handlePlayAudio = async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const buffer = await generateSpeech(text, 'es'); 
    if (buffer) playAudioBuffer(buffer);
    setIsProcessing(false);
  };

  const handleCheck = () => {
    let isCorrect = false;

    if (currentExercise.type === 'SELECT_MEANING') {
      isCorrect = selectedOption === currentExercise.correctAnswer;
    } else if (currentExercise.type === 'FILL_IN_THE_BLANK') {
      isCorrect = textInput.trim().toLowerCase() === currentExercise.correctAnswer.trim().toLowerCase();
    } else if (['TRANSLATE_TO_TARGET', 'TRANSLATE_TO_SOURCE', 'LISTEN_AND_TYPE'].includes(currentExercise.type)) {
      const answer = selectedWords.join(' ');
      // Simple normalization
      const normalizedAnswer = answer.toLowerCase().replace(/[.,!?;]/g, '').trim();
      const normalizedCorrect = currentExercise.correctAnswer.toLowerCase().replace(/[.,!?;]/g, '').trim();
      isCorrect = normalizedAnswer === normalizedCorrect;
    }

    if (isCorrect) {
      playSuccessSound();
      setStatus('CORRECT');
      setCorrectCount(prev => prev + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#58cc02', '#ffffff']
      });
    } else {
      playErrorSound();
      setStatus('WRONG');
      setMistakes(prev => prev + 1);
      onLoseHeart();
    }
  };

  const handleSkip = () => {
    playErrorSound();
    setStatus('WRONG');
    setMistakes(prev => prev + 1);
    if (!timerEnabled) {
      onLoseHeart();
    }
    // Note: We do NOT increment correctCount
  };
  
  const handleUndo = () => {
    if (selectedWords.length > 0) {
      setSelectedWords(prev => prev.slice(0, -1));
      setStatus('IDLE');
    }
  };

  const handleContinue = () => {
    if (currentExerciseIndex < lesson.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      setIsLessonComplete(true);
    }
  };

  const handleFinishLesson = () => {
    // XP Calculation: 
    // 5 XP for finishing
    // 2 XP per correct answer
    // Dynamic Speed Bonus: 1 XP per 5 seconds remaining
    const baseXP = 5;
    const accuracyXP = correctCount * 2;
    const speedBonus = timerEnabled ? Math.ceil(timeLeft / 5) : 0;
    const totalXP = baseXP + accuracyXP + speedBonus;
    
    // Calculate total duration (if timer is enabled use elapsed, otherwise just estimate or 0)
    const timeTaken = timerEnabled ? (DEFAULT_TIME_LIMIT - timeLeft) : 0;

    onComplete({
      xp: totalXP,
      mistakes: mistakes,
      timeSeconds: timeTaken
    });
  };
  
  const handleRemoveWord = (word: string, indexToRemove: number) => {
      if (status !== 'IDLE') return;
      setSelectedWords(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAddWord = (word: string) => {
      if (status !== 'IDLE') return;
      setSelectedWords(prev => [...prev, word]);
  };

  const handleCustomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (customInput.trim()) {
            setCustomOptions(prev => [...prev, customInput.trim()]);
            setCustomInput("");
        }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Combine standard options with user-added options
  const allOptions = [...(currentExercise.options || []), ...customOptions];

  // Helper to determine if a word in the bank should be disabled (used)
  // This supports duplicate words correctly.
  const isWordUsed = (word: string, indexInOptions: number) => {
    // How many times does this word appear in the options BEFORE this index?
    const previousOccurrencesInOptions = allOptions
      .slice(0, indexInOptions)
      .filter(w => w === word).length;

    // How many times is this word currently selected?
    const occurrencesInSelection = selectedWords.filter(w => w === word).length;

    // If we have selected it 2 times, we disable the first 2 instances in the options.
    return previousOccurrencesInOptions < occurrencesInSelection;
  };

  if (status === 'TIME_UP') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center animate-pop-in">
        <div className="mb-8 relative">
           <div className="absolute inset-0 bg-red-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
           <Timer size={120} className="text-duo-red relative z-10" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-duo-red-dark mb-4">Time's Up!</h1>
        <p className="text-xl text-gray-500 mb-8">You ran out of time. Don't worry, practice makes perfect!</p>
        
        <Button 
          size="lg" 
          fullWidth 
          variant="danger"
          onClick={onExit}
          className="max-w-xs animate-slide-up"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (isLessonComplete) {
    const speedBonus = timerEnabled ? Math.ceil(timeLeft / 5) : 0;
    const earnedXP = 5 + (correctCount * 2) + speedBonus;
    const isPerfect = mistakes === 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center animate-pop-in">
        <div className="mb-8 relative">
           <div className={`absolute inset-0 rounded-full blur-3xl opacity-50 animate-pulse ${isPerfect ? 'bg-purple-200' : 'bg-yellow-200'}`}></div>
           <Trophy size={120} className={`${isPerfect ? 'text-purple-500' : 'text-duo-yellow'} relative z-10`} fill="currentColor" />
        </div>
        
        <h1 className={`text-4xl font-extrabold mb-4 ${isPerfect ? 'text-purple-600' : 'text-duo-yellow-dark'}`}>
          {isPerfect ? 'Perfect Lesson!' : 'Lesson Complete!'}
        </h1>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
           <div className="bg-orange-100 p-4 rounded-2xl border-2 border-orange-200 min-w-[120px]">
              <div className="text-sm font-bold text-orange-400 uppercase">Total XP</div>
              <div className="text-3xl font-black text-orange-500">+{earnedXP}</div>
           </div>
           <div className="bg-green-100 p-4 rounded-2xl border-2 border-green-200 min-w-[120px]">
              <div className="text-sm font-bold text-green-400 uppercase">Accuracy</div>
              <div className="text-3xl font-black text-green-500">
                {Math.round((correctCount / lesson.exercises.length) * 100)}%
              </div>
           </div>
           {timerEnabled && (
             <div className="bg-yellow-100 p-4 rounded-2xl border-2 border-yellow-200 min-w-[120px] animate-bounce">
                <div className="text-sm font-bold text-yellow-600 uppercase flex items-center justify-center gap-1">
                  <Zap size={14} className="fill-current" /> Speed
                </div>
                <div className="text-3xl font-black text-yellow-500">+{speedBonus}</div>
             </div>
           )}
        </div>

        {isPerfect && (
          <div className="mb-8 bg-purple-100 text-purple-600 px-4 py-2 rounded-xl font-bold animate-bounce">
             ✨ Zero Mistakes Bonus Applied!
          </div>
        )}

        <Button 
          size="lg" 
          fullWidth 
          onClick={handleFinishLesson}
          className="max-w-xs animate-slide-up"
        >
          Continue <span className="text-xs ml-2 opacity-70 font-normal">(Press Enter)</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen max-w-2xl mx-auto bg-white ${timerEnabled ? 'border-x-4 border-yellow-400' : ''}`}>
      {/* Header */}
      <div className="px-4 py-6 flex items-center gap-4">
        <button onClick={() => setShowExitModal(true)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <ProgressBar progress={progress} />
        </div>
        
        {isOffline && (
            <div className="flex items-center gap-1 text-gray-400 bg-gray-100 px-2 py-1 rounded-full text-xs font-bold border border-gray-200" title="Offline Mode">
                <WifiOff size={14} />
                <span className="hidden sm:inline">OFFLINE</span>
            </div>
        )}
        
        {timerEnabled ? (
          <div className={`
             flex items-center gap-1 font-black font-mono text-xl px-3 py-1 rounded-xl border-4 shadow-sm transition-all duration-300
             ${timeLeft < 30 ? 'text-white bg-duo-red border-duo-red-dark scale-110 animate-pulse' : 'text-yellow-700 bg-yellow-100 border-yellow-400'}
          `}>
             <Zap size={20} className="fill-current" />
             {formatTime(timeLeft)}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-duo-red font-bold">
            <Heart className="fill-current" size={24} /> {hearts}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <h2 className="text-2xl font-bold text-gray-700 mb-8">
          {currentExercise.type === 'SELECT_MEANING' && "Select the correct meaning"}
          {currentExercise.type === 'TRANSLATE_TO_TARGET' && "Translate this sentence"}
          {currentExercise.type === 'TRANSLATE_TO_SOURCE' && "Translate this sentence"}
          {currentExercise.type === 'LISTEN_AND_TYPE' && "Tap what you hear"}
          {currentExercise.type === 'FILL_IN_THE_BLANK' && "Complete the sentence"}
        </h2>

        {/* Question Area */}
        <div className="mb-8">
           {currentExercise.type === 'SELECT_MEANING' ? (
             <div className="text-xl font-medium text-gray-600 mb-4">{currentExercise.prompt}</div>
           ) : (
             <div className={`flex gap-4 ${currentExercise.type === 'LISTEN_AND_TYPE' ? 'flex-col items-center' : 'items-start'}`}>
                {(currentExercise.type === 'TRANSLATE_TO_SOURCE' || currentExercise.type === 'LISTEN_AND_TYPE' || (!isOffline && currentExercise.type !== 'FILL_IN_THE_BLANK')) && (
                   <div className="flex items-center gap-4">
                     <button 
                      onClick={() => handlePlayAudio(currentExercise.prompt)}
                      className={`
                         bg-duo-blue text-white rounded-xl shadow-b-4 active:scale-95 transition-transform group relative
                         ${currentExercise.type === 'LISTEN_AND_TYPE' ? 'p-6' : 'p-3'}
                      `}
                      title="Press Spacebar"
                    >
                      <Volume2 size={currentExercise.type === 'LISTEN_AND_TYPE' ? 48 : 24} />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Space
                      </div>
                    </button>
                    
                    {/* Pronunciation Guide Button for Listen exercises */}
                    {currentExercise.type === 'LISTEN_AND_TYPE' && currentExercise.pronunciation && (
                       <button
                         onClick={() => setShowPronunciation(!showPronunciation)}
                         className={`
                           p-3 rounded-xl transition-colors border-2 border-transparent
                           ${showPronunciation 
                             ? 'bg-blue-100 text-duo-blue border-blue-200' 
                             : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                           }
                         `}
                         title={showPronunciation ? "Hide Pronunciation" : "Show Pronunciation"}
                       >
                          {showPronunciation ? <EyeOff size={24} /> : <Eye size={24} />}
                       </button>
                    )}
                   </div>
                )}
                
                {currentExercise.type !== 'LISTEN_AND_TYPE' && currentExercise.type !== 'FILL_IN_THE_BLANK' && (
                  <div className="p-4 border-2 border-gray-200 rounded-2xl text-lg relative chat-bubble">
                    {currentExercise.prompt}
                  </div>
                )}

                {/* Fill in the Blank Render */}
                {currentExercise.type === 'FILL_IN_THE_BLANK' && (
                   <div className="text-xl md:text-2xl font-medium text-gray-700 leading-loose flex flex-wrap items-baseline gap-2 max-w-full">
                       {currentExercise.prompt.split('___').map((part, i, arr) => (
                         <React.Fragment key={i}>
                            <span dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br/>') }}></span>
                            {i < arr.length - 1 && (
                              <input
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                className={`
                                   border-b-4 bg-gray-50 px-3 py-1 rounded-t-lg focus:outline-none font-bold text-center min-w-[120px] transition-colors
                                   ${status === 'CORRECT' ? 'border-duo-green text-duo-green bg-green-50' : ''}
                                   ${status === 'WRONG' ? 'border-duo-red text-duo-red bg-red-50' : ''}
                                   ${status === 'IDLE' ? 'border-gray-300 text-gray-800 focus:border-duo-blue focus:bg-blue-50' : ''}
                                `}
                                disabled={status !== 'IDLE'}
                                autoFocus
                                autoCapitalize="off"
                                autoComplete="off"
                              />
                            )}
                         </React.Fragment>
                       ))}
                   </div>
                )}

                {/* Pronunciation Text Display */}
                {currentExercise.type === 'LISTEN_AND_TYPE' && showPronunciation && currentExercise.pronunciation && (
                    <div className="bg-blue-50 text-duo-blue px-4 py-2 rounded-lg font-mono text-lg font-bold border-2 border-blue-100 animate-pop-in">
                       {currentExercise.pronunciation}
                    </div>
                )}
             </div>
           )}
        </div>

        {/* Options Area */}
        <div className="space-y-4">
          {/* Multiple Choice */}
          {currentExercise.type === 'SELECT_MEANING' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentExercise.options?.map((opt, idx) => (
                <Card 
                  key={idx} 
                  selected={selectedOption === opt}
                  onClick={() => status === 'IDLE' && setSelectedOption(opt)}
                  className={`
                    ${status !== 'IDLE' ? 'pointer-events-none' : ''} 
                    relative flex items-center p-6 min-h-[80px]
                  `}
                >
                   {/* Keyboard shortcut hint and selected indicator */}
                  <span className={`
                     absolute top-3 left-3 text-[10px] font-bold border rounded px-1.5 py-0.5 transition-colors
                     ${selectedOption === opt 
                        ? 'text-duo-blue border-duo-blue bg-blue-50' 
                        : 'text-gray-300 border-gray-200'
                     }
                  `}>
                    {idx + 1}
                  </span>
                  
                  {/* Option Text */}
                  <span className="w-full text-center text-lg font-bold">
                    {opt}
                  </span>
                </Card>
              ))}
            </div>
          )}

          {/* Word Bank / Translation / Listen & Type */}
          {(currentExercise.type === 'TRANSLATE_TO_TARGET' || currentExercise.type === 'TRANSLATE_TO_SOURCE' || currentExercise.type === 'LISTEN_AND_TYPE') && (
            <>
               {/* Answer Drop Zone */}
               <div className="min-h-[60px] border-b-2 border-gray-200 mb-8 flex flex-wrap gap-2 p-2 relative transition-all">
                  {selectedWords.length === 0 && (
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 pointer-events-none text-sm font-bold">
                       {currentExercise.type === 'LISTEN_AND_TYPE' ? 'Tap words you hear...' : 'Tap words to translate...'}
                    </div>
                  )}
                  {selectedWords.map((word, idx) => (
                    <button 
                      key={`${word}-${idx}`}
                      onClick={() => handleRemoveWord(word, idx)}
                      className="px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold shadow-sm animate-pop-in hover:bg-red-50 hover:border-red-200"
                    >
                      {word}
                    </button>
                  ))}
               </div>

               {/* Custom Word Input */}
               {status === 'IDLE' && (
                   <div className="mb-4 flex items-center gap-2">
                       <div className="relative flex-1">
                            <input 
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                onKeyDown={handleCustomInputKeyDown}
                                placeholder="Type to add a word..."
                                className="w-full pl-4 pr-10 py-2 border-2 border-gray-200 rounded-xl focus:border-duo-blue focus:outline-none transition-colors"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded">
                                ENTER
                            </div>
                       </div>
                   </div>
               )}

               {/* Word Bank */}
               <div className="flex flex-wrap justify-center gap-2">
                 {allOptions.map((word, idx) => {
                   // Improved logic to support duplicate words
                   const isDisabled = isWordUsed(word, idx);
                   return (
                     <button
                       key={idx}
                       onClick={() => handleAddWord(word)}
                       disabled={isDisabled}
                       className={`
                         px-4 py-2 rounded-xl text-sm font-bold border-b-4 transition-all
                         ${isDisabled 
                           ? 'bg-gray-200 text-transparent border-gray-200 select-none' 
                           : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 active:translate-y-1 active:border-b-0 shadow-sm border-2'
                         }
                       `}
                     >
                       {word}
                     </button>
                   );
                 })}
               </div>
            </>
          )}
        </div>
      </div>

      {/* Explanation Modal */}
      {showExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pop-in">
             <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                <button onClick={() => setShowExplanation(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Explanation</h3>
                <div className="space-y-4">
                   <div>
                     <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Translation</div>
                     <div className="text-lg font-medium text-gray-700">{currentExercise.translation}</div>
                   </div>
                   {currentExercise.explanation && (
                     <div>
                       <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Why?</div>
                       <div className="text-gray-600 leading-relaxed">{currentExercise.explanation}</div>
                     </div>
                   )}
                </div>
                <Button fullWidth className="mt-6" onClick={() => setShowExplanation(false)}>Got it</Button>
             </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
             <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Quit Lesson?</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                   You will lose all progress for this lesson if you quit now.
                </p>
                <div className="flex gap-4">
                   <Button 
                     variant="ghost" 
                     fullWidth 
                     onClick={() => setShowExitModal(false)}
                     className="text-gray-500 hover:text-gray-700"
                   >
                     Cancel
                   </Button>
                   <Button 
                     variant="danger" 
                     fullWidth 
                     onClick={onExit}
                   >
                     Quit
                   </Button>
                </div>
             </div>
        </div>
      )}

      {/* Footer / Feedback Sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 p-4 md:p-8 transition-colors duration-300 border-t-2 z-20
        ${status === 'CORRECT' ? 'bg-green-100 border-green-200' : ''}
        ${status === 'WRONG' ? 'bg-red-100 border-red-200' : ''}
        ${status === 'IDLE' ? 'bg-white border-gray-200' : ''}
      `}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
           {status === 'IDLE' && (
             <div className="flex-1">
               <Button 
                 variant="ghost" 
                 size="lg"
                 onClick={handleSkip}
                 className="text-gray-400 hover:text-gray-600 hover:bg-gray-50"
               >
                 Skip
               </Button>
             </div>
           )}

           {status === 'CORRECT' && (
             <div className="flex items-center gap-4 animate-slide-up">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-duo-green shadow-sm">
                 <Check size={32} strokeWidth={4} />
               </div>
               <div>
                 <div className="font-bold text-duo-green-dark text-xl">Amazing!</div>
                 <div className="text-duo-green">You're doing great.</div>
               </div>
             </div>
           )}

           {status === 'WRONG' && (
             <div className="flex flex-row items-center gap-4 animate-slide-up flex-1 min-w-0">
               <div className="hidden sm:flex w-14 h-14 bg-white rounded-full items-center justify-center text-duo-red shadow-sm shrink-0">
                 <X size={36} strokeWidth={4} />
               </div>
               <div className="flex-1 flex flex-col justify-center min-w-0">
                 <div className="text-xs md:text-sm font-bold text-duo-red-dark uppercase mb-1 tracking-wider">Correct Answer:</div>
                 <div className="text-sm md:text-lg font-black text-duo-red break-words leading-tight bg-white/40 p-2 rounded-lg border border-duo-red/10">
                    {currentExercise.correctAnswer}
                 </div>
                 {/* Show Pronunciation on Wrong Answer for Listen exercises */}
                 {currentExercise.type === 'LISTEN_AND_TYPE' && currentExercise.pronunciation && (
                     <div className="flex items-center gap-2 mt-1 text-duo-red-dark text-xs font-bold">
                        <Ear size={12} />
                        <span className="font-mono">{currentExercise.pronunciation}</span>
                     </div>
                 )}
               </div>
               {(currentExercise.translation || currentExercise.explanation) && (
                   <button
                     onClick={() => setShowExplanation(true)}
                     className="p-3 bg-white hover:bg-red-50 rounded-xl text-duo-red-dark border-2 border-duo-red/20 transition-colors shrink-0 shadow-sm flex flex-col items-center justify-center gap-1 h-full"
                     title="Explanation"
                   >
                     <BookOpen size={20} />
                     <span className="text-[10px] font-extrabold uppercase hidden md:block">Explain</span>
                   </button>
               )}
             </div>
           )}
           
           {/* Undo Button */}
           {status === 'WRONG' && ['TRANSLATE_TO_TARGET', 'TRANSLATE_TO_SOURCE', 'LISTEN_AND_TYPE'].includes(currentExercise.type) && selectedWords.length > 0 && (
              <Button 
                variant="ghost" 
                onClick={handleUndo}
                className="mr-2 !text-duo-red hover:!bg-red-100 !px-3"
                title="Undo last word and retry"
              >
                <RotateCcw size={24} />
              </Button>
           )}

           <Button 
             variant={status === 'WRONG' ? 'danger' : 'primary'}
             size="lg"
             className="min-w-[150px]"
             onClick={status === 'IDLE' ? handleCheck : handleContinue}
             disabled={status === 'IDLE' && ((currentExercise.type === 'FILL_IN_THE_BLANK' ? !textInput.trim() : (!selectedOption && selectedWords.length === 0)))}
           >
             {status === 'IDLE' ? 'Check' : 'Continue'}
           </Button>
        </div>
      </div>
    </div>
  );
}