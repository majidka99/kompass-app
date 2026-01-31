import type { ReactNode } from 'react';
import React, { useEffect, useState } from 'react';
import pointSound from '../assets/sounds/point.wav';
import { achievementList } from '../data/achievementList';
import { skillsList as defaultSkills } from '../data/skills';
import { dataService } from '../services/dataService';
import type { Achievement, CalendarNotes, Goal, Skill, Symptoms, WordFile } from '../types/index';
import { supabase } from '../utils/supabase';

/* eslint-disable react-refresh/only-export-components */
export const UserDataContext = React.createContext<UserDataContextType | undefined>(undefined);

export interface UserDataContextType {
  username: string;
  setUsername: (username: string) => void;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  calendarNotes: CalendarNotes;
  setCalendarNotes: (notes: CalendarNotes) => void;
  symptoms: Symptoms;
  setSymptoms: (symptoms: Symptoms) => void;
  favorites: string[];
  setFavorites: (favorites: string[]) => void;
  wordFiles: WordFile[];
  setWordFiles: (files: WordFile[]) => void;
  skillsList: Skill[];
  setSkillsList: (skills: Skill[]) => void;
  skillsCompleted: Record<string, boolean>;
  setSkillsCompleted: (completed: Record<string, boolean>) => void;
  hasGoalsReminder: boolean;
  points: number;
  addPoints: (amount: number) => void;
  level: number;
  levelProgress: number;
  isLoading: boolean;
  userId: string | null;
}

interface UserDataProviderProps {
  children: ReactNode;
}

// Calculate level and progress based on points
const getLevel = (points: number): { level: number; progress: number } => {
  if (points < 10) return { level: 1, progress: (points / 10) * 100 };
  if (points < 25) return { level: 2, progress: ((points - 10) / 15) * 100 };
  if (points < 50) return { level: 3, progress: ((points - 25) / 25) * 100 };
  if (points < 100) return { level: 4, progress: ((points - 50) / 50) * 100 };
  return { level: 5, progress: 100 };
};

