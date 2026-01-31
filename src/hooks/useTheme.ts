import { useContext } from 'react';
import type { ThemeContextType } from '../context/ThemeContext';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Custom hook to use the theme context
 * @returns Theme context value
 */
export function useTheme(): ThemeContextType {
  const context = useContext<ThemeContextType | undefined>(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default useTheme;
