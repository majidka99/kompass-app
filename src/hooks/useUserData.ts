import { useContext } from 'react';
import type { UserDataContextType } from '../context/UserDataContext';
import { UserDataContext } from '../context/UserDataContext';

export function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
