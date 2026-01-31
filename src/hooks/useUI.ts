import { useContext } from 'react';
import type { UIContextType } from '../context/UIContext';
import UIContext from '../context/UIContext';

/**
 * Custom hook to use the UI context
 * @returns UI context value
 */
export function useUI(): UIContextType {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

export default useUI;
