import type { ReactNode } from 'react';
import React, { createContext, useEffect, useState } from 'react';
import type { BackgroundOptions } from '../data/backgrounds';
import { backgrounds } from '../data/backgrounds';
import type { Theme } from '../data/themes';
import { modernBlueGrey, themes } from '../data/themes';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  background: BackgroundOptions;
  setBackground: (bg: BackgroundOptions) => void;
  availableThemes: Theme[];
  availableBackgrounds: BackgroundOptions[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export { ThemeContext };

export function ThemeProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('kompass_theme');
    const found = themes.find(t => t.name === saved);
    return found || modernBlueGrey;
  });

  // Use useCallback to ensure stable reference for setTheme
  const setTheme = React.useCallback((newTheme: Theme): void => {
    setThemeState(newTheme);
    localStorage.setItem('kompass_theme', newTheme.name);
  }, []);

  const [background, setBackgroundState] = useState<BackgroundOptions>(() => backgrounds[0]);
  // Use useCallback to ensure stable reference for setBackground
  const setBackground = React.useCallback((bg: BackgroundOptions): void => {
    setBackgroundState(bg);
  }, []);

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.fontFamily = theme.font;
    document.body.style.color = theme.dark ? '#fff' : '#222';
    document.body.className = theme.dark ? 'night' : '';
  }, [theme]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo<ThemeContextType>(
    () => ({
      theme,
      setTheme,
      background,
      setBackground,
      availableThemes: themes,
      availableBackgrounds: backgrounds,
    }),
    [theme, background, setTheme, setBackground]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
