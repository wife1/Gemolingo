

export enum ExerciseType {
  TRANSLATE_TO_TARGET = 'TRANSLATE_TO_TARGET',
  TRANSLATE_TO_SOURCE = 'TRANSLATE_TO_SOURCE',
  SELECT_MEANING = 'SELECT_MEANING',
  LISTEN_AND_TYPE = 'LISTEN_AND_TYPE',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  CHOOSE_THE_CORRECT_TRANSLATION = 'CHOOSE_THE_CORRECT_TRANSLATION'
}

export interface Exercise {
  id: number;
  type: ExerciseType;
  prompt: string; // The question text or sentence to translate
  correctAnswer: string;
  options?: string[]; // For multiple choice or word bank
  translation: string; // The translation of the prompt (for context)
  explanation?: string; // Brief grammar/vocab note
  pronunciation?: string; // IPA or phonetic guide
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type AchievementCondition = 
  | 'LESSONS_COMPLETED' 
  | 'STREAK_DAYS' 
  | 'XP_EARNED' 
  | 'TOPICS_MASTERED' 
  | 'PERFECT_LESSONS' 
  | 'SPEEDRUN_LESSONS';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditionType: AchievementCondition;
  threshold: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Lesson {
  id: string;
  topicId: string; // Original topic ID without difficulty suffix
  title: string;
  description: string;
  exercises: Exercise[];
  difficulty: Difficulty;
}

export interface LessonResult {
  xp: number;
  mistakes: number;
  timeSeconds: number;
}

export interface UserState {
  hearts: number;
  xp: number;
  streak: number;
  currentLanguage: string;
  completedLessons: string[];
  difficulty: Difficulty;
  achievements: Achievement[];
  dailyXp: number;
  dailyGoal: number;
  lastActiveDate: string;
  timerEnabled: boolean;
  topicLevels: Record<string, number>; // TopicID -> Level (0-5)
  streakFreezeActive: boolean;
  perfectLessonCount: number; // For Challenge Achievements
  fastLessonCount: number;    // For Challenge Achievements
  customLanguages: LanguageConfig[]; // User imported languages
  topicOrder?: string[]; // Custom order of topics
}

export type ScreenState = 'DASHBOARD' | 'LESSON' | 'PROFILE' | 'SHOP';

export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'jp', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese (BR)', flag: '🇧🇷' },
  { code: 'pt-pt', name: 'Portuguese (PT)', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'ca', name: 'Catalan', flag: '🇦🇩' },
  { code: 'eo', name: 'Esperanto', flag: '🟩' },
  { code: 'ady', name: 'Adyghe', flag: '🇷🇺' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'nn', name: 'Nynorsk', flag: '🇳🇴' },
  { code: 'ti', name: 'Tigrinya', flag: '🇪🇷' },
];