export enum ExerciseType {
  TRANSLATE_TO_TARGET = 'TRANSLATE_TO_TARGET',
  TRANSLATE_TO_SOURCE = 'TRANSLATE_TO_SOURCE',
  SELECT_MEANING = 'SELECT_MEANING',
  LISTEN_AND_TYPE = 'LISTEN_AND_TYPE'
}

export interface Exercise {
  id: number;
  type: ExerciseType;
  prompt: string; // The question text or sentence to translate
  correctAnswer: string;
  options?: string[]; // For multiple choice or word bank
  translation: string; // The translation of the prompt (for context)
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type AchievementCondition = 'LESSONS_COMPLETED' | 'STREAK_DAYS' | 'XP_EARNED';

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
}

export type ScreenState = 'DASHBOARD' | 'LESSON' | 'PROFILE';

export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'jp', name: 'Japanese', flag: '🇯🇵' },
];