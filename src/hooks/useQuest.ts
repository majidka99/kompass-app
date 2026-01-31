// src/hooks/useQuests.ts
import { useState, useEffect } from 'react';
import type { Quest } from '../types/gamification';
import { weeklyQuests } from '../data/questTemplates';

const STORAGE_KEY = 'kompass_quests';

export const useQuests = () => {
  const [quests, setQuests] = useState<Quest[]>([]);

  // Lade gespeicherte Quests oder Templates
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setQuests(JSON.parse(saved) as Quest[]);
    } else {
      setQuests(weeklyQuests);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklyQuests));
    }
  }, []);

  const updateQuestProgress = (questId: string, amount = 1) => {
    setQuests(prev => {
      const updated = prev.map(q => {
        if (q.id === questId && !q.completed) {
          const progress = q.progress + amount;
          const completed = progress >= q.goal;
          return { ...q, progress, completed };
        }
        return q;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { quests, updateQuestProgress };
};
