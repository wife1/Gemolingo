import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Lesson, LessonResult, ExerciseType } from '../types';
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

  const currentExercise = lesson.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex) / lesson.exercises.length) * 100;

  useEffect(() => {
    // Reset state for new exercise
    setSelectedOption(null);
    setTextInput('');
    setStatus('IDLE');
    setAudioBuffer(null);

    // Auto-play audio if applicable
    if (currentExercise.type === ExerciseType.LISTEN_AND_TYPE || currentExercise.type === ExerciseType.TRANSLATE_TO_SOURCE) {
         handlePlayAudio(currentExercise.prompt);
    }
  }, [currentExerciseIndex, currentExercise]);

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

  const handleCheck = () => {
    setStatus('CHECKING');
    
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
                               className="w-12 h-12 bg-duo-blue rounded-2xl flex items-center justify-center text-white shadow-b-4 hover:bg-opacity-90 active:translate-y-1 active:border-b-0"
                             >
                                {isAudioLoading ? <RotateCcw className="animate-spin" /> : <Volume2 />}
                             </button>
                             <div className="text-xl font-bold text-gray-700 p-4 border-2 border-gray-200 rounded-2xl relative">
                                {currentExercise.prompt}
                                {/* Speech bubble triangle */}
                                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-gray-200 border-b-[8px] border-b-transparent"></div>
                                <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-white border-b-[6px] border-b-transparent"></div>
                             </div>
                          </div>
                      )}
                      
                      {currentExercise.type === ExerciseType.SELECT_MEANING && (
                           <div className="mb-8">
                               <h2 className="text-2xl font-bold text-gray-700 mb-2">What does this mean?</h2>
                               <div className="text-lg text-gray-500">{currentExercise.prompt}</div>
                           </div>
                      )}

                      <div className="grid gap-4">
                          {currentExercise.options?.map((option, idx) => (
                              <Card 
                                key={idx}
                                selected={selectedOption === option}
                                onClick={() => status !== 'CHECKING' && status !== 'CORRECT' && status !== 'WRONG' && setSelectedOption(option)}
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
              // TRANSLATE, FILL_IN_THE_BLANK etc.
              return (
                  <div>
                      <h2 className="text-xl font-bold text-gray-700 mb-6">
                        {currentExercise.type === ExerciseType.TRANSLATE_TO_TARGET ? 'Translate this sentence' : 
                         currentExercise.type === ExerciseType.FILL_IN_THE_BLANK ? 'Fill in the blank' : 'Translate to English'}
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
                         <div className="text-lg text-gray-600">{currentExercise.prompt}</div>
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative overflow-hidden">
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
      <div className="flex-1 overflow-y-auto px-4 pb-32">
         {renderExercise()}
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
                        <div className="text-gray-700 text-sm mb-2">{currentExercise.correctAnswer}</div>
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