export function UserDataProvider({ children }: UserDataProviderProps): React.ReactElement {
  // State for authenticated user
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state with default values (will be loaded from database when authenticated)
  const [username, setUsernameState] = useState<string>('');
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [achievements, setAchievementsState] = useState<Achievement[]>([]);
  const [calendarNotes, setCalendarNotesState] = useState<CalendarNotes>({});
  const [symptoms, setSymptomsState] = useState<Symptoms>({});
  const [favorites, setFavoritesState] = useState<string[]>(['home', 'skills', 'notfall', 'guide']);
  const [wordFiles, setWordFilesState] = useState<WordFile[]>([]);
  const [skillsList, setSkillsListState] = useState<Skill[]>(defaultSkills);
  const [skillsCompleted, setSkillsCompletedState] = useState<Record<string, boolean>>({});
  const [points, setPoints] = useState<number>(0);

  // Load user data when authentication changes
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          setUserId(session.user.id);
          // Load all user data from the healthcare-compliant database with safe fallbacks
          const [
            userData_username,
            userData_goals,
            userData_achievements,
            userData_calendarNotes,
            userData_symptoms,
            userData_favorites,
            userData_wordFiles,
            userData_skillsList,
            userData_skillsCompleted,
            userData_points,
          ] = await Promise.all([
            dataService.getDataSafe<string>('username', session.user.id, ''),
            dataService.getDataSafe<Goal[]>('goals', session.user.id, []),
            dataService.getDataSafe<Achievement[]>('achievements', session.user.id, []),
            dataService.getDataSafe<CalendarNotes>('calendarNotes', session.user.id, {}),
            dataService.getDataSafe<Symptoms>('symptoms', session.user.id, {}),
            dataService.getDataSafe<string[]>('favorites', session.user.id, [
              'home',
              'skills',
              'notfall',
              'guide',
            ]),
            dataService.getDataSafe<WordFile[]>('wordFiles', session.user.id, []),
            dataService.getDataSafe<Skill[]>('skillsList', session.user.id, defaultSkills),
            dataService.getDataSafe<Record<string, boolean>>(
              'skillsCompleted',
              session.user.id,
              {}
            ),
            dataService.getDataSafe<number>('points', session.user.id, 0),
          ]);

          // Update state with safely loaded data
          setUsernameState(userData_username);
          setGoalsState(userData_goals);
          setAchievementsState(userData_achievements);
          setCalendarNotesState(userData_calendarNotes);
          setSymptomsState(userData_symptoms);
          setFavoritesState(userData_favorites);
          setWordFilesState(userData_wordFiles);
          // Merge skillsList with any skills from skillsCompleted that aren't in the list
          const allSkills = [...userData_skillsList];
          const completedSkillKeys = Object.keys(userData_skillsCompleted);

          // Add any completed skills that aren't already in the skillsList
          completedSkillKeys.forEach(skill => {
            if (!allSkills.includes(skill)) {
              allSkills.push(skill);
            }
          });

          setSkillsListState(allSkills);
          setSkillsCompletedState(userData_skillsCompleted);
          setPoints(userData_points);
        } else {
          // No user logged in, reset to defaults
          setUserId(null);
          setUsernameState('');
          setGoalsState([]);
          setAchievementsState([]);
          setCalendarNotesState({});
          setSymptomsState({});
          setFavoritesState(['home', 'skills', 'notfall', 'guide']);
          setWordFilesState([]);
          setSkillsListState(defaultSkills);
          setPoints(0);
        }
      } catch (error) {
        console.error('❌ Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUserData();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setIsLoading(false);
        // Reset to defaults on logout
        setUsernameState('');
        setGoalsState([]);
        setAchievementsState([]);
        setCalendarNotesState({});
        setSymptomsState({});
        setFavoritesState(['home', 'skills', 'notfall', 'guide']);
        setWordFilesState([]);
        setSkillsListState(defaultSkills);
        setPoints(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Calculate level and progress
  const { level, progress } = getLevel(points);

  const setUsername = React.useCallback(
    async (value: string) => {
      setUsernameState(value);
      if (userId) {
        try {
          await dataService.setData('username', value, userId);
        } catch (error) {
          console.error('❌ Failed to save username:', error);
        }
      }
    },
    [userId]
  );

  const setGoals = React.useCallback(
    async (value: Goal[]) => {
      setGoalsState(value);
      if (userId) {
        try {
          await dataService.setData('goals', value, userId);
        } catch (error) {
          console.error('❌ Failed to save goals:', error);
        }
      }
    },
    [userId]
  );

  const setAchievements = React.useCallback(
    async (value: Achievement[]) => {
      setAchievementsState(value);
      if (userId) {
        try {
          await dataService.setData('achievements', value, userId);
        } catch (error) {
          console.error('❌ Failed to save achievements:', error);
        }
      }
    },
    [userId]
  );

  const setCalendarNotes = React.useCallback(
    async (value: CalendarNotes) => {
      setCalendarNotesState(value);
      if (userId) {
        try {
          await dataService.setData('calendarNotes', value, userId);
        } catch (error) {
          console.error('❌ Failed to save calendar notes:', error);
        }
      }
    },
    [userId]
  );

  const setSymptoms = React.useCallback(
    async (value: Symptoms) => {
      setSymptomsState(value);
      if (userId) {
        try {
          await dataService.setData('symptoms', value, userId);
        } catch (error) {
          console.error('❌ Failed to save symptoms:', error);
        }
      }
    },
    [userId]
  );

  const setFavorites = React.useCallback(
    async (value: string[]) => {
      setFavoritesState(value);
      if (userId) {
        try {
          await dataService.setData('favorites', value, userId);
        } catch (error) {
          console.error('❌ Failed to save favorites:', error);
        }
      }
    },
    [userId]
  );

  const setWordFiles = React.useCallback(
    async (value: WordFile[]) => {
      setWordFilesState(value);
      if (userId) {
        try {
          await dataService.setData('wordFiles', value, userId);
        } catch (error) {
          console.error('❌ Failed to save word files:', error);
        }
      }
    },
    [userId]
  );

  const setSkillsList = React.useCallback(
    async (value: Skill[]) => {
      setSkillsListState(value);
      if (userId) {
        try {
          await dataService.setData('skillsList', value, userId);
        } catch (error) {
          console.error('❌ Failed to save skills list:', error);
        }
      }
    },
    [userId]
  );

  const setSkillsCompleted = React.useCallback(
    async (value: Record<string, boolean>) => {
      setSkillsCompletedState(value);
      if (userId) {
        try {
          await dataService.setData('skillsCompleted', value, userId);
        } catch (error) {
          console.error('❌ Failed to save skills completion status:', error);
        }
      }
    },
    [userId]
  );

  const addPoints = React.useCallback(
    (amount: number) => {
      setPoints(currentPoints => {
        const newPoints = currentPoints + amount;
        const audio = new Audio(pointSound);
        audio.play().catch(() => {}); // Falls Browser blockiert, kein Fehler

        // Save points to healthcare database
        if (userId) {
          dataService.setData('points', newPoints, userId).catch(error => {
            console.error('❌ Failed to save points:', error);
          });
        }

        // Achievement logic
        const unlocked: Achievement[] = [];

        achievementList.forEach(a => {
          const alreadyUnlocked = achievements.some(existing => existing.id === a.id);
          const match = a.id.startsWith('points-');
          const targetPoints = parseInt(a.id.split('-')[1]);
          if (match && newPoints >= targetPoints && !alreadyUnlocked) {
            unlocked.push({
              ...a,
              date: new Date().toISOString(),
            });
          }
        });

        if (unlocked.length > 0) {
          const newAchievements = [...achievements, ...unlocked];
          setAchievements(newAchievements);
        }

        return newPoints;
      });
    },
    [achievements, setAchievements, userId]
  );

  // Compute derived state separately to keep the dependency array smaller
  const hasGoalsReminder = React.useMemo(
    () => goals.length > 0 && !goals.some(g => g.completed),
    [goals]
  );

  // Only include state values in the dependency array, not the setter functions
  // since the setter functions are stable references (from useCallback)
  const value = React.useMemo<UserDataContextType>(
    () => ({
      username,
      setUsername,
      goals,
      setGoals,
      achievements,
      setAchievements,
      calendarNotes,
      setCalendarNotes,
      symptoms,
      setSymptoms,
      favorites,
      setFavorites,
      wordFiles,
      setWordFiles,
      skillsList,
      setSkillsList,
      skillsCompleted,
      setSkillsCompleted,
      hasGoalsReminder,
      points,
      addPoints,
      level,
      levelProgress: progress,
      isLoading,
      userId,
    }),
    [
      username,
      setUsername,
      goals,
      setGoals,
      achievements,
      setAchievements,
      calendarNotes,
      setCalendarNotes,
      symptoms,
      setSymptoms,
      favorites,
      setFavorites,
      wordFiles,
      setWordFiles,
      skillsList,
      setSkillsList,
      skillsCompleted,
      setSkillsCompleted,
      hasGoalsReminder,
      points,
      addPoints,
      level,
      progress,
      isLoading,
      userId,
    ]
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserDataContextType {
  const context = React.useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
