import { Achievement, UserState } from '../types';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Progression
  { id: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', conditionType: 'LESSONS_COMPLETED', threshold: 1, unlocked: false },
  { id: 'lesson_5', title: 'Dedicated', description: 'Complete 5 lessons', icon: '📚', conditionType: 'LESSONS_COMPLETED', threshold: 5, unlocked: false },
  
  // XP
  { id: 'scholar_1', title: 'Scholar', description: 'Earn 100 XP', icon: '🎓', conditionType: 'XP_EARNED', threshold: 100, unlocked: false },
  { id: 'scholar_2', title: 'Sage', description: 'Earn 500 XP', icon: '🧙‍♂️', conditionType: 'XP_EARNED', threshold: 500, unlocked: false },
  
  // Streak
  { id: 'streak_3', title: 'On Fire', description: 'Reach a 3-day streak', icon: '🔥', conditionType: 'STREAK_DAYS', threshold: 3, unlocked: false },
  { id: 'streak_7', title: 'Unstoppable', description: 'Reach a 7-day streak', icon: '🚀', conditionType: 'STREAK_DAYS', threshold: 7, unlocked: false },

  // Mastery (New)
  { id: 'mastery_1', title: 'Master Mind', description: 'Reach Level 5 in 1 Topic', icon: '👑', conditionType: 'TOPICS_MASTERED', threshold: 1, unlocked: false },
  { id: 'mastery_3', title: 'Polyglot', description: 'Reach Level 5 in 3 Topics', icon: '🌍', conditionType: 'TOPICS_MASTERED', threshold: 3, unlocked: false },

  // Challenges (New)
  { id: 'perfect_1', title: 'Sharpshooter', description: 'Complete a lesson with no mistakes', icon: '🏹', conditionType: 'PERFECT_LESSONS', threshold: 1, unlocked: false },
  { id: 'perfect_5', title: 'Perfectionist', description: 'Complete 5 perfect lessons', icon: '💎', conditionType: 'PERFECT_LESSONS', threshold: 5, unlocked: false },
  { id: 'speed_1', title: 'Speed Demon', description: 'Complete a timed lesson in under 60 seconds', icon: '⚡', conditionType: 'SPEEDRUN_LESSONS', threshold: 1, unlocked: false },
];

export const initializeAchievements = (currentAchievements: Achievement[] = []): Achievement[] => {
  const currentMap = new Map(currentAchievements.map(a => [a.id, a]));
  return ALL_ACHIEVEMENTS.map(def => {
    const existing = currentMap.get(def.id);
    // Preserve unlocked status if it exists, otherwise use default
    return existing ? { ...def, unlocked: existing.unlocked, unlockedAt: existing.unlockedAt } : def;
  });
};

export const checkAchievements = (state: UserState): { updatedAchievements: Achievement[], newUnlocks: Achievement[] } => {
  const newUnlocks: Achievement[] = [];
  
  const updatedAchievements = state.achievements.map(ach => {
    if (ach.unlocked) return ach; 

    let met = false;
    switch (ach.conditionType) {
      case 'LESSONS_COMPLETED':
        met = state.completedLessons.length >= ach.threshold;
        break;
      case 'STREAK_DAYS':
        met = state.streak >= ach.threshold;
        break;
      case 'XP_EARNED':
        met = state.xp >= ach.threshold;
        break;
      case 'TOPICS_MASTERED':
        // Count topics with level >= 5
        const masteredCount = Object.values(state.topicLevels || {}).filter(lvl => lvl >= 5).length;
        met = masteredCount >= ach.threshold;
        break;
      case 'PERFECT_LESSONS':
        met = (state.perfectLessonCount || 0) >= ach.threshold;
        break;
      case 'SPEEDRUN_LESSONS':
        met = (state.fastLessonCount || 0) >= ach.threshold;
        break;
    }

    if (met) {
      const unlockedAch = { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
      newUnlocks.push(unlockedAch);
      return unlockedAch;
    }
    return ach;
  });

  return { updatedAchievements, newUnlocks };
};