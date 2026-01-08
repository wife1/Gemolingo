import { Achievement, UserState } from '../types';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', conditionType: 'LESSONS_COMPLETED', threshold: 1, unlocked: false },
  { id: 'scholar_1', title: 'Scholar', description: 'Earn 100 XP', icon: '🎓', conditionType: 'XP_EARNED', threshold: 100, unlocked: false },
  { id: 'scholar_2', title: 'Sage', description: 'Earn 500 XP', icon: '🧙‍♂️', conditionType: 'XP_EARNED', threshold: 500, unlocked: false },
  { id: 'streak_3', title: 'On Fire', description: 'Reach a 3-day streak', icon: '🔥', conditionType: 'STREAK_DAYS', threshold: 3, unlocked: false },
  { id: 'streak_7', title: 'Unstoppable', description: 'Reach a 7-day streak', icon: '🚀', conditionType: 'STREAK_DAYS', threshold: 7, unlocked: false },
  { id: 'lesson_5', title: 'Dedicated', description: 'Complete 5 lessons', icon: '📚', conditionType: 'LESSONS_COMPLETED', threshold: 5, unlocked: false },
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