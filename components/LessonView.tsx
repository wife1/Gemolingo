import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Lesson, LessonResult, ExerciseType } from '../types';
import { Button, ProgressBar, Card } from './UI';
import { Heart, Volume2, X, Check, Trophy, Timer, Zap, ArrowLeft, BookOpen, Plus, Ear, Eye, EyeOff, WifiOff, RotateCcw, Loader2 } from 'lucide-react';
import { generateSpeech, playAudioBuffer, lookupWord } from '../services/geminiService';
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

interface WordPopoverState {
  word: string;
  translation: string;
  definition?: string;
  partOfSpeech?: string;
  position: { top: number; left: number };
  loading: boolean;
}

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
  const [textInput, setTextInput] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'CHECKING' | 'CORRECT' | 'WRONG'>('IDLE');
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60s for speed run
  
  // Word Bank State for TRANSLATE_TO_TARGET
  const [selectedWordIndices, setSelectedWordIndices] = useState<number[]>([]);

  // Word Lookup State
  const [wordPopover, setWordPopover] = useState<WordPopoverState | null>(null);

  const currentExercise = lesson.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex) / lesson.exercises.length) * 100;

  useEffect(() => {
    // Reset state for new exercise
    setSelectedOption(null);
    setTextInput('');
    setSelectedWordIndices([]);
    setStatus('IDLE');
    setAudioBuffer(null);
    setWordPopover(null);

    // Auto-play audio if applicable
    if (currentExercise.type === ExerciseType.LISTEN_AND_TYPE || currentExercise.type === ExerciseType.TRANSLATE_TO_SOURCE) {
         handlePlayAudio(currentExercise.prompt);
    }
  }, [currentExerciseIndex, currentExercise]);

  // Sync Word Bank selection to textInput for validation
  useEffect(() => {
    if (currentExercise.type === ExerciseType.TRANSLATE_TO_TARGET && currentExercise.options) {
      const words = selectedWordIndices.map(i => currentExercise.options![i]);
      setTextInput(words.join(' '));
    }
  }, [selectedWordIndices, currentExercise]);

  useEffect(() => {
      let interval: any;
      if (timerEnabled && timeLeft > 0) {
          interval = setInterval(() => {
              setTimeLeft(prev => {
                  if (prev <= 1) {
                      clearInterval(interval);
                      onExit(); // Time's up
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [timerEnabled, timeLeft, onExit]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wordPopover && !(e.target as HTMLElement).closest('.word-popover') && !(e.target as HTMLElement).closest('.interactive-word')) {
        setWordPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wordPopover]);

  const handlePlayAudio = async (text: string) => {
    if (isOffline) return;
    
    // Simple cache check
    if (audioBuffer) {
        playAudioBuffer(audioBuffer);
        return;
    }

    setIsAudioLoading(true);
    const buffer = await generateSpeech(text, 'en'); 
    if (buffer) {
        setAudioBuffer(buffer);
        playAudioBuffer(buffer);
    }
    setIsAudioLoading(false);
  };

  const handleWordClick = async (e: React.MouseEvent<HTMLSpanElement>, word: string) => {
    if (status !== 'IDLE' && status !== 'WRONG') return; // Only allow looking up words when idle or reviewing wrong answer
    if (isOffline) return;

    // Clean word from punctuation
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (!cleanWord) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = document.querySelector('.lesson-container')?.getBoundingClientRect() || { top: 0, left: 0 };
    
    setWordPopover({
      word: cleanWord,
      translation: '',
      loading: true,
      position: {
        top: rect.top - containerRect.top - 10, // Just above the word
        left: rect.left - containerRect.left + (rect.width / 2)
      }
    });

    try {
      const result = await lookupWord(cleanWord, currentExercise.prompt);
      if (result) {
        setWordPopover(prev => prev ? {
          ...prev,
          translation: result.translation,
          definition: result.definition,
          partOfSpeech: result.partOfSpeech,
          loading: false
        } : null);
      } else {
         setWordPopover(null); // Failed to load
      }
    } catch (err) {
      setWordPopover(null);
    }
  };

  const renderInteractivePrompt = (text: string) => {
    // If it's a listening exercise, don't show text usually, or show it differently
    if (currentExercise.type === ExerciseType.LISTEN_AND_TYPE) return null;

    return (
      <div className="flex flex-wrap gap-1.5 text-xl font-medium text-gray-700 leading-relaxed justify-start">
        {text.split(' ').map((word, i) => (
          <span 
            key={i} 
            onClick={(e) => handleWordClick(e, word)}
            className="interactive-word cursor-pointer border-b-2 border-dotted border-gray-300 hover:bg-gray-100 hover:border-duo-blue transition-colors rounded px-0.5"
          >
            {word}
          </span>
        ))}
      </div>
    );
  };

  const handleWordBankSelect = (index: number) => {
    if (status !== 'IDLE') return;
    setSelectedWordIndices(prev => [...prev, index]);
  };

  const handleWordBankDeselect = (indexInSelected: number) => {
    if (status !== 'IDLE') return;
    setSelectedWordIndices(prev => prev.filter((_, i) => i !== indexInSelected));
  };

  const handleCheck = () => {
    setStatus('CHECKING');
    setWordPopover(null);
    
    let isCorrect = false;
    const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");

    if (currentExercise.type === ExerciseType.LISTEN_AND_TYPE || 
        currentExercise.type === ExerciseType.TRANSLATE_TO_TARGET || 
        currentExercise.type === ExerciseType.TRANSLATE_TO_SOURCE ||
        currentExercise.type === ExerciseType.FILL_IN_THE_BLANK) {
        
        const answer = normalize(textInput || selectedOption || '');
        const correct = normalize(currentExercise.correctAnswer);
        isCorrect = answer === correct;

    } else {
        // Multiple Choice
        isCorrect = selectedOption === currentExercise.correctAnswer;
    }

    if (isCorrect) {
        setStatus('CORRECT');
        playSuccessSound();
    } else {
        setStatus('WRONG');
        playErrorSound();
        setMistakes(prev => prev + 1);
        onLoseHeart();
    }
  };

  const handleNext = () => {
    if (currentExerciseIndex < lesson.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
    } else {
        // Lesson Finished
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        const timeSpent = (Date.now() - startTime) / 1000;
        onComplete({
            xp: 10 + (hearts * 2), // Base XP + Heart Bonus
            mistakes,
            timeSeconds: timeSpent
        });
    }
  };

  const playSuccessSound = () => {
      // Placeholder for success sound
  };

  const playErrorSound = () => {
      // Placeholder for error sound
  };

  // Render Exercise Content
  const renderExercise = () => {
      switch (currentExercise.type) {
          case ExerciseType.CHOOSE_THE_CORRECT_TRANSLATION:
          case ExerciseType.SELECT_MEANING:
              return (
                  <div className="space-y-4">
                      {currentExercise.type === ExerciseType.CHOOSE_THE_CORRECT_TRANSLATION && (
                          <div className="flex items-center gap-4 mb-8">
                             <button 
                               onClick={() => handlePlayAudio(currentExercise.prompt)}
                               className="w-12 h-12 flex-shrink-0 bg-duo-blue rounded-2xl flex items-center justify-center text-white shadow-b-4 hover:bg-opacity-90 active:translate-y-1 active:border-b-0"
                             >
                                {isAudioLoading ? <RotateCcw className="animate-spin" /> : <Volume2 />}
                             </button>
                             <div className="p-4 border-2 border-gray-200 rounded-2xl relative bg-white w-full">
                                {renderInteractivePrompt(currentExercise.prompt)}
                                {/* Speech bubble triangle */}
                                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-gray-200 border-b-[8px] border-b-transparent"></div>
                                <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-white border-b-[6px] border-b-transparent"></div>
                             </div>
                          </div>
                      )}
                      
                      {currentExercise.type === ExerciseType.SELECT_MEANING && (
                           <div className="mb-8">
                               <h2 className="text-2xl font-bold text-gray-700 mb-2">What does this mean?</h2>
                               {renderInteractivePrompt(currentExercise.prompt)}
                           </div>
                      )}

                      <div className="grid gap-4">
                          {currentExercise.options?.map((option, idx) => (
                              <Card 
                                key={idx}
                                selected={selectedOption === option}
                                onClick={() => status !== 'IDLE' ? null : setSelectedOption(option)}
                                className="text-lg font-medium p-4"
                              >
                                  <div className="flex items-center gap-4">
                                      <div className={`
                                        w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold
                                        ${selectedOption === option ? 'border-duo-blue text-duo-blue' : 'border-gray-200 text-gray-400'}
                                      `}>
                                          {idx + 1}
                                      </div>
                                      {option}
                                  </div>
                              </Card>
                          ))}
                      </div>
                  </div>
              );
          
          case ExerciseType.TRANSLATE_TO_TARGET:
              return (
                  <div>
                      <h2 className="text-xl font-bold text-gray-700 mb-6">Translate this sentence</h2>
                      
                      <div className="flex items-center gap-4 mb-8">
                           {/* Speech bubble or simple text for prompt */}
                           <div className="p-4 border-2 border-gray-200 rounded-2xl relative bg-white inline-block">
                              {renderInteractivePrompt(currentExercise.prompt)}
                              <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-gray-200 border-b-[8px] border-b-transparent"></div>
                           </div>
                      </div>

                      {/* Answer Zone - Word Bank Items */}
                      <div className="bg-transparent border-b-2 border-gray-200 min-h-[60px] mb-8 py-2 flex flex-wrap gap-2 items-center">
                          {selectedWordIndices.map((originalIndex, i) => (
                              <button 
                                  key={`${originalIndex}-${i}`}
                                  onClick={() => handleWordBankDeselect(i)}
                                  className="px-4 py-2 bg-white border-2 border-gray-200 border-b-4 active:border-b-2 active:translate-y-[2px] rounded-xl font-bold text-gray-700 shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors"
                              >
                                  {currentExercise.options![originalIndex]}
                              </button>
                          ))}
                      </div>

                      {/* Available Options - Word Bank */}
                      <div className="flex flex-wrap gap-2 justify-center">
                          {currentExercise.options?.map((option, idx) => {
                              const isUsed = selectedWordIndices.includes(idx);
                              return (
                                  <div key={idx} className={`${isUsed ? 'opacity-0 pointer-events-none' : ''}`}>
                                       <button 
                                          onClick={() => handleWordBankSelect(idx)}
                                          className="px-4 py-2 bg-white border-2 border-gray-200 border-b-4 active:border-b-2 active:translate-y-[2px] rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                                       >
                                          {option}
                                       </button>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              );

          case ExerciseType.LISTEN_AND_TYPE:
               return (
                  <div className="flex flex-col items-center justify-center py-8">
                      <button 
                        onClick={() => handlePlayAudio(currentExercise.prompt)}
                        className="w-32 h-32 bg-duo-blue rounded-3xl flex items-center justify-center text-white shadow-lg mb-8 hover:scale-105 transition-transform"
                      >
                         {isAudioLoading ? <RotateCcw size={48} className="animate-spin" /> : <Volume2 size={48} />}
                      </button>
                      <div className="text-gray-400 font-bold mb-4 uppercase text-sm tracking-widest">Type what you hear</div>
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type in the language..."
                        className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl p-4 text-xl outline-none focus:border-duo-blue focus:bg-white transition-colors resize-none h-32"
                        disabled={status !== 'IDLE'}
                      />
                  </div>
               );

          default:
              // TRANSLATE_TO_SOURCE, FILL_IN_THE_BLANK etc.
              return (
                  <div>
                      <h2 className="text-xl font-bold text-gray-700 mb-6">
                        {currentExercise.type === ExerciseType.FILL_IN_THE_BLANK ? 'Fill in the blank' : 'Translate to English'}
                      </h2>
                      
                      <div className="flex items-center gap-4 mb-8">
                         {currentExercise.pronunciation && (
                             <button 
                               onClick={() => handlePlayAudio(currentExercise.prompt)}
                               className="p-2 text-duo-blue hover:bg-blue-50 rounded-xl"
                             >
                                <Volume2 />
                             </button>
                         )}
                         {renderInteractivePrompt(currentExercise.prompt)}
                      </div>

                      <div className="border-b-2 border-gray-200 min-h-[60px] mb-8 text-xl p-2 flex flex-wrap gap-2 items-center">
                           <input 
                              type="text" 
                              value={textInput}
                              onChange={(e) => setTextInput(e.target.value)}
                              className="w-full outline-none bg-transparent placeholder-gray-300"
                              placeholder="Type your answer..."
                              disabled={status !== 'IDLE'}
                           />
                      </div>
                      
                      {currentExercise.options && (
                          <div className="flex flex-wrap gap-2">
                             {currentExercise.options.map(opt => (
                                 <button 
                                    key={opt}
                                    onClick={() => setTextInput(prev => prev ? `${prev} ${opt}` : opt)}
                                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 active:translate-y-1 shadow-sm"
                                 >
                                    {opt}
                                 </button>
                             ))}
                          </div>
                      )}
                  </div>
              );
      }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative overflow-hidden lesson-container">
      {/* Header */}
      <div className="px-4 py-6 flex items-center gap-4">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600">
           <X size={24} />
        </button>
        <ProgressBar progress={progress} />
        <div className="flex items-center gap-1 text-duo-red font-bold">
           <Heart className="fill-current" size={24} /> {hearts}
        </div>
        {timerEnabled && (
           <div className={`flex items-center gap-1 font-bold ${timeLeft < 10 ? 'text-duo-red animate-pulse' : 'text-orange-500'}`}>
               <Timer size={20} /> {timeLeft}s
           </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 relative">
         {renderExercise()}

         {/* Word Popover */}
         {wordPopover && (
            <div 
              className="word-popover absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 min-w-[150px] animate-pop-in transform -translate-x-1/2 -translate-y-full"
              style={{ top: wordPopover.position.top, left: wordPopover.position.left }}
            >
               {wordPopover.loading ? (
                 <div className="flex items-center justify-center py-2 text-duo-blue">
                    <Loader2 className="animate-spin" size={20} />
                 </div>
               ) : (
                 <>
                   <div className="font-bold text-duo-blue mb-1">{wordPopover.translation}</div>
                   {wordPopover.partOfSpeech && <div className="text-xs text-gray-400 italic mb-1">{wordPopover.partOfSpeech}</div>}
                   <div className="text-xs text-gray-600 leading-tight">{wordPopover.definition}</div>
                 </>
               )}
               {/* Arrow */}
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
            </div>
         )}
      </div>

      {/* Footer / Feedback Sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 p-4 border-t-2 transition-transform duration-300 ease-in-out z-20 max-w-md mx-auto
        ${status === 'IDLE' || status === 'CHECKING' ? 'bg-white border-gray-200 translate-y-0' : 
          status === 'CORRECT' ? 'bg-green-100 border-transparent translate-y-0' : 
          'bg-red-100 border-transparent translate-y-0'}
      `}>
         {status === 'IDLE' && (
             <Button fullWidth size="lg" onClick={handleCheck} disabled={!selectedOption && !textInput}>
                CHECK
             </Button>
         )}

         {status === 'CHECKING' && (
             <Button fullWidth size="lg" disabled className="opacity-80">
                CHECKING...
             </Button>
         )}

         {status === 'CORRECT' && (
             <div className="animate-slide-up">
                 <div className="flex items-center gap-4 mb-4">
                     <div className="bg-white p-2 rounded-full text-duo-green">
                         <Check size={32} strokeWidth={4} />
                     </div>
                     <div className="flex-1">
                        <div className="text-duo-green font-extrabold text-2xl">Excellent!</div>
                        
                        {/* Always show pronunciation if available - reinforces target language */}
                        {currentExercise.pronunciation && (
                            <div className="text-duo-green-dark text-lg mt-1 font-serif opacity-90">
                                {currentExercise.pronunciation}
                            </div>
                        )}

                        {currentExercise.type === ExerciseType.CHOOSE_THE_CORRECT_TRANSLATION && currentExercise.explanation && (
                            <div className="text-duo-green-dark text-sm mt-1 font-bold">
                                {currentExercise.explanation}
                            </div>
                        )}
                     </div>
                 </div>
                 <Button fullWidth variant="primary" onClick={handleNext}>
                     CONTINUE
                 </Button>
             </div>
         )}

         {status === 'WRONG' && (
             <div className="animate-slide-up">
                 <div className="flex items-start gap-4 mb-4">
                     <div className="bg-white p-2 rounded-full text-duo-red">
                         <X size={32} strokeWidth={4} />
                     </div>
                     <div>
                        <div className="text-duo-red font-extrabold text-2xl mb-1">Incorrect</div>
                        <div className="text-duo-red-dark font-bold text-sm">Correct Answer:</div>
                        <div className="text-gray-700 text-sm mb-2 flex flex-wrap gap-2 items-baseline">
                            <span>{currentExercise.correctAnswer}</span>
                            
                             {/* Only show pronunciation next to answer if answer is in target language */}
                             {(currentExercise.type === ExerciseType.TRANSLATE_TO_TARGET || 
                              currentExercise.type === ExerciseType.LISTEN_AND_TYPE || 
                              currentExercise.type === ExerciseType.FILL_IN_THE_BLANK) && 
                              currentExercise.pronunciation && (
                                <span className="text-gray-500 font-serif italic text-xs">
                                    {currentExercise.pronunciation}
                                </span>
                            )}
                        </div>
                        {currentExercise.explanation && (
                             <div className="bg-white/50 p-2 rounded-lg text-sm text-gray-600 border border-duo-red/20">
                                <strong>Tip:</strong> {currentExercise.explanation}
                             </div>
                        )}
                     </div>
                 </div>
                 <Button fullWidth variant="danger" onClick={handleNext}>
                     GOT IT
                 </Button>
             </div>
         )}
      </div>
      
      {/* Overlay for Feedback states to block interaction with exercise */}
      {(status === 'CORRECT' || status === 'WRONG') && (
          <div className="absolute inset-0 bg-transparent z-10 bottom-[140px]" />
      )}
    </div>
  );
};
