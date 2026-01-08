import React, { useState, useEffect, useRef } from 'react';
import { Exercise, ExerciseType, Lesson } from '../types';
import { Button, ProgressBar, Card } from './UI';
import { Heart, Volume2, X, Check, ArrowRight, Trophy, Timer, Frown } from 'lucide-react';
import { generateSpeech, playAudioBuffer } from '../services/geminiService';
import confetti from 'canvas-confetti';

interface LessonViewProps {
  lesson: Lesson;
  onComplete: (xp: number) => void;
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
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_LIMIT);

  const currentExercise = lesson.exercises[currentExerciseIndex];
  const progress = (currentExerciseIndex / lesson.exercises.length) * 100;

  // Timer Logic
  useEffect(() => {
    if (!timerEnabled || isLessonComplete || status === 'TIME_UP') return;

    // Optional: Pause timer during 'CORRECT' or 'WRONG' feedback? 
    // Usually challenges keep running, but to be fair let's keep running for urgency.
    
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
      // Ignore if modifier keys are pressed (e.g. Ctrl+R)
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isLessonComplete) {
           onComplete(15 + (timerEnabled ? 10 : 0)); // Bonus XP for timed
        } else if (status === 'TIME_UP') {
           onExit();
        } else if (status === 'IDLE') {
           // Only check if we have an answer selected
           if (selectedOption || selectedWords.length > 0) {
             handleCheck();
           }
        } else {
           handleContinue();
        }
      } else if (e.key === ' ' && status === 'IDLE') {
        e.preventDefault(); // Prevent scrolling
        // Play audio if available
        handlePlayAudio(currentExercise.prompt);
      } else if (status === 'IDLE' && currentExercise.type === 'SELECT_MEANING' && currentExercise.options) {
        // Number keys 1-4 for multiple choice
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
      // Fire confetti when lesson is complete
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
    // In a real app, we would cache this
    const buffer = await generateSpeech(text, 'es'); // Defaulting to ES for demo, should use lesson language
    if (buffer) playAudioBuffer(buffer);
    setIsProcessing(false);
  };

  const handleCheck = () => {
    let isCorrect = false;

    if (currentExercise.type === 'SELECT_MEANING') {
      isCorrect = selectedOption === currentExercise.correctAnswer;
    } else if (currentExercise.type === 'TRANSLATE_TO_TARGET' || currentExercise.type === 'TRANSLATE_TO_SOURCE') {
      const answer = selectedWords.join(' ');
      // Simple string match - in production needed more fuzzy matching
      isCorrect = answer.toLowerCase().trim() === currentExercise.correctAnswer.toLowerCase().trim();
    }

    if (isCorrect) {
      setStatus('CORRECT');
      // Mini celebration for correct answer
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#58cc02', '#ffffff']
      });
      // Play ding sound (simulated logic)
    } else {
      setStatus('WRONG');
      onLoseHeart();
    }
  };

  const handleContinue = () => {
    if (currentExerciseIndex < lesson.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      setIsLessonComplete(true);
    }
  };
  
  const handleRemoveWord = (word: string, indexToRemove: number) => {
      if (status !== 'IDLE') return;
      setSelectedWords(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAddWord = (word: string) => {
      if (status !== 'IDLE') return;
      setSelectedWords(prev => [...prev, word]);
  };

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center animate-pop-in">
        <div className="mb-8 relative">
           <div className="absolute inset-0 bg-yellow-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
           <Trophy size={120} className="text-duo-yellow relative z-10" fill="currentColor" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-duo-yellow-dark mb-4">Lesson Complete!</h1>
        
        <div className="flex gap-4 mb-8">
           <div className="bg-orange-100 p-4 rounded-2xl border-2 border-orange-200 min-w-[120px]">
              <div className="text-sm font-bold text-orange-400 uppercase">XP Earned</div>
              <div className="text-3xl font-black text-orange-500">+{timerEnabled ? 25 : 15} XP</div>
           </div>
           <div className="bg-blue-100 p-4 rounded-2xl border-2 border-blue-200 min-w-[120px]">
              <div className="text-sm font-bold text-blue-400 uppercase">Speed</div>
              <div className="text-3xl font-black text-blue-500">
                {timerEnabled ? formatTime(DEFAULT_TIME_LIMIT - timeLeft) : 'Normal'}
              </div>
           </div>
        </div>

        <Button 
          size="lg" 
          fullWidth 
          onClick={() => onComplete(timerEnabled ? 25 : 15)}
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
                {/* Only show TTS if it is NOT a source translation (where prompt is in Target Language already) or if we want to hear the foreign text */}
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
                   const isSelected = selectedWords.includes(word);
                   return (
                     <button
                       key={idx}
                       onClick={() => handleAddWord(word)}
                       disabled={isSelected}
                       className={`
                         px-4 py-2 rounded-xl text-sm font-bold border-b-4 transition-all
                         ${isSelected 
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
             <div className="flex-1"></div>
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