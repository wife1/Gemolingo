import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Lesson, LessonResult } from '../types';
import { Button, ProgressBar, Card } from './UI';
import { Heart, Volume2, X, Check, Trophy, Timer } from 'lucide-react';
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
  const [status, setStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG' | 'TIME_UP'>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  
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
    if (status !== 'TIME_UP') {
      setStatus('IDLE');
    }
  }, [currentExerciseIndex]);

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
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
  }, [status, isLessonComplete, selectedOption, selectedWords, currentExercise]);

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
    } else if (currentExercise.type === 'TRANSLATE_TO_TARGET' || currentExercise.type === 'TRANSLATE_TO_SOURCE') {
      const answer = selectedWords.join(' ');
      isCorrect = answer.toLowerCase().trim() === currentExercise.correctAnswer.toLowerCase().trim();
    }

    if (isCorrect) {
      setStatus('CORRECT');
      setCorrectCount(prev => prev + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#58cc02', '#ffffff']
      });
    } else {
      setStatus('WRONG');
      setMistakes(prev => prev + 1);
      onLoseHeart();
    }
  };

  const handleSkip = () => {
    setStatus('WRONG');
    setMistakes(prev => prev + 1);
    if (!timerEnabled) {
      onLoseHeart();
    }
    // Note: We do NOT increment correctCount
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
    // 5 XP Speed Bonus (if timer enabled)
    const baseXP = 5;
    const accuracyXP = correctCount * 2;
    const speedBonus = timerEnabled ? 5 : 0;
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to determine if a word in the bank should be disabled (used)
  // This supports duplicate words correctly.
  const isWordUsed = (word: string, indexInOptions: number) => {
    // How many times does this word appear in the options BEFORE this index?
    const previousOccurrencesInOptions = (currentExercise.options || [])
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
    const earnedXP = 5 + (correctCount * 2) + (timerEnabled ? 5 : 0);
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
        
        <div className="flex gap-4 mb-8">
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
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white">
      {/* Header */}
      <div className="px-4 py-6 flex items-center gap-4">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <ProgressBar progress={progress} />
        
        {timerEnabled ? (
          <div className={`
             flex items-center gap-1 font-black font-mono text-xl px-3 py-1 rounded-xl border-2
             ${timeLeft < 10 ? 'text-duo-red border-duo-red bg-red-50 animate-pulse' : 'text-duo-blue border-duo-blue bg-blue-50'}
          `}>
             <Timer size={20} />
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
        </h2>

        {/* Question Area */}
        <div className="mb-8">
           {currentExercise.type === 'SELECT_MEANING' ? (
             <div className="text-xl font-medium text-gray-600 mb-4">{currentExercise.prompt}</div>
           ) : (
             <div className="flex items-start gap-4">
                {(currentExercise.type === 'TRANSLATE_TO_SOURCE' || currentExercise.type === 'LISTEN_AND_TYPE' || !isOffline) && (
                   <button 
                    onClick={() => handlePlayAudio(currentExercise.prompt)}
                    className="p-3 bg-duo-blue text-white rounded-xl shadow-b-4 active:scale-95 transition-transform group relative"
                    title="Press Spacebar"
                  >
                    <Volume2 size={24} />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Space
                    </div>
                  </button>
                )}
                
                <div className="p-4 border-2 border-gray-200 rounded-2xl text-lg relative chat-bubble">
                  {currentExercise.prompt}
                </div>
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
                    relative
                  `}
                >
                  <span className="absolute top-2 left-2 text-xs font-bold text-gray-300 border border-gray-200 rounded px-1.5">{idx + 1}</span>
                  {opt}
                </Card>
              ))}
            </div>
          )}

          {/* Word Bank / Translation */}
          {(currentExercise.type === 'TRANSLATE_TO_TARGET' || currentExercise.type === 'TRANSLATE_TO_SOURCE') && (
            <>
               {/* Answer Drop Zone */}
               <div className="min-h-[60px] border-b-2 border-gray-200 mb-8 flex flex-wrap gap-2 p-2 relative transition-all">
                  {selectedWords.length === 0 && (
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 pointer-events-none text-sm font-bold">
                       Tap words to translate...
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

               {/* Word Bank */}
               <div className="flex flex-wrap justify-center gap-2">
                 {currentExercise.options?.map((word, idx) => {
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

      {/* Footer / Feedback Sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 p-4 md:p-8 transition-colors duration-300 border-t-2 z-20
        ${status === 'CORRECT' ? 'bg-green-100 border-green-200' : ''}
        ${status === 'WRONG' ? 'bg-red-100 border-red-200' : ''}
        ${status === 'TIME_UP' ? 'bg-red-100 border-red-200' : ''}
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
             <div className="flex items-center gap-4 animate-slide-up">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-duo-red shadow-sm">
                 <X size={32} strokeWidth={4} />
               </div>
               <div>
                 <div className="font-bold text-duo-red-dark text-xl">Correct Answer:</div>
                 <div className="text-duo-red">{currentExercise.correctAnswer}</div>
               </div>
             </div>
           )}

           <Button 
             variant={status === 'WRONG' || status === 'TIME_UP' ? 'danger' : 'primary'}
             size="lg"
             className="min-w-[150px]"
             onClick={status === 'IDLE' ? handleCheck : handleContinue}
             disabled={status === 'IDLE' && !selectedOption && selectedWords.length === 0}
           >
             {status === 'IDLE' ? 'Check' : 'Continue'}
           </Button>
        </div>
      </div>
    </div>
  );
};