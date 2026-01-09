import { Lesson, UserState } from '../types';

const USER_STATE_KEY = 'gemolingo_user_state';
const LESSONS_KEY = 'gemolingo_offline_lessons';

export const saveUserState = (state: UserState) => {
  try {
    localStorage.setItem(USER_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save user state", e);
  }
};

export const loadUserState = (): UserState | null => {
  try {
    const stored = localStorage.getItem(USER_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

// Structure: { [languageCode]: { [topicId]: Lesson } }
export const saveOfflineLesson = (language: string, topicId: string, lesson: Lesson) => {
  try {
    const stored = localStorage.getItem(LESSONS_KEY);
    const data = stored ? JSON.parse(stored) : {};
    
    if (!data[language]) data[language] = {};
    data[language][topicId] = lesson;
    
    localStorage.setItem(LESSONS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save lesson offline", e);
    alert("Not enough space to save lesson offline.");
  }
};

export const removeOfflineLesson = (language: string, topicId: string) => {
   try {
    const stored = localStorage.getItem(LESSONS_KEY);
    if (!stored) return;
    const data = JSON.parse(stored);
    
    if (data[language] && data[language][topicId]) {
      delete data[language][topicId];
      localStorage.setItem(LESSONS_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error("Failed to remove offline lesson", e);
  }
}

export const getOfflineLesson = (language: string, topicId: string): Lesson | null => {
  try {
    const stored = localStorage.getItem(LESSONS_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data[language]?.[topicId] || null;
  } catch (e) {
    return null;
  }
};

export const getAllOfflineLessons = () => {
  try {
    const stored = localStorage.getItem(LESSONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

export const mergeOfflineLessons = (newData: any) => {
  try {
    const stored = localStorage.getItem(LESSONS_KEY);
    const currentData = stored ? JSON.parse(stored) : {};

    // Basic validation: Check if newData is an object
    if (typeof newData !== 'object' || newData === null) return null;

    // Deep merge logic
    Object.keys(newData).forEach(lang => {
      if (typeof newData[lang] === 'object') {
          if (!currentData[lang]) currentData[lang] = {};
          Object.keys(newData[lang]).forEach(topicId => {
             currentData[lang][topicId] = newData[lang][topicId];
          });
      }
    });

    localStorage.setItem(LESSONS_KEY, JSON.stringify(currentData));
    return currentData;
  } catch (e) {
    console.error("Failed to merge offline lessons", e);
    return null;
  }
};